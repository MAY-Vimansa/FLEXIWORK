package com.flexiwork.service;

import com.flexiwork.dto.attendance.JobWorkerRow;
import com.flexiwork.dto.attendance.PreviewResponse;
import com.flexiwork.dto.attendance.ScanResponse;
import com.flexiwork.dto.attendance.TodayJobSummary;
import com.flexiwork.entity.Application;
import com.flexiwork.entity.Attendance;
import com.flexiwork.entity.CompanyProfile;
import com.flexiwork.entity.JobPost;
import com.flexiwork.entity.WorkerProfile;
import com.flexiwork.entity.enums.ApplicationStatus;
import com.flexiwork.exception.BusinessException;
import com.flexiwork.repository.ApplicationRepository;
import com.flexiwork.repository.AttendanceRepository;
import com.flexiwork.repository.JobPostRepository;
import com.flexiwork.security.CurrentUserService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * QR attendance scanning, used by COMPANY owners and COMPANY_GUARD staff. A scan is only accepted
 * when the token maps to an ACCEPTED application for one of <em>this</em> company's jobs scheduled
 * for <em>today</em>, and the worker has not already checked in. Each failure mode returns a
 * distinct, clear message.
 */
@Service
public class AttendanceService {

    private final ApplicationRepository applicationRepository;
    private final AttendanceRepository attendanceRepository;
    private final JobPostRepository jobRepository;
    private final CurrentUserService currentUserService;
    private final NotificationTriggers notificationTriggers;

    public AttendanceService(ApplicationRepository applicationRepository,
                             AttendanceRepository attendanceRepository,
                             JobPostRepository jobRepository,
                             CurrentUserService currentUserService,
                             NotificationTriggers notificationTriggers) {
        this.applicationRepository = applicationRepository;
        this.attendanceRepository = attendanceRepository;
        this.jobRepository = jobRepository;
        this.currentUserService = currentUserService;
        this.notificationTriggers = notificationTriggers;
    }

    /** Read-only lookup — returns what action WOULD happen without changing any record. */
    @Transactional(readOnly = true)
    public PreviewResponse preview(String token) {
        CompanyProfile company = currentUserService.requireActingCompany();
        Application application = applicationRepository.findByQrCodeToken(token)
                .orElseThrow(() -> new BusinessException("Invalid QR code"));
        JobPost job = application.getJobPost();
        if (!job.getCompany().getId().equals(company.getId()))
            throw new BusinessException("This QR code belongs to another company's job");
        if (application.getStatus() != ApplicationStatus.ACCEPTED)
            throw new BusinessException("This worker was not accepted for the job");
        if (!job.getJobDate().equals(com.flexiwork.util.AppClock.today()))
            throw new BusinessException("This job is not scheduled for today (" + job.getJobDate() + ")");
        WorkerProfile worker = application.getWorker();
        Optional<Attendance> existing = attendanceRepository.findByApplication(application);
        String pendingAction;
        if (existing.isEmpty()) {
            pendingAction = "CHECK_IN";
        } else if (existing.get().getCheckOutTime() == null) {
            pendingAction = "CHECK_OUT";
        } else {
            throw new BusinessException("This worker has already checked out");
        }
        return new PreviewResponse(pendingAction, worker.getFullName(), worker.getWhatsappNumber(),
                worker.getProfilePhotoPath(), job.getTitle(), job.getJobDate().toString(), job.getDailyWage());
    }

