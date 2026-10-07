export const dynamic = "force-dynamic";

import { requireAuth } from "@/lib/auth/rbac";
import { getAnalyticsDataAction } from "@/server/actions/analytics";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AnalyticsClient } from "@/components/analytics/analytics-client";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: {
    tab?: string;
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
      <AnalyticsClient
        initialData={analyticsData}
        userRole={user.role}
        initialTab={searchParams.tab || "overall"}
      />
    </DashboardShell>
  );
}
