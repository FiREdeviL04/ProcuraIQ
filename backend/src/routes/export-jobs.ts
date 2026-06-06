import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth, requireRole } from '../middleware/auth'
import { createActivity } from '../utils/activity'
import { getExportQueue } from '../utils/queue'

const prisma = new PrismaClient()
const router = Router()

// create export job
router.post('/', requireAuth, requireRole(['ADMIN','MANAGER','PROCUREMENT_OFFICER']), async (req: any, res) => {
  const { type = 'CSV', filters = {} } = req.body
  const job = await prisma.exportJob.create({ data: { userId: req.user.id, type, filters: JSON.stringify(filters) } })
  await createActivity(req.user.id, 'Create Export Job', 'ExportJob', job.id)
  // enqueue job in Redis queue for worker
  try {
    const queue = getExportQueue()
    if (queue) {
      await queue.add('export', { jobId: job.id })
    }
  } catch (err) {
    console.error('Failed to enqueue export job', err)
  }
  res.json({ ...job, filters })
})

// list jobs
router.get('/', requireAuth, requireRole(['ADMIN','MANAGER']), async (req: any, res) => {
  const jobs = await prisma.exportJob.findMany({ orderBy: { createdAt: 'desc' } })
  const mappedJobs = jobs.map(j => ({ ...j, filters: j.filters ? JSON.parse(j.filters) : {} }))
  res.json(mappedJobs)
})

// get presigned download link
router.get('/:id/download', requireAuth, async (req: any, res) => {
  const { id } = req.params
  const job = await prisma.exportJob.findUnique({ where: { id } })
  if (!job) return res.status(404).json({ error: 'Not found' })
  // only owner or admin
  if (req.user.role !== 'ADMIN' && req.user.id !== job.userId) return res.status(403).json({ error: 'Forbidden' })
  if (!job.s3Key) return res.status(400).json({ error: 'Not available yet' })
  const { getPresignedUrl } = await import('../utils/s3')
  const url = await getPresignedUrl(job.s3Key)
  res.json({ url })
})

export default router
