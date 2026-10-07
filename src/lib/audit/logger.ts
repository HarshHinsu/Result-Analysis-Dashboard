import prisma from '@/lib/db/prisma';

export interface AuditLogParams {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: any;
  ipAddress?: string | null;
}

export async function logAuditEvent({
  userId,
  action,
  entity,
  entityId,
  details,
  ipAddress,
}: AuditLogParams): Promise<void> {
  try {
    const detailsStr = details
      ? typeof details === 'string'
        ? details
        : JSON.stringify(details)
      : null;

    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        entity,
        entityId: entityId || null,
        details: detailsStr,
        ipAddress: ipAddress || null,
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}
