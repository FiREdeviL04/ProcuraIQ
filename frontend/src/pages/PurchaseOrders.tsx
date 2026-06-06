import React, { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'

interface PurchaseOrder {
  id: string
  poNumber: string
  quotationId: string
  vendorId: string
  amount: number
  status: string
  createdAt: string
  vendor: {
    vendorName: string
  }
}

interface Quotation {
  id: string
  rfqId: string
  vendorId: string
  price: number
  gst: number
  deliveryDays: number
  notes: string | null
  status: string
  createdAt: string
  vendor: {
    vendorName: string
  }
  rfq: {
    title: string
  }
}

export default function PurchaseOrdersPage() {
  const [pos, setPos] = useState<PurchaseOrder[]>([])
  const [approvedQuotes, setApprovedQuotes] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'pos' | 'approved_quotes'>('pos')
  const [actionLoading, setActionLoading] = useState(false)

  async function loadData() {
    try {
      setLoading(true)
      const [posData, quotesData] = await Promise.all([
        apiFetch('/api/purchase-orders'),
        apiFetch('/api/quotations')
      ])
      setPos(posData)
      setApprovedQuotes(quotesData.filter((q: Quotation) => q.status === 'APPROVED'))
    } catch (err: any) {
      setError(err.message || 'Failed to load purchase orders data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function generatePO(quotationId: string) {
    try {
      setActionLoading(true)
      await apiFetch('/api/purchase-orders', {
        method: 'POST',
        body: JSON.stringify({ quotationId })
      })
      alert('Purchase Order successfully generated!')
      await loadData()
      setActiveTab('pos')
    } catch (err: any) {
      alert(`Error generating PO: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading && pos.length === 0 && approvedQuotes.length === 0) {
    return <div className="text-slate-500 p-8">Loading purchase orders...</div>
  }

  if (error) {
    return <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl lg:p-8">
        <div className="flex justify-between items-center">
          <div>
            <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-blue-200">Financials</div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight lg:text-4xl">Purchase Orders</h1>
            <p className="mt-2 text-sm text-slate-300">
              Manage generated purchase orders or issue new ones from approved vendor quotations.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('pos')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${activeTab === 'pos' ? 'bg-blue-600 text-white shadow' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              Active POs ({pos.length})
            </button>
            <button
              onClick={() => setActiveTab('approved_quotes')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${activeTab === 'approved_quotes' ? 'bg-blue-600 text-white shadow' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              Pending PO Issue ({approvedQuotes.length})
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'pos' ? (
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Generated Purchase Orders</h2>
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-6 py-4">PO Number</th>
                  <th className="px-6 py-4">Vendor</th>
                  <th className="px-6 py-4">Total Amount (Incl. GST)</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Issued Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {pos.map(po => (
                  <tr key={po.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 font-semibold text-slate-900">{po.poNumber}</td>
                    <td className="px-6 py-4 text-slate-600">{po.vendor?.vendorName}</td>
                    <td className="px-6 py-4 text-slate-900 font-semibold">${Number(po.amount).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                        {po.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{new Date(po.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {!pos.length && (
                  <tr>
                    <td className="px-6 py-8 text-slate-500 text-center" colSpan={5}>
                      No purchase orders generated yet. Approve a quotation first!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Quotations Ready for Purchase Order</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {approvedQuotes.map(q => {
              const totalAmount = q.price + (q.price * (q.gst / 100))
              return (
                <div key={q.id} className="rounded-2xl border border-slate-200 p-5 space-y-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-lg">{q.rfq?.title}</h3>
                      <p className="text-sm text-slate-500">Vendor: {q.vendor?.vendorName}</p>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded border border-emerald-300">
                      Approved
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm border-t border-b border-slate-100 py-3">
                    <div>
                      <span className="text-slate-500">Base Price:</span>
                      <span className="block font-medium text-slate-800">${q.price.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">GST Rate:</span>
                      <span className="block font-medium text-slate-800">{q.gst}%</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Delivery:</span>
                      <span className="block font-medium text-slate-800">{q.deliveryDays} Days</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Total (with Tax):</span>
                      <span className="block font-bold text-emerald-600">${totalAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  <button
                    disabled={actionLoading}
                    onClick={() => generatePO(q.id)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold transition active:scale-[0.98] disabled:opacity-50"
                  >
                    {actionLoading ? 'Issuing PO...' : 'Issue Purchase Order'}
                  </button>
                </div>
              )
            })}
            {!approvedQuotes.length && (
              <div className="col-span-2 py-8 text-slate-500 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                No approved vendor quotations are currently waiting for a Purchase Order.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
