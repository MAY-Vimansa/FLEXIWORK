package com.flexiwork.service;

import com.flexiwork.entity.Application;
import com.flexiwork.entity.JobPost;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Business-event facade for outbound notifications. Each method is fail-safe: a delivery failure is
 * logged and swallowed so it can never roll back the surrounding business transaction (a core
 * requirement). The actual WhatsApp Cloud API / email wiring is injected in step 8 via
 * {@code NotificationService}; until then these methods log the intent.
 */
@Component
public class NotificationTriggers {

    private static final Logger log = LoggerFactory.getLogger(NotificationTriggers.class);

    private final NotificationService notificationService;

    public NotificationTriggers(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    /** Worker accepted onto a job — send approval with job details, maps link and QR image. */
    public void onApplicationAccepted(Application application) {
        safely(() -> notificationService.sendApplicationApproved(application),
                "approval", application.getId());
    }

    /** Worker's pending application auto/manually rejected. */
    public void onApplicationRejected(Application application) {
        safely(() -> notificationService.sendApplicationRejected(application),
                "rejection", application.getId());
    }

    /** A job was cancelled — notify all already-accepted workers. */
    public void onJobCancelled(JobPost job) {
        safely(() -> notificationService.sendJobCancelled(job),
                "cancellation", job.getId());
    }

    /** Worker checked IN via QR scan. */
    public void onCheckIn(Application application) {
        safely(() -> notificationService.sendCheckIn(application), "check-in", application.getId());
    }

    /** Worker checked OUT via QR scan. */
    public void onCheckOut(Application application) {
        safely(() -> notificationService.sendCheckOut(application), "check-out", application.getId());
    }

    /** Worker's shift was extended with extra pay. */
    public void onShiftExtended(Application application, java.math.BigDecimal extraWage) {
        safely(() -> notificationService.sendShiftExtended(application, extraWage),
                "shift-extended", application.getId());
    }

    /** 2-hour shift reminder — cancel window has closed. */
    public void onShiftReminder(Application application) {
        safely(() -> notificationService.sendShiftReminder(application),
                "shift-reminder", application.getId());
    }

    private void safely(Runnable action, String kind, Object refId) {
        try {
            action.run();
        } catch (Exception ex) {
            log.warn("Notification '{}' for ref {} failed (continuing): {}",
                    kind, refId, ex.getMessage());
        }
    }
}
