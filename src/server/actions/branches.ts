'use server';

import prisma from '@/lib/db/prisma';
import { BranchSchema, BranchInput } from '@/lib/validations';
import { requireAuth, requireAdmin } from '@/lib/auth/rbac';
import { logAuditEvent } from '@/lib/audit/logger';
import { revalidatePath } from 'next/cache';

export async function getBranchesAction(includeInactive = false) {
  await requireAuth();
  return prisma.branch.findMany({
    where: includeInactive ? undefined : { active: true },
    include: {
      _count: {
        select: {
          students: true,
          subjects: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });
}

export async function createBranchAction(data: BranchInput) {
  const user = await requireAdmin();
  const validated = BranchSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.errors[0]?.message || 'Invalid branch data' };
  }

  const { code, name, active } = validated.data;

  // Check unique code
  const existing = await prisma.branch.findUnique({
    where: { code },
  });
  if (existing) {
    return { error: `A branch with code "${code}" already exists.` };
  }

  const branch = await prisma.branch.create({
    data: {
      code,
      name,
      active,
    },
  });

  await logAuditEvent({
    userId: user.id,
    action: 'CREATE_BRANCH',
    entity: 'Branch',
    entityId: branch.id,
    details: { code, name },
  });

  revalidatePath('/branches');
  return { success: true, branch };
}

export async function updateBranchAction(id: string, data: Partial<BranchInput>) {
  const user = await requireAdmin();
  const existing = await prisma.branch.findUnique({ where: { id } });
  if (!existing) {
    return { error: 'Branch not found' };
  }

  const branch = await prisma.branch.update({
    where: { id },
    data: {
      name: data.name ?? existing.name,
      code: data.code ? data.code.toUpperCase() : existing.code,
      active: data.active ?? existing.active,
    },
  });

  await logAuditEvent({
    userId: user.id,
    action: 'UPDATE_BRANCH',
    entity: 'Branch',
    entityId: branch.id,
    details: { code: branch.code, name: branch.name, active: branch.active },
  });

  revalidatePath('/branches');
  return { success: true, branch };
}
