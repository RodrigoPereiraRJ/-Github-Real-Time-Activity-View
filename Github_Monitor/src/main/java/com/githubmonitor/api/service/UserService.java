package com.githubmonitor.api.service;

import com.githubmonitor.api.dto.UserDTO;
import java.util.List;
import java.util.UUID;

public interface UserService {
    List<UserDTO> getAllUsers();
    UserDTO getUserById(UUID id);
    UserDTO getUserByEmail(String email);
    UserDTO updateUser(UUID id, UserDTO userDTO);
    void deleteUser(UUID id);
}
