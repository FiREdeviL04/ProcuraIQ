import React, { useEffect, useState } from 'react'
import { apiFetch, TOKEN_KEY } from '../lib/api'

interface Invoice {
  id: string
  invoiceNumber: string
  poId: string
  subtotal: number
  tax: number
  total: number
  status: string
  createdAt: string
  po: {
    poNumber: string
    vendor: {
      vendorName: string
    }
  }
}

interface PurchaseOrder {
  id: string
  poNumber: string
  amount: number
  status: string
  createdAt: string
  vendor: {
    vendorName: string
  }
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [pos, setPos] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'invoices' | 'generate'>('invoices')
  const [actionLoading, setActionLoading] = useState(false)

  async function loadData() {
    try {
      setLoading(true)
      const [invoicesData, posData] = await Promise.all([
        apiFetch('/api/invoices'),
        apiFetch('/api/purchase-orders')
      ])
      setInvoices(invoicesData)
      
      // Filter out POs that already have an invoice
      const invoicedPoIds = new Set(invoicesData.map((inv: Invoice) => inv.poId))
      setPos(posData.filter((po: PurchaseOrder) => !invoicedPoIds.has(po.id)))
    } catch (err: any) {
      setError(err.message || 'Failed to load invoices data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function generateInvoice(poId: string) {
    try {
      setActionLoading(true)
      await apiFetch('/api/invoices', {
        method: 'POST',
        body: JSON.stringify({ poId })
      })
      alert('Invoice successfully generated!')
      await loadData()
      setActiveTab('invoices')
    } catch (err: any) {
      alert(`Error generating invoice: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  async function downloadPDF(invoiceId: string, invoiceNumber: string) {
    try {
      const token = localStorage.getItem(TOKEN_KEY)
      const response = await fetch(`/api/invoices/${invoiceId}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!response.ok) throw new Error('Failed to generate PDF')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${invoiceNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
  }

  if (loading && invoices.length === 0 && pos.length === 0) {
    return <div className="text-slate-500 p-8">Loading invoices...</div>
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
            <h1 className="mt-4 text-3xl font-semibold tracking-tight lg:text-4xl">Invoices</h1>
            <p className="mt-2 text-sm text-slate-300">
              Track billed items, download printable invoice PDFs, and manage billing workflows.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${activeTab === 'invoices' ? 'bg-blue-600 text-white shadow' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              Invoice List ({invoices.length})
            </button>
            <button
              onClick={() => setActiveTab('generate')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${activeTab === 'generate' ? 'bg-blue-600 text-white shadow' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              Generate from PO ({pos.length})
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'invoices' ? (
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Issued Invoices</h2>
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-6 py-4">Invoice Number</th>
                  <th className="px-6 py-4">PO Link</th>
                  <th className="px-6 py-4">Vendor</th>
                  <th className="px-6 py-4">Subtotal</th>
                  <th className="px-6 py-4">Tax (GST)</th>
                  <th className="px-6 py-4">Total Billed</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 font-semibold text-slate-900">{inv.invoiceNumber}</td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{inv.po?.poNumber}</td>
                    <td className="px-6 py-4 text-slate-600">{inv.po?.vendor?.vendorName}</td>
                    <td className="px-6 py-4 text-slate-600">${inv.subtotal.toLocaleString()}</td>
                    <td className="px-6 py-4 text-slate-600">${inv.tax.toLocaleString()}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">${inv.total.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => downloadPDF(inv.id, inv.invoiceNumber)}
                        className="px-3 py-1.5 border border-slate-300 rounded-xl hover:bg-slate-50 font-medium text-slate-700 shadow-sm text-xs transition"
                      >
                        PDF Download
                      </button>
                    </td>
                  </tr>
                ))}
                {!invoices.length && (
                  <tr>
                    <td className="px-6 py-8 text-slate-500 text-center" colSpan={7}>
                      No invoices found. Generate an invoice from a purchase order!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Pending Billing (Uninvoiced POs)</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {pos.map(po => (
              <div key={po.id} className="rounded-2xl border border-slate-200 p-5 space-y-4 hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-slate-900 text-lg">{po.poNumber}</h3>
                    <p className="text-sm text-slate-500">Vendor: {po.vendor?.vendorName}</p>
                  </div>
                  <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded border border-blue-300">
                    PO Issued
                  </span>
                </div>

                <div className="flex justify-between items-center border-t border-b border-slate-100 py-3 text-sm">
                  <div>
                    <span className="text-slate-500">Issued Date:</span>
                    <span className="block font-medium text-slate-800">{new Date(po.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500">Total Billed Amount:</span>
                    <span className="block font-bold text-slate-900">${po.amount.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  disabled={actionLoading}
                  onClick={() => generateInvoice(po.id)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold transition active:scale-[0.98] disabled:opacity-50"
                >
                  {actionLoading ? 'Generating Invoice...' : 'Generate Invoice'}
                </button>
              </div>
            ))}
            {!pos.length && (
              <div className="col-span-2 py-8 text-slate-500 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                No active Purchase Orders are currently awaiting billing.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
