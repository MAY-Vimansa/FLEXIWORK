package com.flexiwork.exception;

/**
 * Thrown when a request is well-formed but violates a business rule (e.g. duplicate application,
 * editing a non-open job, scanning a QR on the wrong day). Mapped to HTTP 400 by the global handler.
 */
public class BusinessException extends RuntimeException {

    public BusinessException(String message) {
        super(message);
    }
}
