package com.flexiwork.config.service;

import com.flexiwork.entity.CompanyProfile;
import com.flexiwork.entity.JobPost;
import com.flexiwork.entity.Payment;
import com.flexiwork.entity.enums.JobStatus;
import com.flexiwork.repository.AttendanceRepository;
import com.flexiwork.repository.JobPostRepository;
import com.flexiwork.repository.PaymentRepository;
import com.flexiwork.security.CurrentUserService;
import com.flexiwork.service.PaymentService;
import com.flexiwork.service.PdfReceiptService;
import com.flexiwork.service.SettingsService;
import com.flexiwork.service.payment.PaymentGateway;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for the commission logic — the most important business rule: commission is charged on
 * <em>attended</em> workers only (no charge for no-shows), using the rate stored on the payment.
 */
@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock PaymentRepository paymentRepository;
    @Mock JobPostRepository jobRepository;
    @Mock AttendanceRepository attendanceRepository;
    @Mock CurrentUserService currentUserService;
    @Mock PaymentGateway paymentGateway;
    @Mock
    PdfReceiptService pdfReceiptService;
    @Mock
    SettingsService settingsService;

    PaymentService newService() {
        return new PaymentService(paymentRepository, jobRepository, attendanceRepository,
                currentUserService, paymentGateway, pdfReceiptService, settingsService);
    }

    @Test
    void computeCommission_chargesAttendedWorkersOnly() {
        // 10 accepted but only 8 attended, wage 3500 -> wages 28000, commission 2800.
        BigDecimal commission = PaymentService.computeCommission(new BigDecimal("3500"), 8, new BigDecimal("0.10"));
        assertThat(commission).isEqualByComparingTo("2800.00");
    }

    @Test
    void computeCommission_zeroAttendance_isZero() {
        BigDecimal commission = PaymentService.computeCommission(new BigDecimal("3500"), 0, new BigDecimal("0.10"));
        assertThat(commission).isEqualByComparingTo("0.00");
    }

    @Test
    void completeJobAndBill_billsOnVerifiedAttendanceCount() {
        CompanyProfile company = new CompanyProfile();
        company.setId(1L);
        company.setCompanyName("ABC Hotels");

        JobPost job = new JobPost();
        job.setId(5L);
        job.setCompany(company);
        job.setDailyWage(new BigDecimal("3500"));
        job.setWorkersNeeded(10);
        job.setWorkersAccepted(10);
        job.setStatus(JobStatus.FILLED);
        job.setJobDate(LocalDate.now());

        // 8 attended of 10 — each with no extension pay; commission billed on base wage only.
        java.util.List<com.flexiwork.entity.Attendance> attended = new java.util.ArrayList<>();
        for (int i = 0; i < 8; i++) {
            com.flexiwork.entity.Attendance a = new com.flexiwork.entity.Attendance();
            a.setExtraWage(BigDecimal.ZERO);
            attended.add(a);
        }

        when(currentUserService.requireActingCompany()).thenReturn(company);
        when(jobRepository.findById(5L)).thenReturn(java.util.Optional.of(job));
        when(settingsService.commissionRate()).thenReturn(new BigDecimal("0.10"));
        when(settingsService.paymentGraceDays()).thenReturn(7);
        when(paymentRepository.existsByJobPost(job)).thenReturn(false);
        when(attendanceRepository.findByJobPost(job)).thenReturn(attended);
        when(paymentRepository.countByReceiptNumberStartingWith(anyString())).thenReturn(0L);
        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));

        var response = newService().completeJobAndBill(5L);

        assertThat(response.workersAttended()).isEqualTo(8);
        assertThat(response.totalWages()).isEqualByComparingTo("28000.00");
        assertThat(response.commissionAmount()).isEqualByComparingTo("2800.00");
        assertThat(response.commissionRate()).isEqualByComparingTo("0.10");
        assertThat(job.getStatus()).isEqualTo(JobStatus.COMPLETED);
        verify(paymentRepository).save(any(Payment.class));
    }
}
