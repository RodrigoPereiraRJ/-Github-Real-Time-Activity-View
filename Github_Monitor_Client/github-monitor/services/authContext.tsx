import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from './api';

interface AuthContextType {
  user: User | null;
  login: (token: string, userData: Partial<User>) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      // Set initial state from local storage to avoid flicker
      setUser({ ...JSON.parse(storedUser), token });
      
      // Immediately sync with backend to get latest data (e.g. avatar)
      api.users.getProfile()
        .then(profile => {
           const updatedUser = { ...profile, token };
           setUser(updatedUser);
           localStorage.setItem('user', JSON.stringify(profile));
        })
        .catch(() => {
            // If token is invalid, logout might be appropriate, or just keep local state
            // For now, we'll just log the error
            console.error("Failed to sync user profile on init");
        });
    }
    // No longer initializing demo user automatically
    setIsLoading(false);
  }, []);

  const login = (token: string, userData: Partial<User>) => {
    localStorage.setItem('token', token);
    const userObj = { ...userData, token } as User;
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userObj);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = async (userData: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    
    // Persist user data
    const { token, ...userProfile } = updatedUser;
    localStorage.setItem('user', JSON.stringify(userProfile));

    try {
        await api.users.updateProfile(userData);
    } catch (error) {
        console.error("Failed to sync user profile with backend", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, isAuthenticated: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};