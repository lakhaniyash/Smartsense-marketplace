import { Query, Resolver } from '@nestjs/graphql'
import { Public } from '../auth/decorators/public.decorator'
import { UsersService } from './users.service'

@Resolver()
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Query(() => String, { name: 'usersStatus', description: 'Users module status' })
  usersStatus(): string {
    return this.usersService.getStatus()
  }
}
