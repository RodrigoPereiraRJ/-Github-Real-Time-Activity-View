package com.githubmonitor.api.repository;

import com.githubmonitor.api.entity.Repository;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
import java.util.List;
import java.util.Optional;

@org.springframework.stereotype.Repository
public interface RepositoryRepository extends JpaRepository<Repository, UUID> {
    List<Repository> findByUserId(UUID userId);
    Optional<Repository> findByGithubRepoId(String githubRepoId);
}
