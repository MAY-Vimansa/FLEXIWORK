package com.flexiwork.dto.attendance;

import jakarta.validation.constraints.NotBlank;

/** The QR payload (an application's qrCodeToken) submitted by the scanner. */
public record ScanRequest(@NotBlank String token) {
}
