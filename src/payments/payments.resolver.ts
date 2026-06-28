import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentMethod } from '../common/graphql-types';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, PaymentType } from '@prisma/client';

@Resolver()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class PaymentsResolver {
  constructor(private paymentsService: PaymentsService) {}

  @Query(() => [PaymentMethod])
  async myPaymentMethods(@CurrentUser() user: any) {
    return this.paymentsService.findMyPaymentMethods(user);
  }

  @Mutation(() => PaymentMethod)
  async addPaymentMethod(
    @Args('type', { type: () => PaymentType }) type: PaymentType,
    @Args('label') label: string,
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.add(type, label, user);
  }

  @Mutation(() => PaymentMethod)
  async updatePaymentMethod(
    @Args('id') id: string,
    @Args('label') label: string,
    @Args('isDefault') isDefault: boolean,
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.update(id, label, isDefault, user);
  }

  @Mutation(() => Boolean)
  async deletePaymentMethod(@Args('id') id: string, @CurrentUser() user: any) {
    return this.paymentsService.delete(id, user);
  }
}
