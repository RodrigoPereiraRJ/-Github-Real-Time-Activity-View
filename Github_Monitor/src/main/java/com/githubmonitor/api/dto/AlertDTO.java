package com.githubmonitor.api.dto;

import com.githubmonitor.api.entity.Alert;
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
public class AlertDTO {
    private UUID id;
    private String ruleType;
    private UUID eventId;
    private Alert.Severity severity;
    private String message;
    private String branch;
    private String authorLogin;
    private String authorAvatarUrl;
    private Alert.Status status;
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;
}
