import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { Permissions } from '../auth/decorators/permissions.decorator'
import { Public } from '../auth/decorators/public.decorator'
import { type AuthenticatedUser } from '../auth/types/auth-context.type'
import { BillingService } from './billing.service'
import { CreatePaymentInput } from './dto/create-payment.input'
import { InvoiceConnectionOutput } from './dto/invoice-connection.output'
import { InvoiceFilterInput } from './dto/invoice-filter.input'
import { InvoiceSortInput } from './dto/invoice-sort.input'
import { InvoiceOutput } from './dto/invoice.output'
import { PaymentOutput } from './dto/payment.output'

@Resolver()
export class BillingResolver {
  constructor(private readonly billingService: BillingService) {}

  @Public()
  @Query(() => String, { name: 'billingStatus', description: 'Billing module status' })
  billingStatus(): string {
    return this.billingService.getStatus()
  }

  @Permissions('billing:read')
  @Query(() => InvoiceConnectionOutput, {
    name: 'invoices',
    description: "A page of the caller's visible invoices (Admin: all; Partner: own as vendor).",
  })
  invoices(
    @CurrentUser() user: AuthenticatedUser,
    // See OrdersResolver.orders for why every arg admits null as well as
    // undefined — same exactOptionalPropertyTypes reasoning applies here.
    @Args('first', { type: () => Int, nullable: true }) first?: number | null,
    @Args('after', { type: () => String, nullable: true }) after?: string | null,
    @Args('filter', { type: () => InvoiceFilterInput, nullable: true })
    filter?: InvoiceFilterInput | null,
    @Args('sort', { type: () => InvoiceSortInput, nullable: true }) sort?: InvoiceSortInput | null,
  ): Promise<InvoiceConnectionOutput> {
    return this.billingService.findInvoices(user, {
      first: first ?? undefined,
      after: after ?? undefined,
      filter: filter ?? undefined,
      sort: sort ?? undefined,
    })
  }

  @Permissions('billing:read')
  @Query(() => InvoiceOutput, {
    name: 'invoice',
    description:
      'A single invoice by id, scoped to the caller. Throws NOT_FOUND rather than returning ' +
      'null on a missing or out-of-scope id.',
  })
  invoice(
    @CurrentUser() user: AuthenticatedUser,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<InvoiceOutput> {
    return this.billingService.findInvoiceById(user, id)
  }

  @Permissions('billing:manage')
  @Mutation(() => PaymentOutput, {
    name: 'recordPayment',
    description:
      'Records a Payment against an Invoice (v1 has no live payment gateway — "recorded, not ' +
      'processed", per docs/roadmap.md). Idempotent on input.idempotencyKey: a retry with the ' +
      'same key returns the original Payment rather than creating a duplicate.',
  })
  recordPayment(
    @CurrentUser() user: AuthenticatedUser,
    @Args('input') input: CreatePaymentInput,
  ): Promise<PaymentOutput> {
    return this.billingService.recordPayment(user, input)
  }

  @Permissions('billing:manage')
  @Mutation(() => InvoiceOutput, {
    name: 'voidInvoice',
    description:
      'Voids a DRAFT/ISSUED Invoice with zero recorded Payments (docs/domain-model.md § Invoice).',
  })
  voidInvoice(
    @CurrentUser() user: AuthenticatedUser,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<InvoiceOutput> {
    return this.billingService.voidInvoice(user, id)
  }

  @Permissions('billing:read')
  @Query(() => String, {
    name: 'exportInvoicesCsv',
    description: "A CSV export of the caller's visible invoices, matching the given filter.",
  })
  exportInvoicesCsv(
    @CurrentUser() user: AuthenticatedUser,
    @Args('filter', { type: () => InvoiceFilterInput, nullable: true })
    filter?: InvoiceFilterInput | null,
  ): Promise<string> {
    return this.billingService.exportInvoicesCsv(user, filter ?? undefined)
  }

  @Permissions('billing:read')
  @Query(() => String, {
    name: 'invoicePdf',
    description: 'A base64-encoded PDF rendering of a single invoice by id.',
  })
  invoicePdf(
    @CurrentUser() user: AuthenticatedUser,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<string> {
    return this.billingService.getInvoicePdf(user, id)
  }
}
