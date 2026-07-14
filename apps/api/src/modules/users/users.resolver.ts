import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql'
import { AuditLogEntryOutput } from '../../common/graphql/audit-log-entry.output'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { Permissions } from '../auth/decorators/permissions.decorator'
import { Public } from '../auth/decorators/public.decorator'
import { type AuthenticatedUser } from '../auth/types/auth-context.type'
import { CreateRoleInput } from './dto/create-role.input'
import { RoleOutput } from './dto/role.output'
import { UpdateRolePermissionsInput } from './dto/update-role-permissions.input'
import { UserConnectionOutput } from './dto/user-connection.output'
import { UserFilterInput } from './dto/user-filter.input'
import { UserSortInput } from './dto/user-sort.input'
import { UserOutput } from './dto/user.output'
import { UsersService } from './users.service'

@Resolver()
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Query(() => String, { name: 'usersStatus', description: 'Users module status' })
  usersStatus(): string {
    return this.usersService.getStatus()
  }

  @Permissions('users:read')
  @Query(() => UserConnectionOutput, {
    name: 'users',
    description:
      'A page of platform users (Admin-only global resource — no ownership scoping, ' +
      'docs/authorization.md § Users row).',
  })
  users(
    @CurrentUser() user: AuthenticatedUser,
    // See CustomersResolver.customers for why every arg admits null as well
    // as undefined — same exactOptionalPropertyTypes reasoning applies here.
    @Args('first', { type: () => Int, nullable: true }) first?: number | null,
    @Args('after', { type: () => String, nullable: true }) after?: string | null,
    @Args('filter', { type: () => UserFilterInput, nullable: true })
    filter?: UserFilterInput | null,
    @Args('sort', { type: () => UserSortInput, nullable: true })
    sort?: UserSortInput | null,
  ): Promise<UserConnectionOutput> {
    return this.usersService.findUsers(user, {
      first: first ?? undefined,
      after: after ?? undefined,
      filter: filter ?? undefined,
      sort: sort ?? undefined,
    })
  }

  @Permissions('users:read')
  @Query(() => UserOutput, {
    name: 'userById',
    description:
      'A single user by id. Throws NOT_FOUND rather than returning null on a missing id.',
  })
  userById(
    @CurrentUser() user: AuthenticatedUser,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<UserOutput> {
    return this.usersService.findUserById(user, id)
  }

  @Permissions('users:read')
  @Query(() => [AuditLogEntryOutput], {
    name: 'userAuditLog',
    description: "A User's activity timeline, most recent first.",
  })
  userAuditLog(
    @CurrentUser() user: AuthenticatedUser,
    @Args('userId', { type: () => ID }) userId: string,
  ): Promise<AuditLogEntryOutput[]> {
    return this.usersService.getAuditLog(user, userId)
  }

  @Permissions('users:read')
  @Query(() => [RoleOutput], {
    name: 'roles',
    description: 'Every assignable Role with its granted Permissions.',
  })
  roles(): Promise<RoleOutput[]> {
    return this.usersService.listRoles()
  }

  @Permissions('users:manage')
  @Mutation(() => RoleOutput, {
    name: 'createRole',
    description:
      'Creates a custom Role granted the given existing Permission keys. Does not create new ' +
      'Permission definitions (out of v1 scope, docs/domain-model.md § Permission).',
  })
  createRole(
    @CurrentUser() user: AuthenticatedUser,
    @Args('input') input: CreateRoleInput,
  ): Promise<RoleOutput> {
    return this.usersService.createRole(user, input)
  }

  @Permissions('users:manage')
  @Mutation(() => RoleOutput, {
    name: 'updateRolePermissions',
    description:
      "Replaces a Role's entire granted-Permission set. Rejected for a system Role " +
      '(Admin/Partner/Customer).',
  })
  updateRolePermissions(
    @CurrentUser() user: AuthenticatedUser,
    @Args('input') input: UpdateRolePermissionsInput,
  ): Promise<RoleOutput> {
    return this.usersService.updateRolePermissions(user, input)
  }

  @Permissions('users:manage')
  @Mutation(() => RoleOutput, {
    name: 'archiveRole',
    description:
      'Soft-archives a custom Role (prevents new assignment; does not strip existing grants). ' +
      'Rejected for a system Role (Admin/Partner/Customer).',
  })
  archiveRole(
    @CurrentUser() user: AuthenticatedUser,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<RoleOutput> {
    return this.usersService.archiveRole(user, id)
  }
}
