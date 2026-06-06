import { PrismaClient } from '@prisma/client'
import { Role } from '../types/role'

const prisma = new PrismaClient()

export async function notifyUsers(userIds: string[], message: string, io?: any) {
  if (!userIds.length) return []
  const created = await prisma.notification.createMany({
    data: userIds.map(userId => ({ userId, message }))
  })
  if (io) {
    for (const userId of userIds) {
      io.emit('notification:new', { userId, message })
    }
  }
  return created
}

export async function notifyRoles(roles: Role[], message: string, io?: any) {
  const users = await prisma.user.findMany({ where: { role: { in: roles } }, select: { id: true } })
  return notifyUsers(users.map(user => user.id), message, io)
}

export async function markNotificationRead(notificationId: string, userId: string, io?: any) {
  const notification = await prisma.notification.findUnique({ where: { id: notificationId } })
  if (!notification || notification.userId !== userId) {
    return null
  }
  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true }
  })
  if (io) {
    io.emit('notification:read', { userId, notificationId })
  }
  return updated
}
