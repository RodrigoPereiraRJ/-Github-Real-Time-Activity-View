package com.githubmonitor.api.service;

import com.githubmonitor.api.dto.LoginDTO;
import com.githubmonitor.api.dto.RegisterDTO;

public interface AuthService {
    String login(LoginDTO loginDto);
    String register(RegisterDTO registerDto);
}
