import { PrismaClient } from '@prisma/client'
import { Role } from '../types/role'

const prisma = new PrismaClient()

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(key: string) {
  const [year, month] = key.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'short', year: 'numeric' })
}

export async function getDashboardSummary() {
  const [totalVendors, activeRFQs, pendingApprovals, totalPurchaseOrders, totalInvoices] = await Promise.all([
    prisma.vendor.count(),
    prisma.rFQ.count({ where: { status: 'OPEN' } }),
    prisma.quotation.count({ where: { status: 'SUBMITTED' } }),
    prisma.purchaseOrder.count(),
    prisma.invoice.count()
  ])

  const spendAgg = await prisma.invoice.aggregate({ _sum: { total: true } })
  const monthlyInvoices = await prisma.invoice.findMany({ select: { total: true, createdAt: true }, orderBy: { createdAt: 'asc' } })
  const trendMap = new Map<string, number>()
  for (const invoice of monthlyInvoices) {
    const key = monthKey(new Date(invoice.createdAt))
    trendMap.set(key, (trendMap.get(key) || 0) + invoice.total)
  }

  const monthlySpend = Array.from(trendMap.entries()).map(([key, value]) => ({ month: monthLabel(key), spend: Number(value.toFixed(2)) }))

  return {
    totalVendors,
    activeRFQs,
    pendingApprovals,
    totalPurchaseOrders,
    totalInvoices,
    totalSpend: Number((spendAgg._sum.total || 0).toFixed(2)),
    monthlySpend
  }
}

export async function getVendorPerformance() {
  const vendors = await prisma.vendor.findMany({
    include: {
      Quotations: {
        include: { Approval: true }
      }
    },
    orderBy: { vendorName: 'asc' }
  })

  return vendors.map(vendor => {
    const totalQuotations = vendor.Quotations.length
    const approvedQuotations = vendor.Quotations.filter(q => q.Approval?.status === 'APPROVED').length
    const averageQuoteValue = totalQuotations
      ? vendor.Quotations.reduce((sum, q) => sum + q.price, 0) / totalQuotations
      : 0
    const approvalRate = totalQuotations ? (approvedQuotations / totalQuotations) * 100 : 0

    return {
      vendorId: vendor.id,
      vendorName: vendor.vendorName,
      totalQuotations,
      approvedQuotations,
      averageQuoteValue: Number(averageQuoteValue.toFixed(2)),
      approvalRate: Number(approvalRate.toFixed(2)),
      vendorRating: vendor.rating ?? 0
    }
  })
}

export async function getProcurementStats() {
  const [totalRFQs, totalQuotations, approvedQuotations, rejectedQuotations] = await Promise.all([
    prisma.rFQ.count(),
    prisma.quotation.count(),
    prisma.approval.count({ where: { status: 'APPROVED' } }),
    prisma.approval.count({ where: { status: 'REJECTED' } })
  ])

  const quotationWithApprovals = await prisma.quotation.findMany({
    select: {
      createdAt: true,
      Approval: {
        select: {
          createdAt: true,
          status: true
        }
      }
    }
  })
  const averageCycleTime = quotationWithApprovals.length
    ? quotationWithApprovals.reduce((sum, q) => {
      if (!q.Approval) return sum
      const diff = new Date(q.Approval.createdAt).getTime() - new Date(q.createdAt).getTime()
      return sum + (diff / (1000 * 60 * 60 * 24))
    }, 0) / quotationWithApprovals.filter(q => q.Approval).length
    : 0

  return {
    totalRFQs,
    totalQuotations,
    approvalRate: totalQuotations ? Number(((approvedQuotations / totalQuotations) * 100).toFixed(2)) : 0,
    rejectionRate: totalQuotations ? Number(((rejectedQuotations / totalQuotations) * 100).toFixed(2)) : 0,
    averageProcurementCycleTime: Number(averageCycleTime.toFixed(2))
  }
}

export async function getSpendingTrends() {
  const invoices = await prisma.invoice.findMany({ select: { total: true, createdAt: true }, orderBy: { createdAt: 'asc' } })
  const trendMap = new Map<string, number>()
  for (const invoice of invoices) {
    const key = monthKey(new Date(invoice.createdAt))
    trendMap.set(key, (trendMap.get(key) || 0) + invoice.total)
  }
  return Array.from(trendMap.entries()).map(([key, value]) => ({ month: monthLabel(key), spend: Number(value.toFixed(2)) }))
}

export async function getTopVendors() {
  const vendors = await prisma.vendor.findMany({
    include: { Quotations: { include: { Approval: true } } }
  })

  return vendors
    .map(vendor => {
      const approvalCount = vendor.Quotations.filter(q => q.Approval?.status === 'APPROVED').length
      const procurementVolume = vendor.Quotations.length
      const totalBusinessValue = vendor.Quotations.filter(q => q.Approval?.status === 'APPROVED').reduce((sum, q) => sum + q.price, 0)

      return {
        vendorId: vendor.id,
        vendorName: vendor.vendorName,
        approvalCount,
        procurementVolume,
        totalBusinessValue: Number(totalBusinessValue.toFixed(2)),
        vendorRating: vendor.rating ?? 0,
        score: (approvalCount * 3) + procurementVolume + totalBusinessValue / 1000
      }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
}

export async function getOptimizedDashboard(userId: string, role?: Role) {
  const [summary, vendorPerformance, procurementStats, spendingTrends, recentActivity, recentPurchaseOrders, notifications] = await Promise.all([
    getDashboardSummary(),
    getVendorPerformance(),
    getProcurementStats(),
    getSpendingTrends(),
    prisma.activityLog.findMany({ where: { ...(role === 'VENDOR' ? { userId } : {}) }, orderBy: { createdAt: 'desc' }, take: 10 }),
    prisma.purchaseOrder.findMany({ orderBy: { createdAt: 'desc' }, take: 5, include: { vendor: true, quotation: true } }),
    prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 10 })
  ])

  return {
    cards: {
      totalVendors: summary.totalVendors,
      activeRFQs: summary.activeRFQs,
      pendingApprovals: summary.pendingApprovals,
      totalPurchaseOrders: summary.totalPurchaseOrders,
      totalInvoices: summary.totalInvoices,
      totalSpend: summary.totalSpend,
    },
    charts: {
      spendingTrends,
      vendorPerformance,
      procurementStats,
      topVendors: await getTopVendors()
    },
    recentActivity,
    recentPurchaseOrders,
    notifications
  }
}
