package com.flexiwork.service;

import com.flexiwork.entity.Application;
import com.flexiwork.entity.Attendance;
import com.flexiwork.entity.CompanyProfile;
import com.flexiwork.entity.JobPost;
import com.flexiwork.entity.User;
import com.flexiwork.entity.WorkerProfile;
import com.flexiwork.entity.enums.ApplicationStatus;
import com.flexiwork.exception.BusinessException;
import com.flexiwork.repository.ApplicationRepository;
import com.flexiwork.repository.AttendanceRepository;
import com.flexiwork.repository.JobPostRepository;
import com.flexiwork.security.CurrentUserService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Covers the QR check-in/check-out toggle, including the concurrent-scan race fix: two scans
 * racing on the same just-unscanned QR must not both create an attendance row (the unique
 * application_id constraint backs this — here we verify the resulting DB error becomes a clear
 * BusinessException instead of a raw 500/DataIntegrityViolationException), and the suspended-company
 * guard added so a company can't keep scanning while suspended for an overdue payment.
 */
@ExtendWith(MockitoExtension.class)
class AttendanceServiceTest {

    @Mock ApplicationRepository applicationRepository;
    @Mock AttendanceRepository attendanceRepository;
    @Mock JobPostRepository jobRepository;
    @Mock CurrentUserService currentUserService;
    @Mock NotificationTriggers notificationTriggers;

    AttendanceService newService() {
        return new AttendanceService(applicationRepository, attendanceRepository, jobRepository,
                currentUserService, notificationTriggers);
    }

    private CompanyProfile company(Long id, boolean suspended) {
        CompanyProfile company = new CompanyProfile();
        company.setId(id);
        company.setSuspended(suspended);
        return company;
    }

    private Application acceptedApplicationToday(CompanyProfile company) {
        JobPost job = new JobPost();
        job.setId(10L);
        job.setCompany(company);
        job.setJobDate(com.flexiwork.util.AppClock.today());
        job.setStartTime(LocalTime.of(9, 0));
        job.setEndTime(LocalTime.of(17, 0));
        job.setDailyWage(new BigDecimal("2500"));

        WorkerProfile worker = new WorkerProfile();
        worker.setId(1L);
        worker.setFullName("Nimal Silva");

        Application application = new Application();
        application.setId(100L);
        application.setJobPost(job);
        application.setWorker(worker);
        application.setStatus(ApplicationStatus.ACCEPTED);
        application.setQrCodeToken("tok-1");
        return application;
    }

    @Test
    void scan_firstScan_createsCheckIn() {
        CompanyProfile company = company(1L, false);
        Application application = acceptedApplicationToday(company);
        User scanner = new User();
        scanner.setId(7L);

        when(currentUserService.requireActingCompany()).thenReturn(company);
        when(currentUserService.requireCurrentUser()).thenReturn(scanner);
        when(applicationRepository.findByQrCodeToken("tok-1")).thenReturn(Optional.of(application));
        when(attendanceRepository.findByApplication(application)).thenReturn(Optional.empty());
        when(attendanceRepository.save(any(Attendance.class))).thenAnswer(inv -> inv.getArgument(0));

        var response = newService().scan("tok-1");

        assertThat(response.action()).isEqualTo("CHECK_IN");
    }

    @Test
    void scan_secondScan_togglesToCheckOut() {
        CompanyProfile company = company(1L, false);
        Application application = acceptedApplicationToday(company);
        User scanner = new User();
        scanner.setId(7L);
        Attendance existing = new Attendance();
        existing.setApplication(application);
        existing.setCheckInTime(java.time.Instant.now());
        existing.setExtraWage(BigDecimal.ZERO);

        when(currentUserService.requireActingCompany()).thenReturn(company);
        when(currentUserService.requireCurrentUser()).thenReturn(scanner);
        when(applicationRepository.findByQrCodeToken("tok-1")).thenReturn(Optional.of(application));
        when(attendanceRepository.findByApplication(application)).thenReturn(Optional.of(existing));
        when(attendanceRepository.save(any(Attendance.class))).thenAnswer(inv -> inv.getArgument(0));

        var response = newService().scan("tok-1");

        assertThat(response.action()).isEqualTo("CHECK_OUT");
        assertThat(existing.getCheckOutTime()).isNotNull();
    }

    @Test
    void scan_concurrentDoubleCheckIn_surfacesAsBusinessExceptionNotRawDbError() {
        CompanyProfile company = company(1L, false);
        Application application = acceptedApplicationToday(company);
        User scanner = new User();
        scanner.setId(7L);

        when(currentUserService.requireActingCompany()).thenReturn(company);
        when(currentUserService.requireCurrentUser()).thenReturn(scanner);
        when(applicationRepository.findByQrCodeToken("tok-1")).thenReturn(Optional.of(application));
        when(attendanceRepository.findByApplication(application)).thenReturn(Optional.empty());
        // Simulates the unique application_id constraint firing because another thread's scan
        // already inserted the check-in row between our read and our write.
        when(attendanceRepository.save(any(Attendance.class)))
                .thenThrow(new DataIntegrityViolationException("duplicate key"));

        assertThatThrownBy(() -> newService().scan("tok-1"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("just checked in by another scan");
    }

    @Test
    void scan_suspendedCompany_isBlocked() {
        CompanyProfile suspended = company(1L, true);

        when(currentUserService.requireActingCompany()).thenReturn(suspended);

        assertThatThrownBy(() -> newService().scan("tok-1"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("suspended");
    }

    @Test
    void scan_jobNotScheduledForToday_throws() {
        CompanyProfile company = company(1L, false);
        Application application = acceptedApplicationToday(company);
        application.getJobPost().setJobDate(LocalDate.now().minusDays(1));
        User scanner = new User();
        scanner.setId(7L);

        when(currentUserService.requireActingCompany()).thenReturn(company);
        when(currentUserService.requireCurrentUser()).thenReturn(scanner);
        when(applicationRepository.findByQrCodeToken("tok-1")).thenReturn(Optional.of(application));

        assertThatThrownBy(() -> newService().scan("tok-1"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("not scheduled for today");
    }
}
