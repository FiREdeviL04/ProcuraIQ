import { z } from 'zod'

export const createRfqSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  quantity: z.number().int().positive(),
  expectedBudget: z.number().positive().optional(),
  deadline: z.string().refine(s => !Number.isNaN(Date.parse(s)), { message: 'Invalid date' }),
  vendorIds: z.array(z.string()).optional()
})

export type CreateRfqInput = z.infer<typeof createRfqSchema>
