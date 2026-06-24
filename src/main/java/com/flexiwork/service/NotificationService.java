package com.flexiwork.service;

import com.flexiwork.entity.Application;
import com.flexiwork.entity.JobPost;

/**
 * Outbound worker notifications (WhatsApp). Implementations must be safe to call within a business
 * transaction; callers wrap them via {@link NotificationTriggers} so failures never propagate.
 */
public interface NotificationService {

    void sendApplicationApproved(Application application);

    void sendApplicationRejected(Application application);

    void sendJobCancelled(JobPost job);

    void sendCheckIn(Application application);

    void sendCheckOut(Application application);

    /** Notify a worker their shift was extended with extra pay. */
    void sendShiftExtended(Application application, java.math.BigDecimal extraWage);

    /** 2-hour reminder — sent once when the cancel window closes. */
    void sendShiftReminder(Application application);
}
