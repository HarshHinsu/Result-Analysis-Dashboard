'use server';

import prisma from '@/lib/db/prisma';
import { FacultySchema, FacultyInput } from '@/lib/validations';
import { requireAdmin } from '@/lib/auth/rbac';
import { hashPassword } from '@/lib/auth/session';
import { logAuditEvent } from '@/lib/audit/logger';
import { revalidatePath } from 'next/cache';

export async function getFacultyListAction() {
  await requireAdmin();
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          auditLogs: true,
          importJobs: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });
}

export async function createFacultyAction(data: FacultyInput) {
  const admin = await requireAdmin();
  const validated = FacultySchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.errors[0]?.message || 'Invalid user data' };
  }

  const { name, username, email, password, role, active } = validated.data;

  if (!password || password.length < 6) {
    return { error: 'A secure password with at least 6 characters is required.' };
  }

  const existingUsername = await prisma.user.findUnique({ where: { username } });
  if (existingUsername) {
    return { error: `Username "${username}" is already taken.` };
  }

  if (email) {
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return { error: `Email "${email}" is already registered.` };
    }
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      name,
      username,
      email: email || null,
      passwordHash,
      role,
      active,
    },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
    },
  });

  await logAuditEvent({
    userId: admin.id,
    action: 'CREATE_FACULTY',
    entity: 'User',
    entityId: user.id,
    details: { name: user.name, username: user.username, role: user.role },
  });

  revalidatePath('/faculty');
  return { success: true, user };
}

export async function updateFacultyAction(
  id: string,
  data: { name?: string; email?: string; role?: 'ADMIN' | 'FACULTY'; active?: boolean; newPassword?: string }
) {
  const admin = await requireAdmin();
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return { error: 'User not found' };
  }

  // Prevent self-deactivation if last admin
  if (existing.id === admin.id && data.active === false) {
    return { error: 'You cannot deactivate your own administrative account.' };
  }

  const updateData: any = {};
  if (data.name) updateData.name = data.name;
  if (data.email !== undefined) updateData.email = data.email || null;
  if (data.role) updateData.role = data.role;
  if (data.active !== undefined) updateData.active = data.active;
  if (data.newPassword && data.newPassword.trim().length >= 6) {
    updateData.passwordHash = await hashPassword(data.newPassword.trim());
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      active: true,
    },
  });

  await logAuditEvent({
    userId: admin.id,
    action: 'UPDATE_FACULTY',
    entity: 'User',
    entityId: id,
    details: { username: existing.username, changes: Object.keys(updateData) },
  });

  revalidatePath('/faculty');
  return { success: true, user: updatedUser };
}
