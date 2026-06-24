package com.flexiwork.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

/**
 * Sends WhatsApp messages via the local whatsapp-web.js microservice
 * running on localhost:3001. When disabled (dev), calls are only logged.
 */
@Component
public class WhatsAppClient {

    private static final Logger log = LoggerFactory.getLogger(WhatsAppClient.class);

    private final boolean enabled;
    private final String sharedSecret;
    private final WebClient webClient;

    public WhatsAppClient(
            @Value("${flexiwork.whatsapp.enabled}") boolean enabled,
            @Value("${flexiwork.whatsapp.service-url}") String serviceUrl,
            @Value("${flexiwork.whatsapp.shared-secret}") String sharedSecret,
            WebClient.Builder webClientBuilder) {
        this.enabled = enabled;
        this.sharedSecret = sharedSecret;
        this.webClient = webClientBuilder.baseUrl(serviceUrl).build();
    }

    public void sendText(String toE164, String body) {
        if (!enabled) {
            log.info("[WhatsApp DISABLED] -> {} : {}", toE164, body);
            return;
        }
        try {
            webClient.post()
                    .uri("/send")
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("X-Internal-Secret", sharedSecret)
                    .bodyValue(Map.of("to", toE164, "message", body))
                    .retrieve()
                    .toBodilessEntity()
                    .block();
            log.info("WhatsApp sent to {}", toE164);
        } catch (Exception ex) {
            log.warn("WhatsApp send failed to {} (continuing): {}", toE164, ex.getMessage());
        }
    }
}
