package com.flexiwork.dto.auth;

/** Lightweight description of the logged-in user, returned by {@code GET /api/auth/me}. */
public record CurrentUserResponse(
        Long userId,
        String email,
        String role,
        boolean active,
        Long parentCompanyId,
        boolean companySuspended) {
}
