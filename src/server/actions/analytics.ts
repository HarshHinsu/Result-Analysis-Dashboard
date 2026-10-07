'use server';

import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/rbac';
import {
  calculateDashboardKPIs,
  calculateGradeDistribution,
  calculateScoreDistribution,
  calculateBacklogDistribution,
  calculateSemesterTrends,
  calculateBranchComparison,
  calculateSubjectPerformance,
  calculateStudentRankings,
} from '@/lib/calculations/analytics';
import { DashboardFilterParams } from '@/types';

export async function getAnalyticsDataAction(filters: DashboardFilterParams = {}) {
  await requireAuth();

  const where: any = {};

  if (filters.academicYearId && filters.academicYearId !== 'ALL') {
    where.academicYearId = filters.academicYearId;
  }

  if (filters.semesterId && filters.semesterId !== 'ALL') {
    where.semesterId = filters.semesterId;
  }

  if (filters.branchId && filters.branchId !== 'ALL') {
    where.student = { ...where.student, branchId: filters.branchId };
  }

  if (filters.batch && filters.batch !== 'ALL') {
    where.student = { ...where.student, batch: filters.batch };
  }

  // Load semester results matching filters
  const [results, branches, semesters, academicYears, totalStudentsCount] = await Promise.all([
    prisma.semesterResult.findMany({
      where,
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
        { semester: { number: 'asc' } },
        { student: { enrollmentNumber: 'asc' } },
      ],
    }),
    prisma.branch.findMany({ where: { active: true } }),
    prisma.semester.findMany({ orderBy: { number: 'asc' } }),
    prisma.academicYear.findMany({ orderBy: { startYear: 'desc' } }),
    prisma.student.count({
      where: {
        active: true,
        ...(filters.branchId && filters.branchId !== 'ALL' ? { branchId: filters.branchId } : {}),
        ...(filters.batch && filters.batch !== 'ALL' ? { batch: filters.batch } : {}),
      },
    }),
  ]);

  // Aggregate all subject results in scope
  const allSubjectResults = results.flatMap((r) => r.subjectResults);

  // Compute metrics using pure calculation engine
  const kpis = calculateDashboardKPIs(results as any, totalStudentsCount);
  const gradeDistribution = calculateGradeDistribution(allSubjectResults);
  const spiDistribution = calculateScoreDistribution(results.map((r) => r.spi));
  const cpiDistribution = calculateScoreDistribution(results.map((r) => r.cpi));
  const cgpaDistribution = calculateScoreDistribution(results.map((r) => r.cgpa));
  const backlogDistribution = calculateBacklogDistribution(results);
  const semesterTrends = calculateSemesterTrends(results as any);
  const branchComparison = calculateBranchComparison(results as any, branches);
  const subjectPerformance = calculateSubjectPerformance(results as any);
  const studentRankings = calculateStudentRankings(results as any, 'SPI');

  return {
    kpis,
    gradeDistribution,
    spiDistribution,
    cpiDistribution,
    cgpaDistribution,
    backlogDistribution,
    semesterTrends,
    branchComparison,
    subjectPerformance,
    studentRankings,
    totalResults: results.length,
    branches,
    semesters,
    academicYears,
  };
}
