package com.flexiwork.exception;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.Map;

/** Consistent error envelope returned for every handled exception. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiError(
        int status,
        String error,
        String message,
        Map<String, String> fieldErrors,
        String path,
        Instant timestamp) {

    public static ApiError of(int status, String error, String message, String path) {
        return new ApiError(status, error, message, null, path, Instant.now());
    }

    public static ApiError withFields(int status, String error, String message,
                                      Map<String, String> fieldErrors, String path) {
        return new ApiError(status, error, message, fieldErrors, path, Instant.now());
    }
}
