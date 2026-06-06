import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth, requireRole } from '../middleware/auth'
import { createApprovalSchema } from '../validation/approval'
import { createActivity } from '../utils/activity'
import { notifyUsers, notifyRoles } from '../services/notificationService'

const prisma = new PrismaClient()
const router = Router()

router.post('/', requireAuth, requireRole(['MANAGER', 'ADMIN']), async (req: any, res) => {
  try {
    const parsed = createApprovalSchema.parse(req.body)
    const approval = await prisma.approval.create({ data: {
      quotationId: parsed.quotationId,
      managerId: req.user.id,
      remarks: parsed.remarks,
      status: parsed.status
    }})

    // update quotation status
    await prisma.quotation.update({ where: { id: parsed.quotationId }, data: { status: parsed.status } })

    // emit event
    const io = req.app.get('io')
    io?.emit('approval_completed', { quotationId: parsed.quotationId, status: parsed.status })

    await createActivity(req.user.id, parsed.status === 'APPROVED' ? 'Approve Quotation' : 'Reject Quotation', 'Approval', approval.id)
    const quotation = await prisma.quotation.findUnique({ where: { id: parsed.quotationId }, include: { rfq: true } })
    if (quotation?.vendorId) {
      await notifyUsers([quotation.vendorId], `Your quotation has been ${parsed.status.toLowerCase()}`, io)
    }
    if (quotation?.rfq?.createdBy) {
      await notifyUsers([quotation.rfq.createdBy], `Approval ${parsed.status.toLowerCase()} for quotation ${parsed.quotationId}`, io)
    }
    await notifyRoles(['ADMIN', 'MANAGER'], `Quotation ${parsed.status.toLowerCase()} for RFQ ${quotation?.rfqId || ''}`, io)

    res.json(approval)
  } catch (err: any) {
    console.error(err)
    res.status(400).json({ error: err?.message || 'Invalid input' })
  }
})

export default router
