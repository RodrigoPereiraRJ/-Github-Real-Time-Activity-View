package com.githubmonitor.api.controller;

import com.githubmonitor.api.security.WebhookSignatureValidator;
import com.githubmonitor.api.service.EventService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/webhooks/github")
@RequiredArgsConstructor
@Slf4j
public class WebhookController {

    private final EventService eventService;
    private final WebhookSignatureValidator signatureValidator;

    @PostMapping
    public ResponseEntity<String> handleWebhook(
            @RequestHeader(value = "X-GitHub-Event") String eventType,
            @RequestHeader(value = "X-Hub-Signature-256", required = false) String signature,
            @RequestHeader(value = "X-GitHub-Delivery") String deliveryId,
            @RequestBody String payload) {
        
        log.info("Received webhook event: {}", eventType);
        
        if (signature != null && !signatureValidator.validateSignature(signature, payload)) {
            log.warn("Invalid webhook signature for delivery: {}", deliveryId);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid signature");
        }
        
        eventService.processWebhook(eventType, signature, deliveryId, payload);
        
        return ResponseEntity.ok("Webhook received");
    }
}
