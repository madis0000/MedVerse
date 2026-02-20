import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'SUPER_ADMIN' | 'DOCTOR' | 'NURSE' | 'RECEPTIONIST' | 'LAB_TECH';
  specialtyId?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  sessionExpired: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setSessionExpired: (expired: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      sessionExpired: false,
      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true, sessionExpired: false }),
      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),
      setSessionExpired: (expired) =>
        set({ sessionExpired: expired }),
      logout: () =>
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, sessionExpired: false }),
    }),
    { name: 'medpulse-auth' },
  ),
);
