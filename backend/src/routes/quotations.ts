import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth, requireRole } from '../middleware/auth'
import { createQuotationSchema } from '../validation/quotation'
import { createActivity } from '../utils/activity'
import { recommendVendor } from '../services/recommendationService'
import { notifyRoles, notifyUsers } from '../services/notificationService'

const prisma = new PrismaClient()
const router = Router()

router.post('/', requireAuth, requireRole(['VENDOR']), async (req: any, res) => {
  try {
    const parsed = createQuotationSchema.parse(req.body)

    // check RFQ exists and is open
    const rfq = await prisma.rFQ.findUnique({ where: { id: parsed.rfqId } })
    if (!rfq) return res.status(404).json({ error: 'RFQ not found' })
    if (new Date(rfq.deadline) < new Date()) return res.status(400).json({ error: 'RFQ deadline passed' })

    // ensure vendor is assigned (best-effort)
    const assigned = await prisma.rFQVendors.findFirst({ where: { rfqId: parsed.rfqId, vendorId: req.user.id } })

    // allow submission even if not explicitly assigned, but log warning
    if (!assigned) console.warn('Vendor submitting quotation was not assigned to RFQ')

    const vendorIdToUse = parsed.vendorId ?? req.user.id
    const quotation = await prisma.quotation.create({ data: {
      rfqId: parsed.rfqId,
      vendorId: vendorIdToUse,
      price: parsed.price,
      gst: parsed.gst,
      deliveryDays: parsed.deliveryDays,
      notes: parsed.notes,
      status: 'SUBMITTED'
    }})

    // emit event
    const io = req.app.get('io')
    io?.emit('quotation_submitted', { quotationId: quotation.id, rfqId: parsed.rfqId })

    await createActivity(req.user.id, 'Submit Quotation', 'Quotation', quotation.id)
    await notifyRoles(['ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER'], `Quotation submitted for RFQ ${parsed.rfqId}`, io)
    const rfqOwner = await prisma.rFQ.findUnique({ where: { id: parsed.rfqId }, select: { createdBy: true } })
    if (rfqOwner?.createdBy) {
      await notifyUsers([rfqOwner.createdBy], `Quotation submitted for RFQ ${parsed.rfqId}`, io)
    }

    res.json(quotation)
  } catch (err: any) {
    console.error(err)
    res.status(400).json({ error: err?.message || 'Invalid input' })
  }
})

router.get('/', requireAuth, async (req: any, res) => {
  const { rfqId } = req.query
  const where: any = {}
  if (rfqId) where.rfqId = rfqId as string
  const quotations = await prisma.quotation.findMany({ where, include: { vendor: true, rfq: true } })
  res.json(quotations)
})

router.get('/:rfqId/recommendation', requireAuth, requireRole(['ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER']), async (req: any, res) => {
  const { rfqId } = req.params
  const quotations = await prisma.quotation.findMany({
    where: { rfqId },
    include: { vendor: true }
  })

  const recommendation = recommendVendor(quotations.map(q => ({
    id: q.id,
    price: q.price,
    gst: q.gst,
    deliveryDays: q.deliveryDays,
    vendor: {
      id: q.vendor.id,
      vendorName: q.vendor.vendorName,
      rating: q.vendor.rating,
    }
  })))

  res.json({
    recommendedVendor: recommendation ? recommendation.vendor : null,
    score: recommendation ? recommendation.score : 0,
    reasons: recommendation ? recommendation.reasons : [],
    quotationId: recommendation ? recommendation.quotationId : null
  })
})

export default router
