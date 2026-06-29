package com.flexiwork.repository;

import com.flexiwork.entity.OtpToken;
import com.flexiwork.entity.enums.OtpPurpose;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Optional;

public interface OtpTokenRepository extends JpaRepository<OtpToken, Long> {

    /** Most recent unused, non-expired challenge for a user + purpose. */
    Optional<OtpToken> findFirstByUserIdAndPurposeAndUsedFalseOrderByCreatedAtDesc(
            Long userId, OtpPurpose purpose);

    /** Used to enforce the resend cooldown. */
    Optional<OtpToken> findFirstByUserIdAndPurposeOrderByCreatedAtDesc(
            Long userId, OtpPurpose purpose);

    long countByUserIdAndPurposeAndCreatedAtAfter(Long userId, OtpPurpose purpose, Instant after);
}
