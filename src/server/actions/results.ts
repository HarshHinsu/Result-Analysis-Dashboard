'use server';

import prisma from '@/lib/db/prisma';
import { SemesterResultSchema, SemesterResultInput } from '@/lib/validations';
import { requireAuth } from '@/lib/auth/rbac';
import { logAuditEvent } from '@/lib/audit/logger';
import { revalidatePath } from 'next/cache';
import { calculateSPI, DEFAULT_GRADE_POINTS, DEFAULT_FAILING_GRADES } from '@/lib/calculations/analytics';

export async function getSemesterResultsAction(params: {
  page?: number;
  limit?: number;
  semesterId?: string;
  branchId?: string;
  academicYearId?: string;
  studentId?: string;
  search?: string;
} = {}) {
  await requireAuth();

  const page = Math.max(1, params.page || 1);
  const limit = Math.max(1, Math.min(100, params.limit || 20));
  const skip = (page - 1) * limit;

  const where: any = {};

  if (params.studentId) {
    where.studentId = params.studentId;
  }

  if (params.semesterId && params.semesterId !== 'ALL') {
    where.semesterId = params.semesterId;
  }

  if (params.branchId && params.branchId !== 'ALL') {
    where.student = { branchId: params.branchId };
  }

  if (params.academicYearId && params.academicYearId !== 'ALL') {
    where.academicYearId = params.academicYearId;
  }

  if (params.search && params.search.trim()) {
    const s = params.search.trim();
    where.OR = [
      { student: { fullName: { contains: s } } },
      { student: { enrollmentNumber: { contains: s } } },
      { seatNumber: { contains: s } },
    ];
  }

  const [total, results] = await Promise.all([
    prisma.semesterResult.count({ where }),
    prisma.semesterResult.findMany({
      where,
      skip,
      take: limit,
      include: {
        student: {
          include: {
            branch: true,
          },
        },
        semester: true,
        academicYear: true,
        subjectResults: {
          include: {
            subject: true,
          },
        },
      },
      orderBy: [
        { academicYear: { startYear: 'desc' } },
        { semester: { number: 'desc' } },
        { student: { enrollmentNumber: 'asc' } },
      ],
    }),
  ]);

  return {
    results,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getSubjectsForBranchAndSemester(branchId: string, semesterId: string) {
  await requireAuth();
  return prisma.subject.findMany({
    where: {
      active: true,
      semesterId,
      OR: [{ branchId }, { branchId: null }],
    },
    orderBy: { subjectCode: 'asc' },
  });
}

export async function saveSemesterResultAction(data: SemesterResultInput, resultId?: string) {
  const user = await requireAuth();
  const validated = SemesterResultSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.errors[0]?.message || 'Invalid result payload.' };
  }

  const payload = validated.data;

  // Retrieve grade points map from config if available
  let gradePointsMap = DEFAULT_GRADE_POINTS;
  try {
    const config = await prisma.calculationConfig.findUnique({ where: { key: 'GRADE_POINTS_MAP' } });
    if (config?.value) gradePointsMap = JSON.parse(config.value);
  } catch (e) {
    // fallback
  }

  // Calculate backlog count based on subjects
  let calculatedBacklogs = 0;
  payload.subjectResults.forEach((sr) => {
    if (sr.isBacklog || DEFAULT_FAILING_GRADES.includes(sr.grade.toUpperCase())) {
      calculatedBacklogs++;
    }
  });

  const finalCurrentBacklog = payload.currentBacklog !== undefined ? payload.currentBacklog : calculatedBacklogs;
  const resultStatus = finalCurrentBacklog > 0 ? 'FAIL' : 'PASS';

  // Transaction to update or create
  try {
    const saved = await prisma.$transaction(async (tx) => {
      let semResult;
      if (resultId) {
        // Update existing
        semResult = await tx.semesterResult.update({
          where: { id: resultId },
          data: {
            seatNumber: payload.seatNumber || null,
            declarationDate: payload.declarationDate || null,
            spi: payload.spi,
            cpi: payload.cpi,
            cgpa: payload.cgpa,
            currentBacklog: finalCurrentBacklog,
            totalBacklog: payload.totalBacklog,
            resultStatus,
            remarks: payload.remarks || null,
          },
        });

        // Clear existing subject results for this semester result
        await tx.subjectResult.deleteMany({
          where: { semesterResultId: resultId },
        });
      } else {
        // Check duplicate
        const existing = await tx.semesterResult.findUnique({
          where: {
            studentId_semesterId_academicYearId: {
              studentId: payload.studentId,
              semesterId: payload.semesterId,
              academicYearId: payload.academicYearId,
            },
          },
        });

        if (existing) {
          throw new Error('A semester result already exists for this student, semester, and academic year.');
        }

        semResult = await tx.semesterResult.create({
          data: {
            studentId: payload.studentId,
            semesterId: payload.semesterId,
            academicYearId: payload.academicYearId,
            seatNumber: payload.seatNumber || null,
            declarationDate: payload.declarationDate || null,
            spi: payload.spi,
            cpi: payload.cpi,
            cgpa: payload.cgpa,
            currentBacklog: finalCurrentBacklog,
            totalBacklog: payload.totalBacklog,
            resultStatus,
            remarks: payload.remarks || null,
          },
        });
      }

      // Insert subject results
      for (const sr of payload.subjectResults) {
        const gp = gradePointsMap[sr.grade.toUpperCase()] ?? 0;
        await tx.subjectResult.create({
          data: {
            semesterResultId: semResult.id,
            subjectId: sr.subjectId,
            grade: sr.grade.toUpperCase(),
            gradePoint: gp,
            eIndicator: sr.eIndicator || '',
            mIndicator: sr.mIndicator || '',
            iIndicator: sr.iIndicator || '',
            vIndicator: sr.vIndicator || '',
            isBacklog: sr.isBacklog || DEFAULT_FAILING_GRADES.includes(sr.grade.toUpperCase()),
          },
        });
      }

      return semResult;
    });

    await logAuditEvent({
      userId: user.id,
      action: resultId ? 'UPDATE_RESULT' : 'CREATE_RESULT',
      entity: 'SemesterResult',
      entityId: saved.id,
      details: { studentId: payload.studentId, semesterId: payload.semesterId, spi: payload.spi },
    });

    revalidatePath('/results');
    revalidatePath(`/students/${payload.studentId}`);
    return { success: true, result: saved };
  } catch (error: any) {
    console.error('Save semester result error:', error);
    return { error: error.message || 'Failed to save semester result.' };
  }
}

export async function deleteSemesterResultAction(id: string) {
  const user = await requireAuth();
  const existing = await prisma.semesterResult.findUnique({ where: { id } });
  if (!existing) {
    return { error: 'Result record not found.' };
  }

  await prisma.semesterResult.delete({ where: { id } });

  await logAuditEvent({
    userId: user.id,
    action: 'DELETE_RESULT',
    entity: 'SemesterResult',
    entityId: id,
  });

  revalidatePath('/results');
  return { success: true };
}
