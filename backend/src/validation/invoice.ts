import { z } from 'zod'

export const createInvoiceSchema = z.object({
  poId: z.string().min(1)
})

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>
