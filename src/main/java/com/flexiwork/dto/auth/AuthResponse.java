package com.flexiwork.dto.auth;

/** Returned on successful login. The React client stores {@code token} and reads {@code role}. */
public record AuthResponse(
        String token,
        Long userId,
        String email,
        String role) {
}
