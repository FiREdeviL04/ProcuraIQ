import { z } from 'zod'

export const dateRangeSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional()
})

export type DateRangeInput = z.infer<typeof dateRangeSchema>
