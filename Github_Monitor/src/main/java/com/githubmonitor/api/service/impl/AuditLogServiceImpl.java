package com.githubmonitor.api.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.githubmonitor.api.dto.AuditLogDTO;
import com.githubmonitor.api.entity.AuditLog;
import com.githubmonitor.api.entity.User;
import com.githubmonitor.api.repository.AuditLogRepository;
import com.githubmonitor.api.repository.UserRepository;
import com.githubmonitor.api.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public List<AuditLogDTO> getAllLogs() {
        return auditLogRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private AuditLogDTO toDTO(AuditLog log) {
        return AuditLogDTO.builder()
                .id(log.getId())
                .userEmail(log.getUser() != null ? log.getUser().getEmail() : null)
                .action(log.getAction())
                .resource(log.getResource())
                .anonymous(log.getAnonymous())
                .details(log.getDetails())
                .createdAt(log.getCreatedAt())
                .build();
    }

    @Override
    @Async // Audit logging should not block main business logic
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(User user, String action, String resource, Object details) {
        saveLog(user, action, resource, details);
    }

    @Override
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String action, String resource, Object details) {
        User user = getCurrentUser();
        saveLog(user, action, resource, details);
    }

    @Override
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logSecurityEvent(String action, String resource, String details) {
        // Security events might not have a logged-in user context available (e.g., failed login)
        // Try to get user from context, otherwise null
        User user = getCurrentUser();
        saveLog(user, action, resource, details);
    }

    private void saveLog(User user, String action, String resource, Object details) {
        try {
            // Always serialize to JSON to ensure validity (even strings must be quoted for JSON columns)
            String detailsJson = objectMapper.writeValueAsString(details);

            AuditLog auditLog = AuditLog.builder()
                    .user(user)
                    .anonymous(user == null)
                    .action(action)
                    .resource(resource)
                    .details(detailsJson)
                    .build();

            auditLogRepository.save(auditLog);
            log.info("Audit Log: User={} Action={} Resource={}", user != null ? user.getEmail() : "Anonymous", action, resource);

        } catch (JsonProcessingException e) {
            log.error("Failed to serialize audit log details", e);
        } catch (Exception e) {
            log.error("Failed to save audit log", e);
        }
    }

    private User getCurrentUser() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getPrincipal())) {
                String email = authentication.getName();
                return userRepository.findByEmail(email).orElse(null);
            }
        } catch (Exception e) {
            // Ignore context errors
        }
        return null;
    }
}
