package com.flexiwork.util;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

/**
 * The platform operates only in Sri Lanka, so all business-date logic (job dates, shift cutoffs,
 * payment due dates) must be computed in {@code Asia/Colombo}, not the server's local timezone —
 * otherwise the server and the actual users disagree on what day/hour it is. Use this instead of
 * {@code LocalDate.now()} / {@code LocalDateTime.now()} for anything compared against a job date,
 * shift time, or due date. {@code Instant.now()} (pure timestamps with no calendar meaning, e.g.
 * audit "scanned at" fields) is unaffected and should keep using {@code Instant.now()} directly.
 */
public final class AppClock {

    public static final ZoneId ZONE = ZoneId.of("Asia/Colombo");

    private AppClock() {
    }

    public static LocalDate today() {
        return LocalDate.now(ZONE);
    }

    public static LocalDateTime now() {
        return LocalDateTime.now(ZONE);
    }

    /** Resolves a shift's end instant, rolling over to the next day when endTime <= startTime
     *  (i.e. the shift crosses midnight, e.g. a hotel's 18:00-06:00 night shift). */
    public static LocalDateTime actualEnd(LocalDate jobDate, java.time.LocalTime startTime, java.time.LocalTime endTime) {
        LocalDateTime end = LocalDateTime.of(jobDate, endTime);
        return endTime.isAfter(startTime) ? end : end.plusDays(1);
    }
}
