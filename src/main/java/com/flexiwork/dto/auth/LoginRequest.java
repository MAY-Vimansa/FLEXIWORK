package com.flexiwork.dto.auth;

import jakarta.validation.constraints.NotBlank;

/** Credentials for the JWT login endpoint. Accepts email or WhatsApp phone number. */
public record LoginRequest(
        @NotBlank String identifier,
        @NotBlank String password) {
}
