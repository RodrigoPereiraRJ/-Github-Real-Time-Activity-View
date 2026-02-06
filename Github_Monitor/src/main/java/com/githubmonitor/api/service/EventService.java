package com.githubmonitor.api.service;

import com.githubmonitor.api.dto.DiffFileDTO;
import com.githubmonitor.api.dto.EventDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface EventService {
    Page<EventDTO> findAll(UUID repositoryId, String type, LocalDateTime start, LocalDateTime end, Pageable pageable);
    List<DiffFileDTO> getEventDiff(UUID eventId);
    void processWebhook(String eventType, String signature, String deliveryId, String payload);
}
