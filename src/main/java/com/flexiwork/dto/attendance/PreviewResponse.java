package com.flexiwork.dto.attendance;

import java.math.BigDecimal;

/**
 * Read-only preview returned before the guard clicks Check In / Check Out.
 * Does not modify any attendance record.
 */
public record PreviewResponse(
        String pendingAction,      // CHECK_IN | CHECK_OUT
        String workerName,
        String workerPhone,
        String profilePhotoPath,
        String jobTitle,
        String jobDate,
        BigDecimal baseWage) {
}
