package com.flexiwork.dto.registration;

/** Returned after successful registration; the account is PENDING admin verification. */
public record RegistrationResponse(
        Long userId,
        String email,
        String role,
        String status,
        String message) {
}
