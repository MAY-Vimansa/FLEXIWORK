package com.flexiwork.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import jakarta.annotation.PostConstruct;
import java.util.ArrayList;
import java.util.List;

/**
 * Refuses to start the application under the {@code prod} profile if any security-critical secret
 * has been left at its committed development default. Without this guard, forgetting to set an env
 * var silently ships a deployment whose JWT signing key (and more) is public in the repository —
 * anyone could forge tokens. Failing fast at boot is far safer than running insecurely.
 */
@Configuration
@Profile("prod")
public class ProdSecretsGuard {

    private static final Logger log = LoggerFactory.getLogger(ProdSecretsGuard.class);

    /** Values that must never appear in a real deployment. */
    private static final String DEFAULT_JWT_SECRET =
            "flexiwork-dev-secret-change-me-please-0123456789-abcdefgh";
    private static final String DEFAULT_WHATSAPP_SECRET = "dev-only-change-me";
    private static final String DEV_DB_PASSWORD = "root";
    private static final String DEV_CORS_ORIGIN = "http://localhost:5173";

    @Value("${flexiwork.jwt.secret}")
    private String jwtSecret;

    @Value("${flexiwork.whatsapp.shared-secret}")
    private String whatsappSecret;

    @Value("${spring.datasource.password}")
    private String dbPassword;

    @Value("${flexiwork.cors.allowed-origins}")
    private String corsOrigins;

    @PostConstruct
    void verify() {
        List<String> violations = new ArrayList<>();
        if (DEFAULT_JWT_SECRET.equals(jwtSecret)) {
            violations.add("JWT_SECRET is the committed dev default — set a strong, secret value");
        }
        if (jwtSecret == null || jwtSecret.getBytes(java.nio.charset.StandardCharsets.UTF_8).length < 32) {
            violations.add("JWT_SECRET must be at least 32 bytes for HS256");
        }
        if (DEFAULT_WHATSAPP_SECRET.equals(whatsappSecret)) {
            violations.add("WHATSAPP_SHARED_SECRET is the dev default — set a unique value");
        }
        if (DEV_DB_PASSWORD.equals(dbPassword)) {
            violations.add("DB_PASSWORD is the dev default 'root' — set real database credentials");
        }
        if (corsOrigins != null && corsOrigins.contains(DEV_CORS_ORIGIN)) {
            violations.add("FLEXIWORK_CORS_ALLOWED_ORIGINS still allows the Vite dev origin "
                    + "(" + DEV_CORS_ORIGIN + ") — set it to the real frontend origin(s)");
        }

        if (!violations.isEmpty()) {
            String message = "Refusing to start with the 'prod' profile because insecure default "
                    + "configuration was detected:\n  - " + String.join("\n  - ", violations);
            log.error(message);
            throw new IllegalStateException(message);
        }
        log.info("Production secrets guard passed — no default secrets detected.");
    }
}
