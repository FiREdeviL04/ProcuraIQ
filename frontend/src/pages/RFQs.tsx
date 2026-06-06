import React, { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'

const defaultForm = {
  title: '',
  description: '',
  quantity: 1,
  expectedBudget: '',
  deadline: '',
  vendorIds: ''
}

export default function RFQs() {
  const [rfqs, setRFQs] = useState<any[]>([])
  const [vendors, setVendors] = useState<any[]>([])
  const [filters, setFilters] = useState({ q: '', status: '' })
  const [form, setForm] = useState(defaultForm)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [rfqData, vendorData] = await Promise.all([
        apiFetch(`/api/rfqs${filters.q ? `?q=${encodeURIComponent(filters.q)}` : ''}`),
        apiFetch('/api/vendors')
      ])
      const filtered = filters.status ? rfqData.filter((item: any) => item.status === filters.status) : rfqData
      setRFQs(filtered)
      setVendors(vendorData)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function createRFQ(e: React.FormEvent) {
    e.preventDefault()
    try {
      const payload = {
        title: form.title,
        description: form.description,
        quantity: Number(form.quantity),
        expectedBudget: form.expectedBudget ? Number(form.expectedBudget) : undefined,
        deadline: form.deadline,
        vendorIds: form.vendorIds ? form.vendorIds.split(',').map(v => v.trim()).filter(Boolean) : []
      }
      await apiFetch('/api/rfqs', { method: 'POST', body: JSON.stringify(payload) })
      setForm(defaultForm)
      await load()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const statusPills = ['Draft', 'Open', 'Closed', 'Approved', 'Rejected']

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-blue-200">RFQ Workbench</div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight">Request for quotation management</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">Create RFQs, assign vendors, track status, and set up procurement demand.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/10 p-4">
              <div className="text-slate-300">Total Vendors</div>
              <div className="mt-1 text-2xl font-semibold">{vendors.length}</div>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <div className="text-slate-300">RFQs</div>
              <div className="mt-1 text-2xl font-semibold">{rfqs.length}</div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">RFQ list</h2>
              <p className="text-sm text-slate-500">Search and filter procurement requests.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {statusPills.map(item => (
                <button
                  key={item}
                  onClick={() => setFilters(prev => ({ ...prev, status: prev.status === item ? '' : item }))}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${filters.status === item ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <input value={filters.q} onChange={e => setFilters(prev => ({ ...prev, q: e.target.value }))} placeholder="Search RFQ title" className="w-full rounded-xl border border-slate-200 px-4 py-2 outline-none focus:border-blue-500" />
            <button onClick={load} className="rounded-xl bg-slate-900 px-4 py-2 font-medium text-white">Search</button>
          </div>

          {loading && <div className="mt-6 text-slate-500">Loading RFQs…</div>}
          {error && <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}

          <div className="mt-4 space-y-3">
            {rfqs.map(rfq => (
              <article key={rfq.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">{rfq.title}</h3>
                    <p className="mt-1 text-sm text-slate-500">{rfq.description || 'No description provided.'}</p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{rfq.status}</span>
                </div>
                <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
                  <div><div className="text-xs uppercase tracking-wide text-slate-400">Quantity</div>{rfq.quantity}</div>
                  <div><div className="text-xs uppercase tracking-wide text-slate-400">Deadline</div>{new Date(rfq.deadline).toLocaleDateString()}</div>
                  <div><div className="text-xs uppercase tracking-wide text-slate-400">Budget</div>{rfq.expectedBudget ? `$${Number(rfq.expectedBudget).toLocaleString()}` : '-'}</div>
                </div>
              </article>
            ))}
            {!rfqs.length && !loading && <div className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">No RFQs found.</div>}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Create RFQ</h2>
          <p className="text-sm text-slate-500">Publish requests and assign multiple vendors.</p>

          <form onSubmit={createRFQ} className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1 text-sm sm:col-span-2">
                <span className="font-medium text-slate-700">RFQ Title</span>
                <input value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-2 outline-none focus:border-blue-500" />
              </label>
              <label className="space-y-1 text-sm sm:col-span-2">
                <span className="font-medium text-slate-700">Description</span>
                <textarea value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} rows={4} className="w-full rounded-xl border border-slate-200 px-4 py-2 outline-none focus:border-blue-500" />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Quantity</span>
                <input type="number" min={1} value={form.quantity} onChange={e => setForm(prev => ({ ...prev, quantity: Number(e.target.value) }))} className="w-full rounded-xl border border-slate-200 px-4 py-2 outline-none focus:border-blue-500" />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Expected Budget</span>
                <input type="number" min={0} value={form.expectedBudget} onChange={e => setForm(prev => ({ ...prev, expectedBudget: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-2 outline-none focus:border-blue-500" />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Deadline</span>
                <input type="date" value={form.deadline} onChange={e => setForm(prev => ({ ...prev, deadline: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-2 outline-none focus:border-blue-500" />
              </label>
              <label className="space-y-1 text-sm sm:col-span-2">
                <span className="font-medium text-slate-700">Vendor Assignments</span>
                <input value={form.vendorIds} onChange={e => setForm(prev => ({ ...prev, vendorIds: e.target.value }))} placeholder="Comma-separated vendor IDs" className="w-full rounded-xl border border-slate-200 px-4 py-2 outline-none focus:border-blue-500" />
                <div className="text-xs text-slate-400">Use vendor IDs from the Vendors page. Example: id1, id2</div>
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" className="rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700">Save RFQ</button>
              <button type="button" onClick={() => setForm(defaultForm)} className="rounded-xl border border-slate-200 px-5 py-2.5 font-medium text-slate-700 hover:bg-slate-50">Reset</button>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}
