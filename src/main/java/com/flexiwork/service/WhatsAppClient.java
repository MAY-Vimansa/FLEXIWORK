package com.flexiwork.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.Map;

/**
 * Sends WhatsApp messages via the local whatsapp-web.js microservice
 * running on localhost:3001. When disabled (dev), calls are only logged.
 *
 * <p>Uses the synchronous {@link RestClient} (Spring Web) rather than the reactive WebClient so the
 * project doesn't drag in the entire WebFlux/Reactor stack for a single blocking call.
 */
@Component
public class WhatsAppClient {

    private static final Logger log = LoggerFactory.getLogger(WhatsAppClient.class);

    private final boolean enabled;
    private final String sharedSecret;
    private final RestClient restClient;

    public WhatsAppClient(
            @Value("${flexiwork.whatsapp.enabled}") boolean enabled,
            @Value("${flexiwork.whatsapp.service-url}") String serviceUrl,
            @Value("${flexiwork.whatsapp.shared-secret}") String sharedSecret,
            RestClient.Builder restClientBuilder) {
        this.enabled = enabled;
        this.sharedSecret = sharedSecret;
        this.restClient = restClientBuilder.baseUrl(serviceUrl).build();
    }

    public void sendText(String toE164, String body) {
        if (!enabled) {
            log.info("[WhatsApp DISABLED] -> {} : {}", toE164, body);
            return;
        }
        try {
            restClient.post()
                    .uri("/send")
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("X-Internal-Secret", sharedSecret)
                    .body(Map.of("to", toE164, "message", body))
                    .retrieve()
                    .toBodilessEntity();
            log.info("WhatsApp sent to {}", toE164);
        } catch (RestClientResponseException ex) {
            log.warn("WhatsApp send failed to {} (continuing): {}", toE164, ex.getResponseBodyAsString());
        } catch (Exception ex) {
            log.warn("WhatsApp send failed to {} (continuing): {}", toE164, ex.getMessage());
        }
    }
}
