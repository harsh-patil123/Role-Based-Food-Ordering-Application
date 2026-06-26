import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role, Country, OrderStatus } from '@prisma/client';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: PrismaService;

  const mockUserMember = { id: 'member-id', role: Role.MEMBER, country: Country.INDIA, name: 'Thanos', email: 't@shield.gov', passwordHash: 'hash', createdAt: new Date(), updatedAt: new Date() };
  const mockUserManager = { id: 'manager-id', role: Role.MANAGER, country: Country.INDIA, name: 'Marvel', email: 'cm@shield.gov', passwordHash: 'hash', createdAt: new Date(), updatedAt: new Date() };
  const mockUserOther = { id: 'other-id', role: Role.MEMBER, country: Country.INDIA, name: 'Thor', email: 'thor@shield.gov', passwordHash: 'hash', createdAt: new Date(), updatedAt: new Date() };

  const mockRestaurant = { id: 'rest-id', name: 'Spice Garden', country: Country.INDIA, description: 'Desc', imageUrl: 'Img', isActive: true };
  const mockMenuItem = { id: 'menu-item-id', name: 'Biryani', price: 300, description: 'Spiced', imageUrl: 'Img', isAvailable: true, restaurantId: 'rest-id' };
  const mockOrder = {
    id: 'order-id',
    userId: 'member-id',
    restaurantId: 'rest-id',
    status: OrderStatus.PENDING,
    totalAmount: 0.0,
    restaurant: mockRestaurant,
  };
  const mockPaymentMethod = { id: 'pm-id', type: 'CARD', label: 'Visa', isDefault: true, userId: 'member-id' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: {
            restaurant: {
              findUnique: jest.fn(),
            },
            order: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            menuItem: {
              findUnique: jest.fn(),
            },
            orderItem: {
              create: jest.fn(),
              delete: jest.fn(),
              findUnique: jest.fn(),
            },
            paymentMethod: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('any role can createOrder', async () => {
    jest.spyOn(prisma.restaurant, 'findUnique').mockResolvedValue(mockRestaurant as any);
    jest.spyOn(prisma.order, 'create').mockResolvedValue(mockOrder as any);

    const result = await service.create('rest-id', mockUserMember);
    expect(result).toEqual(mockOrder);
  });

  it('any role can addItemToOrder', async () => {
    jest.spyOn(prisma.order, 'findUnique').mockResolvedValue(mockOrder as any);
    jest.spyOn(prisma.menuItem, 'findUnique').mockResolvedValue(mockMenuItem as any);
    jest.spyOn(prisma.orderItem, 'create').mockResolvedValue({} as any);
    jest.spyOn(prisma.order, 'update').mockResolvedValue({ ...mockOrder, totalAmount: 300.0 } as any);

    const result = await service.addItem('order-id', 'menu-item-id', 1, mockUserMember);
    expect(result.totalAmount).toBe(300.0);
  });

  it('MEMBER cannot placeOrder → throws ForbiddenException', async () => {
    await expect(
      service.place('order-id', 'pm-id', mockUserMember),
    ).rejects.toThrow(ForbiddenException);
  });

  it('MEMBER cannot cancelOrder → throws ForbiddenException', async () => {
    await expect(
      service.cancel('order-id', mockUserMember),
    ).rejects.toThrow(ForbiddenException);
  });

  it('MANAGER can placeOrder', async () => {
    const managerOrder = { ...mockOrder, userId: 'manager-id' };
    jest.spyOn(prisma.order, 'findUnique').mockResolvedValue(managerOrder as any);
    jest.spyOn(prisma.paymentMethod, 'findUnique').mockResolvedValue(mockPaymentMethod as any);
    jest.spyOn(prisma.order, 'update').mockResolvedValue({ ...managerOrder, status: OrderStatus.PLACED } as any);

    const result = await service.place('order-id', 'pm-id', mockUserManager);
    expect(result.status).toBe(OrderStatus.PLACED);
  });

  it('MANAGER can cancelOrder', async () => {
    const managerOrder = { ...mockOrder, userId: 'manager-id' };
    jest.spyOn(prisma.order, 'findUnique').mockResolvedValue(managerOrder as any);
    jest.spyOn(prisma.order, 'update').mockResolvedValue({ ...managerOrder, status: OrderStatus.CANCELLED } as any);

    const result = await service.cancel('order-id', mockUserManager);
    expect(result.status).toBe(OrderStatus.CANCELLED);
  });

  it("user cannot access another user's order → throws ForbiddenException", async () => {
    jest.spyOn(prisma.order, 'findUnique').mockResolvedValue(mockOrder as any);

    // Thor (mockUserOther) trying to access Thanos (mockUserMember)'s order
    await expect(
      service.findOne('order-id', mockUserOther),
    ).rejects.toThrow(ForbiddenException);
  });
});
