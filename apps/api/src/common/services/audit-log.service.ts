import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'

export interface RecordAuditLogInput {
  actorUserId: string
  action: string
  entityType: string
  entityId: string
  metadata?: Prisma.InputJsonValue
}

const AUDIT_LOG_WITH_ACTOR = {
  actor: { select: { id: true, fullName: true, email: true } },
} satisfies Prisma.AuditLogInclude

export type AuditLogWithActor = Prisma.AuditLogGetPayload<{ include: typeof AUDIT_LOG_WITH_ACTOR }>

/**
 * Writes/reads `AuditLog` rows — append-only, per docs/database-schema.md.
 * `record` takes the caller's own `tx`, never opens one itself (same
 * caller-owns-the-transaction contract as InventoryService.reserve/release,
 * docs/api-conventions.md § Transactions): the audit record must commit or
 * roll back atomically with the privileged mutation it's recording, not as
 * an afterthought that could succeed while the mutation fails or vice versa.
 */
@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async record(tx: Prisma.TransactionClient, input: RecordAuditLogInput): Promise<void> {
    await tx.auditLog.create({
      data: {
        actorUserId: input.actorUserId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        ...(input.metadata !== undefined && { metadata: input.metadata }),
      },
    })
  }

  /**
   * Read path — the Customer activity timeline (Sprint 2) is the first
   * consumer. Oldest-last (most recent activity first), matching how a
   * timeline is read.
   */
  findForEntity(entityType: string, entityId: string): Promise<AuditLogWithActor[]> {
    return this.prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { occurredAt: 'desc' },
      include: AUDIT_LOG_WITH_ACTOR,
    })
  }
}
