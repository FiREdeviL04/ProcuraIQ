import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch, setToken, getToken } from '../lib/api'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@vendorbridge.local')
  const [password, setPassword] = useState('password')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (getToken()) {
      navigate('/dashboard')
    }
  }, [navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const result = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      })
      setToken(result.token)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.22),_transparent_34%),linear-gradient(180deg,_#f8fafc_0%,_#e2e8f0_100%)]">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center px-4 py-10 lg:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-2xl shadow-slate-900/20 lg:p-12">
            <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-blue-200">VendorBridge</div>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight lg:text-6xl">Smart Procurement. Faster Decisions.</h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300 lg:text-base">
              Run the complete procurement lifecycle with RFQs, quotations, approvals, purchase orders, invoicing, analytics, and real-time notifications.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {['RFQ workflow', 'Vendor analytics', 'Approval automation'].map(item => (
                <div key={item} className="rounded-2xl bg-white/10 p-4 text-sm text-slate-100">{item}</div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] bg-white p-8 shadow-2xl shadow-slate-900/10 ring-1 ring-slate-200 lg:p-10">
            <div className="mb-8">
              <div className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Sign in</div>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Welcome back</h2>
              <p className="mt-2 text-sm text-slate-500">Use the demo admin account to enter the dashboard.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block space-y-2 text-sm">
                <span className="font-medium text-slate-700">Email</span>
                <input value={email} onChange={e => setEmail(e.target.value)} type="email" className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
              </label>

              <label className="block space-y-2 text-sm">
                <span className="font-medium text-slate-700">Password</span>
                <input value={password} onChange={e => setPassword(e.target.value)} type="password" className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
              </label>

              {error ? <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

              <div className="flex items-center justify-between text-sm text-slate-600">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  Remember me
                </label>
                <button type="button" className="font-medium text-blue-600 hover:text-blue-700">Forgot password?</button>
              </div>

              <button disabled={loading} className="w-full rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70">
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <div className="mt-8 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              Demo credentials: <span className="font-medium text-slate-900">admin@vendorbridge.local</span> / <span className="font-medium text-slate-900">password</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
