export const dynamic = "force-dynamic";

import { requireAuth } from "@/lib/auth/rbac";
import { getStudentsAction } from "@/server/actions/students";
import { getBranchesAction } from "@/server/actions/branches";
import prisma from "@/lib/db/prisma";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StudentsClient } from "@/components/students/students-client";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: {
    page?: string;
    search?: string;
    branchId?: string;
    batch?: string;
    status?: string;
    semesterId?: string;
  };
}) {
  const user = await requireAuth();

  const page = parseInt(searchParams.page || "1", 10);
  const [data, branches, semesters, batchesRaw] = await Promise.all([
    getStudentsAction({
      page,
      limit: 15,
      search: searchParams.search,
      branchId: searchParams.branchId,
      batch: searchParams.batch,
      status: searchParams.status,
      semesterId: searchParams.semesterId,
    }),
    getBranchesAction(false),
    prisma.semester.findMany({ orderBy: { number: "asc" } }),
    prisma.student.findMany({
      select: { batch: true },
      distinct: ["batch"],
      where: { batch: { not: null } },
    }),
  ]);

  const batches = batchesRaw
    .map((b) => b.batch)
    .filter((b): b is string => Boolean(b));

  return (
    <DashboardShell user={user}>
      <StudentsClient
        initialData={data}
        branches={branches}
        semesters={semesters}
        batches={batches}
        userRole={user.role}
      />
    </DashboardShell>
  );
}
