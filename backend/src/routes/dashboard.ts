import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { getOptimizedDashboard } from '../services/reportService'

const router = Router()

router.get('/', requireAuth, async (req: any, res) => {
  const data = await getOptimizedDashboard(req.user.id, req.user.role)
  res.json(data)
})

export default router
