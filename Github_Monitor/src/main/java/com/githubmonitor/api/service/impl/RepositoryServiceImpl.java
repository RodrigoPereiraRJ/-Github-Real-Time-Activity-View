package com.githubmonitor.api.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.githubmonitor.api.dto.ContributorRankingDTO;
import com.githubmonitor.api.dto.RepositoryDTO;
import com.githubmonitor.api.dto.RepositoryInput;
import com.githubmonitor.api.dto.RepositoryMetricsDTO;
import com.githubmonitor.api.entity.Contributor;
import com.githubmonitor.api.entity.Event;
import com.githubmonitor.api.entity.Repository;
import com.githubmonitor.api.entity.User;
import com.githubmonitor.api.exception.ResourceNotFoundException;
import com.githubmonitor.api.repository.EventRepository;
import com.githubmonitor.api.repository.RepositoryRepository;
import com.githubmonitor.api.repository.UserRepository;
import com.githubmonitor.api.service.RepositoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RepositoryServiceImpl implements RepositoryService {

    private final RepositoryRepository repositoryRepository;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final ObjectMapper objectMapper;
    private final com.githubmonitor.api.service.AuditLogService auditLogService;
    private final com.githubmonitor.api.service.SseService sseService;

    @Override
    public Page<RepositoryDTO> findAll(Pageable pageable) {
        return repositoryRepository.findAll(pageable)
                .map(this::toDTO);
    }

    @Override
    @Transactional
    public RepositoryDTO create(RepositoryInput input) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        Repository repository = Repository.builder()
                .owner(input.getOwner())
                .name(input.getName())
                .webhookSecret(input.getWebhookSecret())
                .url("https://github.com/" + input.getOwner() + "/" + input.getName())
                .githubRepoId(input.getOwner() + "/" + input.getName()) 
                .user(user)
                .build();

        Repository savedRepository = repositoryRepository.save(repository);
        
        auditLogService.log("CREATE_REPOSITORY", "Repository", savedRepository.getGithubRepoId());
        
        RepositoryDTO dto = toDTO(savedRepository);
        sseService.sendUpdate("repository-update", dto);
        
        return dto;
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        Repository repository = repositoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Repository not found"));

        repositoryRepository.delete(repository);
        
        auditLogService.log("DELETE_REPOSITORY", "Repository", repository.getGithubRepoId());
        sseService.sendUpdate("repository-update", java.util.Map.of("id", id, "action", "delete"));
    }

    @Override
    public RepositoryDTO findById(UUID id) {
        return repositoryRepository.findById(id)
                .map(this::toDTO)
                .orElseThrow(() -> new RuntimeException("Repository not found"));
    }

    @Override
    public RepositoryMetricsDTO getMetrics(UUID id, String period) {
        java.time.LocalDateTime startDate = java.time.LocalDateTime.now().minusDays(7);
        if ("30d".equals(period)) {
            startDate = java.time.LocalDateTime.now().minusDays(30);
        } else if ("90d".equals(period)) {
            startDate = java.time.LocalDateTime.now().minusDays(90);
        }

        List<Event> events = eventRepository.findByRepositoryIdAndCreatedAtAfter(id, startDate);

        int commitsCount = 0;
        int prOpened = 0;
        int prMerged = 0;
        int prClosed = 0;
        int issuesCount = 0;
        java.util.Map<String, Integer> contributorCommits = new java.util.HashMap<>();

        for (Event event : events) {
            try {
                com.fasterxml.jackson.databind.JsonNode payload = objectMapper.readTree(event.getPayload());
                String action = payload.path("action").asText("");

                if (event.getType() == Event.EventType.PUSH) {
                    commitsCount++;
                    // Count contributor commits
                    String login = "unknown";
                    if (payload.has("pusher")) {
                        login = payload.path("pusher").path("name").asText("unknown");
                    } else if (payload.has("sender")) {
                        login = payload.path("sender").path("login").asText("unknown");
                    }
                    contributorCommits.merge(login, 1, Integer::sum);

                } else if (event.getType() == Event.EventType.PULL_REQUEST) {
                    if ("opened".equals(action)) {
                        prOpened++;
                    } else if ("closed".equals(action)) {
                        boolean merged = payload.path("pull_request").path("merged").asBoolean(false);
                        if (merged) {
                            prMerged++;
                        } else {
                            prClosed++;
                        }
                    }
                } else if (event.getType() == Event.EventType.ISSUE) {
                    if ("opened".equals(action)) {
                        issuesCount++;
                    }
                }
            } catch (Exception e) {
                // Ignore parsing errors for metrics
            }
        }

        List<RepositoryMetricsDTO.ContributorMetric> topContributors = contributorCommits.entrySet().stream()
                .map(entry -> new RepositoryMetricsDTO.ContributorMetric(entry.getKey(), entry.getValue()))
                .sorted((a, b) -> b.getCommits().compareTo(a.getCommits()))
                .limit(5)
                .collect(Collectors.toList());

        return RepositoryMetricsDTO.builder()
                .repositoryId(id)
                .period(period)
                .commitsCount(commitsCount)
                .pullRequests(RepositoryMetricsDTO.PullRequestsMetrics.builder()
                        .opened(prOpened)
                        .merged(prMerged)
                        .closed(prClosed)
                        .build())
                .issuesCount(issuesCount)
                .topContributors(topContributors)
                .build();
    }

    @Override
    public List<ContributorRankingDTO> getRanking(UUID id) {
        List<Event> events = eventRepository.findByRepositoryId(id);

        return events.stream()
                .filter(e -> e.getContributor() != null)
                .collect(Collectors.groupingBy(e -> e.getContributor().getGithubLogin()))
                .entrySet().stream()
                .map(entry -> {
                    String login = entry.getKey();
                    List<Event> userEvents = entry.getValue();
                    Contributor contributor = userEvents.get(0).getContributor();

                    long eventCount = userEvents.size();

                    return ContributorRankingDTO.builder()
                            .githubLogin(login)
                            .avatarUrl(contributor.getAvatarUrl())
                            .eventCount(eventCount)
                            .score(eventCount)
                            .build();
                })
                .sorted(Comparator.comparingLong(ContributorRankingDTO::getEventCount).reversed())
                .collect(Collectors.toList());
    }

    private RepositoryDTO toDTO(Repository repository) {
        return RepositoryDTO.builder()
                .id(repository.getId())
                .name(repository.getName())
                .owner(repository.getOwner())
                .url(repository.getUrl())
                .language(repository.getLanguage())
                .createdAt(repository.getCreatedAt())
                .lastSyncedAt(repository.getLastSyncedAt())
                .status(repository.getLastSyncedAt() != null ? "synced" : "pending")
                .build();
    }
}
