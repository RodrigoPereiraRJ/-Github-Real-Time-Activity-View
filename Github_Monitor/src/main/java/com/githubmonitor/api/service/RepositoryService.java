package com.githubmonitor.api.service;

import com.githubmonitor.api.dto.ContributorRankingDTO;
import com.githubmonitor.api.dto.RepositoryDTO;
import com.githubmonitor.api.dto.RepositoryInput;
import com.githubmonitor.api.dto.RepositoryMetricsDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.UUID;

public interface RepositoryService {
    Page<RepositoryDTO> findAll(Pageable pageable);
    RepositoryDTO create(RepositoryInput input);
    void delete(UUID id);
    RepositoryDTO findById(UUID id);
    RepositoryMetricsDTO getMetrics(UUID id, String period);
    List<ContributorRankingDTO> getRanking(UUID id);
}
