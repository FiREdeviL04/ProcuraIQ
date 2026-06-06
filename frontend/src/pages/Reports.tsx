import React, { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts'

interface VendorPerformance {
  vendorId: string
  vendorName: string
  totalQuotations: number
  approvedQuotations: number
  averageQuoteValue: number
  approvalRate: number
  vendorRating: number
}

interface ProcurementStats {
  totalRFQs: number
  totalQuotations: number
  approvalRate: number
  rejectionRate: number
  averageProcurementCycleTime: number
}

interface TopVendor {
  vendorId: string
  vendorName: string
  approvalCount: number
  procurementVolume: number
  totalBusinessValue: number
  vendorRating: number
  score: number
}

export default function ReportsPage() {
  const [performance, setPerformance] = useState<VendorPerformance[]>([])
  const [stats, setStats] = useState<ProcurementStats | null>(null)
  const [topVendors, setTopVendors] = useState<TopVendor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadData() {
    try {
      setLoading(true)
      const [perfData, statsData, topData] = await Promise.all([
        apiFetch('/api/reports/vendor-performance'),
        apiFetch('/api/reports/procurement-stats'),
        apiFetch('/api/reports/top-vendors')
      ])
      setPerformance(perfData)
      setStats(statsData)
      setTopVendors(topData)
    } catch (err: any) {
      setError(err.message || 'Failed to load report data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return <div className="text-slate-500 p-8">Loading analytics reports...</div>
  }

  if (error) {
    return <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl lg:p-8">
        <div>
          <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-blue-200">Analytics</div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight lg:text-4xl">Procurement & Vendor Reports</h1>
          <p className="mt-2 text-sm text-slate-300">
            Audit vendor behavior, performance metrics, and procurement statistics.
          </p>
        </div>
      </div>

      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total RFQs</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{stats.totalRFQs}</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Quotations</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{stats.totalQuotations}</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Approval Rate</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{stats.approvalRate}%</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Rejection Rate</div>
            <div className="text-2xl font-bold text-red-600 mt-1">{stats.rejectionRate}%</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Avg. Cycle Time</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">{stats.averageProcurementCycleTime} days</div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Vendor Rating vs Volume Chart */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Vendor Quotation Volumes</h2>
          <p className="text-sm text-slate-500 mb-4">Comparison of quotation volume and average price.</p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="vendorName" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="totalQuotations" name="Quote Volume" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="averageQuoteValue" name="Avg Value ($)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Vendor Standings */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Top Vendors Leaderboard</h2>
          <p className="text-sm text-slate-500 mb-4">Ranked by aggregate vendor score and volume.</p>
          <div className="flex-1 space-y-3">
            {topVendors.map((vendor, idx) => (
              <div key={vendor.vendorId} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100/50 transition">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-400 w-5">#{idx + 1}</span>
                  <div>
                    <div className="font-semibold text-slate-900">{vendor.vendorName}</div>
                    <div className="text-xs text-slate-500">
                      Rating: {vendor.vendorRating ?? 4.5}/5 • Approvals: {vendor.approvalCount}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-slate-900">${vendor.totalBusinessValue.toLocaleString()}</div>
                  <div className="text-xs font-semibold text-blue-600">Score: {vendor.score.toFixed(1)}</div>
                </div>
              </div>
            ))}
            {!topVendors.length && (
              <div className="text-slate-500 py-8 text-center">No vendor standings.</div>
            )}
          </div>
        </div>
      </div>

      {/* Vendor Audit List */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Vendor Performance Overview</h2>
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-6 py-4">Vendor Name</th>
                <th className="px-6 py-4">Quoted Count</th>
                <th className="px-6 py-4">Approved Count</th>
                <th className="px-6 py-4">Approval Rate</th>
                <th className="px-6 py-4">Average Value</th>
                <th className="px-6 py-4">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {performance.map(v => (
                <tr key={v.vendorId} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4 font-semibold text-slate-900">{v.vendorName}</td>
                  <td className="px-6 py-4 text-slate-600">{v.totalQuotations}</td>
                  <td className="px-6 py-4 text-slate-600">{v.approvedQuotations}</td>
                  <td className="px-6 py-4 font-medium text-emerald-600">{v.approvalRate.toFixed(1)}%</td>
                  <td className="px-6 py-4 font-semibold text-slate-800">${v.averageQuoteValue.toLocaleString()}</td>
                  <td className="px-6 py-4 text-slate-900 font-semibold">
                    ⭐ {v.vendorRating ? v.vendorRating.toFixed(1) : '4.5'}
                  </td>
                </tr>
              ))}
              {!performance.length && (
                <tr>
                  <td className="px-6 py-8 text-slate-500 text-center" colSpan={6}>
                    No vendor performance statistics loaded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
