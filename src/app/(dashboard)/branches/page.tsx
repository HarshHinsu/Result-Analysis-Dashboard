export const dynamic = "force-dynamic";

import { requireAuth } from "@/lib/auth/rbac";
import { getBranchesAction } from "@/server/actions/branches";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { BranchesClient } from "@/components/branches/branches-client";

export default async function BranchesPage() {
  const user = await requireAuth();
  const branches = await getBranchesAction(true);

  return (
    <DashboardShell user={user}>
      <BranchesClient initialBranches={branches} userRole={user.role} />
    </DashboardShell>
  );
}
