import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function createActivity(userId: string, action: string, entityType: string, entityId: string) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (user) {
      await prisma.activityLog.create({ data: { userId, action, entityType, entityId } })
    } else {
      console.warn(`Skipping activity log: User ${userId} does not exist`)
    }
  } catch (err) {
    console.error('Failed to create activity log', err)
  }
}