    @Transactional
    public ScanResponse scan(String token) {
        CompanyProfile company = currentUserService.requireActingCompany();
        if (company.isSuspended()) {
            throw new BusinessException(
                    "Your account is suspended due to an overdue payment. Please settle it or contact FlexiWork admins.");
        }
        Long scannerUserId = currentUserService.requireCurrentUser().getId();

        Application application = applicationRepository.findByQrCodeToken(token)
                .orElseThrow(() -> new BusinessException("Invalid QR code"));
        JobPost job = application.getJobPost();

        if (!job.getCompany().getId().equals(company.getId())) {
            throw new BusinessException("This QR code belongs to another company's job");
        }
        if (application.getStatus() != ApplicationStatus.ACCEPTED) {
            throw new BusinessException("This worker was not accepted for the job");
        }
        if (!job.getJobDate().equals(com.flexiwork.util.AppClock.today())) {
            throw new BusinessException("This job is not scheduled for today ("
                    + job.getJobDate() + ")");
        }
        WorkerProfile worker = application.getWorker();
        Optional<Attendance> existing = attendanceRepository.findByApplication(application);

        // Auto-toggle: no row → check IN; row without checkout → check OUT; already out → error.
        // The application_id column is unique, so a concurrent double check-in (two scans racing
        // on the same QR before either commits) fails on insert here rather than creating two rows.
        if (existing.isEmpty()) {
            Attendance attendance = new Attendance();
            attendance.setApplication(application);
            attendance.setCheckInTime(Instant.now());
            attendance.setVerified(true);
            attendance.setExtraWage(BigDecimal.ZERO);
            attendance.setScannedByUserId(scannerUserId);
            try {
                attendanceRepository.save(attendance);
            } catch (DataIntegrityViolationException e) {
                throw new BusinessException("This worker was just checked in by another scan");
            }
            notificationTriggers.onCheckIn(application);
            return scanResponse("CHECK_IN", worker, job, attendance, attendance.getCheckInTime(),
                    "Checked IN: " + worker.getFullName());
        }

        Attendance attendance = existing.get();
        if (attendance.getCheckOutTime() != null) {
            throw new BusinessException("This worker has already checked out");
        }
        attendance.setCheckOutTime(Instant.now());
        attendance.setScannedOutByUserId(scannerUserId);
        attendanceRepository.save(attendance);
        notificationTriggers.onCheckOut(application);
        return scanResponse("CHECK_OUT", worker, job, attendance, attendance.getCheckOutTime(),
                "Checked OUT: " + worker.getFullName());
    }

    private ScanResponse scanResponse(String action, WorkerProfile worker, JobPost job,
                                      Attendance attendance, Instant time, String message) {
        BigDecimal base = job.getDailyWage();
        BigDecimal extra = attendance.getExtraWage() == null ? BigDecimal.ZERO : attendance.getExtraWage();
        BigDecimal payable = base.add(extra);
        return new ScanResponse(action, worker.getFullName(), worker.getWhatsappNumber(),
                worker.getProfilePhotoPath(), job.getTitle(), time, base, extra, payable, message);
    }

    /** Accepted workers for a job with their real-time check-in status. */
    @Transactional(readOnly = true)
    public List<JobWorkerRow> jobWorkers(Long jobId) {
        CompanyProfile company = currentUserService.requireActingCompany();
        JobPost job = jobRepository.findById(jobId)
                .orElseThrow(() -> new BusinessException("Job not found"));
        if (!job.getCompany().getId().equals(company.getId())) {
            throw new BusinessException("Job not found");
        }
        return applicationRepository.findByJobPostAndStatus(job, ApplicationStatus.ACCEPTED).stream()
                .map(app -> {
                    WorkerProfile w = app.getWorker();
                    Optional<Attendance> att = attendanceRepository.findByApplication(app);
                    BigDecimal extra = att.map(Attendance::getExtraWage).orElse(BigDecimal.ZERO);
                    BigDecimal payable = att.isPresent() ? job.getDailyWage().add(extra) : null;
                    return new JobWorkerRow(
                            w.getId(),
                            w.getFullName(),
                            w.getProfilePhotoPath(),
                            att.isPresent(),
                            att.map(Attendance::getCheckInTime).orElse(null),
                            att.map(a -> a.getCheckOutTime() != null).orElse(false),
                            att.map(Attendance::getCheckOutTime).orElse(null),
                            extra,
                            payable);
                })
                .toList();
    }

    /** Today's jobs for the acting company with live accepted vs checked-in counts (kiosk feed). */
    @Transactional(readOnly = true)
    public List<TodayJobSummary> todaysJobs() {
        CompanyProfile company = currentUserService.requireActingCompany();
        return jobRepository.findByCompanyAndJobDate(company, com.flexiwork.util.AppClock.today()).stream()
                .map(job -> new TodayJobSummary(
                        job.getId(),
                        job.getTitle(),
                        job.getStartTime(),
                        job.getEndTime(),
                        (int) applicationRepository.countByJobPostAndStatus(job, ApplicationStatus.ACCEPTED),
                        (int) attendanceRepository.countVerifiedByJobPost(job)))
                .toList();
    }
}
