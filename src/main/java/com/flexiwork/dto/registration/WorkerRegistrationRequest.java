package com.flexiwork.dto.registration;

import com.flexiwork.entity.enums.District;
import jakarta.validation.constraints.*;

/**
 * Worker self-registration fields (the three required files are bound separately as multipart
 * parts). Submitted as {@code multipart/form-data} with a JSON-or-form body plus file parts.
 */
public record WorkerRegistrationRequest(
        @NotBlank @Size(max = 120) String fullName,
        @NotBlank @Pattern(regexp = "^(\\d{9}[VXvx]|\\d{12})$",
                message = "NIC must be a valid Sri Lankan NIC, e.g. 991234567V or 199912345678")
        String nicNumber,
        @NotBlank @Pattern(regexp = "^[\\w.+-]+@[A-Za-z\\d-]+\\.[A-Za-z]{2,}$",
                message = "Email must be a valid address, e.g. name@example.com")
        String email,
        @NotBlank @Pattern(regexp = "^07\\d{8}$",
                message = "WhatsApp number must be in the format 07XXXXXXXX")
        String whatsappNumber,
        @NotBlank @Pattern(regexp = "^(?=[A-Z])(?=.*\\d)(?=.*[@#$])[A-Za-z\\d@#$]{8,12}$",
                message = "Password must be 8-12 characters, start with a capital letter, and include a number and a symbol (@, # or $)")
        String password,
        @NotNull District district,
        @DecimalMin("5.5") @DecimalMax("10.0") Double latitude,
        @DecimalMin("79.5") @DecimalMax("82.0") Double longitude,
        @Size(max = 500) String skills) {
}
