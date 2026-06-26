package com.flexiwork.dto.payment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/** Simulated card payment form submitted from the React payment page. */
public record PayRequest(
        @NotBlank @Pattern(regexp = "^\\d{13,19}$", message = "Card number must be 13-19 digits")
        String cardNumber,
        @NotBlank @Pattern(regexp = "^(0[1-9]|1[0-2])/\\d{2}$", message = "Expiry must be in MM/YY format")
        String expiry,
        @NotBlank @Pattern(regexp = "^\\d{3,4}$", message = "CVV must be 3-4 digits")
        String cvv,
        @NotBlank String nameOnCard) {
}
