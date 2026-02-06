package com.githubmonitor.api.controller;

import com.githubmonitor.api.dto.AlertDTO;
import com.githubmonitor.api.service.AlertService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
public class AlertController {

    private final AlertService alertService;

    @GetMapping
    public ResponseEntity<Page<AlertDTO>> findAll(
            @RequestParam(required = false) UUID repositoryId,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        return ResponseEntity.ok(alertService.findAll(repositoryId, pageable));
    }

    @PostMapping("/{id}/resolve")
    public ResponseEntity<Void> resolveAlert(@PathVariable UUID id) {
        alertService.resolveAlert(id);
        return ResponseEntity.noContent().build();
    }
}
