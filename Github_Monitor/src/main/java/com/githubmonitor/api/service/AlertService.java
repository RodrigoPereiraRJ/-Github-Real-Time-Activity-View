package com.githubmonitor.api.service;

import com.githubmonitor.api.dto.AlertDTO;
import com.githubmonitor.api.entity.Event;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.UUID;

public interface AlertService {
    void checkAlerts(Event event);
    Page<AlertDTO> findAll(UUID repositoryId, Pageable pageable);
    void resolveAlert(UUID id);
}
