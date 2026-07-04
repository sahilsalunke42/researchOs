import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { serverGetSession } from '@/lib/auth';
import { ShellClient } from '@/components/layout/ShellClient';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieHeader = cookies().getAll().map((c) => `${c.name}=${c.value}`).join('; ');
  const user = await serverGetSession(cookieHeader);
  if (!user) redirect('/login');
  return <ShellClient user={user}>{children}</ShellClient>;
}
