import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth, requireRole } from '../middleware/auth'
import { createRfqSchema } from '../validation/rfq'
import { createActivity } from '../utils/activity'
import { notifyRoles } from '../services/notificationService'

const prisma = new PrismaClient()
const router = Router()

router.get('/', requireAuth, async (req: any, res) => {
  const { status, q } = req.query
  const where: any = {}
  if (status) where.status = status
  if (q) where.title = { contains: q as string }
  const rfqs = await prisma.rFQ.findMany({ where, orderBy: { createdAt: 'desc' } })
  res.json(rfqs)
})

router.post('/', requireAuth, requireRole(['ADMIN','PROCUREMENT_OFFICER']), async (req: any, res) => {
  try {
    const parsed = createRfqSchema.parse(req.body)
    const rfq = await prisma.rFQ.create({ data: {
      title: parsed.title,
      description: parsed.description,
      quantity: parsed.quantity,
      expectedBudget: parsed.expectedBudget,
      deadline: new Date(parsed.deadline),
      status: 'OPEN',
      createdBy: req.user.id
    }})

    // assign vendors if provided
    if (parsed.vendorIds && parsed.vendorIds.length) {
      const createMany = parsed.vendorIds.map(vId => ({ rfqId: rfq.id, vendorId: vId }))
      await prisma.rFQVendors.createMany({ data: createMany })
    }

    // emit socket event
    const io = req.app.get('io')
    io?.emit('new_rfq', { rfqId: rfq.id, title: rfq.title })

    await createActivity(req.user.id, 'Create RFQ', 'RFQ', rfq.id)
    await notifyRoles(['ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER'], `New RFQ created: ${rfq.title}`, io)

    res.json(rfq)
  } catch (err: any) {
    console.error(err)
    res.status(400).json({ error: err?.message || 'Invalid input' })
  }
})

router.get('/:id', requireAuth, async (req, res) => {
  const { id } = req.params
  const rfq = await prisma.rFQ.findUnique({ where: { id }, include: { RFQVendors: { include: { vendor: true } }, Quotations: { include: { vendor: true } } } })
  if (!rfq) return res.status(404).json({ error: 'Not found' })
  res.json(rfq)
})

export default router
