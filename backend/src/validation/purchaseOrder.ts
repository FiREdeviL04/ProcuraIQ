import { z } from 'zod'

export const createPurchaseOrderSchema = z.object({
  quotationId: z.string().min(1)
})

export type CreatePOSchema = z.infer<typeof createPurchaseOrderSchema>
