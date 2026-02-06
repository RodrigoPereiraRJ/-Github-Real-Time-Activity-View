package com.githubmonitor.api.controller;

import com.githubmonitor.api.dto.DiffFileDTO;
import com.githubmonitor.api.dto.EventDTO;
import com.githubmonitor.api.service.EventService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.githubmonitor.api.service.SseService;
import org.springframework.http.MediaType;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;
    private final SseService sseService;

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamEvents() {
        return sseService.subscribe();
    }

    @GetMapping("/{id}/diff")
    public ResponseEntity<List<DiffFileDTO>> getEventDiff(@PathVariable UUID id) {
        return ResponseEntity.ok(eventService.getEventDiff(id));
    }

    @GetMapping
    public ResponseEntity<Page<EventDTO>> findAll(
            @RequestParam(required = false) UUID repositoryId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end,
            @PageableDefault(size = 20, sort = "createdAt", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable) {
        
        return ResponseEntity.ok(eventService.findAll(repositoryId, type, start, end, pageable));
    }
}
