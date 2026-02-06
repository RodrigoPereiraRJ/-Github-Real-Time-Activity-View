package com.githubmonitor.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogDTO {
    private UUID id;
    private String userEmail;
    private String action;
    private String resource;
    private Boolean anonymous;
    private String details;
    private LocalDateTime createdAt;
}
