import React, { useEffect, useState } from 'react'

function downloadCSV(rows: any[], filename = 'activity-logs.csv') {
  if (!rows || !rows.length) return
  const header = ['createdAt', 'action', 'entityType', 'entityId', 'userId']
  const lines = [header.join(',')]
  rows.forEach(r => {
    const vals = [new Date(r.createdAt).toISOString(), r.action, r.entityType, r.entityId, r.userId]
    lines.push(vals.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
  })
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function printLogs(rows: any[]) {
  const w = window.open('', '_blank')
  if (!w) return
  const style = `<style>body{font-family: Arial, Helvetica, sans-serif; padding:20px} table{width:100%; border-collapse: collapse} th,td{border:1px solid #ddd;padding:8px} th{background:#f3f4f6}</style>`
  const html = `<!doctype html><html><head><meta charset="utf-8">${style}</head><body><h2>Activity Logs</h2><table><thead><tr><th>Date</th><th>Action</th><th>Entity</th><th>Entity ID</th><th>User</th></tr></thead><tbody>${rows.map(r => `<tr><td>${new Date(r.createdAt).toLocaleString()}</td><td>${r.action}</td><td>${r.entityType}</td><td>${r.entityId}</td><td>${r.userId}</td></tr>`).join('')}</tbody></table></body></html>`
  w.document.write(html)
  w.document.close()
  w.focus()
  w.print()
  // optionally close window after print
}

export default function ActivityLogs() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState({ userId: '', entityType: '', q: '' })

  async function load() {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('pageSize', String(pageSize))
    if (filters.userId) params.set('userId', filters.userId)
    if (filters.entityType) params.set('entityType', filters.entityType)
    if (filters.q) params.set('q', filters.q)
    const res = await fetch(`/api/activity-logs?${params.toString()}`, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('vendorbridge_token') } })
    const json = await res.json()
    setLogs(json.data || [])
    setTotal(json.total || 0)
    setLoading(false)
  }

  useEffect(() => { load() }, [page, pageSize])

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Activity Logs</h2>

      <div className="mb-4 flex gap-2">
        <input placeholder="User ID" value={filters.userId} onChange={e => setFilters(f => ({ ...f, userId: e.target.value }))} className="border p-2 rounded" />
        <input placeholder="Entity Type" value={filters.entityType} onChange={e => setFilters(f => ({ ...f, entityType: e.target.value }))} className="border p-2 rounded" />
        <input placeholder="Search action" value={filters.q} onChange={e => setFilters(f => ({ ...f, q: e.target.value }))} className="border p-2 rounded" />
        <button className="bg-slate-700 text-white px-4 rounded" onClick={() => { setPage(1); load() }}>Filter</button>
        <button className="bg-blue-600 text-white px-4 rounded" onClick={() => downloadCSV(logs)}>Export CSV</button>
        <button className="bg-gray-600 text-white px-4 rounded" onClick={() => printLogs(logs)}>Export PDF</button>
      </div>

      <div className="mb-2">Total: {total}</div>

      {loading && <div className="text-slate-500">Loading...</div>}

      <div className="space-y-2">
        {logs.length === 0 && !loading && <div className="text-slate-500">No activity found.</div>}
        {logs.map(l => (
          <div key={l.id} className="bg-white p-4 rounded shadow-sm">
            <div className="text-sm text-slate-600">{new Date(l.createdAt).toLocaleString()}</div>
            <div className="font-medium">{l.action}</div>
            <div className="text-xs text-slate-500">{l.entityType} • {l.entityId} • User: {l.userId}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button className="px-3 py-1 border rounded" onClick={() => { if (page>1) setPage(p => p-1) }}>Previous</button>
        <div>Page {page}</div>
        <button className="px-3 py-1 border rounded" onClick={() => { if (page * pageSize < total) setPage(p => p+1) }}>Next</button>
        <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }} className="ml-4 border p-1 rounded">
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>
    </div>
  )
}
