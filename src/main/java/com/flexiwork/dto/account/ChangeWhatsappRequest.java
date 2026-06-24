package com.flexiwork.dto.account;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/** Requests an OTP to be sent to a new WhatsApp number, to confirm it before it replaces the
 *  worker's current verified number. */
public record ChangeWhatsappRequest(
        @NotBlank @Pattern(regexp = "^07\\d{8}$", message = "WhatsApp number must be in the format 07XXXXXXXX")
        String newNumber) {
}
