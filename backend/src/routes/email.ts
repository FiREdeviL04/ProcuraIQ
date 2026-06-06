import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth, requireRole } from '../middleware/auth'
import { sendMail } from '../utils/mailer'
import PDFDocument from 'pdfkit'
import { createActivity } from '../utils/activity'
import { notifyRoles, notifyUsers } from '../services/notificationService'

const prisma = new PrismaClient()
const router = Router()

// send invoice email with PDF attachment
router.post('/invoices/:id/send', requireAuth, requireRole(['PROCUREMENT_OFFICER']), async (req: any, res) => {
  try {
    const { id } = req.params
    const invoice = await prisma.invoice.findUnique({ where: { id }, include: { po: { include: { vendor: true, quotation: true } } } })
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' })

    // generate PDF buffer
    const doc = new PDFDocument({ size: 'A4', margin: 50 })
    const chunks: Buffer[] = []
    doc.on('data', (c) => chunks.push(c))
    doc.on('end', async () => {
      const pdfBuffer = Buffer.concat(chunks)
      // send email
      const to = invoice.po.vendor.email || req.body.to
      const subject = `Invoice ${invoice.invoiceNumber}`
      const text = `Please find attached invoice ${invoice.invoiceNumber}`
      await sendMail(to, subject, text, [{ filename: `${invoice.invoiceNumber}.pdf`, content: pdfBuffer }])

      // create notification
      await prisma.notification.create({ data: { userId: req.user.id, message: `Invoice ${invoice.invoiceNumber} sent to ${to}` } })

      await createActivity(req.user.id, 'Send Invoice Email', 'Invoice', invoice.id)

      // emit socket notification
      const io = req.app.get('io')
      io?.emit('notification', { userId: req.user.id, message: `Invoice ${invoice.invoiceNumber} sent` })
      await notifyRoles(['ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER'], `Invoice ${invoice.invoiceNumber} sent`, io)
      if (invoice.po.quotation?.vendorId) {
        await notifyUsers([invoice.po.quotation.vendorId], `Invoice ${invoice.invoiceNumber} sent`, io)
      }

      res.json({ ok: true })
    })

    // write minimal content
    doc.fontSize(20).text('VendorBridge Invoice', { align: 'center' })
    doc.moveDown()
    doc.text(`Invoice: ${invoice.invoiceNumber}`)
    doc.text(`Total: ${invoice.total}`)
    doc.end()

  } catch (err: any) {
    console.error(err)
    res.status(500).json({ error: 'Failed to send email' })
  }
})

export default router
