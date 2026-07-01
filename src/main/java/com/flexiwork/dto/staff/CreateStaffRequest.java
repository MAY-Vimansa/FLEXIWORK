package com.flexiwork.dto.staff;

import com.flexiwork.entity.enums.Role;
import jakarta.validation.constraints.*;

/** Owner creates a guard or poster sub-account. Role must be COMPANY_GUARD or COMPANY_POSTER. */
public record CreateStaffRequest(
        @NotBlank @Email String email,
        @NotBlank @Pattern(regexp = "^(?=[A-Z])(?=.*\\d)(?=.*[@#$])[A-Za-z\\d@#$]{8,12}$",
                message = "Temp password must be 8-12 characters, start with a capital letter, and include a number and a symbol (@, # or $)")
        String tempPassword,
        @NotNull Role role) {
}
