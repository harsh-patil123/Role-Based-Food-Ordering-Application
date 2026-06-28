import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, Country, OrderStatus, User } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async findMyOrders(user: User) {
    if (user.role === Role.ADMIN) {
      return this.prisma.order.findMany({
        include: {
          restaurant: true,
          orderItems: { include: { menuItem: true } },
          user: true,
        },
      });
    }
    return this.prisma.order.findMany({
      where: {
        userId: user.id,
        restaurant: { country: user.country as Country },
      },
      include: {
        restaurant: true,
        orderItems: { include: { menuItem: true } },
        user: true,
      },
    });
  }

  async findOne(id: string, user: User) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        restaurant: true,
        orderItems: { include: { menuItem: true } },
        user: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (user.role !== Role.ADMIN && order.restaurant.country !== user.country) {
      throw new ForbiddenException('Access denied: country restriction');
    }

    if (user.role !== Role.ADMIN && order.userId !== user.id) {
      throw new ForbiddenException('Access denied: own orders only');
    }

    return order;
  }

  async create(restaurantId: string, user: User) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    if (user.role !== Role.ADMIN && restaurant.country !== user.country) {
      throw new ForbiddenException('Access denied: country restriction');
    }

    return this.prisma.order.create({
      data: {
        userId: user.id,
        restaurantId,
        status: OrderStatus.PENDING,
        totalAmount: 0.0,
      },
      include: {
        restaurant: true,
        orderItems: { include: { menuItem: true } },
        user: true,
      },
    });
  }

  async addItem(
    orderId: string,
    menuItemId: string,
    quantity: number,
    user: User,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { restaurant: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (user.role !== Role.ADMIN && order.restaurant.country !== user.country) {
      throw new ForbiddenException('Access denied: country restriction');
    }

    if (user.role !== Role.ADMIN && order.userId !== user.id) {
      throw new ForbiddenException('Access denied: own orders only');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Cannot add items to a finalized order');
    }

    const menuItem = await this.prisma.menuItem.findUnique({
      where: { id: menuItemId },
    });

    if (!menuItem) {
      throw new NotFoundException('MenuItem not found');
    }

    if (menuItem.restaurantId !== order.restaurantId) {
      throw new BadRequestException(
        'MenuItem does not belong to the restaurant of this order',
      );
    }

    const itemPrice = menuItem.price;
    await this.prisma.orderItem.create({
      data: {
        orderId,
        menuItemId,
        quantity,
        unitPrice: itemPrice,
      },
    });

    const updatedTotal = order.totalAmount + itemPrice * quantity;
    return this.prisma.order.update({
      where: { id: orderId },
      data: { totalAmount: updatedTotal },
      include: {
        restaurant: true,
        orderItems: { include: { menuItem: true } },
        user: true,
      },
    });
  }

  async removeItem(orderId: string, orderItemId: string, user: User) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { restaurant: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (user.role !== Role.ADMIN && order.restaurant.country !== user.country) {
      throw new ForbiddenException('Access denied: country restriction');
    }

    if (user.role !== Role.ADMIN && order.userId !== user.id) {
      throw new ForbiddenException('Access denied: own orders only');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        'Cannot remove items from a finalized order',
      );
    }

    const orderItem = await this.prisma.orderItem.findUnique({
      where: { id: orderItemId },
    });

    if (!orderItem || orderItem.orderId !== orderId) {
      throw new NotFoundException('OrderItem not found in this order');
    }

    const updatedTotal = Math.max(
      0.0,
      order.totalAmount - orderItem.unitPrice * orderItem.quantity,
    );
    await this.prisma.orderItem.delete({
      where: { id: orderItemId },
    });

    return this.prisma.order.update({
      where: { id: orderId },
      data: { totalAmount: updatedTotal },
      include: {
        restaurant: true,
        orderItems: { include: { menuItem: true } },
        user: true,
      },
    });
  }

  async place(orderId: string, paymentMethodId: string, user: User) {
    if (user.role === Role.MEMBER) {
      throw new ForbiddenException('Access denied: insufficient permissions');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { restaurant: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (user.role !== Role.ADMIN && order.restaurant.country !== user.country) {
      throw new ForbiddenException('Access denied: country restriction');
    }

    if (user.role !== Role.ADMIN && order.userId !== user.id) {
      throw new ForbiddenException('Access denied: own orders only');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Order is already placed or cancelled');
    }

    const paymentMethod = await this.prisma.paymentMethod.findUnique({
      where: { id: paymentMethodId },
    });

    if (!paymentMethod) {
      throw new NotFoundException('PaymentMethod not found');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.PLACED },
      include: {
        restaurant: true,
        orderItems: { include: { menuItem: true } },
        user: true,
      },
    });
  }

  async cancel(orderId: string, user: User) {
    if (user.role === Role.MEMBER) {
      throw new ForbiddenException('Access denied: insufficient permissions');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { restaurant: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (user.role !== Role.ADMIN && order.restaurant.country !== user.country) {
      throw new ForbiddenException('Access denied: country restriction');
    }

    if (user.role !== Role.ADMIN && order.userId !== user.id) {
      throw new ForbiddenException('Access denied: own orders only');
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Order is already cancelled');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED },
      include: {
        restaurant: true,
        orderItems: { include: { menuItem: true } },
        user: true,
      },
    });
  }
}
