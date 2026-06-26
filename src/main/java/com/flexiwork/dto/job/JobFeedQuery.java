package com.flexiwork.dto.job;

import com.flexiwork.entity.enums.District;
import com.flexiwork.entity.enums.JobCategory;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Filter + sort parameters for the public job feed. All fields are optional; absent filters are
 * simply not applied (see {@code JobPostSpecifications}). {@code sort} is one of
 * {@code newest} (default), {@code wage}, {@code date}.
 */
public record JobFeedQuery(
        District district,
        JobCategory category,
        BigDecimal minWage,
        LocalDate date,
        String keyword,
        String sort,
        Double workerLat,
        Double workerLng) {
}
