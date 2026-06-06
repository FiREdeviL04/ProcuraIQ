import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth, requireRole } from '../middleware/auth'
import PDFDocument from 'pdfkit'

const prisma = new PrismaClient()
const router = Router()

// GET /api/activity-logs?userId=&entityType=&q=&page=&pageSize=
router.get('/', requireAuth, requireRole(['ADMIN','MANAGER']), async (req: any, res) => {
  const { userId, entityType, q } = req.query
  const page = Math.max(Number(req.query.page) || 1, 1)
  const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 50, 1), 1000)
  const where: any = {}
  if (userId) where.userId = userId
  if (entityType) where.entityType = entityType
  if (q) where.action = { contains: q as string }

  const total = await prisma.activityLog.count({ where })
  const skip = (page - 1) * pageSize
  const logs = await prisma.activityLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: pageSize })
  res.json({ data: logs, total, page, pageSize })
})

// Server-side CSV export for large exports
router.get('/export/csv', requireAuth, requireRole(['ADMIN','MANAGER']), async (req: any, res) => {
  const { userId, entityType, q } = req.query
  const where: any = {}
  if (userId) where.userId = userId
  if (entityType) where.entityType = entityType
  if (q) where.action = { contains: q as string }

  const logs = await prisma.activityLog.findMany({ where, orderBy: { createdAt: 'desc' } })

  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename="activity-logs.csv"')

  // header
  res.write('createdAt,action,entityType,entityId,userId\n')
  for (const l of logs) {
    const line = [
      new Date(l.createdAt).toISOString(),
      (l.action || '').replace(/"/g, '""'),
      (l.entityType || '').replace(/"/g, '""'),
      (l.entityId || '').replace(/"/g, '""'),
      (l.userId || '').replace(/"/g, '""')
    ].map(v => `"${v}"`).join(',')
    res.write(line + '\n')
  }
  res.end()
})

// Server-side PDF export for large exports
router.get('/export/pdf', requireAuth, requireRole(['ADMIN','MANAGER']), async (req: any, res) => {
  const { userId, entityType, q } = req.query
  const where: any = {}
  if (userId) where.userId = userId
  if (entityType) where.entityType = entityType
  if (q) where.action = { contains: q as string }

  const logs = await prisma.activityLog.findMany({ where, orderBy: { createdAt: 'desc' } })

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', 'attachment; filename="activity-logs.pdf"')

  const doc = new PDFDocument({ size: 'A4', margin: 40 })
  doc.pipe(res)

  doc.fontSize(18).text('Activity Logs', { align: 'center' })
  doc.moveDown()

  const tableTop = doc.y
  const colWidths = { date: 120, action: 160, entity: 100, entityId: 100, user: 100 }

  // header
  doc.fontSize(10).text('Date', 40, doc.y, { continued: true, width: colWidths.date })
  doc.text('Action', 40 + colWidths.date, doc.y, { continued: true, width: colWidths.action })
  doc.text('Entity', 40 + colWidths.date + colWidths.action, doc.y, { continued: true, width: colWidths.entity })
  doc.text('Entity ID', 40 + colWidths.date + colWidths.action + colWidths.entity, doc.y, { continued: true, width: colWidths.entityId })
  doc.text('User', 40 + colWidths.date + colWidths.action + colWidths.entity + colWidths.entityId, doc.y, { width: colWidths.user })
  doc.moveDown()

  doc.fontSize(9)
  for (const l of logs) {
    if (doc.y > 720) { doc.addPage(); }
    doc.text(new Date(l.createdAt).toLocaleString(), 40, doc.y, { continued: true, width: colWidths.date })
    doc.text(l.action || '-', 40 + colWidths.date, doc.y, { continued: true, width: colWidths.action })
    doc.text(l.entityType || '-', 40 + colWidths.date + colWidths.action, doc.y, { continued: true, width: colWidths.entity })
    doc.text(l.entityId || '-', 40 + colWidths.date + colWidths.action + colWidths.entity, doc.y, { continued: true, width: colWidths.entityId })
    doc.text(l.userId || '-', 40 + colWidths.date + colWidths.action + colWidths.entity + colWidths.entityId, doc.y, { width: colWidths.user })
    doc.moveDown()
  }

  doc.end()
})

export default router
