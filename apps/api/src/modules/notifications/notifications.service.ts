import { Injectable, NotFoundException } from '@nestjs/common'
import { type Notification, NotificationStatus, Prisma, UserStatus } from '@prisma/client'
import { type AuthenticatedUser } from '../auth/types/auth-context.type'
import { PrismaService } from '../../prisma/prisma.service'
import { decodeCursor, encodeCursor } from '../../common/utils/cursor.util'
import {
  NotificationConnectionOutput,
  NotificationEdgeOutput,
} from './dto/notification-connection.output'
import { NotificationFilterInput } from './dto/notification-filter.input'
import { NotificationOutput } from './dto/notification.output'

const DEFAULT_PAGE_SIZE = 20

export interface FindNotificationsArgs {
  first?: number | undefined
  after?: string | undefined
  filter?: NotificationFilterInput | undefined
}

/** Input for a single fan-out call — one row is created per resolved recipient. */
export interface FanOutInput {
  type: Notification['type']
  title: string
  body: string
  entityType?: string
  entityId?: string
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Always scoped to the caller's own id — a Notification is individually
   * owned, never org-shared (unlike Invoice's Admin/Partner-wide scoping),
   * so there is no Admin "see everyone's" branch here.
   */
  async findNotifications(
    user: AuthenticatedUser,
    args: FindNotificationsArgs,
  ): Promise<NotificationConnectionOutput> {
    const after = args.after ?? undefined
    const first = args.first ?? DEFAULT_PAGE_SIZE
    const status = args.filter?.status ?? undefined

    const where: Prisma.NotificationWhereInput = {
      recipientId: user.id,
      ...(status !== undefined && { status }),
    }

    const rows = await this.prisma.notification.findMany({
      where,
      // Most-recent-first is the only order this feed needs; `id` breaks
      // ties so cursor pagination has a fully-determined total order (same
      // reasoning as BillingService.buildOrderBy).
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      take: first + 1,
      ...(after !== undefined && {
        cursor: { id: decodeCursor(after) },
        skip: 1,
      }),
    })

    const hasNextPage = rows.length > first
    const page = hasNextPage ? rows.slice(0, first) : rows

    const edges: NotificationEdgeOutput[] = page.map((notification) => ({
      cursor: encodeCursor(notification.id),
      node: this.mapToOutput(notification),
    }))

    return {
      edges,
      pageInfo: {
        hasNextPage,
        hasPreviousPage: after !== undefined,
        startCursor: edges[0]?.cursor ?? null,
        endCursor: edges[edges.length - 1]?.cursor ?? null,
      },
    }
  }

  async unreadCount(user: AuthenticatedUser): Promise<number> {
    return this.prisma.notification.count({
      where: { recipientId: user.id, status: NotificationStatus.UNREAD },
    })
  }

  /**
   * Ownership miss reads as NOT_FOUND, never FORBIDDEN (docs/authorization.md
   * § Ownership Rules) — same convention as BillingService.findInvoiceById.
   * Already-READ is an idempotent no-op: a duplicate mark-as-read must never
   * re-write readAt to a later timestamp.
   */
  async markAsRead(user: AuthenticatedUser, id: string): Promise<NotificationOutput> {
    const notification = await this.prisma.notification.findUnique({ where: { id } })
    if (notification === null || notification.recipientId !== user.id) {
      throw new NotFoundException('Notification not found')
    }

    if (notification.status === NotificationStatus.READ) {
      return this.mapToOutput(notification)
    }

    const updated = await this.prisma.notification.update({
      where: { id },
      data: { status: NotificationStatus.READ, readAt: new Date() },
    })
    return this.mapToOutput(updated)
  }

  /**
   * A single atomic `UPDATE ... WHERE status = 'UNREAD'` — two concurrent
   * calls can't double-apply or lose an update; the loser's WHERE simply
   * matches nothing already-updated and returns count: 0. No $transaction
   * or row lock needed.
   */
  async markAllAsRead(user: AuthenticatedUser): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: { recipientId: user.id, status: NotificationStatus.UNREAD },
      data: { status: NotificationStatus.READ, readAt: new Date() },
    })
    return result.count
  }

  /**
   * Called only by NotificationEventsListener — never exposed via GraphQL.
   * Orders/Billing event payloads identify an organization (partnerId), not
   * a User row, so this fans a single event out to every ACTIVE,
   * non-deleted User belonging to that Partner — each staff member gets
   * their own row and independent read state.
   */
  async notifyPartnerUsers(partnerId: string, input: FanOutInput): Promise<void> {
    await this.fanOut({ partnerId }, input)
  }

  /** Same fan-out, scoped to a Customer organization's Users instead. */
  async notifyCustomerUsers(customerId: string, input: FanOutInput): Promise<void> {
    await this.fanOut({ customerId }, input)
  }

  /**
   * Notifies exactly one User by id, regardless of their current `status`
   * (Sprint 3, SM-335) — unlike `fanOut`, which only ever targets `ACTIVE`
   * Users of an organization. A suspended User is precisely the case
   * `fanOut`'s status filter would otherwise exclude, and the whole point
   * here is notifying that User about their own status change (they'll see
   * it once reactivated, or immediately if this event was a reactivation).
   */
  async notifyUser(userId: string, input: FanOutInput): Promise<void> {
    await this.prisma.notification.create({
      data: {
        recipientId: userId,
        type: input.type,
        title: input.title,
        body: input.body,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
      },
    })
  }

  private async fanOut(scope: Prisma.UserWhereInput, input: FanOutInput): Promise<void> {
    const recipients = await this.prisma.user.findMany({
      where: { ...scope, status: UserStatus.ACTIVE, deletedAt: null },
      select: { id: true },
    })
    if (recipients.length === 0) return

    await this.prisma.notification.createMany({
      data: recipients.map((recipient) => ({
        recipientId: recipient.id,
        type: input.type,
        title: input.title,
        body: input.body,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
      })),
    })
  }

  mapToOutput(notification: Notification): NotificationOutput {
    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      entityType: notification.entityType,
      entityId: notification.entityId,
      status: notification.status,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    }
  }
}
