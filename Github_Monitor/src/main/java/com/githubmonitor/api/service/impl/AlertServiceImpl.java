package com.githubmonitor.api.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.githubmonitor.api.dto.AlertDTO;
import com.githubmonitor.api.entity.Alert;
import com.githubmonitor.api.entity.Event;
import com.githubmonitor.api.model.AlertRuleType;
import com.githubmonitor.api.repository.AlertRepository;
import com.githubmonitor.api.repository.EventRepository;
import com.githubmonitor.api.service.AlertService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AlertServiceImpl implements AlertService {

    private final AlertRepository alertRepository;
    private final EventRepository eventRepository;
    private final ObjectMapper objectMapper;
    private final com.githubmonitor.api.service.NotificationService notificationService;
    private final com.githubmonitor.api.service.SseService sseService;

    @Override
    public Page<AlertDTO> findAll(UUID repositoryId, Pageable pageable) {
        return alertRepository.findAll(pageable)
                .map(this::toDTO);
    }

    private AlertDTO toDTO(Alert alert) {
        return AlertDTO.builder()
                .id(alert.getId())
                .ruleType(alert.getRuleType())
                .eventId(alert.getEvent() != null ? alert.getEvent().getId() : null)
                .severity(alert.getSeverity())
                .message(alert.getMessage())
                .branch(extractBranch(alert.getEvent()))
                .authorLogin(alert.getEvent() != null && alert.getEvent().getContributor() != null ? alert.getEvent().getContributor().getGithubLogin() : null)
                .authorAvatarUrl(alert.getEvent() != null && alert.getEvent().getContributor() != null ? alert.getEvent().getContributor().getAvatarUrl() : null)
                .status(alert.getStatus())
                .createdAt(alert.getCreatedAt())
                .resolvedAt(alert.getResolvedAt())
                .build();
    }

    private String extractBranch(Event event) {
        if (event == null || event.getPayload() == null) return null;
        try {
            JsonNode payload = objectMapper.readTree(event.getPayload());
            // Handle Push events
            if (payload.has("ref")) {
                String ref = payload.path("ref").asText("");
                if (ref.startsWith("refs/heads/")) {
                    return ref.replace("refs/heads/", "");
                }
                return ref;
            }
            // Handle PR events if needed
            if (payload.has("pull_request")) {
                return payload.path("pull_request").path("head").path("ref").asText(null);
            }
        } catch (Exception e) {
            log.debug("Could not extract branch from event payload", e);
        }
        return null;
    }

    @Override
    @Transactional
    public void resolveAlert(UUID id) {
        Alert alert = alertRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Alert not found"));
        alert.setStatus(Alert.Status.RESOLVED);
        alert.setResolvedAt(LocalDateTime.now());
        alertRepository.save(alert);
        sseService.sendUpdate("alert-update", toDTO(alert));
    }

    @Override
    @Transactional
    public void checkAlerts(Event event) {
        for (AlertRuleType ruleType : AlertRuleType.values()) {
            if (shouldTrigger(ruleType, event)) {
                createAlert(ruleType, event);
            }
        }
    }

    private boolean shouldTrigger(AlertRuleType ruleType, Event event) {
        try {
            JsonNode params = objectMapper.readTree(ruleType.getDefaultParameters());

            if (ruleType == AlertRuleType.HIGH_FREQUENCY_COMMITS) {
                 if (event.getType() != Event.EventType.PUSH) {
                     return false;
                 }

                 int threshold = params.has("threshold") ? params.get("threshold").asInt() : 10;
                 int intervalMinutes = params.has("interval_minutes") ? params.get("interval_minutes").asInt() : 5;

                 LocalDateTime since = LocalDateTime.now().minusMinutes(intervalMinutes);
                 
                 List<Event> recentEvents = eventRepository.findByRepositoryIdAndCreatedAtAfter(
                         event.getRepository().getId(), since);
                 
                 long pushCount = recentEvents.stream()
                         .filter(e -> e.getType() == Event.EventType.PUSH)
                         .count();
                 
                 return pushCount > threshold;

            } else if (ruleType == AlertRuleType.SENSITIVE_FILE_CHANGE) {
                if (event.getType() != Event.EventType.PUSH && event.getType() != Event.EventType.PULL_REQUEST) {
                    return false;
                }

                JsonNode payload = objectMapper.readTree(event.getPayload());
                
                if (event.getType() == Event.EventType.PUSH && payload.has("commits")) {
                    for (JsonNode commit : payload.get("commits")) {
                        if (checkSensitiveFiles(commit.get("added"), params) ||
                            checkSensitiveFiles(commit.get("modified"), params)) {
                            return true;
                        }
                    }
                }
                return false;

            } else if (ruleType == AlertRuleType.DIRECT_PUSH_TO_MAIN) {
                 if (event.getType() != Event.EventType.PUSH) {
                     return false;
                 }
                 
                 JsonNode payload = objectMapper.readTree(event.getPayload());
                 if (payload.has("ref")) {
                     String ref = payload.get("ref").asText();
                     return "refs/heads/main".equals(ref) || "refs/heads/master".equals(ref);
                 }

            } else if (ruleType == AlertRuleType.COMMIT_OUTSIDE_HOURS) {
                if (event.getType() != Event.EventType.PUSH) {
                    return false;
                }

                int startHour = params.has("start_hour") ? params.get("start_hour").asInt() : 8;
                int endHour = params.has("end_hour") ? params.get("end_hour").asInt() : 18;
                
                // LocalDateTime by default doesn't have timezone info, assuming server time is relevant
                int hour = event.getCreatedAt().getHour();
                
                return hour < startHour || hour >= endHour;
            }
            
            return false;
        } catch (Exception e) {
            log.error("Error evaluating rule {}", ruleType, e);
            return false;
        }
    }

    private boolean checkSensitiveFiles(JsonNode filesNode, JsonNode params) {
        if (filesNode == null || !filesNode.isArray()) return false;
        
        List<String> patterns = new java.util.ArrayList<>();
        if (params.has("patterns")) {
            params.get("patterns").forEach(p -> patterns.add(p.asText()));
        } else {
            patterns.add(".env");
            patterns.add("credentials");
            patterns.add("secret");
            patterns.add("key.pem");
        }
        
        for (JsonNode file : filesNode) {
            String filename = file.asText();
            for (String pattern : patterns) {
                if (filename.contains(pattern)) {
                    return true;
                }
            }
        }
        return false;
    }

    private void createAlert(AlertRuleType ruleType, Event event) {
        Alert alert = Alert.builder()
                .ruleType(ruleType.name())
                .repositoryId(event.getRepository().getId())
                .event(event)
                .severity(Alert.Severity.WARNING)
                .message("Alert triggered by rule: " + ruleType.getFriendlyName())
                .status(Alert.Status.OPEN)
                .build();
        
        alertRepository.save(alert);
        log.info("Alert created: {}", alert.getId());
        
        // Broadcast Alert SSE
        sseService.sendUpdate("alert-update", toDTO(alert));

        // Trigger Notification
        triggerAlertNotification(alert, event);
    }

    private void triggerAlertNotification(Alert alert, Event event) {
        try {
            String title = "ALERTA: " + alert.getRuleType();
            StringBuilder message = new StringBuilder();
            message.append("Repo: ").append(event.getRepository().getName()).append("\n");
            message.append("Owner: ").append(event.getRepository().getOwner()).append("\n");

            if (event.getType() == Event.EventType.PUSH && event.getPayload() != null) {
                try {
                    JsonNode payload = objectMapper.readTree(event.getPayload());
                    String ref = payload.path("ref").asText("");
                    if (!ref.isEmpty()) {
                        message.append("Branch: ").append(ref.replace("refs/heads/", "")).append("\n");
                    }
                } catch (Exception e) {
                    log.warn("Could not extract branch from payload for alert notification", e);
                }
            }

            message.append("Data: ").append(event.getCreatedAt().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))).append("\n");
            message.append("Msg: ").append(alert.getMessage());
            
            notificationService.sendNotification(title, message.toString());
        } catch (Exception e) {
            log.error("Failed to send alert notification", e);
        }
    }
}
