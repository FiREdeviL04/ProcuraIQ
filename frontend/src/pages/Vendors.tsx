import React, { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../lib/api'

const emptyForm = {
  vendorName: '',
  category: '',
  gstNumber: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
  country: ''
}

export default function Vendors() {
  const [vendors, setVendors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All Vendors')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await apiFetch(`/api/vendors${search ? `?q=${encodeURIComponent(search)}` : ''}`)
      setVendors(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    if (status === 'All Vendors') return vendors
    return vendors.filter(v => v.status === status.replace(' ', '').toUpperCase())
  }, [vendors, status])

  function resetForm() {
    setForm(emptyForm)
    setEditingId(null)
  }

  async function saveVendor(e: React.FormEvent) {
    e.preventDefault()
    try {
      const method = editingId ? 'PUT' : 'POST'
      const path = editingId ? `/api/vendors/${editingId}` : '/api/vendors'
      await apiFetch(path, { method, body: JSON.stringify(form) })
      resetForm()
      await load()
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function removeVendor(id: string) {
    if (!confirm('Delete this vendor?')) return
    await apiFetch(`/api/vendors/${id}`, { method: 'DELETE' })
    await load()
  }

  function editVendor(vendor: any) {
    setEditingId(vendor.id)
    setForm({
      vendorName: vendor.vendorName ?? '',
      category: vendor.category ?? '',
      gstNumber: vendor.gstNumber ?? '',
      contactPerson: vendor.contactPerson ?? '',
      phone: vendor.phone ?? '',
      email: vendor.email ?? '',
      address: vendor.address ?? '',
      country: vendor.country ?? ''
    })
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Vendor Management</h1>
            <p className="text-sm text-slate-500">Search, filter, create, edit, and remove vendors.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendor, GST, category" className="rounded-xl border border-slate-200 px-4 py-2 outline-none focus:border-blue-500" />
            <button onClick={load} className="rounded-xl bg-slate-900 px-4 py-2 font-medium text-white">Search</button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {['All Vendors', 'ACTIVE', 'PENDING', 'BLOCKED'].map(item => (
            <button
              key={item}
              onClick={() => setStatus(item)}
              className={`rounded-full px-4 py-2 font-medium transition ${status === item ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Vendor Table</h2>
              <p className="text-sm text-slate-500">{filtered.length} vendors shown</p>
            </div>
          </div>

          {loading ? <div className="mt-6 text-slate-500">Loading vendors…</div> : null}
          {error ? <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-3">Vendor</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">GST</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Rating</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filtered.map(vendor => (
                  <tr key={vendor.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">{vendor.vendorName}</td>
                    <td className="px-4 py-3 text-slate-600">{vendor.category || '-'}</td>
                    <td className="px-4 py-3 text-slate-600">{vendor.gstNumber || '-'}</td>
                    <td className="px-4 py-3 text-slate-600">{vendor.contactPerson || '-'}<div className="text-xs text-slate-400">{vendor.email || vendor.phone || ''}</div></td>
                    <td className="px-4 py-3 text-slate-600">{vendor.rating ?? 0}</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{vendor.status}</span></td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-2">
                        <button onClick={() => editVendor(vendor)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">Edit</button>
                        <button onClick={() => removeVendor(vendor.id)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!filtered.length && !loading && <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No vendors found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <form onSubmit={saveVendor} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{editingId ? 'Edit Vendor' : 'Vendor Form'}</h2>
              <p className="text-sm text-slate-500">Capture vendor master data and contact details.</p>
            </div>
            {editingId ? <button type="button" onClick={resetForm} className="text-sm font-medium text-slate-500 hover:text-slate-900">Cancel</button> : null}
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {[
              ['vendorName', 'Vendor Name'],
              ['category', 'Category'],
              ['gstNumber', 'GST Number'],
              ['contactPerson', 'Contact Person'],
              ['phone', 'Phone'],
              ['email', 'Email'],
              ['country', 'Country']
            ].map(([key, label]) => (
              <label key={key} className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">{label}</span>
                <input value={(form as any)[key]} onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-2 outline-none focus:border-blue-500" />
              </label>
            ))}
            <label className="sm:col-span-2 space-y-1 text-sm">
              <span className="font-medium text-slate-700">Address</span>
              <textarea value={form.address} onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))} rows={4} className="w-full rounded-xl border border-slate-200 px-4 py-2 outline-none focus:border-blue-500" />
            </label>
          </div>

          <div className="mt-5 flex gap-3">
            <button type="submit" className="rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700">
              {editingId ? 'Update Vendor' : 'Save Vendor'}
            </button>
            <button type="button" onClick={resetForm} className="rounded-xl border border-slate-200 px-5 py-2.5 font-medium text-slate-700 hover:bg-slate-50">Reset</button>
          </div>
        </form>
      </section>
    </div>
  )
}
