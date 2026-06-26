import { Test, TestingModule } from '@nestjs/testing';
import { RestaurantsService } from './restaurants.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role, Country } from '@prisma/client';

describe('RestaurantsService', () => {
  let service: RestaurantsService;
  let prisma: PrismaService;

  const mockRestaurants = [
    { id: '1', name: 'Spice Garden', country: Country.INDIA, description: 'Desc', imageUrl: 'Img', isActive: true },
    { id: '2', name: 'Burger Palace', country: Country.AMERICA, description: 'Desc', imageUrl: 'Img', isActive: true },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestaurantsService,
        {
          provide: PrismaService,
          useValue: {
            restaurant: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<RestaurantsService>(RestaurantsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('ADMIN sees restaurants from both countries', async () => {
    const adminUser = { id: 'admin-id', role: Role.ADMIN, country: null, name: 'Nick Fury', email: 'nf@shield.gov', passwordHash: 'hash', createdAt: new Date(), updatedAt: new Date() };
    jest.spyOn(prisma.restaurant, 'findMany').mockResolvedValue(mockRestaurants);

    const result = await service.findAll(adminUser);
    expect(result).toHaveLength(2);
    expect(prisma.restaurant.findMany).toHaveBeenCalledWith({ include: { menuItems: true } });
  });

  it('MANAGER (India) sees only Indian restaurants', async () => {
    const managerIn = { id: 'mgr-id', role: Role.MANAGER, country: Country.INDIA, name: 'Marvel', email: 'cm@shield.gov', passwordHash: 'hash', createdAt: new Date(), updatedAt: new Date() };
    jest.spyOn(prisma.restaurant, 'findMany').mockResolvedValue([mockRestaurants[0]]);

    const result = await service.findAll(managerIn);
    expect(result).toHaveLength(1);
    expect(result[0].country).toBe(Country.INDIA);
    expect(prisma.restaurant.findMany).toHaveBeenCalledWith({
      where: { country: Country.INDIA },
      include: { menuItems: true },
    });
  });

  it('MEMBER (America) sees only American restaurants', async () => {
    const memberUs = { id: 'mem-id', role: Role.MEMBER, country: Country.AMERICA, name: 'Travis', email: 't@shield.gov', passwordHash: 'hash', createdAt: new Date(), updatedAt: new Date() };
    jest.spyOn(prisma.restaurant, 'findMany').mockResolvedValue([mockRestaurants[1]]);

    const result = await service.findAll(memberUs);
    expect(result).toHaveLength(1);
    expect(result[0].country).toBe(Country.AMERICA);
    expect(prisma.restaurant.findMany).toHaveBeenCalledWith({
      where: { country: Country.AMERICA },
      include: { menuItems: true },
    });
  });
});
