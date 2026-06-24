package com.flexiwork.dto.account;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ResetPasswordRequest(
        @NotBlank @Email String email,
        @NotBlank @Pattern(regexp = "^\\d{4,6}$", message = "Code must be 4-6 digits") String otp,
        @NotBlank @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{8,13}$",
                message = "Password must be 8-13 characters with a mix of letters and numbers")
        String newPassword) {
}
