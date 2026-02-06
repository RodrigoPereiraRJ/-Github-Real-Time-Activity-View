package com.githubmonitor.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RepositoryMetricsDTO {
    private UUID repositoryId;
    private String period;
    private Integer commitsCount;
    private PullRequestsMetrics pullRequests;
    private Integer issuesCount;
    private List<ContributorMetric> topContributors;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PullRequestsMetrics {
        private Integer opened;
        private Integer merged;
        private Integer closed;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ContributorMetric {
        private String login;
        private Integer commits;
    }
}
