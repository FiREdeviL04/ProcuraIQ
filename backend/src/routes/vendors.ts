import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth, requireRole } from '../middleware/auth'
import { createActivity } from '../utils/activity'

const prisma = new PrismaClient()
const router = Router()

router.get('/', requireAuth, async (req: any, res) => {
  const q = (req.query.q as string) || undefined
  const where = q ? { OR: [{ vendorName: { contains: q } }, { gstNumber: { contains: q } }, { category: { contains: q } }] } : {}
  const vendors = await prisma.vendor.findMany({ where })
  res.json(vendors)
})

router.post('/', requireAuth, requireRole(['ADMIN','PROCUREMENT_OFFICER']), async (req, res) => {
  const data = req.body
  const v = await prisma.vendor.create({ data })
  await createActivity(req.user?.id || 'system', 'Create Vendor', 'Vendor', v.id)
  res.json(v)
})

router.put('/:id', requireAuth, requireRole(['ADMIN','PROCUREMENT_OFFICER']), async (req, res) => {
  const { id } = req.params
  const v = await prisma.vendor.update({ where: { id }, data: req.body })
  await createActivity(req.user?.id || 'system', 'Update Vendor', 'Vendor', id)
  res.json(v)
})

router.delete('/:id', requireAuth, requireRole(['ADMIN']), async (req, res) => {
  const { id } = req.params
  await prisma.vendor.delete({ where: { id } })
  await createActivity(req.user?.id || 'system', 'Delete Vendor', 'Vendor', id)
  res.json({ ok: true })
})

export default router
