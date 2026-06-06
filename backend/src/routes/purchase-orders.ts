import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth, requireRole } from '../middleware/auth'
import { createPurchaseOrderSchema } from '../validation/purchaseOrder'
import { createActivity } from '../utils/activity'
import { notifyUsers, notifyRoles } from '../services/notificationService'

const prisma = new PrismaClient()
const router = Router()

function genPoNumber() {
  const y = new Date().getFullYear()
  const r = Math.floor(1000 + Math.random() * 9000)
  return `PO-${y}-${r}`
}

router.post('/', requireAuth, requireRole(['PROCUREMENT_OFFICER', 'ADMIN']), async (req: any, res) => {
  try {
    const parsed = createPurchaseOrderSchema.parse(req.body)
    const quotation = await prisma.quotation.findUnique({ where: { id: parsed.quotationId } })
    if (!quotation) return res.status(404).json({ error: 'Quotation not found' })

    const amount = quotation.price + (quotation.price * (quotation.gst / 100))
    const poNumber = genPoNumber()

    const po = await prisma.purchaseOrder.create({ data: {
      poNumber,
      quotationId: quotation.id,
      vendorId: quotation.vendorId,
      amount,
      status: 'SENT'
    }})

    // update quotation status
    await prisma.quotation.update({ where: { id: quotation.id }, data: { status: 'PO_GENERATED' } })

    const io = req.app.get('io')
    io?.emit('po_generated', { poId: po.id, poNumber })

    await createActivity(req.user.id, 'Generate PO', 'PurchaseOrder', po.id)
    const quotationWithRfq = await prisma.quotation.findUnique({ where: { id: quotation.id }, include: { rfq: true } })
    if (quotationWithRfq?.vendorId) {
      await notifyUsers([quotationWithRfq.vendorId], `Purchase Order ${po.poNumber} generated`, io)
    }
    if (quotationWithRfq?.rfq?.createdBy) {
      await notifyUsers([quotationWithRfq.rfq.createdBy], `Purchase Order ${po.poNumber} generated`, io)
    }
    await notifyRoles(['ADMIN', 'PROCUREMENT_OFFICER'], `Purchase Order ${po.poNumber} generated`, io)

    res.json(po)
  } catch (err: any) {
    console.error(err)
    res.status(400).json({ error: err?.message || 'Invalid input' })
  }
})

router.get('/', requireAuth, async (req: any, res) => {
  const pos = await prisma.purchaseOrder.findMany({ include: { vendor: true, quotation: true }, orderBy: { createdAt: 'desc' } })
  res.json(pos)
})

export default router
