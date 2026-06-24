package com.flexiwork.dto.attendance;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Result shown on the guard kiosk after a scan. {@code action} is CHECK_IN or CHECK_OUT; the wage
 * fields let the guard see the worker's pay — base on check-in, and the final payable
 * (base + any shift-extension earned) on check-out.
 */
public record ScanResponse(
        String action,            // CHECK_IN | CHECK_OUT
        String workerName,
        String workerPhone,
        String profilePhotoPath,
        String jobTitle,
        Instant time,
        BigDecimal baseWage,
        BigDecimal extraWage,
        BigDecimal totalPayable,
        String message) {
}
