export const dynamic = "force-dynamic";

import { requireAuth } from "@/lib/auth/rbac";
import { getImportHistoryAction } from "@/server/actions/imports";
import { getBranchesAction } from "@/server/actions/branches";
import { getSubjectsAction } from "@/server/actions/subjects";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ImportsClient } from "@/components/imports/imports-client";

export default async function ImportsPage() {
  const user = await requireAuth();
  const [history, branches, subjects] = await Promise.all([
    getImportHistoryAction(),
    getBranchesAction(true),
    getSubjectsAction({ includeInactive: true }),
  ]);

  return (
    <DashboardShell user={user}>
      <ImportsClient
        initialHistory={history}
        branches={branches}
        subjects={subjects}
        userRole={user.role}
      />
    </DashboardShell>
  );
}
