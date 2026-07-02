import { Query, Resolver } from '@nestjs/graphql'
import { CurrentUser } from './decorators/current-user.decorator'
import { Public } from './decorators/public.decorator'
import { CurrentUserOutput } from './dto/current-user.output'
import { AuthService } from './auth.service'
import { type AuthenticatedUser } from './types/auth-context.type'

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Query(() => String, { name: 'authStatus', description: 'Auth module status' })
  authStatus(): string {
    return this.authService.getStatus()
  }

  @Query(() => CurrentUserOutput, {
    name: 'me',
    description: 'The authenticated caller and their resolved roles/permissions.',
  })
  me(@CurrentUser() user: AuthenticatedUser): CurrentUserOutput {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      roles: user.roles,
      permissions: user.permissions,
    }
  }
}
