import React from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { clearToken } from '../lib/api'

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/vendors', label: 'Vendors' },
  { to: '/rfqs', label: "RFQ's" },
  { to: '/quotations', label: 'Quotations' },
  { to: '/approvals', label: 'Approvals' },
  { to: '/purchase-orders', label: 'Purchase orders' },
  { to: '/invoices', label: 'Invoices' },
  { to: '/reports', label: 'Reports' },
  { to: '/activity-logs', label: 'Activity' },
  { to: '/exports', label: 'Exports' }
]

export default function AppShell() {
  const navigate = useNavigate()

  function logout() {
    clearToken()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-slate-950 text-slate-100 lg:flex lg:flex-col">
          <div className="border-b border-slate-800 px-6 py-6">
            <div className="text-xs uppercase tracking-[0.35em] text-blue-300">VendorBridge</div>
            <div className="mt-2 text-xl font-semibold">Smart Procurement</div>
            <p className="mt-2 text-sm text-slate-400">Hackathon demo shell</p>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `block rounded-xl px-4 py-3 text-sm font-medium transition ${isActive ? 'bg-blue-500 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="border-t border-slate-800 p-4 text-sm text-slate-400">
            ERP procurement workflow
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex items-center justify-between gap-4 px-4 py-4 lg:px-6">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600 lg:hidden">VendorBridge</div>
                <div className="text-sm text-slate-500">Smart Procurement. Faster Decisions.</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 sm:inline-flex">Live APIs</span>
                <span className="hidden rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 sm:inline-flex">Responsive</span>
                <button onClick={logout} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50">Logout</button>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 lg:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
