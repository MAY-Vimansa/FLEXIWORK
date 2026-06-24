package com.flexiwork.dto.attendance;

import java.time.LocalTime;

/** A today's-job row for the guard kiosk, with live accepted vs checked-in counts. */
public record TodayJobSummary(
        Long jobId,
        String title,
        LocalTime startTime,
        LocalTime endTime,
        int accepted,
        int checkedIn) {
}
