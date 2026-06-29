package com.flexiwork.service;

import com.flexiwork.exception.BusinessException;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory brute-force guard for {@code /api/auth/login}. Tracks failed attempts per identifier
 * (email/phone) and locks out after a threshold for a cooldown period. Resets on success.
 *
 * <p>Two safeguards keep the in-memory map from being abused:
 * <ul>
 *   <li><b>Counter decay</b> — a run of failures older than {@link #ATTEMPT_WINDOW_SECONDS} is
 *       treated as expired and the counter restarts, so old sporadic typos don't accumulate into a
 *       lockout.</li>
 *   <li><b>Eviction</b> — stale entries (not currently locked and untouched for longer than the
 *       attempt window) are purged opportunistically, bounding memory so a flood of distinct
 *       identifiers cannot grow the map without limit.</li>
 * </ul>
 *
 * <p>Note: this guard is process-local. In a multi-instance deployment it must be backed by a shared
 * store (e.g. Redis) to be effective across nodes and to survive restarts.
 */
@Component
public class LoginAttemptService {

    private static final int MAX_ATTEMPTS = 5;
    private static final long LOCKOUT_SECONDS = 15 * 60;
    /** A burst of failures older than this is considered expired and the counter restarts. */
    private static final long ATTEMPT_WINDOW_SECONDS = 15 * 60;
    /** Purge stale entries once the map grows past this many keys. */
    private static final int EVICTION_THRESHOLD = 10_000;

    private record Attempt(int count, Instant lockedUntil, Instant updatedAt) {
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
        Instant now = Instant.now();
        attempts.compute(key(identifier), (k, existing) -> {
            // Decay: ignore a previous run of failures that is older than the attempt window.
            boolean expired = existing == null
                    || existing.updatedAt().isBefore(now.minusSeconds(ATTEMPT_WINDOW_SECONDS));
            int count = (expired ? 0 : existing.count()) + 1;
            Instant lockedUntil = count >= MAX_ATTEMPTS ? now.plusSeconds(LOCKOUT_SECONDS) : null;
            return new Attempt(count, lockedUntil, now);
        });
        evictStaleIfNeeded(now);
    }

    public void onSuccess(String identifier) {
        attempts.remove(key(identifier));
    }

    /** Drop entries that are no longer locked and have not been touched within the attempt window. */
    private void evictStaleIfNeeded(Instant now) {
        if (attempts.size() <= EVICTION_THRESHOLD) {
            return;
        }
        Instant staleBefore = now.minusSeconds(ATTEMPT_WINDOW_SECONDS);
        attempts.values().removeIf(a ->
                (a.lockedUntil() == null || now.isAfter(a.lockedUntil()))
                        && a.updatedAt().isBefore(staleBefore));
    }

    private String key(String identifier) {
        return identifier.trim().toLowerCase();
    }
}
