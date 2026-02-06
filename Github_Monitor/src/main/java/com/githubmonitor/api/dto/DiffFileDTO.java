package com.githubmonitor.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiffFileDTO {
    private String filename;
    private String status;
    private int additions;
    private int deletions;
    private String patch;
}
