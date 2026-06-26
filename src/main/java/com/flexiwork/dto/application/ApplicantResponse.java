package com.flexiwork.dto.application;

import com.flexiwork.entity.enums.ApplicationStatus;

/** A company's view of one applicant to its job. */
public record ApplicantResponse(
        Long applicationId,
        ApplicationStatus status,
        Long workerId,
        String workerName,
        String workerDistrict,
        String profilePhotoPath,
        double rating,
        String skills) {
}
