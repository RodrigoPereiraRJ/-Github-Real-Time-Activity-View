package com.githubmonitor.api.service;

import com.githubmonitor.api.dto.AuditLogDTO;
import com.githubmonitor.api.entity.User;

import java.util.List;

public interface AuditLogService {
    void log(User user, String action, String resource, Object details);
    void log(String action, String resource, Object details);
    void logSecurityEvent(String action, String resource, String details);
    List<AuditLogDTO> getAllLogs();
}
