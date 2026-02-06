package com.githubmonitor.api.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.githubmonitor.api.dto.DiffFileDTO;
import com.githubmonitor.api.dto.EventDTO;
import com.githubmonitor.api.entity.Contributor;
import com.githubmonitor.api.entity.Event;
import com.githubmonitor.api.entity.Repository;
import com.githubmonitor.api.repository.ContributorRepository;
import com.githubmonitor.api.repository.EventRepository;
import com.githubmonitor.api.repository.RepositoryRepository;
import com.githubmonitor.api.service.AlertService;
import com.githubmonitor.api.service.EventService;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventServiceImpl implements EventService {

    private final EventRepository eventRepository;
    private final RepositoryRepository repositoryRepository;
    private final ContributorRepository contributorRepository;
    private final AlertService alertService;
    private final com.githubmonitor.api.service.SseService sseService;
    private final ObjectMapper objectMapper;
    private final com.githubmonitor.api.service.NotificationService notificationService;

    @Value("${github.api.token}")
    private String githubToken;

    @Override
    public List<DiffFileDTO> getEventDiff(UUID eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        try {
            JsonNode payload = objectMapper.readTree(event.getPayload());
            String owner = event.getRepository().getOwner();
            String repo = event.getRepository().getName();
            
            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            if (githubToken != null && !githubToken.isEmpty()) {
                headers.set("Authorization", "Bearer " + githubToken);
            }
            org.springframework.http.HttpEntity<String> entity = new org.springframework.http.HttpEntity<>(headers);

            List<DiffFileDTO> diffs = new ArrayList<>();

            if (event.getType() == Event.EventType.PUSH) {
                // Get Head Commit
                String headSha = payload.path("after").asText(null);
                if (headSha == null) {
                    JsonNode headCommit = payload.path("head_commit");
                    if (headCommit != null && !headCommit.isMissingNode()) {
                        headSha = headCommit.path("id").asText(null);
                    }
                }
                
                if (headSha != null) {
                    String url = String.format("https://api.github.com/repos/%s/%s/commits/%s", owner, repo, headSha);
                    org.springframework.http.ResponseEntity<JsonNode> response = restTemplate.exchange(url, org.springframework.http.HttpMethod.GET, entity, JsonNode.class);
                    
                    if (response.getBody() != null && response.getBody().has("files")) {
                        for (JsonNode file : response.getBody().get("files")) {
                            diffs.add(DiffFileDTO.builder()
                                    .filename(file.path("filename").asText())
                                    .status(file.path("status").asText())
                                    .additions(file.path("additions").asInt())
                                    .deletions(file.path("deletions").asInt())
                                    .patch(file.path("patch").asText(null))
                                    .build());
                        }
                    }
                }

            } else if (event.getType() == Event.EventType.PULL_REQUEST) {
                int prNumber = payload.path("pull_request").path("number").asInt();
                String url = String.format("https://api.github.com/repos/%s/%s/pulls/%d/files", owner, repo, prNumber);
                
                org.springframework.http.ResponseEntity<JsonNode> response = restTemplate.exchange(url, org.springframework.http.HttpMethod.GET, entity, JsonNode.class);
                 if (response.getBody() != null && response.getBody().isArray()) {
                        for (JsonNode file : response.getBody()) {
                            diffs.add(DiffFileDTO.builder()
                                    .filename(file.path("filename").asText())
                                    .status(file.path("status").asText())
                                    .additions(file.path("additions").asInt())
                                    .deletions(file.path("deletions").asInt())
                                    .patch(file.path("patch").asText(null))
                                    .build());
                        }
                    }
            }

            return diffs;

        } catch (Exception e) {
            log.error("Failed to fetch diff for event {}", eventId, e);
            throw new RuntimeException("Failed to fetch diff", e);
        }
    }

    @Override
    public Page<EventDTO> findAll(UUID repositoryId, String type, LocalDateTime start, LocalDateTime end, Pageable pageable) {
        Specification<Event> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (repositoryId != null) {
                predicates.add(cb.equal(root.get("repository").get("id"), repositoryId));
            }

            if (type != null && !type.isEmpty()) {
                try {
                    Event.EventType eventType = Event.EventType.valueOf(type.toUpperCase());
                    predicates.add(cb.equal(root.get("type"), eventType));
                } catch (IllegalArgumentException e) {
                    // Ignore invalid type or handle error
                    log.warn("Invalid event type filter: {}", type);
                }
            }

            if (start != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), start));
            }

            if (end != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), end));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return eventRepository.findAll(spec, pageable)
                .map(this::toDTO);
    }

    private EventDTO toDTO(Event event) {
        JsonNode payloadNode = null;
        try {
            if (event.getPayload() != null) {
                payloadNode = objectMapper.readTree(event.getPayload());
            }
        } catch (JsonProcessingException e) {
            log.error("Error parsing event payload for event ID: {}", event.getId(), e);
        }

        EventDTO.EventDTOBuilder builder = EventDTO.builder()
                .id(event.getId())
                .type(event.getType())
                .repositoryId(event.getRepository().getId())
                .payload(payloadNode)
                .createdAt(event.getCreatedAt());

        if (payloadNode != null) {
            enrichDTO(builder, payloadNode, event.getType());
        }

        return builder.build();
    }

    private void enrichDTO(EventDTO.EventDTOBuilder builder, JsonNode payload, Event.EventType type) {
        // Actor & Avatar
        if (payload.has("sender")) {
            builder.actor(payload.get("sender").path("login").asText(null));
            builder.avatarUrl(payload.get("sender").path("avatar_url").asText(null));
        } else if (payload.has("pusher")) {
            builder.actor(payload.get("pusher").path("name").asText(null));
        }

        // Author
        if (type == Event.EventType.PUSH && payload.has("pusher")) {
            builder.author(payload.get("pusher").path("name").asText(null));
        } else if (payload.has("sender")) {
            builder.author(payload.get("sender").path("login").asText(null));
        }

        // Action
        builder.action(type.name());
        if (payload.has("action")) {
            builder.action(payload.get("action").asText());
        }

        // Type Specifics
        switch (type) {
            case PUSH:
                // Branch
                String ref = payload.path("ref").asText(null);
                if (ref != null) builder.branch(ref.replace("refs/heads/", ""));

                // URL
                builder.url(payload.path("compare").asText(null));

                // Commits Info
                JsonNode commits = payload.path("commits");
                if (commits.isArray() && commits.size() > 0) {
                    JsonNode headCommit = commits.get(0);
                    builder.message(headCommit.path("message").asText(null));

                    // Date
                    String dateStr = headCommit.path("committer").path("date").asText(null);
                    if (dateStr != null) {
                        try {
                            builder.eventDate(java.time.LocalDateTime.parse(dateStr, java.time.format.DateTimeFormatter.ISO_OFFSET_DATE_TIME));
                        } catch (Exception e) {
                            // ignore date parse error
                        }
                    }

                    // Modified Files
                    List<String> modified = new ArrayList<>();
                    for (JsonNode commit : commits) {
                        JsonNode modNode = commit.path("modified");
                        if (modNode.isArray()) {
                            for (JsonNode file : modNode) {
                                modified.add(file.asText());
                            }
                        }
                    }
                    if (!modified.isEmpty()) {
                        builder.modifiedFiles(modified.stream().distinct().toList());
                    }
                }
                break;

            case ISSUE:
            case PULL_REQUEST:
                String nodeName = (type == Event.EventType.ISSUE) ? "issue" : "pull_request";
                JsonNode mainNode = payload.path(nodeName);

                String title = mainNode.path("title").asText("");
                String body = mainNode.path("body").asText("");
                builder.message(title + (body.isEmpty() ? "" : "\n" + body));
                
                builder.url(mainNode.path("html_url").asText(null));

                if (type == Event.EventType.PULL_REQUEST) {
                    builder.branch(mainNode.path("head").path("ref").asText(null));
                    
                    // Logic to detect MERGED or REJECTED
                    String action = payload.path("action").asText("");
                    if ("closed".equals(action)) {
                        boolean isMerged = mainNode.path("merged").asBoolean(false);
                        if (isMerged) {
                            builder.action("merged");
                        } else {
                            builder.action("rejected"); // Closed without merge
                        }
                    }
                }
                // Created At from payload if available
                if (mainNode.has("created_at")) {
                     try {
                        builder.eventDate(java.time.LocalDateTime.parse(mainNode.get("created_at").asText(), java.time.format.DateTimeFormatter.ISO_OFFSET_DATE_TIME));
                     } catch (Exception e) {}
                }
                break;

            case CREATE:
                String refType = payload.path("ref_type").asText("unknown");
                String createdRef = payload.path("ref").asText("");
                builder.action("created " + refType);
                builder.branch(createdRef);
                builder.message("Created " + refType + ": " + createdRef);
                
                if (payload.has("repository")) {
                    String repoUrl = payload.path("repository").path("html_url").asText("");
                    if (!repoUrl.isEmpty() && !createdRef.isEmpty()) {
                         builder.url(repoUrl + "/tree/" + createdRef);
                    }
                }
                break;

            default:
                break;
        }
    }

    @Override
    @Transactional
    public void processWebhook(String eventType, String signature, String deliveryId, String payload) {
        log.info("Processing webhook event: {} with deliveryId: {}", eventType, deliveryId);

        try {
            JsonNode rootNode = objectMapper.readTree(payload);

            // 1. Identify Repository
            String repoFullName = getText(rootNode, "repository", "full_name");
            if (repoFullName == null) {
                log.warn("Payload does not contain repository information. Ignoring.");
                return;
            }

            Repository repository = repositoryRepository.findByGithubRepoId(repoFullName)
                    .orElse(null);

            if (repository == null) {
                log.warn("Repository {} not found in system. Ignoring event.", repoFullName);
                return;
            }

            // 2. Identify Contributor (Sender)
            Contributor contributor = null;
            if (rootNode.has("sender")) {
                String senderLogin = getText(rootNode, "sender", "login");
                String avatarUrl = getText(rootNode, "sender", "avatar_url");
                
                if (senderLogin != null) {
                    contributor = contributorRepository.findByGithubLogin(senderLogin)
                            .orElseGet(() -> Contributor.builder()
                                    .githubLogin(senderLogin)
                                    .avatarUrl(avatarUrl)
                                    .build());
                    
                    // Update avatar if changed
                    if (avatarUrl != null && !avatarUrl.equals(contributor.getAvatarUrl())) {
                        contributor.setAvatarUrl(avatarUrl);
                        contributor = contributorRepository.save(contributor);
                    } else if (contributor.getId() == null) {
                         contributor = contributorRepository.save(contributor);
                    }
                }
            }

            // 3. Save Event
            // Map GitHub event types to our Enum
            Event.EventType type;
            try {
                type = parseEventType(eventType);
            } catch (IllegalArgumentException e) {
                log.warn("Ignored unsupported event type: {}", eventType);
                return;
            }

            // Update repository lastSyncedAt and Language
            repository.setLastSyncedAt(LocalDateTime.now());
            
            // Try to extract language from payload (repository.language)
            if (rootNode.has("repository") && rootNode.get("repository").has("language")) {
                String language = rootNode.get("repository").get("language").asText(null);
                if (language != null) {
                    repository.setLanguage(language);
                }
            }
            
            repositoryRepository.save(repository);

            Event event = Event.builder()
                    .repository(repository)
                    .contributor(contributor)
                    .type(type)
                    .deliveryId(deliveryId)
                    .payload(payload)
                    .build();

            eventRepository.save(event);
            log.info("Event saved successfully: {}", event.getId());

            // 4. Trigger Windows Notification
            triggerEventNotification(event, rootNode);

            // 5. Check Alerts
            alertService.checkAlerts(event);

            // 6. Broadcast SSE
            sseService.sendEvent(toDTO(event));

        } catch (Exception e) {
            log.error("Error processing webhook payload", e);
            throw new RuntimeException("Failed to process webhook", e);
        }
    }

    private void triggerEventNotification(Event event, JsonNode payload) {
        try {
            String title = "Novo Evento: " + event.getType();
            StringBuilder message = new StringBuilder();

            // Extract Author/Sender
            String author = "Unknown";
            if (payload.has("sender")) {
                author = payload.path("sender").path("login").asText("Unknown");
            } else if (payload.has("pusher")) {
                author = payload.path("pusher").path("name").asText("Unknown");
            }

            // Extract Branch
            String branchName = extractBranchName(event, payload);
            String branchInfo = (branchName != null && !branchName.isEmpty()) ? " (" + branchName + ")" : "";

            // Compact Header: Repo + Branch
            message.append(event.getRepository().getName()).append(branchInfo).append("\n");
            message.append("By: ").append(author).append("\n");

            if (event.getType() == Event.EventType.PUSH) {
                boolean isBranchDeleted = payload.path("deleted").asBoolean(false);
                if (isBranchDeleted) {
                    title = "DELETE BRANCH 🗑️";
                }
            } else if (event.getType() == Event.EventType.PULL_REQUEST) {
                String action = payload.path("action").asText("");
                JsonNode prNode = payload.path("pull_request");
                String prTitle = prNode.path("title").asText("N/A");
                
                message.append("Action: ").append(action).append("\n");
                message.append("PR: ").append(prTitle).append("\n");

                if ("closed".equalsIgnoreCase(action)) {
                    boolean merged = prNode.path("merged").asBoolean(false);
                    if (merged) {
                        message.append("Status: MERGED!\n");
                    } else {
                        message.append("Status: CLOSED (Rejected) \n");
                    }
                }
            } else if (event.getType() == Event.EventType.ISSUE) {
                String action = payload.path("action").asText("");
                String issueTitle = payload.path("issue").path("title").asText("N/A");
                
                message.append("Action: ").append(action).append("\n");
                message.append("Issue: ").append(issueTitle).append("\n");
            }

            // File changes logic for PUSH
            if (event.getType() == Event.EventType.PUSH && payload.has("commits")) {
                List<String> addedFiles = new ArrayList<>();
                List<String> modifiedFiles = new ArrayList<>();
                List<String> removedFiles = new ArrayList<>();

                for (JsonNode commit : payload.get("commits")) {
                    if (commit.has("added")) commit.get("added").forEach(f -> addedFiles.add(f.asText()));
                    if (commit.has("modified")) commit.get("modified").forEach(f -> modifiedFiles.add(f.asText()));
                    if (commit.has("removed")) commit.get("removed").forEach(f -> removedFiles.add(f.asText()));
                }
                
                // Detect pure file deletion
                if (!removedFiles.isEmpty() && addedFiles.isEmpty() && modifiedFiles.isEmpty()) {
                    title = "DELETE FILE";
                }

                if (!addedFiles.isEmpty()) {
                    message.append("+ ").append(String.join(", ", addedFiles.stream().limit(2).toList()));
                    if (addedFiles.size() > 2) message.append("...");
                    message.append("\n");
                }
                if (!modifiedFiles.isEmpty()) {
                    message.append("~ ").append(String.join(", ", modifiedFiles.stream().limit(2).toList()));
                    if (modifiedFiles.size() > 2) message.append("...");
                    message.append("\n");
                }
                if (!removedFiles.isEmpty()) {
                    message.append("- ").append(String.join(", ", removedFiles.stream().limit(2).toList()));
                    if (removedFiles.size() > 2) message.append("...");
                    message.append("\n");
                }
            }

            notificationService.sendNotification(title, message.toString());
        } catch (Exception e) {
            log.error("Failed to send notification", e);
        }
    }

    private String extractBranchName(Event event, JsonNode payload) {
        String ref = null;
        switch (event.getType()) {
            case PUSH:
            case CREATE:
                ref = payload.path("ref").asText(null);
                break;
            case PULL_REQUEST:
                ref = payload.path("pull_request").path("head").path("ref").asText(null);
                break;
            case RELEASE:
                ref = payload.path("release").path("target_commitish").asText(null);
                break;
            case ISSUE:
                break;
            default:
                break;
        }
        
        if (ref != null) {
            return ref.replace("refs/heads/", "");
        }
        return null;
    }

    private String getText(JsonNode node, String parent, String field) {
        if (node.has(parent) && node.get(parent).has(field)) {
            return node.get(parent).get(field).asText();
        }
        return null;
    }

    private Event.EventType parseEventType(String eventType) {
        if ("push".equalsIgnoreCase(eventType)) return Event.EventType.PUSH;
        if ("pull_request".equalsIgnoreCase(eventType)) return Event.EventType.PULL_REQUEST;
        if ("issues".equalsIgnoreCase(eventType)) return Event.EventType.ISSUE;
        if ("release".equalsIgnoreCase(eventType)) return Event.EventType.RELEASE;
        if ("create".equalsIgnoreCase(eventType)) return Event.EventType.CREATE;
        
        // Fallback or error for strictly typed Enum
        throw new IllegalArgumentException("Unsupported event type: " + eventType);
    }
}
