package com.githubmonitor.api.controller;

import com.githubmonitor.api.dto.ContributorDTO;
import com.githubmonitor.api.service.ContributorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/contributors")
@RequiredArgsConstructor
public class ContributorController {

    private final ContributorService contributorService;

    @GetMapping
    public ResponseEntity<List<ContributorDTO>> getAllContributors() {
        return ResponseEntity.ok(contributorService.getAllContributors());
    }
}
