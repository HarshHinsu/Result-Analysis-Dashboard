export const dynamic = "force-dynamic";

import { requireAdmin } from "@/lib/auth/rbac";
import { getFacultyListAction } from "@/server/actions/faculty";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { FacultyClient } from "@/components/faculty/faculty-client";

export default async function FacultyPage() {
  const user = await requireAdmin();
  const facultyList = await getFacultyListAction();

  return (
    <DashboardShell user={user}>
      <FacultyClient initialFaculty={facultyList} currentAdminId={user.id} />
    </DashboardShell>
  );
}
