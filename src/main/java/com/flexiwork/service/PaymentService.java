package com.flexiwork.service;

import com.flexiwork.dto.payment.PayRequest;
import com.flexiwork.dto.payment.PaymentResponse;
import com.flexiwork.dto.payment.PaymentSummary;
import com.flexiwork.entity.CompanyProfile;
import com.flexiwork.entity.JobPost;
import com.flexiwork.entity.Payment;
import com.flexiwork.entity.enums.JobStatus;
import com.flexiwork.entity.enums.PaymentStatus;
import com.flexiwork.exception.BusinessException;
import com.flexiwork.exception.ResourceNotFoundException;
import com.flexiwork.repository.AttendanceRepository;
import com.flexiwork.repository.JobPostRepository;
import com.flexiwork.repository.PaymentRepository;
import com.flexiwork.security.CurrentUserService;
import com.flexiwork.service.payment.PaymentGateway;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.Year;
import java.util.List;

/**
 * Commission billing. When a company marks a job COMPLETED, we bill a commission on the
 * <em>verified attendances only</em> (no charge for no-shows). The commission rate in effect is
 * snapshotted onto the {@link Payment} and all subsequent calculations read it from there — never a
 * hardcoded constant.
 */
@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final JobPostRepository jobRepository;
    private final AttendanceRepository attendanceRepository;
    private final CurrentUserService currentUserService;
    private final PaymentGateway paymentGateway;
    private final PdfReceiptService pdfReceiptService;
    private final SettingsService settingsService;

    public PaymentService(PaymentRepository paymentRepository,
                          JobPostRepository jobRepository,
                          AttendanceRepository attendanceRepository,
                          CurrentUserService currentUserService,
                          PaymentGateway paymentGateway,
                          PdfReceiptService pdfReceiptService,
                          SettingsService settingsService) {
        this.paymentRepository = paymentRepository;
        this.jobRepository = jobRepository;
        this.attendanceRepository = attendanceRepository;
        this.currentUserService = currentUserService;
        this.paymentGateway = paymentGateway;
        this.pdfReceiptService = pdfReceiptService;
        this.settingsService = settingsService;
    }

    /** Receipt/invoice PDF bytes plus a suitable download filename. */
    public record ReceiptDownload(byte[] pdf, String filename) {
    }

    /**
     * Pure calculation of commission given a daily wage, the number of attended workers and the
     * applicable rate. Extracted for straightforward unit testing.
     */
    public static BigDecimal computeCommission(BigDecimal dailyWage, long attended, BigDecimal rate) {
        BigDecimal totalWages = dailyWage.multiply(BigDecimal.valueOf(attended));
        return totalWages.multiply(rate).setScale(2, RoundingMode.HALF_UP);
    }

    @Transactional
    public PaymentResponse completeJobAndBill(Long jobId) {
        JobPost job = requireOwnedJob(jobId);
        if (job.getStatus() == JobStatus.COMPLETED) {
            throw new BusinessException("This job is already completed");
        }
        if (job.getStatus() == JobStatus.CANCELLED) {
            throw new BusinessException("A cancelled job cannot be completed");
        }
        if (paymentRepository.existsByJobPost(job)) {
            throw new BusinessException("This job has already been billed");
        }

        // Bill on attended workers (checked in), summing base wage + any shift-extension pay each
        // worker earned.
        var attendances = attendanceRepository.findByJobPost(job);
        int attended = attendances.size();
        BigDecimal rate = settingsService.commissionRate();
        BigDecimal totalWages = attendances.stream()
                .map(a -> job.getDailyWage().add(
                        a.getExtraWage() == null ? BigDecimal.ZERO : a.getExtraWage()))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal commission = totalWages.multiply(rate).setScale(2, RoundingMode.HALF_UP);

        Payment payment = new Payment();
        payment.setJobPost(job);
        payment.setCompany(job.getCompany());
        payment.setWorkersAttended(attended);
        payment.setTotalWages(totalWages);
        payment.setCommissionRate(rate);
        payment.setCommissionAmount(commission);
        payment.setJobDate(job.getJobDate());
        payment.setDueDate(com.flexiwork.util.AppClock.today().plusDays(settingsService.paymentGraceDays()));
        payment.setStatus(PaymentStatus.PENDING);
        payment.setReceiptNumber(nextReceiptNumber());
        paymentRepository.save(payment);

        job.setStatus(JobStatus.COMPLETED);
        jobRepository.save(job);

        return toResponse(payment);
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> myPayments(PaymentStatus statusFilter) {
        CompanyProfile company = currentUserService.requireActingCompany();
        List<Payment> payments = (statusFilter == null)
                ? paymentRepository.findByCompany(company)
                : paymentRepository.findByCompanyAndStatus(company, statusFilter);
        return payments.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public PaymentSummary summary() {
        CompanyProfile company = currentUserService.requireActingCompany();
        List<Payment> pending = paymentRepository.findByCompanyAndStatusIn(
                company, List.of(PaymentStatus.PENDING, PaymentStatus.OVERDUE));
        List<Payment> paid = paymentRepository.findByCompanyAndStatus(company, PaymentStatus.PAID);
        BigDecimal outstanding = pending.stream()
                .map(Payment::getCommissionAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalPaid = paid.stream()
                .map(Payment::getCommissionAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        return new PaymentSummary(pending.size(), outstanding, totalPaid);
    }

    @Transactional
    public PaymentResponse pay(Long paymentId, PayRequest req) {
        Payment payment = requireOwnedPayment(paymentId);
        if (payment.getStatus() == PaymentStatus.PAID) {
            throw new BusinessException("This payment has already been settled");
        }
        PaymentGateway.PaymentResult result = paymentGateway.charge(
                payment.getCommissionAmount(), payment.getReceiptNumber(),
                new PaymentGateway.CardDetails(req.cardNumber(), req.expiry(), req.cvv(), req.nameOnCard()));
        if (!result.success()) {
            throw new BusinessException("Payment declined: " + result.message());
        }
        markPaid(payment, result.transactionId());
        return toResponse(payment);
    }

    /** Admin-initiated settlement (manual mark as paid). */
    @Transactional
    public void adminMarkPaid(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> ResourceNotFoundException.of("Payment", paymentId));
        if (payment.getStatus() == PaymentStatus.PAID) {
            throw new BusinessException("This payment has already been settled");
        }
        markPaid(payment, "MANUAL-" + java.util.UUID.randomUUID().toString().substring(0, 10).toUpperCase());
    }

    /** Render the receipt (paid) or invoice (pending) PDF within the transaction so lazy
     *  associations on the {@link Payment} can be read while the session is open. */
    @Transactional(readOnly = true)
    public ReceiptDownload renderReceipt(Long paymentId) {
        Payment payment = requireOwnedPayment(paymentId);
        byte[] pdf = pdfReceiptService.render(payment);
        String prefix = payment.getStatus() == PaymentStatus.PAID ? "receipt-" : "invoice-";
        return new ReceiptDownload(pdf, prefix + payment.getReceiptNumber() + ".pdf");
    }

    private void markPaid(Payment payment, String transactionId) {
        payment.setStatus(PaymentStatus.PAID);
        payment.setTransactionId(transactionId);
        payment.setPaidAt(Instant.now());
        paymentRepository.save(payment);
        liftSuspensionIfCleared(payment.getCompany());
    }

    /** Un-suspend a company once it has no remaining PENDING/OVERDUE payments. */
    private void liftSuspensionIfCleared(CompanyProfile company) {
        if (!company.isSuspended()) {
            return;
        }
        boolean stillOwes = !paymentRepository.findByCompanyAndStatusIn(
                company, List.of(PaymentStatus.PENDING, PaymentStatus.OVERDUE)).isEmpty();
        if (!stillOwes) {
            company.setSuspended(false);
            company.setSuspendedAt(null);
        }
    }

    private String nextReceiptNumber() {
        String prefix = "FLX-" + Year.now().getValue() + "-";
        long count = paymentRepository.countByReceiptNumberStartingWith(prefix);
        return prefix + String.format("%05d", count + 1);
    }

    private JobPost requireOwnedJob(Long jobId) {
        CompanyProfile company = currentUserService.requireActingCompany();
        JobPost job = jobRepository.findById(jobId)
                .orElseThrow(() -> ResourceNotFoundException.of("Job", jobId));
        if (!job.getCompany().getId().equals(company.getId())) {
            throw new BusinessException("This job does not belong to your company");
        }
        if (company.isSuspended()) {
            throw new BusinessException(
                    "Your account is suspended due to an overdue payment. Please settle it or contact FlexiWork admins.");
        }
        return job;
    }

    private Payment requireOwnedPayment(Long paymentId) {
        CompanyProfile company = currentUserService.requireActingCompany();
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> ResourceNotFoundException.of("Payment", paymentId));
        if (!payment.getCompany().getId().equals(company.getId())) {
            throw new BusinessException("This payment does not belong to your company");
        }
        return payment;
    }

    private PaymentResponse toResponse(Payment p) {
        return new PaymentResponse(
                p.getId(),
                p.getJobPost().getId(),
                p.getJobPost().getTitle(),
                p.getCompany().getCompanyName(),
                p.getWorkersAttended(),
                p.getTotalWages(),
                p.getCommissionRate(),
                p.getCommissionAmount(),
                p.getJobDate(),
                p.getStatus(),
                p.getReceiptNumber(),
                p.getTransactionId(),
                p.getPaidAt());
    }
}
