import React, { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'

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
    rating: number | null
  }
  rfq: {
    title: string
  }
}

export default function ApprovalsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [remarks, setRemarks] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // Load Google Fonts for chalkboard/handwriting style
  useEffect(() => {
    const link = document.createElement('link')
    link.href = 'https://fonts.googleapis.com/css2?family=Architects+Daughter&family=Caveat:wght@400;700&display=swap'
    link.rel = 'stylesheet'
    document.head.appendChild(link)
    return () => {
      document.head.removeChild(link)
    }
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const data = await apiFetch('/api/quotations')
      setQuotations(data)
      if (data.length > 0 && !selectedId) {
        setSelectedId(data[0].id)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load quotations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const selectedQuote = quotations.find(q => q.id === selectedId)

  async function handleAction(status: 'APPROVED' | 'REJECTED') {
    if (!selectedId) return
    try {
      setActionLoading(true)
      await apiFetch('/api/approvals', {
        method: 'POST',
        body: JSON.stringify({
          quotationId: selectedId,
          remarks: remarks || 'No remarks provided.',
          status
        })
      })
      alert(`Quotation successfully ${status.toLowerCase()}`)
      setRemarks('')
      await loadData()
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading && quotations.length === 0) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        Loading approval workflows...
      </div>
    )
  }

  if (error && quotations.length === 0) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Selector sidebar for multiple pending quotations */}
      <div className="flex flex-wrap gap-2 mb-4 bg-slate-100 p-3 rounded-2xl">
        <span className="font-semibold text-slate-700 self-center mr-2">Select Quotation:</span>
        {quotations.map(q => (
          <button
            key={q.id}
            onClick={() => setSelectedId(q.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${selectedId === q.id ? 'bg-slate-900 text-white shadow' : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'}`}
          >
            {q.rfq?.title || 'RFQ'} - {q.vendor?.vendorName} (${q.price.toLocaleString()})
          </button>
        ))}
        {quotations.length === 0 && (
          <span className="text-slate-500 text-sm">No quotations available for approval.</span>
        )}
      </div>

      {selectedQuote ? (
        <div className="font-['Architects_Daughter',_cursive] bg-[#0c110f] text-[#e5ece9] p-6 lg:p-8 rounded-3xl border-4 border-[#3c5f50] shadow-2xl relative select-none">
          {/* Top Bar Decoration */}
          <div className="flex items-center justify-between border-b-2 border-[#3c5f50]/40 pb-4 mb-6">
            <h1 className="text-3xl font-bold tracking-wide text-emerald-400">Approval Workflow</h1>
            <div className="h-6 w-6 rounded-full border-2 border-[#e5ece9]/30 flex items-center justify-center text-[10px]">
              ℹ
            </div>
          </div>

          {/* Subtitle Info */}
          <div className="text-lg lg:text-xl font-semibold mb-8 text-[#b8cfc5]">
            RFQ: {selectedQuote.rfq?.title || 'office furniture Q2'} - Vendor: {selectedQuote.vendor?.vendorName || 'Infra Supplies'} - {selectedQuote.price.toLocaleString('en-IN')}
          </div>

          {/* Progress Timeline Stepper */}
          <div className="relative mb-12 px-4">
            <div className="absolute top-[16px] left-[32px] right-[32px] h-[3px] bg-[#3c5f50]/30 z-0"></div>
            
            {/* Stepper Steps */}
            <div className="flex justify-between items-start relative z-10">
              {/* Step 1 */}
              <div className="flex flex-col items-center">
                <div className="w-9 h-9 rounded-full border-2 border-[#e5ece9] bg-[#0c110f] flex items-center justify-center font-bold text-lg text-emerald-400">
                  1
                </div>
                <span className="text-xs lg:text-sm mt-2 text-[#9ab0a5]">Submitted</span>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center">
                <div className="w-9 h-9 rounded-full border-2 border-[#e5ece9] bg-[#0c110f] flex items-center justify-center font-bold text-lg text-emerald-400">
                  2
                </div>
                <span className="text-xs lg:text-sm mt-2 text-[#9ab0a5]">L1 Review</span>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center font-bold text-lg transition-colors ${
                  selectedQuote.status === 'SUBMITTED' 
                    ? 'border-sky-400 text-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.2)]'
                    : selectedQuote.status === 'APPROVED' || selectedQuote.status === 'PO_GENERATED'
                      ? 'border-emerald-400 text-emerald-400'
                      : 'border-red-400 text-red-400'
                }`}>
                  3
                </div>
                <span className={`text-xs lg:text-sm mt-2 font-bold ${
                  selectedQuote.status === 'SUBMITTED' 
                    ? 'text-sky-400' 
                    : selectedQuote.status === 'APPROVED' || selectedQuote.status === 'PO_GENERATED'
                      ? 'text-emerald-400'
                      : 'text-red-400'
                }`}>
                  {selectedQuote.status === 'SUBMITTED' ? 'L2 approval' : selectedQuote.status === 'APPROVED' || selectedQuote.status === 'PO_GENERATED' ? 'L2 Approved' : 'L2 Rejected'}
                </span>
              </div>

              {/* Step 4 */}
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center font-bold text-lg ${
                  selectedQuote.status === 'PO_GENERATED'
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-[#3c5f50]/40 text-[#9ab0a5]/40'
                }`}>
                  4
                </div>
                <span className={`text-xs lg:text-sm mt-2 ${
                  selectedQuote.status === 'PO_GENERATED'
                    ? 'text-emerald-400 font-bold'
                    : 'text-[#9ab0a5]/40'
                }`}>Generate PO</span>
              </div>
            </div>
          </div>

          {/* Columns */}
          <div className="grid gap-8 lg:grid-cols-2">
            
            {/* Left Column: Approval Chain and Remarks */}
            <div className="space-y-6">
              <div>
                <h3 className="text-[#8eb19f] text-sm uppercase tracking-wider font-bold mb-4">Approval Chain</h3>
                
                <div className="space-y-4">
                  {/* L1 Approver */}
                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full border-2 border-emerald-400 bg-emerald-950/20 flex items-center justify-center shrink-0 mt-1">
                      <span className="text-emerald-400 text-sm">✓</span>
                    </div>
                    <div>
                      <div className="font-semibold text-lg">Rahul Mehta (Procurement head)</div>
                      <div className="text-sm text-[#9ab0a5] mt-0.5">Approved on May 20, 10:32 Am</div>
                    </div>
                  </div>

                  <div className="border-t border-[#3c5f50]/30 w-full my-2"></div>

                  {/* L2 Approver */}
                  <div className="flex gap-4 items-start">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${
                      selectedQuote.status === 'SUBMITTED'
                        ? 'border-sky-400 bg-sky-950/20'
                        : selectedQuote.status === 'APPROVED' || selectedQuote.status === 'PO_GENERATED'
                          ? 'border-emerald-400 bg-emerald-950/20'
                          : 'border-red-400 bg-red-950/20'
                    }`}>
                      {selectedQuote.status === 'SUBMITTED' ? (
                        <span className="text-sky-400 text-sm">🕒</span>
                      ) : selectedQuote.status === 'APPROVED' || selectedQuote.status === 'PO_GENERATED' ? (
                        <span className="text-emerald-400 text-sm">✓</span>
                      ) : (
                        <span className="text-red-400 text-sm">✗</span>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-lg">Priya Shah (Finance manager)</div>
                      <div className="text-sm text-[#9ab0a5] mt-0.5">
                        {selectedQuote.status === 'SUBMITTED' ? (
                          'Awaiting / Assigned May 21'
                        ) : selectedQuote.status === 'APPROVED' || selectedQuote.status === 'PO_GENERATED' ? (
                          'Approved'
                        ) : (
                          'Rejected'
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Remarks Field */}
              <div className="space-y-3 pt-4 border-t border-[#3c5f50]/30">
                <label className="text-[#8eb19f] text-sm uppercase tracking-wider font-bold block">
                  Approval Remarks
                </label>
                {selectedQuote.status === 'SUBMITTED' ? (
                  <textarea
                    rows={4}
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                    placeholder="Add your comments or conditions...."
                    className="w-full bg-[#16211e] border-2 border-[#3c5f50] rounded-2xl p-4 text-[#e5ece9] placeholder-[#9ab0a5]/50 focus:outline-none focus:border-emerald-400 transition-colors font-sans"
                  />
                ) : (
                  <div className="w-full bg-[#16211e]/40 border border-[#3c5f50]/40 rounded-2xl p-4 text-[#9ab0a5] italic font-sans">
                    Remarks: {selectedQuote.notes || 'No remarks recorded.'}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Quotation Summary Card & Action Buttons */}
            <div className="flex flex-col justify-between space-y-6">
              
              {/* Quotations Summary Card */}
              <div className="bg-[#101715] border-2 border-[#3c5f50] rounded-3xl p-6 shadow-inner space-y-4">
                <h3 className="text-[#8eb19f] text-sm uppercase tracking-wider font-bold mb-2">Quotations Summary</h3>
                
                <div className="grid grid-cols-[100px_1fr] gap-x-4 gap-y-3 text-lg">
                  <span className="text-[#9ab0a5]">Vendor:</span>
                  <span className="font-semibold text-[#e5ece9] text-right">{selectedQuote.vendor?.vendorName || 'Infra Supplies PVT Ltd'}</span>

                  <span className="text-[#9ab0a5]">Total:</span>
                  <span className="font-semibold text-emerald-400 text-right">
                    {(selectedQuote.price + (selectedQuote.price * (selectedQuote.gst / 100))).toLocaleString('en-IN')}
                  </span>

                  <span className="text-[#9ab0a5]">Delivery:</span>
                  <span className="font-semibold text-[#e5ece9] text-right">{selectedQuote.deliveryDays} days</span>

                  <span className="text-[#9ab0a5]">Rating:</span>
                  <span className="font-semibold text-yellow-400 text-right">
                    {selectedQuote.vendor?.rating ? `${selectedQuote.vendor.rating}/5` : '4.5/5'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              {selectedQuote.status === 'SUBMITTED' ? (
                <div className="flex gap-4">
                  <button
                    onClick={() => handleAction('APPROVED')}
                    disabled={actionLoading}
                    className="flex-1 bg-transparent hover:bg-emerald-950/20 border-2 border-emerald-400 hover:border-emerald-300 text-emerald-400 hover:text-emerald-300 py-3 rounded-2xl text-lg font-bold tracking-wider transition duration-200 active:scale-95 disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleAction('REJECTED')}
                    disabled={actionLoading}
                    className="flex-1 bg-transparent hover:bg-red-950/20 border-2 border-red-400 hover:border-red-300 text-red-400 hover:text-red-300 py-3 rounded-2xl text-lg font-bold tracking-wider transition duration-200 active:scale-95 disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'Reject'}
                  </button>
                </div>
              ) : (
                <div className="text-center py-4 bg-[#16211e]/20 border border-[#3c5f50]/20 rounded-2xl">
                  <span className={`text-xl font-bold tracking-wider uppercase ${
                    selectedQuote.status === 'APPROVED' || selectedQuote.status === 'PO_GENERATED' ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    Quotation {selectedQuote.status}
                  </span>
                </div>
              )}
            </div>

          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
          No quotation selected. Use the top selector bar to choose a quotation.
        </div>
      )}
    </div>
  )
}
