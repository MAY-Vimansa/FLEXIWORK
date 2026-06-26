package com.flexiwork.dto.payment;

import java.math.BigDecimal;

/** Outstanding-balance summary for the company payments tab. */
public record PaymentSummary(
        long pendingCount,
        BigDecimal totalOutstanding,
        BigDecimal totalPaid) {
}
