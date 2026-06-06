type QuotationLike = {
  id: string
  price: number
  gst: number
  deliveryDays: number
  vendor: {
    id: string
    vendorName: string
    rating: number | null
  }
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value))
}

export function recommendVendor(quotations: QuotationLike[]) {
  if (!quotations.length) {
    return null
  }

  const minPrice = Math.min(...quotations.map(q => q.price))
  const maxPrice = Math.max(...quotations.map(q => q.price))
  const minDelivery = Math.min(...quotations.map(q => q.deliveryDays))
  const maxDelivery = Math.max(...quotations.map(q => q.deliveryDays))
  const maxRating = Math.max(...quotations.map(q => q.vendor.rating ?? 0), 5)

  const scored = quotations.map(q => {
    const priceScore = maxPrice === minPrice ? 100 : clamp(((maxPrice - q.price) / (maxPrice - minPrice)) * 100)
    const deliveryScore = maxDelivery === minDelivery ? 100 : clamp(((maxDelivery - q.deliveryDays) / (maxDelivery - minDelivery)) * 100)
    const ratingScore = clamp(((q.vendor.rating ?? 0) / maxRating) * 100)

    const score = Math.round((priceScore * 0.5) + (deliveryScore * 0.3) + (ratingScore * 0.2))
    const reasons: string[] = []
    if (q.price === minPrice) reasons.push('Lowest Price')
    if (q.deliveryDays === minDelivery) reasons.push('Fast Delivery')
    if ((q.vendor.rating ?? 0) >= Math.max(...quotations.map(item => item.vendor.rating ?? 0))) reasons.push('Highest Vendor Rating')

    return {
      vendor: q.vendor.vendorName,
      vendorId: q.vendor.id,
      quotationId: q.id,
      score,
      reasons: reasons.length ? reasons : ['Balanced overall score'],
    }
  })

  scored.sort((a, b) => b.score - a.score)
  return scored[0]
}
