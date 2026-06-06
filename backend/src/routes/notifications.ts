import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth } from '../middleware/auth'
import { markNotificationRead } from '../services/notificationService'

const prisma = new PrismaClient()
const router = Router()

router.get('/', requireAuth, async (req: any, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50
  })
  res.json(notifications)
})

router.patch('/:id/read', requireAuth, async (req: any, res) => {
  const updated = await markNotificationRead(req.params.id, req.user.id, req.app.get('io'))
  if (!updated) return res.status(404).json({ error: 'Not found' })
  res.json(updated)
})

router.get('/unread-count', requireAuth, async (req: any, res) => {
  const count = await prisma.notification.count({ where: { userId: req.user.id, isRead: false } })
  res.json({ count })
})

export default router
