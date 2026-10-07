'use server';

import prisma from '@/lib/db/prisma';
import { SubjectSchema, SubjectInput } from '@/lib/validations';
import { requireAuth, requireAdmin } from '@/lib/auth/rbac';
import { logAuditEvent } from '@/lib/audit/logger';
import { revalidatePath } from 'next/cache';

export async function getSubjectsAction(filters?: {
  branchId?: string;
  semesterId?: string;
  search?: string;
  includeInactive?: boolean;
}) {
  await requireAuth();
  return prisma.subject.findMany({
    where: {
      ...(filters?.includeInactive ? {} : { active: true }),
      ...(filters?.branchId ? { branchId: filters.branchId } : {}),
      ...(filters?.semesterId ? { semesterId: filters.semesterId } : {}),
      ...(filters?.search
        ? {
            OR: [
              { subjectCode: { contains: filters.search } },
              { subjectName: { contains: filters.search } },
            ],
          }
        : {}),
    },
    include: {
      branch: true,
      semester: true,
      _count: {
        select: {
          subjectResults: true,
        },
      },
    },
    orderBy: [{ semester: { number: 'asc' } }, { subjectCode: 'asc' }],
  });
}

export async function createSubjectAction(data: SubjectInput) {
  const user = await requireAdmin();
  const validated = SubjectSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.errors[0]?.message || 'Invalid subject data' };
  }

  const { subjectCode, subjectName, branchId, semesterId, credits, active } = validated.data;

  // Check unique subject code per branch and semester
  const existing = await prisma.subject.findFirst({
    where: {
      subjectCode,
      branchId: branchId || null,
      semesterId,
    },
  });

  if (existing) {
    return { error: `Subject code "${subjectCode}" already exists for this branch and semester.` };
  }

  const subject = await prisma.subject.create({
    data: {
      subjectCode,
      subjectName,
      branchId: branchId || null,
      semesterId,
      credits,
      active,
    },
  });

  await logAuditEvent({
    userId: user.id,
    action: 'CREATE_SUBJECT',
    entity: 'Subject',
    entityId: subject.id,
    details: { subjectCode, subjectName, credits },
  });

  revalidatePath('/subjects');
  return { success: true, subject };
}

export async function updateSubjectAction(id: string, data: Partial<SubjectInput>) {
  const user = await requireAdmin();
  const existing = await prisma.subject.findUnique({ where: { id } });
  if (!existing) {
    return { error: 'Subject not found' };
  }

  const subject = await prisma.subject.update({
    where: { id },
    data: {
      subjectName: data.subjectName ?? existing.subjectName,
      subjectCode: data.subjectCode ?? existing.subjectCode,
      credits: data.credits ?? existing.credits,
      active: data.active ?? existing.active,
      branchId: data.branchId !== undefined ? data.branchId : existing.branchId,
      semesterId: data.semesterId ?? existing.semesterId,
    },
  });

  await logAuditEvent({
    userId: user.id,
    action: 'UPDATE_SUBJECT',
    entity: 'Subject',
    entityId: subject.id,
    details: { subjectCode: subject.subjectCode, subjectName: subject.subjectName, active: subject.active },
  });

  revalidatePath('/subjects');
  return { success: true, subject };
}
