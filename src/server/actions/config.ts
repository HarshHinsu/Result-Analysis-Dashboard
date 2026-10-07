'use server';

import prisma from '@/lib/db/prisma';
import { requireAdmin, requireAuth } from '@/lib/auth/rbac';
import { logAuditEvent } from '@/lib/audit/logger';
import { revalidatePath } from 'next/cache';

export async function getSystemConfigsAction() {
  await requireAuth();
  const configs = await prisma.calculationConfig.findMany();
  const configMap: Record<string, any> = {};

  configs.forEach((c) => {
    try {
      configMap[c.key] = JSON.parse(c.value);
    } catch {
      configMap[c.key] = c.value;
    }
  });

  return configMap;
}

export async function updateSystemConfigAction(key: string, value: any, description?: string) {
  const admin = await requireAdmin();
  const valueStr = typeof value === 'string' ? value : JSON.stringify(value);

  const config = await prisma.calculationConfig.upsert({
    where: { key },
    update: {
      value: valueStr,
      description: description || undefined,
    },
    create: {
      key,
      value: valueStr,
      description: description || null,
    },
  });

  await logAuditEvent({
    userId: admin.id,
    action: 'UPDATE_SYSTEM_CONFIG',
    entity: 'CalculationConfig',
    entityId: config.id,
    details: { key },
  });

  revalidatePath('/settings');
  return { success: true, config };
}

export async function getAuditLogsAction(limit = 100) {
  await requireAdmin();
  return prisma.auditLog.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          role: true,
        },
      },
    },
  });
}
