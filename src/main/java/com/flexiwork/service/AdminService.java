package com.flexiwork.service;

import com.flexiwork.entity.CompanyProfile;
import com.flexiwork.entity.WorkerProfile;
import com.flexiwork.entity.enums.District;
import com.flexiwork.entity.enums.PaymentStatus;
import com.flexiwork.entity.enums.Role;
import com.flexiwork.entity.enums.VerificationStatus;
import com.flexiwork.exception.BusinessException;
import com.flexiwork.exception.ResourceNotFoundException;
import com.flexiwork.repository.*;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * Admin-side use cases backing the Thymeleaf panel: dashboard statistics and KYC verification of
 * companies and workers.
 */
@Service
public class AdminService {

    private final UserRepository userRepository;
    private final CompanyProfileRepository companyRepository;
    private final WorkerProfileRepository workerRepository;
    private final JobPostRepository jobRepository;
    private final PaymentRepository paymentRepository;
    private final ContactMessageRepository contactMessageRepository;
    private final NotificationTriggers notificationTriggers;

    public AdminService(UserRepository userRepository,
                        CompanyProfileRepository companyRepository,
                        WorkerProfileRepository workerRepository,
                        JobPostRepository jobRepository,
                        PaymentRepository paymentRepository,
                        ContactMessageRepository contactMessageRepository,
                        NotificationTriggers notificationTriggers) {
        this.userRepository = userRepository;
        this.companyRepository = companyRepository;
        this.workerRepository = workerRepository;
        this.jobRepository = jobRepository;
        this.paymentRepository = paymentRepository;
        this.contactMessageRepository = contactMessageRepository;
        this.notificationTriggers = notificationTriggers;
    }

    @Transactional(readOnly = true)
    public DashboardStats dashboardStats() {
        BigDecimal commission = paymentRepository.sumCommissionByStatus(PaymentStatus.PAID);
        return new DashboardStats(
                jobRepository.count(),
                userRepository.countByRole(Role.WORKER),
                userRepository.countByRole(Role.COMPANY),
                commission == null ? BigDecimal.ZERO : commission,
                companyRepository.countByStatus(VerificationStatus.PENDING),
                workerRepository.countByStatus(VerificationStatus.PENDING));
    }

    /** Jobs-scheduled-per-date series for the dashboard line chart. */
    @Transactional(readOnly = true)
    public JobsTrend jobsTrend() {
        List<String> labels = new java.util.ArrayList<>();
        List<Long> counts = new java.util.ArrayList<>();
        for (Object[] row : jobRepository.countJobsByDate()) {
            labels.add(String.valueOf(row[0]));        // LocalDate -> ISO string
            counts.add(((Number) row[1]).longValue());
        }
        return new JobsTrend(labels, counts);
    }

    @Transactional(readOnly = true)
    public List<CompanyProfile> pendingCompanies() {
        return companyRepository.findByStatus(VerificationStatus.PENDING);
    }

    @Transactional(readOnly = true)
    public List<CompanyProfile> suspendedCompanies() {
        return companyRepository.findBySuspendedTrue();
    }

    @Transactional(readOnly = true)
    public List<WorkerProfile> pendingWorkers() {
        return workerRepository.findByStatus(VerificationStatus.PENDING);
    }

    /** Full worker directory for the admin ledger, filtered and sorted to taste. */
    @Transactional(readOnly = true)
    public List<WorkerProfile> ledgerWorkers(VerificationStatus status, District district, String search,
                                              String sortField, String sortDir) {
        Specification<WorkerProfile> spec = Specification
                .where(LedgerSpecifications.workerHasStatus(status))
                .and(LedgerSpecifications.workerHasDistrict(district))
                .and(LedgerSpecifications.workerMatches(search));
        return workerRepository.findAll(spec, ledgerSort(sortField, sortDir, "fullName"));
    }

    /** Full company directory for the admin ledger, filtered and sorted to taste. */
    @Transactional(readOnly = true)
    public List<CompanyProfile> ledgerCompanies(VerificationStatus status, District district, String search,
                                                 String sortField, String sortDir) {
        Specification<CompanyProfile> spec = Specification
                .where(LedgerSpecifications.companyHasStatus(status))
                .and(LedgerSpecifications.companyHasDistrict(district))
                .and(LedgerSpecifications.companyMatches(search));
        return companyRepository.findAll(spec, ledgerSort(sortField, sortDir, "companyName"));
    }

    /** Maps the ledger's "name"/"district"/"status"/"created" sort keys onto entity properties. */
    private Sort ledgerSort(String sortField, String sortDir, String nameProperty) {
        String property = switch (sortField == null ? "name" : sortField) {
            case "district" -> "district";
            case "status" -> "status";
            case "created" -> "createdAt";
            default -> nameProperty;
        };
        Sort.Direction direction = "desc".equalsIgnoreCase(sortDir) ? Sort.Direction.DESC : Sort.Direction.ASC;
        return Sort.by(direction, property);
    }

    @Transactional
    public void setCompanyStatus(Long companyId, VerificationStatus status) {
        CompanyProfile company = companyRepository.findById(companyId)
                .orElseThrow(() -> ResourceNotFoundException.of("Company", companyId));
        company.setStatus(status);
        if (status == VerificationStatus.VERIFIED) {
            company.setApprovedAt(java.time.Instant.now());
        }
        companyRepository.save(company);
    }

