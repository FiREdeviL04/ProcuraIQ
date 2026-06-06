import { PrismaClient } from '@prisma/client'
import { uploadBuffer, getPresignedUrl } from '../utils/s3'
import PDFDocument from 'pdfkit'
import { sendMail } from '../utils/mailer'
import { createActivity } from '../utils/activity'
import { Worker } from 'bullmq'
import { getExportQueue } from '../utils/queue'

const prisma = new PrismaClient()

async function handleJob(job: any) {
  const id = job.data.jobId
  try {
    await prisma.exportJob.update({ where: { id }, data: { status: 'PROCESSING' } })

    const jobRecord = await prisma.exportJob.findUnique({ where: { id } })
    const filters = jobRecord?.filters ? JSON.parse(jobRecord.filters) : {}
    const where: any = {}
    if (filters.userId) where.userId = filters.userId
    if (filters.entityType) where.entityType = filters.entityType
    if (filters.q) where.action = { contains: filters.q }
    if (filters.startDate || filters.endDate) {
      where.createdAt = {}
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate)
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate)
    }

    const logs = await prisma.activityLog.findMany({ where, orderBy: { createdAt: 'desc' } })

    if ((jobRecord?.type || 'CSV') === 'CSV') {
      const header = ['createdAt', 'action', 'entityType', 'entityId', 'userId']
      const lines = [header.join(',')]
      for (const l of logs) {
        const vals = [new Date(l.createdAt).toISOString(), l.action, l.entityType, l.entityId, l.userId]
        lines.push(vals.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      }
      const buffer = Buffer.from(lines.join('\n'))
      const key = `exports/${id}.csv`
      await uploadBuffer(key, buffer, 'text/csv')
      const url = await getPresignedUrl(key)
      await prisma.exportJob.update({ where: { id }, data: { status: 'COMPLETED', filename: `${id}.csv`, s3Key: key, completedAt: new Date() } })
      const user = await prisma.user.findUnique({ where: { id: jobRecord?.userId } })
      if (user?.email) await sendMail(user.email, 'Your export is ready', `Download: ${url}`)
      if (jobRecord) await createActivity(jobRecord.userId, 'Export Completed', 'ExportJob', id)
    } else {
      // PDF export
      const doc = new PDFDocument({ size: 'A4', margin: 40 })
      const chunks: Buffer[] = []
      doc.on('data', c => chunks.push(c))
      doc.on('end', async () => {
        const buffer = Buffer.concat(chunks)
        const key = `exports/${id}.pdf`
        await uploadBuffer(key, buffer, 'application/pdf')
        const url = await getPresignedUrl(key)
        await prisma.exportJob.update({ where: { id }, data: { status: 'COMPLETED', filename: `${id}.pdf`, s3Key: key, completedAt: new Date() } })
        const user = await prisma.user.findUnique({ where: { id: jobRecord?.userId } })
        if (user?.email) await sendMail(user.email, 'Your export is ready', `Download: ${url}`)
        if (jobRecord) await createActivity(jobRecord.userId, 'Export Completed', 'ExportJob', id)
      })

      doc.fontSize(18).text('Activity Logs', { align: 'center' })
      doc.moveDown()
      for (const l of logs) {
        doc.fontSize(10).text(`${new Date(l.createdAt).toLocaleString()} | ${l.action} | ${l.entityType} | ${l.entityId} | ${l.userId}`)
        doc.moveDown(0.2)
      }
      doc.end()
    }
  } catch (err) {
    console.error('Export job failed', err)
    await prisma.exportJob.update({ where: { id }, data: { status: 'FAILED', completedAt: new Date() } })
  }
}

let workerStarted = false
export function startExportWorker(app: any) {
  if (workerStarted) return
  if (!process.env.REDIS_HOST && !process.env.REDIS_URL) {
    console.log('Redis not configured; skipping export worker startup')
    return
  }
  workerStarted = true
  const queue = getExportQueue()
  const connection = process.env.REDIS_URL
    ? { url: process.env.REDIS_URL }
    : { host: process.env.REDIS_HOST!, port: Number(process.env.REDIS_PORT || 6379) }
  const worker = new Worker('exportJobs', async (job) => {
    await handleJob(job)
  }, { connection })

  worker.on('completed', (job) => {
    console.log('Export job completed', job.id)
  })
  worker.on('failed', (job, err) => {
    console.error('Export job failed', job?.id, err)
  })
}
