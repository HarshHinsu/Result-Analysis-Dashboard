import { redirect } from 'next/navigation';
import { getSessionFromCookies } from './session';
import { AuthUser } from '@/types';

export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await getSessionFromCookies();
  return session?.user || null;
}

export async function requireAuth(redirectTo: string = '/login'): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(redirectTo);
  }
  return user;
}

export async function requireAdmin(redirectTo: string = '/dashboard'): Promise<AuthUser> {
  const user = await requireAuth();
  if (user.role !== 'ADMIN') {
    redirect(redirectTo);
  }
  return user;
}

export function isAdmin(user: AuthUser | null | undefined): boolean {
  return user?.role === 'ADMIN';
}

export function isFaculty(user: AuthUser | null | undefined): boolean {
  return user?.role === 'FACULTY' || user?.role === 'ADMIN';
}
