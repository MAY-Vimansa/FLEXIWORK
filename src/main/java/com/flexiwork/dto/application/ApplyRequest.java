package com.flexiwork.dto.application;

import jakarta.validation.constraints.NotNull;

/** A worker's request to apply for a job. */
public record ApplyRequest(@NotNull Long jobId) {
}
