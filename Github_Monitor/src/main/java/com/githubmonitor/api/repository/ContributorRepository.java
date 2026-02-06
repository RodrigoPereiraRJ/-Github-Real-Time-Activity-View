package com.githubmonitor.api.repository;

import com.githubmonitor.api.entity.Contributor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ContributorRepository extends JpaRepository<Contributor, UUID> {
    Optional<Contributor> findByGithubLogin(String githubLogin);
}
