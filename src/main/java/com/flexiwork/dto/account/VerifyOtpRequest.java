package com.flexiwork.dto.account;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/** Used to confirm a WhatsApp verification code for the logged-in worker. */
public record VerifyOtpRequest(@NotBlank @Pattern(regexp = "^\\d{4,6}$", message = "Code must be 4-6 digits") String otp) {
}
