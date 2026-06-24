package com.flexiwork.entity;

import com.flexiwork.entity.enums.OtpPurpose;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * A one-time password challenge. The OTP itself is never stored in plain text — only its BCrypt
 * hash ({@link #otpHash}). Tokens expire after a short window, are single-use, and lock out after
 * a maximum number of failed attempts.
 */
@Entity
@Table(name = "otp_tokens")
@Getter
@Setter
@NoArgsConstructor
public class OtpToken extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String otpHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OtpPurpose purpose;

    @Column(nullable = false)
    private Instant expiresAt;

    @Column(nullable = false)
    private boolean used = false;

    @Column(nullable = false)
    private int attempts = 0;

    /** Optional payload carried by the OTP (e.g. the candidate new email for EMAIL_CHANGE). */
    private String payload;
}
