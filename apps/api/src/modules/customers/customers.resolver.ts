import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { Permissions } from '../auth/decorators/permissions.decorator'
import { Public } from '../auth/decorators/public.decorator'
import { type AuthenticatedUser } from '../auth/types/auth-context.type'
import { CustomersService } from './customers.service'
import { AuditLogEntryOutput } from './dto/audit-log-entry.output'
import { CreateCustomerInput } from './dto/create-customer.input'
import { CustomerConnectionOutput } from './dto/customer-connection.output'
import { CustomerFilterInput } from './dto/customer-filter.input'
import { CustomerSortInput } from './dto/customer-sort.input'
import { CustomerOutput } from './dto/customer.output'
import { UpdateCustomerInput } from './dto/update-customer.input'

@Resolver()
export class CustomersResolver {
  constructor(private readonly customersService: CustomersService) {}

  @Public()
  @Query(() => String, { name: 'customersStatus', description: 'Customers module status' })
  customersStatus(): string {
    return this.customersService.getStatus()
  }

  @Permissions('customers:read')
  @Query(() => CustomerConnectionOutput, {
    name: 'customers',
    description:
      "A page of the caller's visible customers (Admin: all; Partner: only customers with at " +
      'least one Order placed with that Partner).',
  })
  customers(
    @CurrentUser() user: AuthenticatedUser,
    // See CatalogResolver.products for why every arg admits null as well as
    // undefined — same exactOptionalPropertyTypes reasoning applies here.
    @Args('first', { type: () => Int, nullable: true }) first?: number | null,
    @Args('after', { type: () => String, nullable: true }) after?: string | null,
    @Args('filter', { type: () => CustomerFilterInput, nullable: true })
    filter?: CustomerFilterInput | null,
    @Args('sort', { type: () => CustomerSortInput, nullable: true })
    sort?: CustomerSortInput | null,
  ): Promise<CustomerConnectionOutput> {
    return this.customersService.findCustomers(user, {
      first: first ?? undefined,
      after: after ?? undefined,
      filter: filter ?? undefined,
      sort: sort ?? undefined,
    })
  }

  @Permissions('customers:read')
  @Query(() => CustomerOutput, {
    name: 'customerById',
    description:
      'A single customer by id, scoped to the caller, including its billing summary. Throws ' +
      'NOT_FOUND rather than returning null on a missing or out-of-scope id.',
  })
  customerById(
    @CurrentUser() user: AuthenticatedUser,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<CustomerOutput> {
    return this.customersService.findCustomerById(user, id)
  }

  @Permissions('customers:read')
  @Query(() => [AuditLogEntryOutput], {
    name: 'customerAuditLog',
    description: "A Customer's activity timeline, most recent first.",
  })
  customerAuditLog(
    @CurrentUser() user: AuthenticatedUser,
    @Args('customerId', { type: () => ID }) customerId: string,
  ): Promise<AuditLogEntryOutput[]> {
    return this.customersService.getAuditLog(user, customerId)
  }

  @Permissions('customers:write')
  @Mutation(() => CustomerOutput, {
    name: 'createCustomer',
    description: 'Creates a new Customer. Admin-only — see CustomersService.createCustomer.',
  })
  createCustomer(
    @CurrentUser() user: AuthenticatedUser,
    @Args('input') input: CreateCustomerInput,
  ): Promise<CustomerOutput> {
    return this.customersService.createCustomer(user, input)
  }

  @Permissions('customers:write')
  @Mutation(() => CustomerOutput, {
    name: 'updateCustomer',
    description: "Updates a Customer within the caller's scope.",
  })
  updateCustomer(
    @CurrentUser() user: AuthenticatedUser,
    @Args('input') input: UpdateCustomerInput,
  ): Promise<CustomerOutput> {
    return this.customersService.updateCustomer(user, input)
  }

  @Permissions('customers:write')
  @Mutation(() => CustomerOutput, {
    name: 'archiveCustomer',
    description:
      "Suspends a Customer within the caller's scope (soft archive, reversible via activateCustomer).",
  })
  archiveCustomer(
    @CurrentUser() user: AuthenticatedUser,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<CustomerOutput> {
    return this.customersService.archiveCustomer(user, id)
  }

  @Permissions('customers:write')
  @Mutation(() => CustomerOutput, {
    name: 'activateCustomer',
    description: "Reactivates a suspended Customer within the caller's scope.",
  })
  activateCustomer(
    @CurrentUser() user: AuthenticatedUser,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<CustomerOutput> {
    return this.customersService.activateCustomer(user, id)
  }
}
