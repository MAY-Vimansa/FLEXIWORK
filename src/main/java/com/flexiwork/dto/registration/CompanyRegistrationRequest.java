package com.flexiwork.dto.registration;

import com.flexiwork.entity.enums.District;
import jakarta.validation.constraints.*;

/** Company self-registration fields (BR certificate, logo, premises photo bound as multipart). */
public record CompanyRegistrationRequest(
        @NotBlank @Size(max = 150) String companyName,
        @NotBlank @Pattern(regexp = "^(PV|PQ|PB|GA|GS|FB)\\d{4,8}$",
                message = "BR number must be a valid Sri Lankan format, e.g. PV12345")
        String brNumber,
        @NotBlank @Pattern(regexp = "^[\\w.+-]+@[A-Za-z\\d-]+\\.[A-Za-z]{2,}$",
                message = "Email must be a valid address, e.g. name@example.com")
        String email,
        @NotBlank @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{8,13}$",
                message = "Password must be 8-13 characters with a mix of letters and numbers")
        String password,
        @NotNull District district,
        @NotBlank @Size(max = 255) String addressLine,
        @NotNull @DecimalMin("5.5") @DecimalMax("10.0") Double latitude,
        @NotNull @DecimalMin("79.5") @DecimalMax("82.0") Double longitude) {
}
