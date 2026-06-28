import { Test, TestingModule } from '@nestjs/testing';
import { RestaurantsService } from '../restaurants/restaurants.service';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role, Country, OrderStatus } from '@prisma/client';
import { ForbiddenException } from '@nestjs/common';

describe('Re-BAC Country Restrictions', () => {
  let restaurantsService: RestaurantsService;
  let ordersService: OrdersService;
  let prisma: PrismaService;

  const mockManagerIndia = {
    id: 'mgr-in',
    role: Role.MANAGER,
    country: Country.INDIA,
    name: 'Marvel',
    email: 'cm@shield.gov',
    passwordHash: 'hash',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const mockMemberAmerica = {
    id: 'mem-us',
    role: Role.MEMBER,
    country: Country.AMERICA,
    name: 'Travis',
    email: 't@shield.gov',
    passwordHash: 'hash',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const mockAdmin = {
    id: 'admin',
    role: Role.ADMIN,
    country: null,
    name: 'Nick Fury',
    email: 'nf@shield.gov',
    passwordHash: 'hash',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRestaurantIndia = {
    id: 'rest-in',
    name: 'Spice Garden',
    country: Country.INDIA,
    description: 'Desc',
    imageUrl: 'Img',
    isActive: true,
  };
  const mockRestaurantAmerica = {
    id: 'rest-us',
    name: 'Burger Palace',
    country: Country.AMERICA,
    description: 'Desc',
    imageUrl: 'Img',
    isActive: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestaurantsService,
        OrdersService,
        {
          provide: PrismaService,
          useValue: {
            restaurant: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
            },
            order: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            menuItem: {
              findUnique: jest.fn(),
            },
            paymentMethod: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    restaurantsService = module.get<RestaurantsService>(RestaurantsService);
    ordersService = module.get<OrdersService>(OrdersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('Indian MANAGER cannot view American restaurant', async () => {
    jest
      .spyOn(prisma.restaurant, 'findUnique')
      .mockResolvedValue(mockRestaurantAmerica);

    await expect(
      restaurantsService.findOne('rest-us', mockManagerIndia),
    ).rejects.toThrow(ForbiddenException);
  });

  it('American MEMBER cannot place order at Indian restaurant', async () => {
    jest
      .spyOn(prisma.restaurant, 'findUnique')
      .mockResolvedValue(mockRestaurantIndia);

    await expect(
      ordersService.create('rest-in', mockMemberAmerica),
    ).rejects.toThrow(ForbiddenException);
  });

  it('ADMIN can view and act on both countries freely', async () => {
    jest
      .spyOn(prisma.restaurant, 'findUnique')
      .mockResolvedValue(mockRestaurantIndia);
    const restResult = await restaurantsService.findOne('rest-in', mockAdmin);
    expect(restResult).toEqual(mockRestaurantIndia);

    jest
      .spyOn(prisma.restaurant, 'findUnique')
      .mockResolvedValue(mockRestaurantAmerica);
    jest.spyOn(prisma.order, 'create').mockResolvedValue({
      id: 'new-order-us',
      restaurant: mockRestaurantAmerica,
    } as any);

    const orderResult = await ordersService.create('rest-us', mockAdmin);
    expect(orderResult.restaurant).toEqual(mockRestaurantAmerica);
  });
});
