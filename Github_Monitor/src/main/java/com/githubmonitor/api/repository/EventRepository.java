package com.githubmonitor.api.repository;

import com.githubmonitor.api.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EventRepository extends JpaRepository<Event, UUID>, JpaSpecificationExecutor<Event> {
    List<Event> findByRepositoryId(UUID repositoryId);
    List<Event> findByRepositoryIdAndCreatedAtAfter(UUID repositoryId, java.time.LocalDateTime createdAt);
    Optional<Event> findByDeliveryId(String deliveryId);
}
