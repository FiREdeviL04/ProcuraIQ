import { z } from 'zod'

export const createQuotationSchema = z.object({
  rfqId: z.string().min(1),
  vendorId: z.string().optional(),
  price: z.number().positive(),
  gst: z.number().min(0),
  deliveryDays: z.number().int().min(0),
  notes: z.string().optional()
})

export type CreateQuotationInput = z.infer<typeof createQuotationSchema>
