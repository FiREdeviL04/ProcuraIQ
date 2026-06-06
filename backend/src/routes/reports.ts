import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth'
import {
  getDashboardSummary,
  getVendorPerformance,
  getProcurementStats,
  getSpendingTrends,
  getTopVendors,
} from '../services/reportService'

const router = Router()

router.get('/dashboard', requireAuth, requireRole(['ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER']), async (_req, res) => {
  const summary = await getDashboardSummary()
  res.json(summary)
})

router.get('/vendor-performance', requireAuth, requireRole(['ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER']), async (_req, res) => {
  const data = await getVendorPerformance()
  res.json(data)
})

router.get('/procurement-stats', requireAuth, requireRole(['ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER']), async (_req, res) => {
  const data = await getProcurementStats()
  res.json(data)
})

router.get('/spending-trends', requireAuth, requireRole(['ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER']), async (_req, res) => {
  const data = await getSpendingTrends()
  res.json(data)
})

router.get('/top-vendors', requireAuth, requireRole(['ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER']), async (_req, res) => {
  const data = await getTopVendors()
  res.json(data)
})

export default router
