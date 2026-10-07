export const dynamic = "force-dynamic";

import { requireAuth } from "@/lib/auth/rbac";
import { getAnalyticsDataAction } from "@/server/actions/analytics";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: {
    academicYearId?: string;
    semesterId?: string;
    branchId?: string;
    batch?: string;
  };
}) {
  const user = await requireAuth();
  const analyticsData = await getAnalyticsDataAction({
    academicYearId: searchParams.academicYearId,
    semesterId: searchParams.semesterId,
    branchId: searchParams.branchId,
    batch: searchParams.batch,
  });

  return (
    <DashboardShell user={user}>
      <DashboardClient
        initialData={analyticsData}
        userRole={user.role}
        userName={user.name}
      />
    </DashboardShell>
  );
}
