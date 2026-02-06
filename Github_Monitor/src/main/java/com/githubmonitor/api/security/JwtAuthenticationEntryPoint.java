package com.githubmonitor.api.security;

import com.githubmonitor.api.service.AuditLogService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final AuditLogService auditLogService;

    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException, ServletException {
        
        String path = request.getRequestURI();
        String method = request.getMethod();
        String details = "Method: " + method + ", Path: " + path + ", Error: " + authException.getMessage();

        // Logs authentication failure (user is likely anonymous or token is invalid)
        auditLogService.logSecurityEvent("AUTHENTICATION_FAILURE", "API", details);

        response.sendError(HttpServletResponse.SC_UNAUTHORIZED, authException.getMessage());
    }
}
