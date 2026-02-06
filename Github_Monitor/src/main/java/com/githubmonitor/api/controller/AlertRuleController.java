package com.githubmonitor.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.githubmonitor.api.dto.AlertRuleDTO;
import com.githubmonitor.api.model.AlertRuleType;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/alert-rules")
@RequiredArgsConstructor
public class AlertRuleController {

    private final ObjectMapper objectMapper;

    @GetMapping
    public ResponseEntity<List<AlertRuleDTO>> listRules() {
        List<AlertRuleDTO> rules = Arrays.stream(AlertRuleType.values())
                .map(rule -> {
                    try {
                        return AlertRuleDTO.builder()
                                .name(rule.getFriendlyName())
                                .type(rule.name())
                                .description(rule.getDescription())
                                .parameters(objectMapper.readTree(rule.getDefaultParameters()))
                                .build();
                    } catch (Exception e) {
                        throw new RuntimeException("Error parsing default parameters for rule " + rule.name(), e);
                    }
                })
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(rules);
    }
}
