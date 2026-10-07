export const dynamic = "force-dynamic";

import { requireAuth } from "@/lib/auth/rbac";
import { getSemesterResultsAction } from "@/server/actions/results";
import { getBranchesAction } from "@/server/actions/branches";
import prisma from "@/lib/db/prisma";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ResultsClient } from "@/components/results/results-client";

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: {
    page?: string;
    search?: string;
    branchId?: string;
    semesterId?: string;
    academicYearId?: string;
    studentId?: string;
  };
}) {
  const user = await requireAuth();

  const page = parseInt(searchParams.page || "1", 10);
  const [resultsData, branches, semesters, academicYears, students] = await Promise.all([
    getSemesterResultsAction({
      page,
      limit: 20,
      search: searchParams.search,
      branchId: searchParams.branchId,
      semesterId: searchParams.semesterId,
      academicYearId: searchParams.academicYearId,
      studentId: searchParams.studentId,
    }),
    getBranchesAction(false),
    prisma.semester.findMany({ orderBy: { number: "asc" } }),
    prisma.academicYear.findMany({ orderBy: { startYear: "desc" } }),
    prisma.student.findMany({
      where: { active: true },
      select: { id: true, enrollmentNumber: true, fullName: true, branchId: true, seatNumber: true },
      orderBy: { enrollmentNumber: "asc" },
    }),
  ]);

  return (
    <DashboardShell user={user}>
      <ResultsClient
        initialData={resultsData}
        branches={branches}
        semesters={semesters}
        academicYears={academicYears}
        students={students}
        userRole={user.role}
        preselectedStudentId={searchParams.studentId}
      />
    </DashboardShell>
  );
}
