package com.flexiwork.dto.job;

import com.flexiwork.entity.enums.District;
import com.flexiwork.entity.enums.JobCategory;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Create/update payload for a job post. Coordinate ranges are validated to Sri Lanka's bounding
 * box both here (fast field checks) and in the service (precise {@code GeoUtil.withinSriLanka}).
 */
public record JobRequest(

        @NotBlank @Size(max = 150) String title,
        @NotBlank @Size(max = 2000) String description,
        @NotNull JobCategory category,
        @NotNull District district,
        @NotBlank @Size(max = 255) String addressLine,

        @NotNull @DecimalMin("5.5") @DecimalMax("10.0") Double latitude,
        @NotNull @DecimalMin("79.5") @DecimalMax("82.0") Double longitude,

        @NotNull @FutureOrPresent LocalDate jobDate,
        @NotNull LocalTime startTime,
        @NotNull LocalTime endTime,

        @NotNull @Positive BigDecimal dailyWage,
        @NotNull @Min(1) @Max(500) Integer workersNeeded) {
}
