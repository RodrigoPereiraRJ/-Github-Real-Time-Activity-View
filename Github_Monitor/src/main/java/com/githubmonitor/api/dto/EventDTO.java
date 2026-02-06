package com.githubmonitor.api.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.databind.JsonNode;
import com.githubmonitor.api.entity.Event;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventDTO {
    private UUID id;
    private Event.EventType type;
    private UUID repositoryId;
    
    // Extracted Fields
    private String actor;           // sender.login or pusher.name
    private String author;          // commit author or sender
    private String action;          // type name or specific action (opened, closed)
    private String avatarUrl;       // sender.avatar_url
    private String branch;          // ref or pr.head.ref
    private String message;         // commit message or issue/pr body
    private String url;             // html_url
    private List<String> modifiedFiles; // Only if present
    private LocalDateTime eventDate; // original event date (committer.date etc)
    
    @JsonIgnore
    private JsonNode payload; // Keeping full payload for reference, or can be removed if desired
    private LocalDateTime createdAt;
}
