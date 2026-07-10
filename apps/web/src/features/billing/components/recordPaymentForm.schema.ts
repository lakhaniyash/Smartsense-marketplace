import { z } from 'zod'
import { PaymentMethod } from '@lib/graphql/__generated__/graphql'

// A decimal string with up to 2 fraction digits — the server's Decimal
// scalar serializes/parses as a plain string end-to-end (see codegen.ts's
// `scalars: { Decimal: 'string' }`), so this form never converts the amount
// to a Number before sending it to the mutation.
const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/

// Validates before the mutation is sent — a UX optimization, not the
// security/correctness boundary (class-validator on CreatePaymentInput,
// server-side, is that). Kept beside RecordPaymentForm per
// docs/architecture.md § Forms.
export const recordPaymentFormSchema = z.object({
  amount: z
    .string()
    .trim()
    .min(1, 'Amount is required')
    .refine((value) => AMOUNT_PATTERN.test(value) && Number(value) > 0, {
      message: 'Enter a positive amount with up to 2 decimal places',
    }),
  method: z.nativeEnum(PaymentMethod),
  externalTransactionId: z
    .string()
    .trim()
    .min(1, 'External transaction ID is required')
    .max(200, 'External transaction ID is too long'),
})

export type RecordPaymentFormValues = z.infer<typeof recordPaymentFormSchema>
