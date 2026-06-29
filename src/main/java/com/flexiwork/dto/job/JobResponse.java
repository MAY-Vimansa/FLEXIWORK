package com.flexiwork.dto.job;

import com.flexiwork.entity.enums.District;
import com.flexiwork.entity.enums.JobCategory;
import com.flexiwork.entity.enums.JobStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Read model for a job, enriched server-side with the company name/logo, a Google Maps navigation
 * link, the slots remaining, and (when the caller supplies their location) the distance away.
 */
public record JobResponse(
        Long id,
        String title,
        String description,
        JobCategory category,
        District district,
        String addressLine,
        Double latitude,
        Double longitude,
        String mapsLink,
        LocalDate jobDate,
        LocalTime startTime,
        LocalTime endTime,
        BigDecimal dailyWage,
        int workersNeeded,
        int workersAccepted,
        int slotsLeft,
        JobStatus status,
        Long companyId,
        String companyName,
        String companyLogoPath,
        Double distanceKm) {
}
