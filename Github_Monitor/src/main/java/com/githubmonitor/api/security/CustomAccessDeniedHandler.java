package com.githubmonitor.api.security;

import com.githubmonitor.api.service.AuditLogService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class CustomAccessDeniedHandler implements AccessDeniedHandler {

    private final AuditLogService auditLogService;

    @Override
    public void handle(HttpServletRequest request,
                       HttpServletResponse response,
                       AccessDeniedException accessDeniedException) throws IOException, ServletException {
        
        String path = request.getRequestURI();
        String method = request.getMethod();
        String details = "Method: " + method + ", Path: " + path + ", Error: " + accessDeniedException.getMessage();

        // Logs security event (user might be authenticated but lacks permission)
        auditLogService.logSecurityEvent("ACCESS_DENIED", "API", details);

        response.sendError(HttpServletResponse.SC_FORBIDDEN, "Access Denied");
    }
}
