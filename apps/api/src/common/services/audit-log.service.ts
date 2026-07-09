import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'

export interface RecordAuditLogInput {
  actorUserId: string
  action: string
  entityType: string
  entityId: string
  metadata?: Prisma.InputJsonValue
}

/**
 * Writes an `AuditLog` row — append-only, per docs/database-schema.md.
 * Takes the caller's own `tx`, never opens one itself (same
 * caller-owns-the-transaction contract as InventoryService.reserve/release,
 * docs/api-conventions.md § Transactions): the audit record must commit or
 * roll back atomically with the privileged mutation it's recording, not as
 * an afterthought that could succeed while the mutation fails or vice versa.
 */
@Injectable()
export class AuditLogService {
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
}
