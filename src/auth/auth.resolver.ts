import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { AuthPayload } from '../common/graphql-types';
import { Role, Country } from '@prisma/client';

@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Mutation(() => AuthPayload)
  async register(
    @Args('name') name: string,
    @Args('email') email: string,
    @Args('password') passwordRaw: string,
    @Args('role', { type: () => Role }) role: Role,
    @Args('country', { type: () => Country, nullable: true })
    country?: Country | null,
  ) {
    return this.authService.register(name, email, passwordRaw, role, country);
  }

  @Mutation(() => AuthPayload)
  async login(
    @Args('email') email: string,
    @Args('password') passwordRaw: string,
  ) {
    return this.authService.login(email, passwordRaw);
  }
}
