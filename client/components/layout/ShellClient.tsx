'use client';

import { useRouter } from 'next/navigation';
import { Shell } from './Shell';
import { logout } from '@/lib/auth';
import type { UserDTO } from '@/types/api.types';

export function ShellClient({ user, children }: { user: UserDTO; children: React.ReactNode }) {
  const router = useRouter();
  async function onLogout() {
    await logout();
    router.push('/login');
    router.refresh();
  }
  return <Shell userName={user.name} onLogout={onLogout}>{children}</Shell>;
}
