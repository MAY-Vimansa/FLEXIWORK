package com.flexiwork.dto.account;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ResetPasswordRequest(
        @NotBlank @Email String email,
        @NotBlank @Pattern(regexp = "^\\d{4,6}$", message = "Code must be 4-6 digits") String otp,
        @NotBlank @Pattern(regexp = "^(?=[A-Z])(?=.*\\d)(?=.*[@#$])[A-Za-z\\d@#$]{8,12}$",
                message = "Password must be 8-12 characters, start with a capital letter, and include a number and a symbol (@, # or $)")
        String newPassword) {
}
