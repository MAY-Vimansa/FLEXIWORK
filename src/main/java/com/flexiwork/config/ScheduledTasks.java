package com.flexiwork.config;

import com.flexiwork.entity.Application;
import com.flexiwork.entity.CompanyProfile;
import com.flexiwork.entity.Payment;
import com.flexiwork.entity.WorkerProfile;
import com.flexiwork.entity.enums.ApplicationStatus;
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Background jobs:
 * <ul>
 *   <li><b>Auto-approval</b> — PENDING worker/company KYC profiles older than the configured window
 *       are set VERIFIED (admins can still approve/reject sooner; REJECTED is never touched).</li>
 *   <li><b>Payment enforcement</b> — PENDING payments past their due date become OVERDUE and the
 *       owning company is suspended until the balance is cleared.</li>
 *   <li><b>Job expiry</b> — OPEN jobs whose shift end time has passed are auto-cancelled.</li>
 * </ul>
 * Both run on a fixed delay; the windows are configurable so they can be demonstrated quickly.
 */
@Component
public class ScheduledTasks {

    private static final Logger log = LoggerFactory.getLogger(ScheduledTasks.class);

    private final WorkerProfileRepository workerRepository;
    private final CompanyProfileRepository companyRepository;
    private final PaymentRepository paymentRepository;
    private final ApplicationRepository applicationRepository;
    private final NotificationTriggers notificationTriggers;
    private final SettingsService settingsService;
    private final ApplicationService applicationService;
    private final JobService jobService;

    public ScheduledTasks(WorkerProfileRepository workerRepository,
                          CompanyProfileRepository companyRepository,
                          PaymentRepository paymentRepository,
                          ApplicationRepository applicationRepository,
                          NotificationTriggers notificationTriggers,
                          SettingsService settingsService,
                          ApplicationService applicationService,
                          JobService jobService) {
        this.workerRepository = workerRepository;
        this.companyRepository = companyRepository;
        this.paymentRepository = paymentRepository;
        this.applicationRepository = applicationRepository;
        this.notificationTriggers = notificationTriggers;
        this.settingsService = settingsService;
        this.applicationService = applicationService;
        this.jobService = jobService;
    }

    /** Auto-cancel OPEN jobs whose shift end has passed. Runs every 30s so the dashboard, "My
     *  jobs" and the public homepage feed reflect expiry close to real time. */
    @Scheduled(fixedDelay = 30_000, initialDelay = 10_000)
    public void expireJobs() {
        jobService.expireOverdueJobs();
    }

    /** Auto-approve KYC after the window. Runs every minute. */
    @Scheduled(fixedDelay = 60_000, initialDelay = 15_000)
    @Transactional
    public void autoApprove() {
        Instant cutoff = Instant.now().minus(settingsService.approvalAutoWindowMinutes(), ChronoUnit.MINUTES);

        List<WorkerProfile> workers =
                workerRepository.findByStatusAndCreatedAtBefore(VerificationStatus.PENDING, cutoff);
        for (WorkerProfile w : workers) {
            w.setStatus(VerificationStatus.VERIFIED);
            w.setApprovedAt(Instant.now());
        }
        if (!workers.isEmpty()) {
            workerRepository.saveAll(workers);
            log.info("Auto-approved {} worker(s).", workers.size());
            // Newly-verified workers may have job applications that were left PENDING while
            // unverified; accept those now (QR issued) so they don't wait for company review.
            for (WorkerProfile w : workers) {
                applicationService.autoAcceptPendingForWorker(w);
            }
        }

        List<CompanyProfile> companies =
                companyRepository.findByStatusAndCreatedAtBefore(VerificationStatus.PENDING, cutoff);
        for (CompanyProfile c : companies) {
            c.setStatus(VerificationStatus.VERIFIED);
            c.setApprovedAt(Instant.now());
        }
        if (!companies.isEmpty()) {
            companyRepository.saveAll(companies);
            log.info("Auto-approved {} compan(ies).", companies.size());
        }
    }

    /**
     * Sends a WhatsApp reminder to workers whose shift starts in exactly 2 hours (the same moment
     * the cancel window closes). Runs every minute; uses reminderSentAt to send only once per application.
     */
    @Scheduled(fixedDelay = 60_000, initialDelay = 30_000)
    @Transactional
    public void sendShiftReminders() {
        // Compare against the full shift start instant (date + time), not bare wall-clock time, so
        // the 2h window is computed with real date arithmetic and never wraps incorrectly across
        // midnight (e.g. a 23:00 shift evaluated at 21:00).
        java.time.LocalDateTime now = com.flexiwork.util.AppClock.now();

        List<Application> candidates = applicationRepository
                .findByStatusAndReminderSentAtIsNullAndJobPost_JobDate(
                        ApplicationStatus.ACCEPTED, com.flexiwork.util.AppClock.today());

        for (Application app : candidates) {
            java.time.LocalDateTime shiftStart = java.time.LocalDateTime.of(
                    app.getJobPost().getJobDate(), app.getJobPost().getStartTime());
            long minutesUntilStart = java.time.Duration.between(now, shiftStart).toMinutes();
            // Fire once when the shift is ~2h out (this tick lands in the [120, 121) minute window).
            if (minutesUntilStart >= 120 && minutesUntilStart < 121) {
                notificationTriggers.onShiftReminder(app);
                app.setReminderSentAt(Instant.now());
                applicationRepository.save(app);
                log.info("Shift reminder sent for application {}.", app.getId());
            }
        }
    }

    /** Flag overdue payments and suspend the companies that owe them. Runs every minute. */
    @Scheduled(fixedDelay = 60_000, initialDelay = 20_000)
    @Transactional
    public void enforcePayments() {
        List<Payment> overdue =
                paymentRepository.findByStatusAndDueDateBefore(
                        PaymentStatus.PENDING, com.flexiwork.util.AppClock.today());
        for (Payment p : overdue) {
            p.setStatus(PaymentStatus.OVERDUE);
            CompanyProfile company = p.getCompany();
            if (!company.isSuspended()) {
                company.setSuspended(true);
                company.setSuspendedAt(Instant.now());
                companyRepository.save(company);
                log.warn("Suspended company {} for overdue payment {}.",
                        company.getCompanyName(), p.getReceiptNumber());
            }
        }
        if (!overdue.isEmpty()) {
            paymentRepository.saveAll(overdue);
        }
    }
}
