import React, { useState, useEffect } from 'react'

export default function ExportsPage() {
  const [type, setType] = useState('CSV')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [entityType, setEntityType] = useState('')
  const [q, setQ] = useState('')
  const [jobs, setJobs] = useState<any[]>([])

  async function loadJobs() {
    const res = await fetch('/api/exports', { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('vendorbridge_token') } })
    const json = await res.json()
    setJobs(json)
  }

  useEffect(() => { loadJobs() }, [])

  async function schedule() {
    const filters: any = { startDate: startDate || undefined, endDate: endDate || undefined, entityType: entityType || undefined, q: q || undefined }
    const res = await fetch('/api/exports', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('vendorbridge_token') }, body: JSON.stringify({ type, filters }) })
    if (res.ok) {
      await loadJobs()
      alert('Export scheduled')
    } else {
      alert('Failed to schedule')
    }
  }

  async function download(job: any) {
    const res = await fetch(`/api/exports/${job.id}/download`, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('vendorbridge_token') } })
    if (!res.ok) return alert('Not available')
    const json = await res.json()
    window.open(json.url, '_blank')
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Exports</h2>
      <div className="bg-white p-4 rounded mb-4">
        <div className="flex gap-2 mb-2">
          <select value={type} onChange={e => setType(e.target.value)} className="border p-2 rounded">
            <option value="CSV">CSV</option>
            <option value="PDF">PDF</option>
          </select>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border p-2 rounded" />
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border p-2 rounded" />
          <input placeholder="Entity Type" value={entityType} onChange={e => setEntityType(e.target.value)} className="border p-2 rounded" />
          <input placeholder="Search" value={q} onChange={e => setQ(e.target.value)} className="border p-2 rounded" />
          <button className="bg-blue-600 text-white px-4 rounded" onClick={schedule}>Schedule Export</button>
        </div>
      </div>

      <div>
        <h3 className="font-medium mb-2">Export History</h3>
        <div className="space-y-2">
          {jobs.map(j => (
            <div key={j.id} className="bg-white p-3 rounded flex justify-between items-center">
              <div>
                <div className="font-medium">{j.type} • {j.status}</div>
                <div className="text-sm text-slate-500">{new Date(j.createdAt).toLocaleString()}</div>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 border rounded" onClick={() => download(j)}>Download</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
