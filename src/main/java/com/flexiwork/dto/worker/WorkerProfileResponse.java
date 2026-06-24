package com.flexiwork.dto.worker;

import com.flexiwork.entity.enums.District;
import com.flexiwork.entity.enums.VerificationStatus;

public record WorkerProfileResponse(
        Long id,
        String fullName,
        String nicNumber,
        String whatsappNumber,
        boolean whatsappVerified,
        District district,
        Double latitude,
        Double longitude,
        String skills,
        double ratingAverage,
        String profilePhotoPath,
        VerificationStatus status) {
}
