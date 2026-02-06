package com.githubmonitor.api.service.impl;

import com.githubmonitor.api.dto.LoginDTO;
import com.githubmonitor.api.dto.RegisterDTO;
import com.githubmonitor.api.entity.User;
import com.githubmonitor.api.repository.UserRepository;
import com.githubmonitor.api.security.JwtTokenProvider;
import com.githubmonitor.api.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final com.githubmonitor.api.service.AuditLogService auditLogService;

    @Override
    public String login(LoginDTO loginDto) {
        Authentication authentication = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(
                loginDto.getEmail(), loginDto.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);

        auditLogService.log("LOGIN", "Auth", "Login success for user: " + loginDto.getEmail());

        return jwtTokenProvider.generateToken(authentication);
    }

    @Override
    public String register(RegisterDTO registerDto) {
        if (userRepository.findByEmail(registerDto.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        User.Role role = User.Role.USER;
        if (registerDto.getRole() != null && !registerDto.getRole().isEmpty()) {
            try {
                role = User.Role.valueOf(registerDto.getRole().toUpperCase());
            } catch (IllegalArgumentException e) {
                // Ignore invalid role, fallback to USER or throw error
                throw new RuntimeException("Invalid role");
            }
        }

        User user = User.builder()
                .name(registerDto.getName())
                .email(registerDto.getEmail())
                .password(passwordEncoder.encode(registerDto.getPassword()))
                .matricula(registerDto.getMatricula())
                .githubId("manual_" + UUID.randomUUID().toString()) // Workaround for NOT NULL constraint in DB
                .role(role)
                .build();

        userRepository.save(user);

        return "User registered successfully";
    }
}
