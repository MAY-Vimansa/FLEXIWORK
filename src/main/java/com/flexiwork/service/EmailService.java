package com.flexiwork.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Sends transactional email (OTP codes). Fail-safe and config-driven: when no SMTP username is
 * configured (dev), the message is logged instead of sent, so the OTP flow is fully demonstrable
 * without real credentials.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final String from;
    private final boolean enabled;

    public EmailService(JavaMailSender mailSender,
                        @Value("${spring.mail.username:}") String from) {
        this.mailSender = mailSender;
        this.from = from;
        this.enabled = from != null && !from.isBlank();
    }

    public void send(String to, String subject, String body) {
        if (!enabled) {
            log.info("[Email DISABLED] To: {} | Subject: {} | Body: {}", to, subject, body);
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(from);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Email sent to {}", to);
        } catch (Exception ex) {
            // Fail-safe: never let an email failure break the calling flow.
            log.warn("Failed to send email to {} (continuing): {}", to, ex.getMessage());
        }
    }
}
