package com.flexiwork.util;

import com.flexiwork.exception.BusinessException;

/** Normalises Sri Lankan mobile numbers to E.164 (+94XXXXXXXXX). */
public final class PhoneUtil {

    private PhoneUtil() {
    }

    /**
     * Accepts {@code 07XXXXXXXX} (local) or {@code +947XXXXXXXX}/{@code 947XXXXXXXX} and returns the
     * canonical {@code +947XXXXXXXX} form. Throws {@link BusinessException} on an invalid number.
     */
    public static String toE164(String raw) {
        if (raw == null) {
            throw new BusinessException("WhatsApp number is required");
        }
        String digits = raw.replaceAll("[\\s-]", "");
        if (digits.matches("0\\d{9}")) {                 // 0771234567
            return "+94" + digits.substring(1);
        }
        if (digits.matches("\\+94\\d{9}")) {             // +94771234567
            return digits;
        }
        if (digits.matches("94\\d{9}")) {                // 94771234567
            return "+" + digits;
        }
        throw new BusinessException("Invalid Sri Lankan mobile number: " + raw);
    }
}
