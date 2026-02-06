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
public class RepositoryDTO {
    private UUID id;
    private String name;
    private String owner;
    private String url;
    private String status;
    private String language;
    private LocalDateTime lastSyncedAt;
    private LocalDateTime createdAt;
}
