package com.flexiwork.service;

import com.flexiwork.dto.PageResponse;
import com.flexiwork.dto.job.JobFeedQuery;
import com.flexiwork.dto.job.JobRequest;
import com.flexiwork.dto.job.JobResponse;
import com.flexiwork.entity.CompanyProfile;
import com.flexiwork.entity.JobPost;
import com.flexiwork.entity.enums.JobStatus;
import com.flexiwork.entity.enums.VerificationStatus;
import com.flexiwork.exception.BusinessException;
import com.flexiwork.exception.ResourceNotFoundException;
import com.flexiwork.repository.JobPostRepository;
import com.flexiwork.repository.JobPostSpecifications;
import com.flexiwork.security.CurrentUserService;
import com.flexiwork.util.GeoUtil;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.RoundingMode;

/**
 * Job posting use cases: the public feed (dynamic filtering + pagination) and company-scoped CRUD.
 * Posting/editing requires a VERIFIED company; staff (poster) actions resolve the company from the
 * authenticated user via {@link CurrentUserService}, never from request input.
 */
@Service
public class JobService {

    /** No single shift (including extensions) may exceed this many hours total. */
    private static final long MAX_SHIFT_HOURS = 24;

    private final JobPostRepository jobRepository;
    private final JobMapper jobMapper;
    private final CurrentUserService currentUserService;
    private final NotificationTriggers notificationTriggers;
    private final com.flexiwork.repository.AttendanceRepository attendanceRepository;
    private final com.flexiwork.repository.ShiftExtensionRepository shiftExtensionRepository;

    public JobService(JobPostRepository jobRepository,
                      JobMapper jobMapper,
                      CurrentUserService currentUserService,
                      NotificationTriggers notificationTriggers,
                      com.flexiwork.repository.AttendanceRepository attendanceRepository,
                      com.flexiwork.repository.ShiftExtensionRepository shiftExtensionRepository) {
        this.jobRepository = jobRepository;
        this.jobMapper = jobMapper;
        this.currentUserService = currentUserService;
        this.notificationTriggers = notificationTriggers;
        this.attendanceRepository = attendanceRepository;
        this.shiftExtensionRepository = shiftExtensionRepository;
    }

    // ------------------------------------------------------------------
    // Public feed
    // ------------------------------------------------------------------
    @Transactional(readOnly = true)
    public PageResponse<JobResponse> feed(JobFeedQuery query, int page, int size) {
        Specification<JobPost> spec = Specification.where(JobPostSpecifications.isOpen())
                .and(JobPostSpecifications.hasDistrict(query.district()))
                .and(JobPostSpecifications.hasCategory(query.category()))
                .and(JobPostSpecifications.wageAtLeast(query.minWage()))
                .and(JobPostSpecifications.onDate(query.date()))
                .and(JobPostSpecifications.keywordMatches(query.keyword()));

        Pageable pageable = PageRequest.of(page, size, resolveSort(query.sort()));
        Page<JobPost> result = jobRepository.findAll(spec, pageable);
        return PageResponse.from(result,
                job -> jobMapper.toResponse(job, query.workerLat(), query.workerLng()));
    }

    private Sort resolveSort(String sort) {
        return switch (sort == null ? "newest" : sort) {
            case "wage" -> Sort.by(Sort.Direction.DESC, "dailyWage");
            case "date" -> Sort.by(Sort.Direction.ASC, "jobDate");
            default -> Sort.by(Sort.Direction.DESC, "createdAt");
        };
    }

    @Transactional(readOnly = true)
    public JobResponse getById(Long id, Double viewerLat, Double viewerLng) {
        JobPost job = jobRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Job", id));
        return jobMapper.toResponse(job, viewerLat, viewerLng);
    }

    // ------------------------------------------------------------------
    // Company-scoped CRUD
    // ------------------------------------------------------------------
    @Transactional
    public JobResponse create(JobRequest request) {
        CompanyProfile company = requireVerifiedActingCompany();
        validateCoordinates(request);
        validateTimes(request);

        JobPost job = new JobPost();
        job.setCompany(company);
        applyRequest(job, request);
        job.setStatus(JobStatus.OPEN);
        job.setWorkersAccepted(0);
        return jobMapper.toResponse(jobRepository.save(job), null, null);
    }

    @Transactional
    public JobResponse update(Long id, JobRequest request) {
        JobPost job = requireOwnedJob(id);
        requireNotSuspended(job.getCompany());
        if (job.getStatus() != JobStatus.OPEN) {
            throw new BusinessException("Only OPEN jobs can be edited");
        }
        validateCoordinates(request);
        validateTimes(request);
        applyRequest(job, request);
        return jobMapper.toResponse(jobRepository.save(job), null, null);
    }

    /** Soft-cancel: status becomes CANCELLED and accepted workers are notified. */
    @Transactional
    public void cancel(Long id) {
        JobPost job = requireOwnedJob(id);
        if (job.getStatus() == JobStatus.COMPLETED || job.getStatus() == JobStatus.CANCELLED) {
            throw new BusinessException("Job is already " + job.getStatus());
        }
        job.setStatus(JobStatus.CANCELLED);
        jobRepository.save(job);
        notificationTriggers.onJobCancelled(job);
    }

