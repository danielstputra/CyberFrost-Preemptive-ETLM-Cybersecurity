import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile, Tenant } from '@/types';
import apiClient from '@/lib/api-client';
import { ENDPOINTS } from '@/lib/constants';

// ── Cookie helper (legacy — untuk middleware/server) ──
function setCookie(name: string, value: string, days = 7) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax; Secure=${location.protocol === 'https:'}`;
}
function removeCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; max-age=0; path=/`;
}

interface AuthState {
  user: UserProfile | null;
  tenant: Tenant | null;
  token: string | null;
  isAuthenticated: boolean;
  hydrated: boolean;

  setAuth: (user: UserProfile, token: string, refreshToken: string, tenant?: Tenant) => void;
  logout: () => void;
  updateUser: (user: UserProfile) => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tenant: null,
      token: null,
      isAuthenticated: false,
      hydrated: false,

      setAuth: (user, token, refreshToken, tenant) => {
        localStorage.setItem('accessToken', token);
        localStorage.setItem('refreshToken', refreshToken);
        setCookie('accessToken', token);
        set({ user, token, tenant: tenant || null, isAuthenticated: true, hydrated: true });
      },

      logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        removeCookie('accessToken');
        set({ user: null, tenant: null, token: null, isAuthenticated: false, hydrated: true });
      },

      updateUser: (user) => set({ user }),

      hydrate: async () => {
        if (get().hydrated) return;
        // Coba restore dari persisted state dulu
        const persisted = localStorage.getItem('cyberfrost-auth');
        if (persisted) {
          try {
            const parsed = JSON.parse(persisted);
            if (parsed.state?.token) {
              set({ hydrated: true });
              return;
            }
          } catch { /* ignore corrupt data */ }
        }
        const token = localStorage.getItem('accessToken');
        if (!token) {
          set({ hydrated: true });
          return;
        }
        try {
          const res = await apiClient.get<{ user: UserProfile }>(ENDPOINTS.AUTH_ME);
          const user = res.data.user;
          set({ user, tenant: user.tenant || null, token, isAuthenticated: true, hydrated: true });
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          removeCookie('accessToken');
          set({ hydrated: true });
        }
      },
    }),
    {
      name: 'cyberfrost-auth',
      partialize: (state) => ({
        user: state.user,
        tenant: state.tenant,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
