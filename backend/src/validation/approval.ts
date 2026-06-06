import { z } from 'zod'

export const createApprovalSchema = z.object({
  quotationId: z.string().min(1),
  remarks: z.string().optional(),
  status: z.enum(['APPROVED', 'REJECTED'])
})

export type CreateApprovalInput = z.infer<typeof createApprovalSchema>
