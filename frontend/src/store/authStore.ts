import { create } from 'zustand';
import { apiClient } from '../api/client';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  workspaceId: string;
  workspaceName?: string;
  role: 'owner' | 'analyst' | 'viewer';
}

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, fullName: string, workspaceName?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  initAuth: () => Promise<void>;
  fetchUser: () => Promise<void>;
  deleteWorkspaceData: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('semimatrix_token'),
  user: (() => {
    try {
      const stored = localStorage.getItem('semimatrix_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })(),
  isInitialized: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      const { accessToken, user } = res.data.data;
      localStorage.setItem('semimatrix_token', accessToken);
      localStorage.setItem('semimatrix_user', JSON.stringify(user));
      set({ token: accessToken, user, isLoading: false, isInitialized: true });
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Login failed. Please check your credentials.';
      set({ error: msg, isLoading: false });
      return false;
    }
  },

  register: async (email: string, password: string, fullName: string, workspaceName?: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.post('/auth/register', { email, password, fullName, workspaceName });
      const { accessToken, user } = res.data.data;
      localStorage.setItem('semimatrix_token', accessToken);
      localStorage.setItem('semimatrix_user', JSON.stringify(user));
      set({ token: accessToken, user, isLoading: false, isInitialized: true });
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Registration failed. Please try again.';
      set({ error: msg, isLoading: false });
      return false;
    }
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // ignore logout network errors
    } finally {
      localStorage.removeItem('semimatrix_token');
      localStorage.removeItem('semimatrix_user');
      set({ token: null, user: null, isInitialized: true });
    }
  },

  fetchUser: async () => {
    try {
      const res = await apiClient.get('/auth/me');
      const user = res.data.data;
      localStorage.setItem('semimatrix_user', JSON.stringify(user));
      set({ user, isInitialized: true });
    } catch (e) {
      localStorage.removeItem('semimatrix_token');
      localStorage.removeItem('semimatrix_user');
      set({ token: null, user: null, isInitialized: true });
    }
  },

  initAuth: async () => {
    const token = localStorage.getItem('semimatrix_token');
    if (token) {
      await get().fetchUser();
    } else {
      set({ isInitialized: true });
    }
  },

  deleteWorkspaceData: async () => {
    set({ isLoading: true });
    try {
      await apiClient.delete('/auth/workspace/data');
      await get().logout();
      set({ isLoading: false });
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to delete workspace data.';
      set({ error: msg, isLoading: false });
      return false;
    }
  }
}));
