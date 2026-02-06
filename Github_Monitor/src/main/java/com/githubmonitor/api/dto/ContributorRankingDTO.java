package com.githubmonitor.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContributorRankingDTO {
    private String githubLogin;
    private String avatarUrl;
    private Long eventCount;
    private Long score;
}
