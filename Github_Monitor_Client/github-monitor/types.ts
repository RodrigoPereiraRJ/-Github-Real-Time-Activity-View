export interface User {
  id: string;
  name: string;
  email: string;
  token: string;
  avatarUrl?: string;
  role?: string;
  matricula?: string;
}

export interface Repository {
  id: string;
  githubRepoId?: string;
  name: string;
  owner: string;
  url: string;
  lastSyncedAt?: string;
  status?: 'synced' | 'failed' | 'syncing' | 'paused' | 'pending';
  language?: string;
  visibility?: 'Public' | 'Private';
}

export interface Event {
  id: string;
  repositoryId: string;
  type: 'PUSH' | 'PULL_REQUEST' | 'ISSUE';
  actorName?: string;
  actor?: string; 
  avatarUrl?: string; 
  branch?: string;
  message: string;
  createdAt: string;
}

export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  createdAt: string;
  status: 'OPEN' | 'RESOLVED';
  branch?: string;
  authorLogin?: string;
  authorAvatarUrl?: string;
}

export interface Contributor {
  id: string;
  login: string;
  avatarUrl: string;
  contributions: number;
}

export interface AuthResponse {
  token: string;
  type: string;
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  role?: string;
}

export interface Metrics {
  commits: number;
  pullRequests: number;
  issues: number;
}