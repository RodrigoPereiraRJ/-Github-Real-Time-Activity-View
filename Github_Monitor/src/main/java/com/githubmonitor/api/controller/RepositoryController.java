package com.githubmonitor.api.controller;

import com.githubmonitor.api.dto.ContributorRankingDTO;
import com.githubmonitor.api.dto.RepositoryDTO;
import com.githubmonitor.api.dto.RepositoryInput;
import com.githubmonitor.api.dto.RepositoryMetricsDTO;
import com.githubmonitor.api.service.RepositoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/repositories")
@RequiredArgsConstructor
public class RepositoryController {
    
    private final RepositoryService repositoryService;

    @PostMapping
    public ResponseEntity<RepositoryDTO> create(@RequestBody @Valid RepositoryInput input) {
        RepositoryDTO createdRepository = repositoryService.create(input);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdRepository);
    }

    @GetMapping
    public ResponseEntity<Page<RepositoryDTO>> findAll(@PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(repositoryService.findAll(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RepositoryDTO> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(repositoryService.findById(id));
    }

    @GetMapping("/{id}/ranking")
    public ResponseEntity<List<ContributorRankingDTO>> getRanking(@PathVariable UUID id) {
        return ResponseEntity.ok(repositoryService.getRanking(id));
    }

    @GetMapping("/{id}/metrics")
    public ResponseEntity<RepositoryMetricsDTO> getMetrics(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "7d") String period) {
        return ResponseEntity.ok(repositoryService.getMetrics(id, period));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        repositoryService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
