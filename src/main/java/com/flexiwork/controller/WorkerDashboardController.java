package com.flexiwork.controller;

import com.flexiwork.entity.Attendance;
import com.flexiwork.entity.WorkerProfile;
import com.flexiwork.entity.enums.ApplicationStatus;
import com.flexiwork.entity.enums.JobStatus;
import com.flexiwork.exception.BusinessException;
import com.flexiwork.repository.ApplicationRepository;
import com.flexiwork.repository.AttendanceRepository;
import com.flexiwork.repository.WorkerProfileRepository;
import com.flexiwork.security.CurrentUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

/** Stats for the worker's dashboard: jobs completed, total earned, active applications. */
@RestController
@RequestMapping("/api/worker/dashboard")
@PreAuthorize("hasRole('WORKER')")
@Tag(name = "Worker dashboard")
public class WorkerDashboardController {

    private final WorkerProfileRepository workerRepository;
    private final AttendanceRepository attendanceRepository;
    private final ApplicationRepository applicationRepository;
    private final CurrentUserService currentUserService;

    public WorkerDashboardController(WorkerProfileRepository workerRepository,
                                     AttendanceRepository attendanceRepository,
                                     ApplicationRepository applicationRepository,
                                     CurrentUserService currentUserService) {
        this.workerRepository = workerRepository;
        this.attendanceRepository = attendanceRepository;
        this.applicationRepository = applicationRepository;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    @Operation(summary = "Worker dashboard statistics")
    public DashboardResponse dashboard() {
        Long userId = currentUserService.requireCurrentUser().getId();
        WorkerProfile worker = workerRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException("Worker profile not found"));

        var attendances = attendanceRepository.findByWorker(worker);
        // Earned = base wage + any extension pay, across every job the worker attended.
        BigDecimal totalEarned = attendances.stream()
                .map(a -> a.getApplication().getJobPost().getDailyWage()
                        .add(a.getExtraWage() == null ? BigDecimal.ZERO : a.getExtraWage()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long completedJobs = attendances.stream()
                .filter(a -> a.getApplication().getJobPost().getStatus() == JobStatus.COMPLETED)
                .count();

        long activeApplications = applicationRepository.findByWorkerOrderByAppliedAtDesc(worker).stream()
                .filter(app -> app.getStatus() == ApplicationStatus.PENDING
                        || app.getStatus() == ApplicationStatus.ACCEPTED)
                // A job the company has finished (COMPLETED) or cancelled (CANCELLED) is no longer
                // "enrolled" — it belongs in Job History, so keep it out of the active count.
                .filter(app -> app.getJobPost().getStatus() != JobStatus.COMPLETED
                        && app.getJobPost().getStatus() != JobStatus.CANCELLED)
                .count();

        return new DashboardResponse(completedJobs, totalEarned, activeApplications, attendances.size());
    }

    public record DashboardResponse(long completedJobs, BigDecimal totalEarned,
                                    long activeApplications, long jobsAttended) {
    }
}
