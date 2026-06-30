package com.flexiwork.service;

import com.flexiwork.dto.application.ApplicantResponse;
import com.flexiwork.dto.application.ApplicationResponse;
import com.flexiwork.entity.Application;
import com.flexiwork.entity.CompanyProfile;
import com.flexiwork.entity.JobPost;
import com.flexiwork.entity.WorkerProfile;
import com.flexiwork.entity.enums.ApplicationStatus;
import com.flexiwork.entity.enums.JobStatus;
import com.flexiwork.entity.enums.VerificationStatus;
import com.flexiwork.exception.BusinessException;
import com.flexiwork.exception.ResourceNotFoundException;
import com.flexiwork.repository.ApplicationRepository;
import com.flexiwork.repository.JobPostRepository;
import com.flexiwork.repository.WorkerProfileRepository;
import com.flexiwork.security.CurrentUserService;
import com.flexiwork.util.GeoUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Application + matching use cases. Workers apply (duplicate-guarded); acceptance is fully
 * automatic — a VERIFIED worker is accepted the moment they apply, an unverified worker once their
 * KYC auto-verifies (see {@link #autoAcceptPendingForWorker}). Acceptance issues a unique QR token +
 * image and notifies the worker; when a job fills, remaining pending applications are auto-rejected.
 * Companies only get a read-only view of applicants ({@link #applicantsForJob}) — there is no manual
 * accept/reject step.
 */
@Service
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final JobPostRepository jobRepository;
    private final WorkerProfileRepository workerRepository;
    private final CurrentUserService currentUserService;
    private final QrService qrService;
    private final NotificationTriggers notificationTriggers;
    private final SettingsService settingsService;

    public ApplicationService(ApplicationRepository applicationRepository,
                              JobPostRepository jobRepository,
                              WorkerProfileRepository workerRepository,
                              CurrentUserService currentUserService,
                              QrService qrService,
                              NotificationTriggers notificationTriggers,
                              SettingsService settingsService) {
        this.applicationRepository = applicationRepository;
        this.jobRepository = jobRepository;
        this.workerRepository = workerRepository;
        this.currentUserService = currentUserService;
        this.qrService = qrService;
        this.notificationTriggers = notificationTriggers;
        this.settingsService = settingsService;
    }

    // ------------------------------------------------------------------
    // Worker side
    // ------------------------------------------------------------------
    /**
     * Workers may apply whether verified or not. A VERIFIED worker is auto-accepted on the spot
     * (QR issued immediately, no company review needed); an unverified worker's application stays
     * PENDING and is auto-accepted once their KYC clears the auto-verification window (see
     * {@link #autoAcceptPendingForWorker}, invoked by {@code ScheduledTasks}).
     */
    @Transactional
    public ApplicationResponse apply(Long jobId) {
        WorkerProfile worker = requireWorker();
        JobPost job = jobRepository.findById(jobId)
                .orElseThrow(() -> ResourceNotFoundException.of("Job", jobId));
        if (job.getStatus() != JobStatus.OPEN) {
            throw new BusinessException("This job is no longer accepting applications");
        }
        if (job.getCompany().getUser().getId().equals(worker.getUser().getId())) {
            throw new BusinessException("You cannot apply to your own company's job");
        }

        // Reapply: if a prior application exists, reactivate it when it was cancelled/rejected;
        // otherwise it's a genuine duplicate.
        Optional<Application> prior = applicationRepository.findByJobPostAndWorker(job, worker);
        Application application;
        if (prior.isPresent()) {
            Application existing = prior.get();
            if (existing.getStatus() == ApplicationStatus.PENDING
                    || existing.getStatus() == ApplicationStatus.ACCEPTED) {
                throw new BusinessException("You have already applied for this job");
            }
            existing.setStatus(ApplicationStatus.PENDING);
            existing.setAppliedAt(Instant.now());
            existing.setQrCodeToken(null);
            application = applicationRepository.save(existing);
        } else {
            application = new Application();
            application.setJobPost(job);
            application.setWorker(worker);
            application.setStatus(ApplicationStatus.PENDING);
            try {
                // The (job_post, worker) unique constraint is the real guard against duplicates;
                // two concurrent first-time applies race past the findByJobPostAndWorker check
                // above and one loses here. Translate the raw constraint violation into the same
                // friendly message instead of a generic 409.
                application = applicationRepository.saveAndFlush(application);
            } catch (org.springframework.dao.DataIntegrityViolationException e) {
                throw new BusinessException("You have already applied for this job");
            }
        }

        if (worker.getStatus() == VerificationStatus.VERIFIED) {
            application = acceptInternal(application);
        }
        return toResponse(application);
    }

    @Transactional(readOnly = true)
    public List<ApplicationResponse> myApplications() {
        WorkerProfile worker = requireWorker();
        return applicationRepository.findByWorkerOrderByAppliedAtDesc(worker).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void cancelOwn(Long applicationId) {
        WorkerProfile worker = requireWorker();
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> ResourceNotFoundException.of("Application", applicationId));
        if (!application.getWorker().getId().equals(worker.getId())) {
            throw new BusinessException("This application does not belong to you");
        }
        if (application.getStatus() == ApplicationStatus.REJECTED
                || application.getStatus() == ApplicationStatus.CANCELLED) {
            throw new BusinessException("This application cannot be cancelled");
        }
        // Enforce the cancellation cutoff: no cancelling within N hours of the shift start.
        // Shift times are local Sri Lanka wall-clock; compare against Asia/Colombo "now", not the
        // server's timezone (see AppClock).
        JobPost theJob = application.getJobPost();
        java.time.LocalDateTime shiftStart =
                java.time.LocalDateTime.of(theJob.getJobDate(), theJob.getStartTime());
        long cancelCutoffHours = settingsService.cancelCutoffHours();
        if (com.flexiwork.util.AppClock.now().isAfter(shiftStart.minusHours(cancelCutoffHours))) {
            throw new BusinessException("Applications cannot be cancelled within "
                    + cancelCutoffHours + " hours of the shift start");
        }
        // If they had been accepted, free their slot and reopen a filled job.
        if (application.getStatus() == ApplicationStatus.ACCEPTED) {
            JobPost job = application.getJobPost();
            job.setWorkersAccepted(Math.max(0, job.getWorkersAccepted() - 1));
            if (job.getStatus() == JobStatus.FILLED) {
                job.setStatus(JobStatus.OPEN);
            }
            jobRepository.save(job);
        }
        application.setStatus(ApplicationStatus.CANCELLED);
        applicationRepository.save(application);
    }

    // ------------------------------------------------------------------
    // Company side
    // ------------------------------------------------------------------
    @Transactional(readOnly = true)
    public List<ApplicantResponse> applicantsForJob(Long jobId) {
        JobPost job = requireOwnedJob(jobId);
        return applicationRepository.findByJobPost(job).stream()
                .map(this::toApplicant)
                .toList();
    }

    /**
     * Auto-accepts every PENDING application a worker has for still-OPEN jobs, e.g. right after
     * their KYC auto-verifies. Called by {@code ScheduledTasks.autoApprove()}.
     */
    @Transactional
    public void autoAcceptPendingForWorker(WorkerProfile worker) {
        List<Application> pending =
                applicationRepository.findByWorkerAndStatus(worker, ApplicationStatus.PENDING);
        for (Application application : pending) {
            if (application.getJobPost().getStatus() == JobStatus.OPEN) {
                acceptInternal(application);
            }
        }
    }

    /** Core accept transition: issues the QR, fills the job slot, and auto-rejects the rest once
     *  full. Assumes the caller already checked the application is PENDING and the job is OPEN.
     *  Takes a pessimistic row lock on the job so concurrent accepts for the same job serialize
     *  instead of racing past the workersNeeded check (which could overfill the job). */
    private Application acceptInternal(Application application) {
        Long jobId = application.getJobPost().getId();
        JobPost job = jobRepository.findByIdForUpdate(jobId)
                .orElseThrow(() -> ResourceNotFoundException.of("Job", jobId));
        if (job.getStatus() != JobStatus.OPEN) {
            throw new BusinessException("This job is no longer accepting applications");
        }
        application.setStatus(ApplicationStatus.ACCEPTED);
        application.setQrCodeToken(UUID.randomUUID().toString());
        String qrUrl = qrService.generateAndStore(application.getQrCodeToken());
        application.setQrImageUrl(qrUrl);
        application = applicationRepository.save(application);

        job.setWorkersAccepted(job.getWorkersAccepted() + 1);
        if (job.getWorkersAccepted() >= job.getWorkersNeeded()) {
            job.setStatus(JobStatus.FILLED);
            jobRepository.save(job);
            autoRejectRemaining(job);
        } else {
            jobRepository.save(job);
        }

        notificationTriggers.onApplicationAccepted(application);
        return application;
    }

    /** When a job fills, reject everyone still pending and notify them. */
    private void autoRejectRemaining(JobPost job) {
        List<Application> pending =
                applicationRepository.findByJobPostAndStatus(job, ApplicationStatus.PENDING);
        for (Application app : pending) {
            app.setStatus(ApplicationStatus.REJECTED);
            applicationRepository.save(app);
            notificationTriggers.onApplicationRejected(app);
        }
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------
    private WorkerProfile requireWorker() {
        Long userId = currentUserService.requireCurrentUser().getId();
        return workerRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException("Worker profile not found"));
    }

    private JobPost requireOwnedJob(Long jobId) {
        CompanyProfile company = currentUserService.requireActingCompany();
        JobPost job = jobRepository.findById(jobId)
                .orElseThrow(() -> ResourceNotFoundException.of("Job", jobId));
        if (!job.getCompany().getId().equals(company.getId())) {
            throw new BusinessException("This job does not belong to your company");
        }
        return job;
    }

    private ApplicationResponse toResponse(Application a) {
        JobPost job = a.getJobPost();
        String token = a.getQrCodeToken();
        String qrUrl = a.getQrImageUrl() != null ? a.getQrImageUrl() : (token != null ? "/api/files/qr/" + token + ".png" : null);
        return new ApplicationResponse(
                a.getId(),
                a.getStatus(),
                job.getId(),
                job.getTitle(),
                job.getCompany().getCompanyName(),
                job.getJobDate(),
                job.getAddressLine(),
                job.getDailyWage(),
                GeoUtil.mapsDirectionsLink(job.getLatitude(), job.getLongitude()),
                token,
                qrUrl,
                job.getStatus());
    }

    private ApplicantResponse toApplicant(Application a) {
        WorkerProfile w = a.getWorker();
        return new ApplicantResponse(
                a.getId(),
                a.getStatus(),
                w.getId(),
                w.getFullName(),
                w.getDistrict() != null ? w.getDistrict().name() : null,
                w.getProfilePhotoPath(),
                w.getRatingAverage(),
                w.getSkills());
    }
}
