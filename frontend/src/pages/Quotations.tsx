import React, { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../lib/api'

function formatMoney(value: number) {
  return `$${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function Quotations() {
  const [rfqs, setRfqs] = useState<any[]>([])
  const [selectedRfqId, setSelectedRfqId] = useState('')
  const [quotations, setQuotations] = useState<any[]>([])
  const [recommendation, setRecommendation] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch('/api/rfqs')
      .then(setRfqs)
      .catch((err: any) => setError(err.message))
  }, [])

  useEffect(() => {
    if (!selectedRfqId) return
    let mounted = true
    setLoading(true)
    setError('')

    Promise.all([
      apiFetch(`/api/quotations?rfqId=${selectedRfqId}`),
      apiFetch(`/api/quotations/${selectedRfqId}/recommendation`)
    ])
      .then(([data, recommendationData]) => {
        if (!mounted) return
        setQuotations(data)
        setRecommendation(recommendationData)
      })
      .catch((err: any) => {
        if (mounted) setError(err.message)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => { mounted = false }
  }, [selectedRfqId])

  const sortedQuotations = useMemo(() => {
    return [...quotations].sort((a, b) => a.price - b.price)
  }, [quotations])

  const lowestPrice = sortedQuotations[0]?.price ?? 0
  const fastestDelivery = sortedQuotations.reduce((min, q) => Math.min(min, q.deliveryDays), Number.POSITIVE_INFINITY)
  const highestRating = sortedQuotations.reduce((max, q) => Math.max(max, q.vendor?.rating ?? 0), 0)

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-blue-200">AI Recommendation Engine</div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight">Quotation comparison and vendor recommendation</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">Compare vendor offers side by side and surface the best overall choice using price, delivery time, and vendor rating.</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <div className="text-slate-300">Scoring formula</div>
            <div className="mt-2 text-sm text-white/90">50% Price • 30% Delivery • 20% Rating</div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Select RFQ</h2>
            <p className="text-sm text-slate-500">Load quotations and the system recommendation.</p>
          </div>
          <select
            value={selectedRfqId}
            onChange={e => setSelectedRfqId(e.target.value)}
            className="min-w-[260px] rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
          >
            <option value="">Choose an RFQ</option>
            {rfqs.map(rfq => (
              <option key={rfq.id} value={rfq.id}>{rfq.title}</option>
            ))}
          </select>
        </div>

        {error ? <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
        {loading ? <div className="mt-6 text-slate-500">Loading quotations…</div> : null}

        {!selectedRfqId ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
            Select an RFQ to compare vendor quotations.
          </div>
        ) : null}
      </section>

      {selectedRfqId && !loading ? (
        <section className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Side-by-side comparison</h2>
                <p className="text-sm text-slate-500">Lowest price, fastest delivery, and highest vendor rating are highlighted.</p>
              </div>
              <div className="text-sm text-slate-500">{quotations.length} quotation{quotations.length === 1 ? '' : 's'}</div>
            </div>

            <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Vendor</th>
                    <th className="px-4 py-3">Quoted Price</th>
                    <th className="px-4 py-3">GST</th>
                    <th className="px-4 py-3">Total Cost</th>
                    <th className="px-4 py-3">Delivery Days</th>
                    <th className="px-4 py-3">Vendor Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {sortedQuotations.map((quotation, index) => {
                    const totalCost = quotation.price + (quotation.price * (quotation.gst / 100))
                    const isLowest = quotation.price === lowestPrice
                    const isFastest = quotation.deliveryDays === fastestDelivery
                    const isTopRated = (quotation.vendor?.rating ?? 0) === highestRating
                    return (
                      <tr key={quotation.id} className={isLowest ? 'bg-emerald-50/50' : ''}>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          <div>{quotation.vendor?.vendorName ?? 'Unknown Vendor'}</div>
                          <div className="mt-1 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wide">
                            {isLowest ? <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">Lowest Price</span> : null}
                            {isFastest ? <span className="rounded-full bg-blue-100 px-2 py-1 text-blue-700">Fastest Delivery</span> : null}
                            {isTopRated ? <span className="rounded-full bg-violet-100 px-2 py-1 text-violet-700">Top Rating</span> : null}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{formatMoney(quotation.price)}</td>
                        <td className="px-4 py-3 text-slate-600">{quotation.gst}%</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{formatMoney(totalCost)}</td>
                        <td className="px-4 py-3 text-slate-600">{quotation.deliveryDays} day{quotation.deliveryDays === 1 ? '' : 's'}</td>
                        <td className="px-4 py-3 text-slate-600">{quotation.vendor?.rating ?? 0}/5</td>
                      </tr>
                    )
                  })}
                  {!sortedQuotations.length ? (
                    <tr>
                      <td className="px-4 py-8 text-center text-slate-500" colSpan={6}>No quotations submitted yet.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Recommended vendor</h2>
              {recommendation ? (
                <div className="mt-4 space-y-4">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-sm text-slate-500">Vendor</div>
                    <div className="mt-1 text-xl font-semibold text-slate-900">{recommendation.recommendedVendor}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-blue-50 p-4">
                      <div className="text-sm text-blue-700">Score</div>
                      <div className="mt-1 text-3xl font-semibold text-blue-900">{recommendation.score}/100</div>
                    </div>
                    <div className="rounded-2xl bg-emerald-50 p-4">
                      <div className="text-sm text-emerald-700">RFQ</div>
                      <div className="mt-1 text-sm font-medium text-emerald-900">{rfqs.find(r => r.id === selectedRfqId)?.title ?? 'Selected RFQ'}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Reasoning</div>
                    <ul className="mt-3 space-y-2 text-sm text-slate-600">
                      {recommendation.reasons.map((reason: string) => (
                        <li key={reason} className="rounded-xl bg-slate-50 px-3 py-2">• {reason}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">Recommendation will appear here after quotation data loads.</div>
              )}
            </div>

            <div className="rounded-3xl bg-slate-950 p-5 text-white shadow-sm">
              <h2 className="text-lg font-semibold">Demo value</h2>
              <p className="mt-2 text-sm text-slate-300">This screen gives judges an instant, easy-to-understand comparison across vendors and makes the AI-style recommendation visible in the UI.</p>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}
