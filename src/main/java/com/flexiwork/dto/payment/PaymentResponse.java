package com.flexiwork.dto.payment;

import com.flexiwork.entity.enums.PaymentStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/** Company/admin view of a commission payment. */
public record PaymentResponse(
        Long id,
        Long jobId,
        String jobTitle,
        String companyName,
        int workersAttended,
        BigDecimal totalWages,
        BigDecimal commissionRate,
        BigDecimal commissionAmount,
        LocalDate jobDate,
        PaymentStatus status,
        String receiptNumber,
        String transactionId,
        Instant paidAt) {
}
