import { Query, Resolver } from '@nestjs/graphql'
import { type AuthService } from './auth.service'

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Query(() => String, { name: 'authStatus', description: 'Auth module status' })
  authStatus(): string {
    return this.authService.getStatus()
  }
}
