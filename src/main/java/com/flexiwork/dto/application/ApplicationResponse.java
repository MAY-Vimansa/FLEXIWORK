package com.flexiwork.dto.application;

import com.flexiwork.entity.enums.ApplicationStatus;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * A worker's view of one of their applications, including the job summary and — once accepted —
 * the QR image URL and Google Maps navigation link.
 */
public record ApplicationResponse(
        Long id,
        ApplicationStatus status,
        Long jobId,
        String jobTitle,
        String companyName,
        LocalDate jobDate,
        String addressLine,
        BigDecimal dailyWage,
        String mapsLink,
        String qrCodeToken,
        String qrImageUrl) {
}
