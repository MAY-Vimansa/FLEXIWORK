package com.flexiwork.dto.job;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalTime;

/** Extend a job's shift to a new end time and grant each on-site worker an extra wage. */
public record ExtendShiftRequest(
        @NotNull LocalTime newEndTime,
        @NotNull @PositiveOrZero BigDecimal extraWage) {
}
