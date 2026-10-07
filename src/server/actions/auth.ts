'use server';

import { LoginSchema, LoginInput } from '@/lib/validations';
import prisma from '@/lib/db/prisma';
import { comparePassword, createSessionToken, setSessionCookie, clearSessionCookie, getSessionFromCookies } from '@/lib/auth/session';
import { logAuditEvent } from '@/lib/audit/logger';
import { AuthUser } from '@/types';
import { redirect } from 'next/navigation';

export async function loginAction(data: LoginInput): Promise<{ success?: boolean; user?: AuthUser; error?: string }> {
  try {
    const validated = LoginSchema.safeParse(data);
    if (!validated.success) {
      return { error: validated.error.errors[0]?.message || 'Invalid login details' };
    }

    const { username, password } = validated.data;

    // Search user by username or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: username } },
          { email: { equals: username } },
        ],
      },
    });

    if (!user) {
      return { error: 'Invalid username or password' };
    }

    if (!user.active) {
      return { error: 'This account has been deactivated. Please contact an Administrator.' };
    }

    const passwordMatch = await comparePassword(password, user.passwordHash);
    if (!passwordMatch) {
      return { error: 'Invalid username or password' };
    }

    const authUser: AuthUser = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role as 'ADMIN' | 'FACULTY',
    };

    const token = await createSessionToken(authUser);
    await setSessionCookie(token);

    await logAuditEvent({
      userId: user.id,
      action: 'LOGIN',
      entity: 'User',
      entityId: user.id,
      details: { username: user.username, role: user.role },
    });

    return { success: true, user: authUser };
  } catch (error: any) {
    console.error('Login action error:', error);
    return { error: 'An unexpected error occurred during login. Please try again.' };
  }
}

export async function logoutAction(): Promise<void> {
  const session = await getSessionFromCookies();
  if (session?.user) {
    await logAuditEvent({
      userId: session.user.id,
      action: 'LOGOUT',
      entity: 'User',
      entityId: session.user.id,
    });
  }
  await clearSessionCookie();
  redirect('/login');
}

export async function getCurrentUserAction(): Promise<AuthUser | null> {
  const session = await getSessionFromCookies();
  return session?.user || null;
}
