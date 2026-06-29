package com.flexiwork.service;

import com.flexiwork.entity.Application;
import com.flexiwork.entity.CompanyProfile;
import com.flexiwork.entity.JobPost;
import com.flexiwork.entity.User;
import com.flexiwork.entity.WorkerProfile;
import com.flexiwork.entity.enums.ApplicationStatus;
import com.flexiwork.entity.enums.JobStatus;
import com.flexiwork.entity.enums.Role;
import com.flexiwork.entity.enums.VerificationStatus;
import com.flexiwork.exception.BusinessException;
import com.flexiwork.repository.ApplicationRepository;
import com.flexiwork.repository.JobPostRepository;
import com.flexiwork.repository.WorkerProfileRepository;
import com.flexiwork.security.CurrentUserService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Covers the application/acceptance rules that had zero prior coverage: a company applying to its
 * own job must be blocked, acceptance must take the pessimistic job lock (not the lazy association)
 * so concurrent accepts can't overfill, and a job that fills auto-rejects the rest.
 */
@ExtendWith(MockitoExtension.class)
class ApplicationServiceTest {

    @Mock ApplicationRepository applicationRepository;
    @Mock JobPostRepository jobRepository;
    @Mock WorkerProfileRepository workerRepository;
    @Mock CurrentUserService currentUserService;
    @Mock QrService qrService;
    @Mock NotificationTriggers notificationTriggers;
    @Mock SettingsService settingsService;

    ApplicationService newService() {
        return new ApplicationService(applicationRepository, jobRepository, workerRepository,
                currentUserService, qrService, notificationTriggers, settingsService);
    }

    private JobPost job(Long id, CompanyProfile company, int needed, int accepted) {
        JobPost job = new JobPost();
        job.setId(id);
        job.setCompany(company);
        job.setStatus(JobStatus.OPEN);
        job.setWorkersNeeded(needed);
        job.setWorkersAccepted(accepted);
        job.setJobDate(LocalDate.now().plusDays(1));
        job.setStartTime(LocalTime.of(9, 0));
        job.setEndTime(LocalTime.of(17, 0));
        job.setDailyWage(new BigDecimal("2500"));
        return job;
    }

    private CompanyProfile company(Long companyId, Long userId) {
        User companyUser = new User();
        companyUser.setId(userId);
        companyUser.setRole(Role.COMPANY);
        CompanyProfile company = new CompanyProfile();
        company.setId(companyId);
        company.setUser(companyUser);
        return company;
    }

    private WorkerProfile workerWithUser(Long workerId, User user, VerificationStatus status) {
        WorkerProfile worker = new WorkerProfile();
        worker.setId(workerId);
        worker.setUser(user);
        worker.setStatus(status);
        return worker;
    }

    @Test
    void apply_blocksCompanyApplyingToItsOwnJob() {
        User sharedUser = new User();
        sharedUser.setId(99L);
        CompanyProfile ownCompany = company(1L, 99L);
        JobPost job = job(10L, ownCompany, 3, 0);
        WorkerProfile worker = workerWithUser(5L, sharedUser, VerificationStatus.VERIFIED);

        when(currentUserService.requireCurrentUser()).thenReturn(sharedUser);
        when(workerRepository.findByUserId(99L)).thenReturn(Optional.of(worker));
        when(jobRepository.findById(10L)).thenReturn(Optional.of(job));

        assertThatThrownBy(() -> newService().apply(10L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("own company");
    }

    @Test
    void apply_verifiedWorker_isAutoAcceptedAndJobFillsViaLockedFetch() {
        CompanyProfile otherCompany = company(1L, 1L);
        User workerUser = new User();
        workerUser.setId(2L);
        WorkerProfile worker = workerWithUser(5L, workerUser, VerificationStatus.VERIFIED);
        // workersNeeded=1, workersAccepted=0 — this single accept should fill the job.
        JobPost job = job(10L, otherCompany, 1, 0);

        when(currentUserService.requireCurrentUser()).thenReturn(workerUser);
        when(workerRepository.findByUserId(2L)).thenReturn(Optional.of(worker));
        when(jobRepository.findById(10L)).thenReturn(Optional.of(job));
        when(applicationRepository.findByJobPostAndWorker(job, worker)).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenAnswer(inv -> inv.getArgument(0));
        // acceptInternal re-fetches the job under a pessimistic lock rather than trusting the
        // lazy association already on the application — this is the race-condition fix.
        when(jobRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(job));
        when(applicationRepository.findByJobPostAndStatus(job, ApplicationStatus.PENDING))
                .thenReturn(java.util.List.of());

        var response = newService().apply(10L);

        assertThat(response.status()).isEqualTo(ApplicationStatus.ACCEPTED);
        assertThat(job.getWorkersAccepted()).isEqualTo(1);
        assertThat(job.getStatus()).isEqualTo(JobStatus.FILLED);
    }

    @Test
    void apply_unverifiedWorker_staysPendingWithoutAccepting() {
        CompanyProfile otherCompany = company(1L, 1L);
        User workerUser = new User();
        workerUser.setId(2L);
        WorkerProfile worker = workerWithUser(5L, workerUser, VerificationStatus.PENDING);
        JobPost job = job(10L, otherCompany, 3, 0);

        when(currentUserService.requireCurrentUser()).thenReturn(workerUser);
        when(workerRepository.findByUserId(2L)).thenReturn(Optional.of(worker));
        when(jobRepository.findById(10L)).thenReturn(Optional.of(job));
        when(applicationRepository.findByJobPostAndWorker(job, worker)).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenAnswer(inv -> inv.getArgument(0));

        var response = newService().apply(10L);

        assertThat(response.status()).isEqualTo(ApplicationStatus.PENDING);
        assertThat(job.getWorkersAccepted()).isEqualTo(0);
    }

    @Test
    void apply_onClosedJob_throws() {
        CompanyProfile otherCompany = company(1L, 1L);
        User workerUser = new User();
        workerUser.setId(2L);
        WorkerProfile worker = workerWithUser(5L, workerUser, VerificationStatus.VERIFIED);
        JobPost job = job(10L, otherCompany, 1, 1);
        job.setStatus(JobStatus.FILLED);

        when(currentUserService.requireCurrentUser()).thenReturn(workerUser);
        when(workerRepository.findByUserId(2L)).thenReturn(Optional.of(worker));
        when(jobRepository.findById(10L)).thenReturn(Optional.of(job));

        assertThatThrownBy(() -> newService().apply(10L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("no longer accepting");
    }
}
