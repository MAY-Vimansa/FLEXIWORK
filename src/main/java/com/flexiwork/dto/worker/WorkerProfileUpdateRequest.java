package com.flexiwork.dto.worker;

import com.flexiwork.entity.enums.District;
import jakarta.validation.constraints.*;

/** Editable worker profile fields. NIC and NIC photos are intentionally NOT editable here. */
public record WorkerProfileUpdateRequest(
        @NotBlank @Size(max = 120) String fullName,
        @NotNull District district,
        @DecimalMin("5.5") @DecimalMax("10.0") Double latitude,
        @DecimalMin("79.5") @DecimalMax("82.0") Double longitude,
        @Size(max = 500) String skills) {
}
