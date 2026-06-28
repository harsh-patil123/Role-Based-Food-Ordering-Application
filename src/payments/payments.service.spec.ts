import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role, Country, PaymentType } from '@prisma/client';
import { ForbiddenException } from '@nestjs/common';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: PrismaService;

  const mockUserAdmin = {
    id: 'admin-id',
    role: Role.ADMIN,
    country: null,
    name: 'Nick Fury',
    email: 'nf@shield.gov',
    passwordHash: 'hash',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const mockUserManager = {
    id: 'manager-id',
    role: Role.MANAGER,
    country: Country.INDIA,
    name: 'Marvel',
    email: 'cm@shield.gov',
    passwordHash: 'hash',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const mockUserMember = {
    id: 'member-id',
    role: Role.MEMBER,
    country: Country.INDIA,
    name: 'Thanos',
    email: 't@shield.gov',
    passwordHash: 'hash',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPaymentMethod = {
    id: 'pm-id',
    type: PaymentType.CARD,
    label: 'Visa ending 4242',
    isDefault: true,
    userId: 'admin-id',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: PrismaService,
          useValue: {
            paymentMethod: {
              count: jest.fn(),
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('ADMIN can add a payment method', async () => {
    jest.spyOn(prisma.paymentMethod, 'count').mockResolvedValue(0);
    jest
      .spyOn(prisma.paymentMethod, 'create')
      .mockResolvedValue(mockPaymentMethod);

    const result = await service.add(
      PaymentType.CARD,
      'Visa ending 4242',
      mockUserAdmin,
    );
    expect(result).toEqual(mockPaymentMethod);
    expect(prisma.paymentMethod.create).toHaveBeenCalledWith({
      data: {
        type: PaymentType.CARD,
        label: 'Visa ending 4242',
        isDefault: true,
        userId: 'admin-id',
      },
    });
  });

  it('MANAGER cannot add a payment method → throws ForbiddenException', async () => {
    await expect(
      service.add(PaymentType.CARD, 'Visa ending 4242', mockUserManager),
    ).rejects.toThrow(ForbiddenException);
  });

  it('MEMBER cannot add a payment method → throws ForbiddenException', async () => {
    await expect(
      service.add(PaymentType.CARD, 'Visa ending 4242', mockUserMember),
    ).rejects.toThrow(ForbiddenException);
  });
});
