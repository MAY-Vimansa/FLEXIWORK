package com.flexiwork.service;

import com.flexiwork.exception.BusinessException;
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
 * <p>Two delivery modes:
 * <ul>
 *   <li>{@link #sendText} — fire-and-forget. Used for non-critical notifications (job approved,
 *       reminders, etc.). Delivery failures are logged and swallowed so a downed WhatsApp service
 *       never blocks the surrounding business action.</li>
 *   <li>{@link #sendTextOrThrow} — strict. Used for OTP / verification codes. Throws
 *       {@link BusinessException} when the message could not be delivered, so the caller can return
 *       an error to the user instead of advancing them to an "enter the code" step for a code that
 *       was never actually sent.</li>
 * </ul>
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

    /**
     * Fire-and-forget send for non-critical notifications. Delivery failures are logged and
     * swallowed — the surrounding action (approving a worker, cancelling a job, …) still succeeds
     * even if WhatsApp is temporarily unreachable.
     */
    public void sendText(String toE164, String body) {
        if (!enabled) {
            log.info("[WhatsApp DISABLED] -> {} : {}", toE164, body);
            return;
        }
        try {
            dispatch(toE164, body);
            log.info("WhatsApp sent to {}", toE164);
        } catch (RestClientResponseException ex) {
            log.warn("WhatsApp send failed to {} (continuing): {}", toE164, ex.getResponseBodyAsString());
        } catch (Exception ex) {
            log.warn("WhatsApp send failed to {} (continuing): {}", toE164, ex.getMessage());
        }
    }

    /**
     * Strict send for OTP / verification codes. Throws {@link BusinessException} if the message
     * could not be delivered, so the worker is never told a code was sent when it wasn't.
     *
     * <p>In dev (whatsapp disabled) the code is only logged to the server console and no exception
     * is raised, so the flow stays testable without a real WhatsApp account.
     */
    public void sendTextOrThrow(String toE164, String body) {
        if (!enabled) {
            // Dev mode: no real WhatsApp account wired up. Log the code so it can be read from the
            // server console and the change/verify flow remains testable end to end.
            log.info("[WhatsApp DISABLED] -> {} : {}", toE164, body);
            return;
        }
        try {
            dispatch(toE164, body);
            log.info("WhatsApp code sent to {}", toE164);
        } catch (RestClientResponseException ex) {
            log.warn("WhatsApp code send FAILED to {} (HTTP {}): {}",
                    toE164, ex.getStatusCode().value(), ex.getResponseBodyAsString());
            // 422 = the microservice confirmed the number is not registered on WhatsApp.
            if (ex.getStatusCode().value() == 422) {
                throw new BusinessException(
                        "That number isn't registered on WhatsApp. Enter a number that has an "
                                + "active WhatsApp account.");
            }
            // Anything else (e.g. 503 "WhatsApp client not ready" — service down or not paired).
            throw new BusinessException(
                    "Couldn't send the WhatsApp code right now. Please check the number is correct "
                            + "and try again in a moment.");
        } catch (Exception ex) {
            // Connection refused / timeout — the microservice is down or unreachable.
            log.warn("WhatsApp code send FAILED to {}: {}", toE164, ex.getMessage());
            throw new BusinessException(
                    "Couldn't send the WhatsApp code right now. Please try again in a moment.");
        }
    }

    /** Performs the actual HTTP call to the WhatsApp microservice. Lets exceptions propagate. */
    private void dispatch(String toE164, String body) {
        restClient.post()
                .uri("/send")
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-Internal-Secret", sharedSecret)
                .body(Map.of("to", toE164, "message", body))
                .retrieve()
                .toBodilessEntity();
    }
}
