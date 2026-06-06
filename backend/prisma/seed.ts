import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
const prisma = new PrismaClient()

async function main() {
  console.log('Cleaning existing database data...')
  await prisma.approval.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.purchaseOrder.deleteMany()
  await prisma.quotation.deleteMany()
  await prisma.rFQVendors.deleteMany()
  await prisma.rFQ.deleteMany()
  await prisma.vendor.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.activityLog.deleteMany()
  await prisma.exportJob.deleteMany()
  await prisma.user.deleteMany()

  console.log('Seeding fresh records...')
  const hashedPassword = await bcrypt.hash('password', 10)

  // Seed Users
  const admin = await prisma.user.create({
    data: {
      id: 'user-admin',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@vendorbridge.local',
      password: hashedPassword,
      role: 'ADMIN'
    }
  })

  const manager = await prisma.user.create({
    data: {
      id: 'user-manager',
      firstName: 'Priya',
      lastName: 'Shah',
      email: 'manager@vendorbridge.local',
      password: hashedPassword,
      role: 'MANAGER'
    }
  })

  // Seed 5 Vendors
  const infra = await prisma.vendor.create({
    data: {
      id: 'vendor-infra',
      vendorName: 'Infra Supplies',
      category: 'Office Furniture',
      gstNumber: 'GSTIN33333',
      contactPerson: 'Karan Singh',
      email: 'karan@infra.com',
      phone: '9876543210',
      rating: 4.5,
      status: 'ACTIVE'
    }
  })

  const abc = await prisma.vendor.create({
    data: {
      id: 'vendor-abc',
      vendorName: 'ABC Technologies',
      category: 'IT Services',
      gstNumber: 'GSTIN12345',
      contactPerson: 'Rahul Mehta',
      email: 'rahul@abc.com',
      phone: '9999999999',
      rating: 4.2,
      status: 'ACTIVE'
    }
  })

  const delta = await prisma.vendor.create({
    data: {
      id: 'vendor-delta',
      vendorName: 'Delta Suppliers',
      category: 'Office Supplies',
      gstNumber: 'GSTIN22222',
      contactPerson: 'Meera Sen',
      email: 'meera@delta.com',
      phone: '8888888888',
      rating: 4.0,
      status: 'ACTIVE'
    }
  })

  const prime = await prisma.vendor.create({
    data: {
      id: 'vendor-prime',
      vendorName: 'Prime Logistics',
      category: 'Logistics',
      gstNumber: 'GSTIN44444',
      contactPerson: 'Sanjay Dutt',
      email: 'sanjay@primelogistics.com',
      phone: '7777777777',
      rating: 4.8,
      status: 'ACTIVE'
    }
  })

  const apex = await prisma.vendor.create({
    data: {
      id: 'vendor-apex',
      vendorName: 'Apex Security',
      category: 'Security Services',
      gstNumber: 'GSTIN55555',
      contactPerson: 'Vikram Rathore',
      email: 'vikram@apexsecurity.com',
      phone: '6666666666',
      rating: 3.9,
      status: 'ACTIVE'
    }
  })

  // Seed 5 RFQs
  const rfq1 = await prisma.rFQ.create({
    data: {
      id: 'rfq-1',
      title: 'Raw Material Steel Procurement',
      description: 'Procurement of structural steel beams and columns for construction projects.',
      quantity: 50,
      expectedBudget: 180000,
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      status: 'CLOSED',
      createdBy: admin.id
    }
  })

  const rfq2 = await prisma.rFQ.create({
    data: {
      id: 'rfq-2',
      title: 'Office IT Expansion - Laptops',
      description: 'Need developer-grade high performance laptops.',
      quantity: 15,
      expectedBudget: 100000,
      deadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      status: 'CLOSED',
      createdBy: admin.id
    }
  })

  const rfq3 = await prisma.rFQ.create({
    data: {
      id: 'rfq-3',
      title: 'Facility Air Conditioning AMC',
      description: 'Annual Maintenance Contract for office central cooling.',
      quantity: 1,
      expectedBudget: 40000,
      deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      status: 'CLOSED',
      createdBy: admin.id
    }
  })

  const rfq4 = await prisma.rFQ.create({
    data: {
      id: 'rfq-4',
      title: 'office furniture Q2',
      description: 'Need ergonomic chairs and modular desks for office expansion.',
      quantity: 120,
      expectedBudget: 200000,
      deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      status: 'OPEN',
      createdBy: admin.id
    }
  })

  const rfq5 = await prisma.rFQ.create({
    data: {
      id: 'rfq-5',
      title: 'Marketing Campaign Collaterals',
      description: 'Printing of brochures, banners, and merchandise for upcoming launch.',
      quantity: 5000,
      expectedBudget: 15000,
      deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      status: 'OPEN',
      createdBy: admin.id
    }
  })

  // Assign Vendors to RFQs (best-effort)
  await prisma.rFQVendors.createMany({
    data: [
      { rfqId: rfq1.id, vendorId: infra.id },
      { rfqId: rfq2.id, vendorId: abc.id },
      { rfqId: rfq3.id, vendorId: delta.id },
      { rfqId: rfq4.id, vendorId: infra.id },
      { rfqId: rfq5.id, vendorId: abc.id }
    ]
  })

  // Seed 5 Quotations (one per RFQ)
  const q1 = await prisma.quotation.create({
    data: {
      id: 'quote-1',
      rfqId: rfq1.id,
      vendorId: infra.id,
      price: 150000,
      gst: 18,
      deliveryDays: 10,
      notes: 'Premium structural steel. Prices inclusive of logistics.',
      status: 'PO_GENERATED'
    }
  })

  const q2 = await prisma.quotation.create({
    data: {
      id: 'quote-2',
      rfqId: rfq2.id,
      vendorId: abc.id,
      price: 85000,
      gst: 18,
      deliveryDays: 7,
      notes: 'Full developer specs laptops with 3 year onsite support.',
      status: 'PO_GENERATED'
    }
  })

  const q3 = await prisma.quotation.create({
    data: {
      id: 'quote-3',
      rfqId: rfq3.id,
      vendorId: delta.id,
      price: 32000,
      gst: 18,
      deliveryDays: 5,
      notes: 'Includes comprehensive monthly checkup and part replacements.',
      status: 'APPROVED'
    }
  })

  const q4 = await prisma.quotation.create({
    data: {
      id: 'quote-4',
      rfqId: rfq4.id,
      vendorId: infra.id,
      price: 185400,
      gst: 18,
      deliveryDays: 10,
      notes: 'Ergonomic chairs and executive desks with high warranty.',
      status: 'SUBMITTED'
    }
  })

  const q5 = await prisma.quotation.create({
    data: {
      id: 'quote-5',
      rfqId: rfq5.id,
      vendorId: abc.id,
      price: 12000,
      gst: 18,
      deliveryDays: 3,
      notes: 'High-speed high-quality print collaterals.',
      status: 'SUBMITTED'
    }
  })

  // Seed 3 Approvals (For Quote 1, 2, and 3 which are already approved/processed)
  await prisma.approval.create({
    data: {
      id: 'app-1',
      quotationId: q1.id,
      managerId: manager.id,
      remarks: 'Best commercial and technical proposal.',
      status: 'APPROVED'
    }
  })

  await prisma.approval.create({
    data: {
      id: 'app-2',
      quotationId: q2.id,
      managerId: manager.id,
      remarks: 'Price falls within expected budgets, specs match requirements.',
      status: 'APPROVED'
    }
  })

  await prisma.approval.create({
    data: {
      id: 'app-3',
      quotationId: q3.id,
      managerId: manager.id,
      remarks: 'Selected due to better SLA and delivery response time.',
      status: 'APPROVED'
    }
  })

  // Seed 2 Purchase Orders (For Quote 1 and 2)
  const po1 = await prisma.purchaseOrder.create({
    data: {
      id: 'po-1',
      poNumber: 'PO-2026-8001',
      quotationId: q1.id,
      vendorId: infra.id,
      amount: 177000, // 150000 + 18% GST
      status: 'SENT'
    }
  })

  const po2 = await prisma.purchaseOrder.create({
    data: {
      id: 'po-2',
      poNumber: 'PO-2026-8002',
      quotationId: q2.id,
      vendorId: abc.id,
      amount: 100300, // 85000 + 18% GST
      status: 'SENT'
    }
  })

  // Seed 1 Invoice (For PO 1)
  await prisma.invoice.create({
    data: {
      id: 'inv-1',
      invoiceNumber: 'INV-2026-9001',
      poId: po1.id,
      subtotal: 150000,
      tax: 27000,
      total: 177000,
      status: 'SENT'
    }
  })

  // Seed some initial Activity Logs
  await prisma.activityLog.createMany({
    data: [
      { userId: admin.id, action: 'Register', entityType: 'User', entityId: admin.id },
      { userId: admin.id, action: 'Create RFQ', entityType: 'RFQ', entityId: rfq1.id },
      { userId: admin.id, action: 'Create RFQ', entityType: 'RFQ', entityId: rfq2.id },
      { userId: manager.id, action: 'Approve Quotation', entityType: 'Approval', entityId: 'app-1' },
      { userId: manager.id, action: 'Generate PO', entityType: 'PurchaseOrder', entityId: po1.id }
    ]
  })

  // Seed initial Notifications
  await prisma.notification.createMany({
    data: [
      { userId: admin.id, message: 'New Quotation submitted for RFQ office furniture Q2', isRead: false },
      { userId: admin.id, message: 'New Quotation submitted for RFQ Marketing Campaign Collaterals', isRead: false },
      { userId: admin.id, message: 'Purchase Order PO-2026-8001 generated successfully', isRead: false }
    ]
  })

  console.log('Seeding finished successfully. Exactly 5 records populated for all key stages!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
