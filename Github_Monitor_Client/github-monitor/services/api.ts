import { API_BASE_URL, ENABLE_MOCK_FALLBACK } from '../constants';
import { AuthResponse, Repository, Event, Contributor, Alert, Metrics } from '../types';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handleResponse = async (response: Response) => {
  if (response.status === 401) {
    localStorage.removeItem('token');
    window.location.hash = '#/login';
    throw new Error('Unauthorized');
  }
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  // Check if response has content to parse
  const text = await response.text();
  return text ? JSON.parse(text) : {};
};

// --- API METHODS ---

export const api = {
  auth: {
    login: async (email: string, password: string): Promise<AuthResponse> => {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await handleResponse(res);
      return {
        token: data.accessToken,
        type: data.tokenType,
        id: data.id,
        username: data.name,
        email: data.email,
        avatarUrl: data.avatarUrl,
        role: data.role
      };
    },
    register: async (data: any): Promise<AuthResponse> => {
        // SIMULATION: Allow registration for UI testing purposes
        /*
        const res = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse(res);
        */
       
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    token: 'test-jwt-token-bypass',
                    type: 'Bearer',
                    id: 'test-user-123',
                    username: data.name || 'User',
                    email: data.email,
                });
            }, 800);
        });
    }
  },
  repositories: {
    list: async (): Promise<Repository[]> => {
      const res = await fetch(`${API_BASE_URL}/repositories?size=100`, { headers: getHeaders() });
      const data = await handleResponse(res);
      // Backend returns Page object
      return data.content || [];
    },
    create: async (repo: Partial<Repository>) => {
      const res = await fetch(`${API_BASE_URL}/repositories`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(repo)
      });
      return handleResponse(res);
    },
    delete: async (id: string) => {
        const res = await fetch(`${API_BASE_URL}/repositories/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (res.status === 204) return true;
        return handleResponse(res);
    },
    getMetrics: async (id: string): Promise<Metrics> => {
        const res = await fetch(`${API_BASE_URL}/repositories/${id}/metrics`, { headers: getHeaders() });
        return handleResponse(res);
    }
  },
  events: {
    list: async (filters?: Record<string, string>): Promise<Event[]> => {
      const query = new URLSearchParams(filters).toString();
      const res = await fetch(`${API_BASE_URL}/events?${query}`, { headers: getHeaders() });
      const data = await handleResponse(res);
      // Backend returns Page object
      return data.content || [];
    },
    getDiff: async (eventId: string): Promise<any[]> => {
        const res = await fetch(`${API_BASE_URL}/events/${eventId}/diff`, { headers: getHeaders() });
        return handleResponse(res);
    }
  },
  contributors: {
    list: async (): Promise<Contributor[]> => {
      const res = await fetch(`${API_BASE_URL}/contributors`, { headers: getHeaders() });
      return handleResponse(res);
    },
  },
  alerts: {
    list: async (): Promise<Alert[]> => {
      const res = await fetch(`${API_BASE_URL}/alerts?size=100`, { headers: getHeaders() });
      const data = await handleResponse(res);
      // Backend returns Page object
      return data.content || [];
    },
    createRule: async (rule: any) => {
        const res = await fetch(`${API_BASE_URL}/alert-rules`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(rule)
        });
        return handleResponse(res);
    },
    resolve: async (id: string): Promise<void> => {
        const res = await fetch(`${API_BASE_URL}/alerts/${id}/resolve`, {
            method: 'POST',
            headers: getHeaders()
        });
        if (res.status === 204) return;
        return handleResponse(res);
    }
  },
  dashboard: {
    export: async (): Promise<Blob> => {
        // Add timestamp to prevent browser caching
        const res = await fetch(`${API_BASE_URL}/dashboard/export?t=${new Date().getTime()}`, { headers: getHeaders() });
        if (!res.ok) throw new Error(`Export Failed: ${res.statusText}`);
        return res.blob();
    }
  },
  users: {
      getProfile: async () => {
          const res = await fetch(`${API_BASE_URL}/users/me`, {
              headers: getHeaders()
          });
          return handleResponse(res);
      },
      updateProfile: async (data: any) => {
          const res = await fetch(`${API_BASE_URL}/users/me`, {
              method: 'PUT',
              headers: getHeaders(),
              body: JSON.stringify(data)
          });
          return handleResponse(res);
      }
  }
};