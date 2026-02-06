package com.githubmonitor.api.service.impl;

import com.githubmonitor.api.dto.ContributorDTO;
import com.githubmonitor.api.entity.Contributor;
import com.githubmonitor.api.repository.ContributorRepository;
import com.githubmonitor.api.service.ContributorService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ContributorServiceImpl implements ContributorService {

    private final ContributorRepository contributorRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ContributorDTO> getAllContributors() {
        return contributorRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private ContributorDTO toDTO(Contributor contributor) {
        return ContributorDTO.builder()
                .id(contributor.getId())
                .login(contributor.getGithubLogin())
                .avatarUrl(contributor.getAvatarUrl())
                .build();
    }
}
