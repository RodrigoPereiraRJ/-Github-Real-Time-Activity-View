package com.githubmonitor.api.service;

import com.githubmonitor.api.dto.EventDTO;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

public interface SseService {
    SseEmitter subscribe();
    void sendEvent(EventDTO event);
    void sendUpdate(String type, Object data);
}
