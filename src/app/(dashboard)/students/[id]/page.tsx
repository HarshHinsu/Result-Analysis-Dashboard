export const dynamic = "force-dynamic";

import { requireAuth } from "@/lib/auth/rbac";
import { getStudentByIdAction } from "@/server/actions/students";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StudentProfileClient } from "@/components/students/student-profile";

export default async function StudentProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireAuth();
  const student = await getStudentByIdAction(params.id);

  if (!student) {
    notFound();
  }

  return (
    <DashboardShell user={user}>
      <StudentProfileClient student={student} userRole={user.role} />
    </DashboardShell>
  );
}
