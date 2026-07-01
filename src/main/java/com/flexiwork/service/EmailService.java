package com.flexiwork.service;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import com.resend.services.emails.model.CreateEmailResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Sends transactional email via Resend API (HTTPS-based, works on Railway free tier).
 * Fail-safe: when no API key is configured, the message is logged instead of sent.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final Resend resend;
    private final String from;
    private final boolean enabled;

    public EmailService(
            @Value("${resend.api-key:}") String apiKey,
            @Value("${resend.from:onboarding@resend.dev}") String from) {
        this.from = from;
        this.enabled = apiKey != null && !apiKey.isBlank();
        this.resend = enabled ? new Resend(apiKey) : null;
    }

    public void send(String to, String subject, String body) {
        if (!enabled) {
            log.info("[Email DISABLED] To: {} | Subject: {} | Body: {}", to, subject, body);
            return;
        }
        try {
            CreateEmailOptions params = CreateEmailOptions.builder()
                    .from(from)
                    .to(to)
                    .subject(subject)
                    .text(body)
                    .build();
            CreateEmailResponse response = resend.emails().send(params);
            log.info("Email sent to {} — id: {}", to, response.getId());
        } catch (ResendException ex) {
            log.warn("Failed to send email to {} (continuing): {}", to, ex.getMessage());
        }
    }
}