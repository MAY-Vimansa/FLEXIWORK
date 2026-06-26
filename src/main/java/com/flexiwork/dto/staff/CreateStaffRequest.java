package com.flexiwork.dto.staff;

import com.flexiwork.entity.enums.Role;
import jakarta.validation.constraints.*;

/** Owner creates a guard or poster sub-account. Role must be COMPANY_GUARD or COMPANY_POSTER. */
public record CreateStaffRequest(
        @NotBlank @Email String email,
        @NotBlank @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{8,13}$",
                message = "Temp password must be 8-13 characters with a mix of letters and numbers")
        String tempPassword,
        @NotNull Role role) {
}
