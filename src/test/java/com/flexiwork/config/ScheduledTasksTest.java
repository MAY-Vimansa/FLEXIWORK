package com.flexiwork.config;

import com.flexiwork.entity.CompanyProfile;
import com.flexiwork.entity.Payment;
import com.flexiwork.entity.WorkerProfile;
import com.flexiwork.entity.enums.PaymentStatus;
import com.flexiwork.entity.enums.VerificationStatus;
import com.flexiwork.repository.ApplicationRepository;
import com.flexiwork.repository.CompanyProfileRepository;
import com.flexiwork.repository.PaymentRepository;
import com.flexiwork.repository.WorkerProfileRepository;
import com.flexiwork.service.ApplicationService;
import com.flexiwork.service.JobService;
import com.flexiwork.service.NotificationTriggers;
import com.flexiwork.service.SettingsService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Covers the two background jobs that previously had zero test coverage: auto-approval (which
 * must also auto-accept the newly-verified worker's pending applications) and payment enforcement
 * (which must suspend a company exactly once per overdue payment, not re-suspend an already
 * suspended one).
 */
@ExtendWith(MockitoExtension.class)
class ScheduledTasksTest {

    @Mock WorkerProfileRepository workerRepository;
    @Mock CompanyProfileRepository companyRepository;
    @Mock PaymentRepository paymentRepository;
    @Mock ApplicationRepository applicationRepository;
    @Mock NotificationTriggers notificationTriggers;
    @Mock SettingsService settingsService;
    @Mock ApplicationService applicationService;
    @Mock JobService jobService;

    ScheduledTasks newTasks() {
        return new ScheduledTasks(workerRepository, companyRepository, paymentRepository,
                applicationRepository, notificationTriggers, settingsService, applicationService, jobService);
    }

    @Test
    void autoApprove_verifiesPendingWorkersAndAutoAcceptsTheirApplications() {
        WorkerProfile worker = new WorkerProfile();
        worker.setId(1L);
        worker.setStatus(VerificationStatus.PENDING);

        when(settingsService.approvalAutoWindowMinutes()).thenReturn(720L);
        when(workerRepository.findByStatusAndCreatedAtBefore(
                org.mockito.ArgumentMatchers.eq(VerificationStatus.PENDING), any()))
                .thenReturn(java.util.List.of(worker));
        when(companyRepository.findByStatusAndCreatedAtBefore(
                org.mockito.ArgumentMatchers.eq(VerificationStatus.PENDING), any()))
                .thenReturn(java.util.List.of());

        newTasks().autoApprove();

        assertThat(worker.getStatus()).isEqualTo(VerificationStatus.VERIFIED);
        verify(workerRepository).saveAll(java.util.List.of(worker));
        verify(applicationService).autoAcceptPendingForWorker(worker);
    }

    @Test
    void enforcePayments_suspendsCompanyOnlyOnceForMultipleOverduePayments() {
        CompanyProfile company = new CompanyProfile();
        company.setId(1L);
        company.setCompanyName("Lanka Harvest Logistics");
        company.setSuspended(false);

        Payment overdue1 = new Payment();
        overdue1.setCompany(company);
        overdue1.setStatus(PaymentStatus.PENDING);
        overdue1.setCommissionAmount(BigDecimal.TEN);
        overdue1.setReceiptNumber("FLX-2026-00001");
        Payment overdue2 = new Payment();
        overdue2.setCompany(company);
        overdue2.setStatus(PaymentStatus.PENDING);
        overdue2.setCommissionAmount(BigDecimal.TEN);
        overdue2.setReceiptNumber("FLX-2026-00002");

        when(paymentRepository.findByStatusAndDueDateBefore(
                org.mockito.ArgumentMatchers.eq(PaymentStatus.PENDING), any()))
                .thenReturn(java.util.List.of(overdue1, overdue2));

        newTasks().enforcePayments();

        assertThat(overdue1.getStatus()).isEqualTo(PaymentStatus.OVERDUE);
        assertThat(overdue2.getStatus()).isEqualTo(PaymentStatus.OVERDUE);
        assertThat(company.isSuspended()).isTrue();
        // Suspended exactly once, on the first overdue payment processed.
        verify(companyRepository).save(company);
    }
}
