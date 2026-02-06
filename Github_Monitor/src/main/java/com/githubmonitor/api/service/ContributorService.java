package com.githubmonitor.api.service;

import com.githubmonitor.api.dto.ContributorDTO;
import java.util.List;

public interface ContributorService {
    List<ContributorDTO> getAllContributors();
}
