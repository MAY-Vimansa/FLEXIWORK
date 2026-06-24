package com.flexiwork.dto.attendance;

import java.math.BigDecimal;
import java.time.Instant;

/** One accepted worker's in/out status and pay for a job, used by the guard kiosk roster. */
public record JobWorkerRow(
        Long workerId,
        String workerName,
        String profilePhotoPath,
        boolean checkedIn,
        Instant checkInTime,
        boolean checkedOut,
        Instant checkOutTime,
        BigDecimal extraWage,
        BigDecimal payable) {
}
