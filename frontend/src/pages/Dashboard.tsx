import React, { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../lib/api'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

const cardTone = {
  totalVendors: 'from-blue-500 to-cyan-500',
  activeRFQs: 'from-violet-500 to-fuchsia-500',
  pendingApprovals: 'from-amber-500 to-orange-500',
  totalPurchaseOrders: 'from-emerald-500 to-teal-500',
  totalInvoices: 'from-slate-700 to-slate-900',
  totalSpend: 'from-rose-500 to-pink-500'
} as const

function StatCard({ label, value, tone }: { label: string; value: React.ReactNode; tone: string }) {
  return (
    <div className={`rounded-3xl bg-gradient-to-br ${tone} p-[1px] shadow-lg`}>
      <div className="rounded-3xl bg-white/95 p-5">
        <div className="text-sm font-medium text-slate-500">{label}</div>
        <div className="mt-2 text-3xl font-semibold text-slate-900">{value}</div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    apiFetch('/api/dashboard')
      .then(result => mounted && setData(result))
      .catch(err => mounted && setError(err.message))
      .finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [])

  const cards = useMemo(() => ({
    totalVendors: data?.cards?.totalVendors ?? 0,
    activeRFQs: data?.cards?.activeRFQs ?? 0,
    pendingApprovals: data?.cards?.pendingApprovals ?? 0,
    totalPurchaseOrders: data?.cards?.totalPurchaseOrders ?? 0,
    totalInvoices: data?.cards?.totalInvoices ?? 0,
    totalSpend: data?.cards?.totalSpend ?? 0
  }), [data])

  const monthlySpend = data?.charts?.spendingTrends ?? []
  const recentPurchaseOrders = data?.recentPurchaseOrders ?? []
  const recentActivity = data?.recentActivity ?? []
  const notifications = data?.notifications ?? []
  const topVendors = data?.charts?.topVendors ?? []
  const procurementStats = data?.charts?.procurementStats

  if (loading) {
    return <div className="rounded-3xl bg-white p-8 text-slate-500 shadow-sm">Loading dashboard…</div>
  }

  if (error) {
    return <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl lg:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr] lg:items-end">
          <div>
            <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-blue-200">Overview</div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight lg:text-5xl">Procurement command center</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-300 lg:text-base">
              Track RFQs, vendor performance, approvals, spend trends, and live activity from a single operational view.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-white/10 p-4">
              <div className="text-slate-300">Approval rate</div>
              <div className="mt-2 text-2xl font-semibold">{procurementStats?.approvalRate ?? 0}%</div>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <div className="text-slate-300">Cycle time</div>
              <div className="mt-2 text-2xl font-semibold">{procurementStats?.averageProcurementCycleTime ?? 0} days</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total Vendors" value={cards.totalVendors} tone={cardTone.totalVendors} />
        <StatCard label="Active RFQs" value={cards.activeRFQs} tone={cardTone.activeRFQs} />
        <StatCard label="Pending Approvals" value={cards.pendingApprovals} tone={cardTone.pendingApprovals} />
        <StatCard label="Purchase Orders" value={cards.totalPurchaseOrders} tone={cardTone.totalPurchaseOrders} />
        <StatCard label="Invoices" value={cards.totalInvoices} tone={cardTone.totalInvoices} />
        <StatCard label="Total Spend" value={`$${Number(cards.totalSpend).toLocaleString()}`} tone={cardTone.totalSpend} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Monthly spending trend</h2>
              <p className="text-sm text-slate-500">Recharts line chart from the analytics API.</p>
            </div>
          </div>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlySpend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="spend" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Procurement statistics</h2>
            <p className="text-sm text-slate-500">Approval, rejection, and cycle time summary.</p>
          </div>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Approved', value: procurementStats?.approvalRate ?? 0, fill: '#22c55e' },
                    { name: 'Rejected', value: procurementStats?.rejectionRate ?? 0, fill: '#ef4444' },
                    { name: 'Pending', value: Math.max(0, 100 - ((procurementStats?.approvalRate ?? 0) + (procurementStats?.rejectionRate ?? 0))), fill: '#f59e0b' }
                  ]}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={110}
                  innerRadius={70}
                  paddingAngle={4}
                >
                  {[
                    { fill: '#22c55e' },
                    { fill: '#ef4444' },
                    { fill: '#f59e0b' }
                  ].map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Recent Purchase Orders</h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-3">PO Number</th>
                  <th className="px-4 py-3">Vendor</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {recentPurchaseOrders.map((po: any) => (
                  <tr key={po.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">{po.poNumber}</td>
                    <td className="px-4 py-3 text-slate-600">{po.vendor?.vendorName ?? '-'}</td>
                    <td className="px-4 py-3 text-slate-600">${Number(po.amount).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{po.status}</span>
                    </td>
                  </tr>
                ))}
                {!recentPurchaseOrders.length && (
                  <tr><td className="px-4 py-6 text-slate-500" colSpan={4}>No purchase orders yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Top vendors</h2>
            <div className="mt-4 space-y-4">
              {topVendors.slice(0, 5).map((vendor: any) => (
                <div key={vendor.vendorId} className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900">{vendor.vendorName}</div>
                      <div className="text-sm text-slate-500">Rating {vendor.vendorRating ?? 0} | Approval count {vendor.approvalCount}</div>
                    </div>
                    <div className="text-right text-sm text-slate-600">${vendor.totalBusinessValue.toFixed?.(2) ?? vendor.totalBusinessValue}</div>
                  </div>
                </div>
              ))}
              {!topVendors.length && <div className="text-sm text-slate-500">No vendor analytics yet.</div>}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>
            <div className="mt-4 space-y-3">
              {notifications.map((item: any) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="text-sm font-medium text-slate-900">{item.message}</div>
                  <div className="mt-1 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</div>
                </div>
              ))}
              {!notifications.length && <div className="text-sm text-slate-500">No unread notifications.</div>}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Activity feed</h2>
          <div className="mt-4 space-y-3">
            {recentActivity.map((entry: any) => (
              <div key={entry.id} className="rounded-2xl bg-slate-50 p-4 text-sm">
                <div className="font-medium text-slate-900">{entry.action}</div>
                <div className="text-slate-500">{entry.entityType} • {entry.entityId}</div>
              </div>
            ))}
            {!recentActivity.length && <div className="text-sm text-slate-500">No activity yet.</div>}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Spending trend summary</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySpend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="spend" fill="#0f172a" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  )
}
