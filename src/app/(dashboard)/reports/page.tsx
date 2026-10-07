export const dynamic = "force-dynamic";

import { requireAuth } from "@/lib/auth/rbac";
import { getBranchesAction } from "@/server/actions/branches";
import { getAnalyticsDataAction } from "@/server/actions/analytics";
import prisma from "@/lib/db/prisma";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ReportsClient } from "@/components/reports/reports-client";

export default async function ReportsPage() {
  const user = await requireAuth();
  const [branches, semesters, academicYears, students, analyticsData] = await Promise.all([
    getBranchesAction(false),
    prisma.semester.findMany({ orderBy: { number: "asc" } }),
    prisma.academicYear.findMany({ orderBy: { startYear: "desc" } }),
    prisma.student.findMany({
      where: { active: true },
      include: {
        branch: true,
        semesterResults: {
          include: {
            semester: true,
            academicYear: true,
            subjectResults: {
              include: { subject: true },
            },
          },
        },
      },
      orderBy: { enrollmentNumber: "asc" },
    }),
    getAnalyticsDataAction(),
  ]);

  return (
    <DashboardShell user={user}>
      <ReportsClient
        branches={branches}
        semesters={semesters}
        academicYears={academicYears}
        students={students}
        analyticsData={analyticsData}
        userRole={user.role}
      />
    </DashboardShell>
  );
}
