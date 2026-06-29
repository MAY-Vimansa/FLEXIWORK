package com.flexiwork.entity.enums;

/**
 * Platform roles. ADMIN authenticates via session/cookie (Thymeleaf); all others via JWT.
 * COMPANY_GUARD and COMPANY_POSTER are staff sub-accounts owned by a COMPANY.
 */
public enum Role {
    ADMIN,
    COMPANY,
    COMPANY_GUARD,
    COMPANY_POSTER,
    WORKER
}
