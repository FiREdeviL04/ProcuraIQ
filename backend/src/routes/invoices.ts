import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import PDFDocument from 'pdfkit'
import { sendMail } from '../utils/mailer'
import { requireAuth, requireRole } from '../middleware/auth'
import { createInvoiceSchema } from '../validation/invoice'
import { createActivity } from '../utils/activity'
import { notifyRoles, notifyUsers } from '../services/notificationService'

const prisma = new PrismaClient()
const router = Router()

function genInvoiceNumber() {
  const y = new Date().getFullYear()
  const r = Math.floor(1000 + Math.random() * 9000)
  return `INV-${y}-${r}`
}

router.post('/', requireAuth, requireRole(['PROCUREMENT_OFFICER', 'ADMIN']), async (req: any, res) => {
  try {
    const parsed = createInvoiceSchema.parse(req.body)
    const purchaseOrder = await prisma.purchaseOrder.findUnique({ where: { id: parsed.poId }, include: { quotation: true, vendor: true } })
    if (!purchaseOrder) return res.status(404).json({ error: 'PO not found' })

    const gst = purchaseOrder.quotation?.gst ?? 0
    const total = purchaseOrder.amount
    const subtotal = total / (1 + gst / 100)
    const tax = total - subtotal
    const invoiceNumber = genInvoiceNumber()

    const invoice = await prisma.invoice.create({ data: {
      invoiceNumber,
      poId: purchaseOrder.id,
      subtotal: Number(subtotal.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      total: Number(total.toFixed(2)),
      status: 'SENT'
    }})

    const io = req.app.get('io')
    io?.emit('invoice_generated', { invoiceId: invoice.id, invoiceNumber })

    await createActivity(req.user.id, 'Generate Invoice', 'Invoice', invoice.id)
    await notifyRoles(['ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER'], `Invoice ${invoice.invoiceNumber} generated`, io)
    if (purchaseOrder.quotation?.vendorId) {
      await notifyUsers([purchaseOrder.quotation.vendorId], `Invoice ${invoice.invoiceNumber} generated`, io)
    }

    // optionally send email immediately if query param send=true
    if (req.query.send === 'true') {
      const doc = new PDFDocument({ size: 'A4', margin: 50 })
      const chunks: Buffer[] = []
      doc.on('data', c => chunks.push(c))
      doc.on('end', async () => {
        const pdfBuffer = Buffer.concat(chunks)
        const to = purchaseOrder.vendor.email
        await sendMail(to || '', `Invoice ${invoice.invoiceNumber}`, `Invoice ${invoice.invoiceNumber}`, [{ filename: `${invoice.invoiceNumber}.pdf`, content: pdfBuffer }])
      })
      doc.fontSize(20).text('VendorBridge Invoice', { align: 'center' })
      doc.text(`Invoice: ${invoice.invoiceNumber}`)
      doc.text(`Total: ${invoice.total}`)
      doc.end()
    }

    res.json(invoice)
  } catch (err: any) {
    console.error(err)
    res.status(400).json({ error: err?.message || 'Invalid input' })
  }
})

router.get('/:id/pdf', requireAuth, async (req: any, res) => {
  try {
    const { id } = req.params
    const invoice = await prisma.invoice.findUnique({ where: { id }, include: { po: { include: { vendor: true, quotation: true } } } })
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' })

    const doc = new PDFDocument({ size: 'A4', margin: 50 })
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`)
    doc.fontSize(20).text('VendorBridge Invoice', { align: 'center' })
    doc.moveDown()
    const vendor = invoice.po.vendor
    doc.fontSize(12).text(`Invoice: ${invoice.invoiceNumber}`)
    doc.text(`Date: ${invoice.createdAt.toISOString().slice(0,10)}`)
    doc.moveDown()
    doc.text(`Vendor: ${vendor.vendorName}`)
    doc.text(`Contact: ${vendor.contactPerson} | ${vendor.email} | ${vendor.phone}`)
    doc.moveDown()
    doc.text(`PO: ${invoice.po.poNumber}`)
    doc.moveDown()
    doc.text(`Subtotal: ${invoice.subtotal.toFixed(2)}`)
    doc.text(`Tax: ${invoice.tax.toFixed(2)}`)
    doc.text(`Total: ${invoice.total.toFixed(2)}`)
    doc.moveDown()
    doc.text('Thank you for your business.', { align: 'center' })
    doc.end()
    doc.pipe(res)
  } catch (err: any) {
    console.error(err)
    res.status(500).json({ error: 'Unable to generate PDF' })
  }
})

router.get('/', requireAuth, async (req: any, res) => {
  const invoices = await prisma.invoice.findMany({ include: { po: { include: { vendor: true } } }, orderBy: { createdAt: 'desc' } })
  res.json(invoices)
})

export default router
