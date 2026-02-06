package com.githubmonitor.api.controller;

import com.githubmonitor.api.dto.AuthResponseDTO;
import com.githubmonitor.api.dto.LoginDTO;
import com.githubmonitor.api.dto.RegisterDTO;
import com.githubmonitor.api.entity.User;
import com.githubmonitor.api.repository.UserRepository;
import com.githubmonitor.api.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    @PostMapping(value = {"/login", "/signin"})
    public ResponseEntity<AuthResponseDTO> login(@RequestBody LoginDTO loginDto){
        String token = authService.login(loginDto);

        User user = userRepository.findByEmail(loginDto.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        AuthResponseDTO authResponseDto = new AuthResponseDTO();
        authResponseDto.setAccessToken(token);
        authResponseDto.setId(user.getId());
        authResponseDto.setName(user.getName());
        authResponseDto.setEmail(user.getEmail());
        authResponseDto.setRole(user.getRole().name());
        authResponseDto.setAvatarUrl(user.getAvatarUrl());

        return ResponseEntity.ok(authResponseDto);
    }

    @PostMapping(value = {"/register", "/signup"})
    public ResponseEntity<String> register(@RequestBody RegisterDTO registerDto){
        String response = authService.register(registerDto);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
}
