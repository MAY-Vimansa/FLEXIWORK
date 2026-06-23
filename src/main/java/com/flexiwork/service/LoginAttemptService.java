package com.flexiwork.service;

import com.flexiwork.exception.BusinessException;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * In-memory brute-force guard for {@code /api/auth/login}. Tracks failed attempts per identifier
 * (email/phone) and locks out after a threshold for a cooldown period. Resets on success.
 */
@Component
public class LoginAttemptService {

    private static final int MAX_ATTEMPTS = 5;
    private static final long LOCKOUT_SECONDS = 15 * 60;

    private record Attempt(AtomicInteger count, Instant lockedUntil) {
    }

    private final ConcurrentHashMap<String, Attempt> attempts = new ConcurrentHashMap<>();

    public void checkNotLocked(String identifier) {
        Attempt a = attempts.get(key(identifier));
        if (a != null && a.lockedUntil() != null && Instant.now().isBefore(a.lockedUntil())) {
            throw new BusinessException(
                    "Too many failed login attempts. Please try again in a few minutes.");
        }
    }

    public void onFailure(String identifier) {
        attempts.compute(key(identifier), (k, existing) -> {
            int count = (existing == null ? 0 : existing.count().get()) + 1;
            Instant lockedUntil = count >= MAX_ATTEMPTS
                    ? Instant.now().plusSeconds(LOCKOUT_SECONDS) : null;
            return new Attempt(new AtomicInteger(count), lockedUntil);
        });
    }

    public void onSuccess(String identifier) {
        attempts.remove(key(identifier));
    }

    private String key(String identifier) {
        return identifier.trim().toLowerCase();
    }
}
