import { Query, Resolver } from '@nestjs/graphql'
import { type UsersService } from './users.service'

@Resolver()
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => String, { name: 'usersStatus', description: 'Users module status' })
  usersStatus(): string {
    return this.usersService.getStatus()
  }
}
