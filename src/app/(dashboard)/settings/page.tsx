export const dynamic = "force-dynamic";

import { requireAdmin } from "@/lib/auth/rbac";
import { getSystemConfigsAction, getAuditLogsAction } from "@/server/actions/config";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SettingsClient } from "@/components/settings/settings-client";

export default async function SettingsPage() {
  const user = await requireAdmin();
  const [configs, auditLogs] = await Promise.all([
    getSystemConfigsAction(),
    getAuditLogsAction(100),
  ]);

  return (
    <DashboardShell user={user}>
      <SettingsClient initialConfigs={configs} initialAuditLogs={auditLogs} />
    </DashboardShell>
  );
}
