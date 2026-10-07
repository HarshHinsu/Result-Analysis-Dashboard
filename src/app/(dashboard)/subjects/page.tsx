export const dynamic = "force-dynamic";

import { requireAuth } from "@/lib/auth/rbac";
import { getSubjectsAction } from "@/server/actions/subjects";
import { getBranchesAction } from "@/server/actions/branches";
import prisma from "@/lib/db/prisma";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SubjectsClient } from "@/components/subjects/subjects-client";

export default async function SubjectsPage() {
  const user = await requireAuth();
  const [subjects, branches, semesters] = await Promise.all([
    getSubjectsAction({ includeInactive: true }),
    getBranchesAction(false),
    prisma.semester.findMany({ orderBy: { number: 'asc' } }),
  ]);

  return (
    <DashboardShell user={user}>
      <SubjectsClient
        initialSubjects={subjects}
        branches={branches}
        semesters={semesters}
        userRole={user.role}
      />
    </DashboardShell>
  );
}
