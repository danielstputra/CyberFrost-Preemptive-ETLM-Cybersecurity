'use client';

import { useMutation } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { ENDPOINTS } from '@/lib/constants';
import { useAuthStore } from '@/store/auth-store';
import type { LoginRequest, RegisterRequest, AuthResponse } from '@/types';
import { useRouter } from 'next/navigation';

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const res = await apiClient.post<AuthResponse>(ENDPOINTS.AUTH_LOGIN, data);
      return res.data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken, data.tenant);
      router.push('/dashboard');
    },
  });
}

export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: RegisterRequest) => {
      const res = await apiClient.post<AuthResponse>(ENDPOINTS.AUTH_REGISTER, data);
      return res.data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken, data.tenant);
      router.push('/dashboard');
    },
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      try {
        await apiClient.post(ENDPOINTS.AUTH_LOGOUT);
      } catch {
        // Ignore errors — we clear locally regardless
      }
    },
    onSuccess: () => {
      logout();
      router.push('/login');
    },
    onSettled: () => {
      logout();
      router.push('/login');
    },
  });
}

export function useProfile() {
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.get(ENDPOINTS.AUTH_ME);
      return res.data;
    },
  });
}
