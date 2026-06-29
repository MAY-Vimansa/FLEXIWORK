package com.flexiwork.service.payment;

import com.flexiwork.exception.BusinessException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Simulated payment gateway: performs light validation on the card and always "approves" the
 * charge, returning a generated transaction id. Structured behind {@link PaymentGateway} so a real
 * provider can replace it without changing callers.
 */
@Service
public class SimulatedPaymentGateway implements PaymentGateway {

    @Override
    public PaymentResult charge(BigDecimal amount, String reference, CardDetails card) {
        if (card == null || card.cardNumber() == null
                || card.cardNumber().replaceAll("\\s", "").length() < 12) {
            throw new BusinessException("Invalid card number");
        }
        if (card.cvv() == null || !card.cvv().matches("\\d{3,4}")) {
            throw new BusinessException("Invalid CVV");
        }
        if (amount == null || amount.signum() <= 0) {
            throw new BusinessException("Invalid charge amount");
        }
        String txnId = "SIMTXN-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();
        return new PaymentResult(true, txnId, "Payment approved (simulated)");
    }
}
