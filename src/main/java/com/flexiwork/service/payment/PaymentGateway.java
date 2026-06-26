package com.flexiwork.service.payment;

import java.math.BigDecimal;

/**
 * Abstraction over a payment provider. The simulated implementation is used for the demo; a real
 * provider (e.g. PayHere) can be dropped in later without touching {@code PaymentService}.
 */
public interface PaymentGateway {

    /**
     * Charge the given amount. Returns a result carrying the provider transaction id on success.
     *
     * @param amount      amount to charge (the commission)
     * @param reference   our receipt number, passed through to the provider
     * @param card        tokenised/raw card details (simulated)
     */
    PaymentResult charge(BigDecimal amount, String reference, CardDetails card);

    record CardDetails(String cardNumber, String expiry, String cvv, String nameOnCard) {
    }

    record PaymentResult(boolean success, String transactionId, String message) {
    }
}
