package com.flexiwork.service;

import com.flexiwork.entity.OtpToken;
import com.flexiwork.entity.enums.OtpPurpose;
import com.flexiwork.exception.BusinessException;
import com.flexiwork.repository.OtpTokenRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

/**
 * One-time password lifecycle. OTPs are 6-digit codes, never stored in plain text (only a BCrypt
 * hash), valid for a short window, single-use, capped at a maximum number of attempts, and
 * rate-limited per user+purpose. {@link #generate} returns the raw code for the caller to deliver
 * via email or WhatsApp.
 */
@Service
public class OtpService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final OtpTokenRepository otpRepository;
    private final PasswordEncoder passwordEncoder;
    private final int length;
    private final long ttlMinutes;
    private final int maxAttempts;
    private final long cooldownSeconds;

    public OtpService(OtpTokenRepository otpRepository,
                      PasswordEncoder passwordEncoder,
                      @Value("${flexiwork.otp.length}") int length,
                      @Value("${flexiwork.otp.ttl-minutes}") long ttlMinutes,
                      @Value("${flexiwork.otp.max-attempts}") int maxAttempts,
                      @Value("${flexiwork.otp.resend-cooldown-seconds}") long cooldownSeconds) {
        this.otpRepository = otpRepository;
        this.passwordEncoder = passwordEncoder;
        this.length = length;
        this.ttlMinutes = ttlMinutes;
        this.maxAttempts = maxAttempts;
        this.cooldownSeconds = cooldownSeconds;
    }

    /** Create and persist a new OTP for the user+purpose, enforcing the resend cooldown. */
    @Transactional
    public String generate(Long userId, OtpPurpose purpose) {
        return generate(userId, purpose, null);
    }

    /** Same as {@link #generate(Long, OtpPurpose)} but carries an opaque payload (e.g. a candidate
     *  new email for {@code EMAIL_CHANGE}) to be returned by {@link #verifyAndGetPayload}. */
    @Transactional
    public String generate(Long userId, OtpPurpose purpose, String payload) {
        otpRepository.findFirstByUserIdAndPurposeOrderByCreatedAtDesc(userId, purpose)
                .ifPresent(latest -> {
                    if (latest.getCreatedAt() != null
                            && latest.getCreatedAt().isAfter(
                            Instant.now().minusSeconds(cooldownSeconds))) {
                        throw new BusinessException(
                                "Please wait a moment before requesting another code");
                    }
                });

        String code = randomCode();
        OtpToken token = new OtpToken();
        token.setUserId(userId);
        token.setOtpHash(passwordEncoder.encode(code));
        token.setPurpose(purpose);
        token.setExpiresAt(Instant.now().plus(ttlMinutes, ChronoUnit.MINUTES));
        token.setUsed(false);
        token.setAttempts(0);
        token.setPayload(payload);
        otpRepository.save(token);
        return code;
    }

    /** Validate a submitted code. Throws a descriptive {@link BusinessException} on any failure. */
    @Transactional
    public void verify(Long userId, OtpPurpose purpose, String code) {
        verifyAndGetPayload(userId, purpose, code);
    }

    /** Same as {@link #verify} but returns the payload stored alongside the OTP, if any. */
    @Transactional
    public String verifyAndGetPayload(Long userId, OtpPurpose purpose, String code) {
        OtpToken token = otpRepository
                .findFirstByUserIdAndPurposeAndUsedFalseOrderByCreatedAtDesc(userId, purpose)
                .orElseThrow(() -> new BusinessException("No active code. Please request a new one"));

        if (token.getExpiresAt().isBefore(Instant.now())) {
            throw new BusinessException("This code has expired. Please request a new one");
        }
        if (token.getAttempts() >= maxAttempts) {
            token.setUsed(true);
            otpRepository.save(token);
            throw new BusinessException("Too many incorrect attempts. Please request a new code");
        }
        if (!passwordEncoder.matches(code, token.getOtpHash())) {
            token.setAttempts(token.getAttempts() + 1);
            if (token.getAttempts() >= maxAttempts) {
                token.setUsed(true);
            }
            otpRepository.save(token);
            throw new BusinessException("Incorrect code");
        }
        token.setUsed(true);
        otpRepository.save(token);
        return token.getPayload();
    }

    private String randomCode() {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(RANDOM.nextInt(10));
        }
        return sb.toString();
    }
}