    /** Admin lifts a company's overdue-payment suspension. */
    @Transactional
    public void unsuspendCompany(Long companyId) {
        CompanyProfile company = companyRepository.findById(companyId)
                .orElseThrow(() -> ResourceNotFoundException.of("Company", companyId));
        company.setSuspended(false);
        company.setSuspendedAt(null);
        companyRepository.save(company);
    }

    @Transactional
    public void setWorkerStatus(Long workerId, VerificationStatus status) {
        WorkerProfile worker = workerRepository.findById(workerId)
                .orElseThrow(() -> ResourceNotFoundException.of("Worker", workerId));
        worker.setStatus(status);
        if (status == VerificationStatus.VERIFIED) {
            worker.setApprovedAt(java.time.Instant.now());
        }
        workerRepository.save(worker);
    }

    @Transactional(readOnly = true)
    public List<com.flexiwork.entity.JobPost> allJobs() {
        return jobRepository.findAllWithCompany();
    }

    @Transactional(readOnly = true)
    public List<com.flexiwork.entity.Payment> allPayments() {
        return paymentRepository.findAllWithDetails();
    }

    /** Admin soft-cancels a job (demonstrates the DELETE method override in the admin forms). */
    @Transactional
    public void cancelJob(Long jobId) {
        com.flexiwork.entity.JobPost job = jobRepository.findById(jobId)
                .orElseThrow(() -> ResourceNotFoundException.of("Job", jobId));
        if (job.getStatus() == com.flexiwork.entity.enums.JobStatus.COMPLETED
                || job.getStatus() == com.flexiwork.entity.enums.JobStatus.CANCELLED) {
            throw new BusinessException("Job is already " + job.getStatus());
        }
        job.setStatus(com.flexiwork.entity.enums.JobStatus.CANCELLED);
        jobRepository.save(job);
        notificationTriggers.onJobCancelled(job);
    }

    /** Pending verification counts for the sidebar badges. */
    @Transactional(readOnly = true)
    public PendingCounts pendingCounts() {
        return new PendingCounts(
                workerRepository.countByStatus(VerificationStatus.PENDING),
                companyRepository.countByStatus(VerificationStatus.PENDING),
                contactMessageRepository.countByReadFalse());
    }

    public record PendingCounts(long workers, long companies, long messages) {}

    /** Recent actionable items for the admin notification bell: pending verifications + unread messages. */
    @Transactional(readOnly = true)
    public List<NotificationItem> recentNotifications() {
        java.util.stream.Stream<NotificationItem> companyItems = companyRepository.findByStatus(VerificationStatus.PENDING)
                .stream()
                .map(c -> new NotificationItem("New company registration: " + c.getCompanyName(),
                        "/admin/companies", c.getCreatedAt()));

        java.util.stream.Stream<NotificationItem> workerItems = workerRepository.findByStatus(VerificationStatus.PENDING)
                .stream()
                .map(w -> new NotificationItem("New worker registration: " + w.getFullName(),
                        "/admin/workers", w.getCreatedAt()));

        java.util.stream.Stream<NotificationItem> messageItems = contactMessageRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .filter(m -> !m.isRead())
                .map(m -> new NotificationItem(
                        "New message from " + m.getFirstName() + " " + m.getLastName() + ": " + m.getTopic(),
                        "/admin/messages", m.getCreatedAt()));

        java.util.stream.Stream<NotificationItem> overduePaymentItems = paymentRepository
                .findByStatusWithDetails(PaymentStatus.OVERDUE)
                .stream()
                .map(p -> new NotificationItem(
                        "Payment overdue: " + p.getCompany().getCompanyName() + " — " + p.getReceiptNumber(),
                        "/admin/payments", p.getUpdatedAt()));

        java.util.stream.Stream<NotificationItem> suspendedCompanyItems = companyRepository.findBySuspendedTrue()
                .stream()
                .map(c -> new NotificationItem(
                        "Company suspended for non-payment: " + c.getCompanyName(),
                        "/admin/payments", c.getSuspendedAt()));

        return java.util.stream.Stream.of(companyItems, workerItems, messageItems, overduePaymentItems, suspendedCompanyItems)
                .flatMap(s -> s)
                .sorted(java.util.Comparator.comparing(NotificationItem::createdAt).reversed())
                .limit(20)
                .toList();
    }

    public record NotificationItem(String message, String link, java.time.Instant createdAt) {}

    /** All "Contact us" submissions, newest first. */
    @Transactional(readOnly = true)
    public List<com.flexiwork.entity.ContactMessage> contactMessages() {
        return contactMessageRepository.findAllByOrderByCreatedAtDesc();
    }

    /** Marks a contact message as read once an admin has opened it. */
    @Transactional
    public void markMessageRead(Long id) {
        com.flexiwork.entity.ContactMessage msg = contactMessageRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Message", id));
        msg.setRead(true);
        contactMessageRepository.save(msg);
    }

    /** Aggregated counts for the dashboard cards. */
    public record DashboardStats(
            long totalJobs,
            long totalWorkers,
            long totalCompanies,
            BigDecimal commissionEarned,
            long pendingCompanies,
            long pendingWorkers) {
    }

    /** Labels + counts for the jobs-per-date line chart. */
    public record JobsTrend(List<String> labels, List<Long> counts) {
    }
}
