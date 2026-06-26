import { Resolver, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { Restaurant, MenuItem } from '../common/graphql-types';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Resolver()
@UseGuards(JwtAuthGuard)
export class RestaurantsResolver {
  constructor(private restaurantsService: RestaurantsService) {}

  @Query(() => [Restaurant])
  async restaurants(@CurrentUser() user: any) {
    return this.restaurantsService.findAll(user);
  }

  @Query(() => Restaurant)
  async restaurant(
    @Args('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.restaurantsService.findOne(id, user);
  }

  @Query(() => [MenuItem])
  async menuItems(
    @Args('restaurantId') restaurantId: string,
    @CurrentUser() user: any,
  ) {
    return this.restaurantsService.findMenuItems(restaurantId, user);
  }

  @Query(() => MenuItem)
  async menuItem(
    @Args('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.restaurantsService.findMenuItem(id, user);
  }
}
