package com.flexiwork.dto.staff;

public record StaffResponse(
        Long id,
        String email,
        String role,
        boolean active) {
}
