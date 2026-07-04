import { api, ApiError } from './api';
import type { UserDTO } from '@/types/api.types';

export async function getSession(): Promise<UserDTO | null> {
  try {
    const res = await api.get<{ user: UserDTO }>('/api/auth/me');
    return res.user;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null;
    throw err;
  }
}

export async function login(input: { email: string; password: string }): Promise<UserDTO> {
  const res = await api.post<{ user: UserDTO }>('/api/auth/login', input);
  return res.user;
}

export async function register(input: { email: string; password: string; name: string }): Promise<UserDTO> {
  const res = await api.post<{ user: UserDTO }>('/api/auth/register', input);
  return res.user;
}

export async function logout(): Promise<void> {
  await api.post<{ ok: true }>('/api/auth/logout');
}

export async function serverGetSession(cookieHeader: string): Promise<UserDTO | null> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';
  try {
    const res = await fetch(`${base}/api/auth/me`, {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      cache: 'no-store'
    });
    if (res.status === 401) return null;
    if (!res.ok) return null;
    const data = (await res.json()) as { user: UserDTO };
    return data.user;
  } catch {
    return null;
  }
}
