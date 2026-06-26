import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Order } from '../common/graphql-types';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Resolver()
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersResolver {
  constructor(private ordersService: OrdersService) {}

  @Query(() => [Order])
  async myOrders(@CurrentUser() user: any) {
    return this.ordersService.findMyOrders(user);
  }

  @Query(() => Order)
  async order(
    @Args('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.findOne(id, user);
  }

  @Mutation(() => Order)
  async createOrder(
    @Args('restaurantId') restaurantId: string,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.create(restaurantId, user);
  }

  @Mutation(() => Order)
  async addItemToOrder(
    @Args('orderId') orderId: string,
    @Args('menuItemId') menuItemId: string,
    @Args('qty', { type: () => Int }) qty: number,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.addItem(orderId, menuItemId, qty, user);
  }

  @Mutation(() => Order)
  async removeItemFromOrder(
    @Args('orderId') orderId: string,
    @Args('orderItemId') orderItemId: string,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.removeItem(orderId, orderItemId, user);
  }

  @Mutation(() => Order)
  @Roles(Role.ADMIN, Role.MANAGER)
  async placeOrder(
    @Args('orderId') orderId: string,
    @Args('paymentMethodId') paymentMethodId: string,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.place(orderId, paymentMethodId, user);
  }

  @Mutation(() => Order)
  @Roles(Role.ADMIN, Role.MANAGER)
  async cancelOrder(
    @Args('orderId') orderId: string,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.cancel(orderId, user);
  }
}