    /**
     * Auto-cancels OPEN jobs whose scheduled shift end has already passed. A job that never
     * reached FILLED can't be staffed retroactively, so once its end time is in the past it's
     * pointless to keep listed; FILLED jobs are left alone since workers may have actually shown
     * up and the company still needs to Complete & bill them.
     */
    @Transactional
    public void expireOverdueJobs() {
        java.time.LocalDateTime now = com.flexiwork.util.AppClock.now();
        for (JobPost job : jobRepository.findByStatus(JobStatus.OPEN)) {
            java.time.LocalDateTime end = com.flexiwork.util.AppClock.actualEnd(
                    job.getJobDate(), job.getStartTime(), job.getEndTime());
            if (now.isAfter(end)) {
                job.setStatus(JobStatus.CANCELLED);
                jobRepository.save(job);
                notificationTriggers.onJobCancelled(job);
            }
        }
    }

    @Transactional(readOnly = true)
    public PageResponse<JobResponse> myJobs(int page, int size) {
        CompanyProfile company = currentUserService.requireActingCompany();
        Page<JobPost> result = jobRepository.findByCompany(company,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return PageResponse.from(result, job -> jobMapper.toResponse(job, null, null));
    }

    /**
     * Extend a job's shift with extra per-worker pay. The extra wage is granted only to workers
     * still on-site (checked in, not yet checked out), who are notified; an audit row is recorded.
     */
    @Transactional
    public JobResponse extendShift(Long id, java.time.LocalTime newEndTime, java.math.BigDecimal extraWage) {
        JobPost job = requireOwnedJob(id);
        requireNotSuspended(job.getCompany());
        if (job.getStatus() == JobStatus.COMPLETED || job.getStatus() == JobStatus.CANCELLED) {
            throw new BusinessException("Cannot extend a " + job.getStatus() + " job");
        }
        if (!job.getJobDate().equals(com.flexiwork.util.AppClock.today())) {
            throw new BusinessException("Shifts can only be extended on the day of the job");
        }
        java.time.LocalDateTime currentEnd = com.flexiwork.util.AppClock.actualEnd(job.getJobDate(), job.getStartTime(), job.getEndTime());
        java.time.LocalDateTime newEnd = newEndTime == null ? null
                : com.flexiwork.util.AppClock.actualEnd(job.getJobDate(), job.getStartTime(), newEndTime);
        if (newEnd == null || !newEnd.isAfter(currentEnd)) {
            throw new BusinessException("New end time must be after the current end time");
        }
        java.time.LocalDateTime shiftStart = java.time.LocalDateTime.of(job.getJobDate(), job.getStartTime());
        long totalShiftHours = java.time.Duration.between(shiftStart, newEnd).toHours();
        if (totalShiftHours > MAX_SHIFT_HOURS) {
            throw new BusinessException(
                    "Extension would make the shift longer than " + MAX_SHIFT_HOURS + " hours total");
        }
        if (extraWage == null || extraWage.signum() < 0) {
            throw new BusinessException("Extension wage must be zero or positive");
        }
        job.setEndTime(newEndTime);
        jobRepository.save(job);

        var onSite = attendanceRepository.findOnSiteByJobPost(job);
        for (var att : onSite) {
            att.setExtraWage(
                    (att.getExtraWage() == null ? java.math.BigDecimal.ZERO : att.getExtraWage())
                            .add(extraWage));
            attendanceRepository.save(att);
            notificationTriggers.onShiftExtended(att.getApplication(), extraWage);
        }

        com.flexiwork.entity.ShiftExtension ext = new com.flexiwork.entity.ShiftExtension();
        ext.setJobPost(job);
        ext.setExtraWage(extraWage);
        ext.setNewEndTime(newEndTime);
        ext.setAppliedToCount(onSite.size());
        shiftExtensionRepository.save(ext);

        return jobMapper.toResponse(job, null, null);
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------
    private CompanyProfile requireVerifiedActingCompany() {
        CompanyProfile company = currentUserService.requireActingCompany();
        if (company.getStatus() != VerificationStatus.VERIFIED) {
            throw new BusinessException("Your company must be verified before posting jobs");
        }
        requireNotSuspended(company);
        return company;
    }

    /** Block company actions while suspended for overdue payment. */
    private void requireNotSuspended(CompanyProfile company) {
        if (company.isSuspended()) {
            throw new BusinessException(
                    "Your account is suspended due to an overdue payment. Please settle it or contact FlexiWork admins.");
        }
    }

    private JobPost requireOwnedJob(Long id) {
        CompanyProfile company = currentUserService.requireActingCompany();
        JobPost job = jobRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Job", id));
        if (!job.getCompany().getId().equals(company.getId())) {
            throw new BusinessException("This job does not belong to your company");
        }
        return job;
    }

    private void applyRequest(JobPost job, JobRequest r) {
        job.setTitle(r.title());
        job.setDescription(r.description());
        job.setCategory(r.category());
        job.setDistrict(r.district());
        job.setAddressLine(r.addressLine());
        job.setLatitude(r.latitude());
        job.setLongitude(r.longitude());
        job.setJobDate(r.jobDate());
        job.setStartTime(r.startTime());
        job.setEndTime(r.endTime());
        // Daily wages are whole rupees; normalise to guard against floating-point input
        // artefacts (e.g. a browser number-input snapping 5000 to 4999.99) being persisted.
        job.setDailyWage(r.dailyWage().setScale(0, RoundingMode.HALF_UP));
        job.setWorkersNeeded(r.workersNeeded());
    }

    private void validateCoordinates(JobRequest r) {
        if (!GeoUtil.withinSriLanka(r.latitude(), r.longitude())) {
            throw new BusinessException("Coordinates must be within Sri Lanka");
        }
    }

    /** Shifts may cross midnight (e.g. a hotel's 18:00-06:00 night shift): only a true zero-length
     *  shift (identical start/end) is rejected, everything else wraps to the next day. */
    private void validateTimes(JobRequest r) {
        if (r.endTime().equals(r.startTime())) {
            throw new BusinessException("Start and end time cannot be the same");
        }
    }
}
