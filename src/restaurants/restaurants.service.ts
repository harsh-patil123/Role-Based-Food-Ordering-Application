import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, Country, User } from '@prisma/client';

@Injectable()
export class RestaurantsService {
  constructor(private prisma: PrismaService) {}

  async findAll(user: User) {
    if (user.role === Role.ADMIN) {
      return this.prisma.restaurant.findMany({
        include: { menuItems: true },
      });
    }
    return this.prisma.restaurant.findMany({
      where: { country: user.country as Country },
      include: { menuItems: true },
    });
  }

  async findOne(id: string, user: User) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
      include: { menuItems: true },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    if (user.role !== Role.ADMIN && restaurant.country !== user.country) {
      throw new ForbiddenException('Access denied: country restriction');
    }

    return restaurant;
  }

  async findMenuItems(restaurantId: string, user: User) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    if (user.role !== Role.ADMIN && restaurant.country !== user.country) {
      throw new ForbiddenException('Access denied: country restriction');
    }

    return this.prisma.menuItem.findMany({
      where: { restaurantId },
    });
  }

  async findMenuItem(id: string, user: User) {
    const menuItem = await this.prisma.menuItem.findUnique({
      where: { id },
      include: { restaurant: true },
    });

    if (!menuItem) {
      throw new NotFoundException('MenuItem not found');
    }

    if (
      user.role !== Role.ADMIN &&
      menuItem.restaurant.country !== user.country
    ) {
      throw new ForbiddenException('Access denied: country restriction');
    }

    return menuItem;
  }
}
