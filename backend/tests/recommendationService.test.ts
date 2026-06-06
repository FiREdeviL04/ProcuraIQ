import test from 'node:test'
import assert from 'node:assert/strict'
import { recommendVendor } from '../src/services/recommendationService'

test('recommendVendor picks the best overall quotation', () => {
  const result = recommendVendor([
    { id: 'q1', price: 100, gst: 18, deliveryDays: 10, vendor: { id: 'v1', vendorName: 'Alpha', rating: 4.2 } },
    { id: 'q2', price: 90, gst: 18, deliveryDays: 7, vendor: { id: 'v2', vendorName: 'Beta', rating: 4.8 } }
  ])

  assert.ok(result)
  assert.equal(result?.vendor, 'Beta')
})
