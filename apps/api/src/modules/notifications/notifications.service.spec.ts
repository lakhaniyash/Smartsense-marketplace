import { NotFoundException } from '@nestjs/common'
import { NotificationStatus, NotificationType, UserStatus } from '@prisma/client'
import { type AuthenticatedUser } from '../auth/types/auth-context.type'
import { NotificationsService } from './notifications.service'

function user(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    id: 'user-1',
    keycloakSubjectId: 'kc-1',
    email: 'yash.lakhani+test@smartsensesolutions.com',
    fullName: 'Test User',
    status: UserStatus.ACTIVE,
    roles: [],
    permissions: [],
    partnerId: null,
    customerId: null,
    ...overrides,
  }
}

function notificationFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'notification-1',
    recipientId: 'user-1',
    type: NotificationType.ORDER_CREATED,
    title: 'New order received',
    body: 'Order ORD-1 was placed for 100.',
    entityType: 'Order',
    entityId: 'order-1',
    status: NotificationStatus.UNREAD,
    readAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  }
}

describe('NotificationsService', () => {
  let service: NotificationsService
  let prisma: {
    notification: {
      findMany: jest.Mock
      findUnique: jest.Mock
      update: jest.Mock
      updateMany: jest.Mock
      count: jest.Mock
      createMany: jest.Mock
    }
    user: { findMany: jest.Mock }
  }

  beforeEach(() => {
    prisma = {
      notification: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(),
        createMany: jest.fn(),
      },
      user: { findMany: jest.fn() },
    }
    service = new NotificationsService(prisma as never)
  })

  describe('findNotifications', () => {
    it("always scopes to the caller's own recipientId", async () => {
      prisma.notification.findMany.mockResolvedValueOnce([])

      await service.findNotifications(user({ id: 'user-9' }), {})

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { recipientId: 'user-9' },
        }),
      )
    })

    it('adds the status filter when provided', async () => {
      prisma.notification.findMany.mockResolvedValueOnce([])

      await service.findNotifications(user(), { filter: { status: NotificationStatus.UNREAD } })

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { recipientId: 'user-1', status: NotificationStatus.UNREAD },
        }),
      )
    })

    it('reports hasNextPage when more rows exist than the page size', async () => {
      prisma.notification.findMany.mockResolvedValueOnce([
        notificationFixture({ id: 'n-1' }),
        notificationFixture({ id: 'n-2' }),
      ])

      const result = await service.findNotifications(user(), { first: 1 })

      expect(result.edges).toHaveLength(1)
      expect(result.pageInfo.hasNextPage).toBe(true)
    })
  })

  describe('unreadCount', () => {
    it('counts only UNREAD notifications for the caller', async () => {
      prisma.notification.count.mockResolvedValueOnce(3)

      const result = await service.unreadCount(user({ id: 'user-9' }))

      expect(prisma.notification.count).toHaveBeenCalledWith({
        where: { recipientId: 'user-9', status: NotificationStatus.UNREAD },
      })
      expect(result).toBe(3)
    })
  })

  describe('markAsRead', () => {
    it('throws NOT_FOUND when the notification does not exist', async () => {
      prisma.notification.findUnique.mockResolvedValueOnce(null)

      await expect(service.markAsRead(user(), 'notification-1')).rejects.toThrow(NotFoundException)
      expect(prisma.notification.update).not.toHaveBeenCalled()
    })

    it("throws NOT_FOUND (not FORBIDDEN) for another recipient's notification", async () => {
      prisma.notification.findUnique.mockResolvedValueOnce(
        notificationFixture({ recipientId: 'other-user' }),
      )

      await expect(service.markAsRead(user(), 'notification-1')).rejects.toThrow(NotFoundException)
      expect(prisma.notification.update).not.toHaveBeenCalled()
    })

    it('marks an UNREAD notification READ and sets readAt', async () => {
      prisma.notification.findUnique.mockResolvedValueOnce(notificationFixture())
      prisma.notification.update.mockResolvedValueOnce(
        notificationFixture({ status: NotificationStatus.READ, readAt: new Date() }),
      )

      const result = await service.markAsRead(user(), 'notification-1')

      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notification-1' },
        data: { status: NotificationStatus.READ, readAt: expect.any(Date) as unknown },
      })
      expect(result.status).toBe(NotificationStatus.READ)
    })

    it('is an idempotent no-op for an already-READ notification', async () => {
      prisma.notification.findUnique.mockResolvedValueOnce(
        notificationFixture({ status: NotificationStatus.READ, readAt: new Date('2026-01-01') }),
      )

      await service.markAsRead(user(), 'notification-1')

      expect(prisma.notification.update).not.toHaveBeenCalled()
    })
  })

  describe('markAllAsRead', () => {
    it('runs a single atomic updateMany scoped to the caller and returns its count', async () => {
      prisma.notification.updateMany.mockResolvedValueOnce({ count: 4 })

      const result = await service.markAllAsRead(user({ id: 'user-9' }))

      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { recipientId: 'user-9', status: NotificationStatus.UNREAD },
        data: { status: NotificationStatus.READ, readAt: expect.any(Date) as unknown },
      })
      expect(result).toBe(4)
    })
  })

  describe('notifyPartnerUsers / notifyCustomerUsers (fan-out)', () => {
    it('creates one Notification per ACTIVE, non-deleted recipient scoped to the Partner', async () => {
      prisma.user.findMany.mockResolvedValueOnce([{ id: 'staff-1' }, { id: 'staff-2' }])

      await service.notifyPartnerUsers('partner-1', {
        type: NotificationType.ORDER_CREATED,
        title: 'New order received',
        body: 'Order ORD-1 was placed for 100.',
        entityType: 'Order',
        entityId: 'order-1',
      })

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { partnerId: 'partner-1', status: UserStatus.ACTIVE, deletedAt: null },
        select: { id: true },
      })
      expect(prisma.notification.createMany).toHaveBeenCalledWith({
        data: [
          {
            recipientId: 'staff-1',
            type: NotificationType.ORDER_CREATED,
            title: 'New order received',
            body: 'Order ORD-1 was placed for 100.',
            entityType: 'Order',
            entityId: 'order-1',
          },
          {
            recipientId: 'staff-2',
            type: NotificationType.ORDER_CREATED,
            title: 'New order received',
            body: 'Order ORD-1 was placed for 100.',
            entityType: 'Order',
            entityId: 'order-1',
          },
        ],
      })
    })

    it('scopes to the Customer organization for notifyCustomerUsers', async () => {
      prisma.user.findMany.mockResolvedValueOnce([{ id: 'buyer-1' }])

      await service.notifyCustomerUsers('customer-1', {
        type: NotificationType.ORDER_CONFIRMED,
        title: 'Order confirmed',
        body: 'Your order ORD-1 was confirmed.',
      })

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { customerId: 'customer-1', status: UserStatus.ACTIVE, deletedAt: null },
        select: { id: true },
      })
      expect(prisma.notification.createMany).toHaveBeenCalledWith({
        data: [
          {
            recipientId: 'buyer-1',
            type: NotificationType.ORDER_CONFIRMED,
            title: 'Order confirmed',
            body: 'Your order ORD-1 was confirmed.',
            entityType: null,
            entityId: null,
          },
        ],
      })
    })

    it('does not call createMany when there are zero matching recipients', async () => {
      prisma.user.findMany.mockResolvedValueOnce([])

      await service.notifyPartnerUsers('partner-1', {
        type: NotificationType.ORDER_CREATED,
        title: 'New order received',
        body: 'Order ORD-1 was placed for 100.',
      })

      expect(prisma.notification.createMany).not.toHaveBeenCalled()
    })
  })
})
