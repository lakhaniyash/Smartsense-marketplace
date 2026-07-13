import { z } from 'zod'

// `partnerId` is only required for an Admin caller — GenerateBillingReportInput's
// own doc comment: "Required for an Admin caller...; ignored for a Partner
// caller, whose own partnerId always wins" — so the schema is built per-caller
// rather than hardcoding one shape. Validates before the mutation is sent, a
// UX optimization, not the security/correctness boundary (the resolver's own
// `Required` scope-resolution variant is that), per docs/architecture.md §
// Forms.
export function buildGenerateBillingReportFormSchema(isAdmin: boolean) {
  return z
    .object({
      partnerId: z.string().trim().optional(),
      periodStart: z.string().min(1, 'Start date is required'),
      periodEnd: z.string().min(1, 'End date is required'),
    })
    .refine((values) => !isAdmin || (values.partnerId ?? '').trim() !== '', {
      message: 'Partner ID is required',
      path: ['partnerId'],
    })
    .refine((values) => new Date(values.periodStart) <= new Date(values.periodEnd), {
      message: 'Start date must be before the end date',
      path: ['periodEnd'],
    })
}

export type GenerateBillingReportFormValues = z.infer<
  ReturnType<typeof buildGenerateBillingReportFormSchema>
>
