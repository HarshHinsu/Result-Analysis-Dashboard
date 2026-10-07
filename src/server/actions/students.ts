'use server';

import prisma from '@/lib/db/prisma';
import { StudentSchema, StudentInput } from '@/lib/validations';
import { requireAuth } from '@/lib/auth/rbac';
import { logAuditEvent } from '@/lib/audit/logger';
import { revalidatePath } from 'next/cache';

export interface GetStudentsParams {
  page?: number;
  limit?: number;
  search?: string;
  branchId?: string;
  batch?: string;
  status?: string;
  semesterId?: string;
}

export async function getStudentsAction(params: GetStudentsParams = {}) {
  await requireAuth();

  const page = Math.max(1, params.page || 1);
  const limit = Math.max(1, Math.min(100, params.limit || 15));
  const skip = (page - 1) * limit;

  const where: any = {};

  if (params.search && params.search.trim()) {
    const s = params.search.trim();
    where.OR = [
      { fullName: { contains: s } },
      { enrollmentNumber: { contains: s } },
      { seatNumber: { contains: s } },
    ];
  }

  if (params.branchId && params.branchId !== 'ALL') {
    where.branchId = params.branchId;
  }

  if (params.batch && params.batch !== 'ALL') {
    where.batch = params.batch;
  }

  if (params.status && params.status !== 'ALL') {
    where.active = params.status === 'ACTIVE';
  }

  if (params.semesterId && params.semesterId !== 'ALL') {
    where.semesterResults = {
      some: {
        semesterId: params.semesterId,
      },
    };
  }

  const [total, students] = await Promise.all([
    prisma.student.count({ where }),
    prisma.student.findMany({
      where,
      skip,
      take: limit,
      include: {
        branch: true,
        semesterResults: {
          orderBy: { semester: { number: 'desc' } },
          take: 1,
          include: {
            semester: true,
          },
        },
      },
      orderBy: { enrollmentNumber: 'asc' },
    }),
  ]);

  return {
    students,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getStudentByIdAction(id: string) {
  await requireAuth();

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      branch: true,
      semesterResults: {
        orderBy: { semester: { number: 'asc' } },
        include: {
          semester: true,
          academicYear: true,
          subjectResults: {
            include: {
              subject: true,
            },
            orderBy: { subject: { subjectCode: 'asc' } },
          },
        },
      },
    },
  });

  return student;
}

export async function createStudentAction(data: StudentInput) {
  const user = await requireAuth();
  const validated = StudentSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.errors[0]?.message || 'Invalid student data' };
  }

  const { enrollmentNumber, seatNumber, fullName, branchId, batch, admissionYear, active } = validated.data;

  // Check unique enrollment
  const existing = await prisma.student.findUnique({
    where: { enrollmentNumber },
  });
  if (existing) {
    return { error: `A student with Enrollment Number "${enrollmentNumber}" already exists.` };
  }

  const student = await prisma.student.create({
    data: {
      enrollmentNumber,
      seatNumber: seatNumber || null,
      fullName,
      branchId,
      batch: batch || null,
      admissionYear,
      active,
    },
    include: {
      branch: true,
    },
  });

  await logAuditEvent({
    userId: user.id,
    action: 'CREATE_STUDENT',
    entity: 'Student',
    entityId: student.id,
    details: { enrollmentNumber, fullName, branchId },
  });

  revalidatePath('/students');
  return { success: true, student };
}

export async function updateStudentAction(id: string, data: Partial<StudentInput>) {
  const user = await requireAuth();
  const existing = await prisma.student.findUnique({ where: { id } });
  if (!existing) {
    return { error: 'Student record not found.' };
  }

  if (data.enrollmentNumber && data.enrollmentNumber !== existing.enrollmentNumber) {
    const conflict = await prisma.student.findUnique({
      where: { enrollmentNumber: data.enrollmentNumber },
    });
    if (conflict) {
      return { error: `Enrollment number "${data.enrollmentNumber}" is already in use by another student.` };
    }
  }

  const student = await prisma.student.update({
    where: { id },
    data: {
      fullName: data.fullName ?? existing.fullName,
      enrollmentNumber: data.enrollmentNumber ?? existing.enrollmentNumber,
      seatNumber: data.seatNumber !== undefined ? data.seatNumber : existing.seatNumber,
      branchId: data.branchId ?? existing.branchId,
      batch: data.batch !== undefined ? data.batch : existing.batch,
      admissionYear: data.admissionYear ?? existing.admissionYear,
      active: data.active ?? existing.active,
    },
    include: {
      branch: true,
    },
  });

  await logAuditEvent({
    userId: user.id,
    action: 'UPDATE_STUDENT',
    entity: 'Student',
    entityId: student.id,
    details: { enrollmentNumber: student.enrollmentNumber, fullName: student.fullName },
  });

  revalidatePath('/students');
  revalidatePath(`/students/${id}`);
  return { success: true, student };
}
