import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as supertest from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { Role, Country, OrderStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const request = (supertest as any).default || supertest;

describe('AppController (e2e)', () => {
  let app: INestApplication;

  const passwordHash = bcrypt.hashSync('password123', 10);

  const mockUserMember = {
    id: 'mem-id',
    email: 'thanos@shield.gov',
    passwordHash,
    role: Role.MEMBER,
    country: Country.INDIA,
    name: 'Thanos',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserManager = {
    id: 'mgr-id',
    email: 'captainmarvel@shield.gov',
    passwordHash,
    role: Role.MANAGER,
    country: Country.INDIA,
    name: 'Captain Marvel',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRestaurant = {
    id: 'rest-id',
    name: 'Spice Garden',
    description: 'Desc',
    imageUrl: 'Img',
    country: Country.INDIA,
    isActive: true,
  };

  const mockMenuItem = {
    id: 'item-id',
    name: 'Biryani',
    price: 300,
    description: 'Spiced',
    imageUrl: 'Img',
    isAvailable: true,
    restaurantId: 'rest-id',
  };

  const mockOrder = {
    id: 'order-id',
    userId: 'mgr-id',
    restaurantId: 'rest-id',
    status: OrderStatus.PENDING,
    totalAmount: 0.0,
    restaurant: mockRestaurant,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPaymentMethod = {
    id: 'pm-id',
    type: 'CARD',
    label: 'Visa',
    isDefault: true,
    userId: 'mgr-id',
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.email === 'captainmarvel@shield.gov') return mockUserManager;
        if (where.email === 'thanos@shield.gov') return mockUserMember;
        if (where.id === 'mgr-id') return mockUserManager;
        if (where.id === 'mem-id') return mockUserMember;
        return null;
      }),
      create: jest.fn(),
    },
    restaurant: {
      findMany: jest.fn().mockResolvedValue([mockRestaurant]),
      findUnique: jest.fn().mockResolvedValue(mockRestaurant),
    },
    order: {
      create: jest.fn().mockResolvedValue(mockOrder),
      findUnique: jest.fn().mockResolvedValue(mockOrder),
      update: jest.fn().mockImplementation(({ where, data }) => {
        const status = data.status || mockOrder.status;
        const totalAmount = data.totalAmount !== undefined ? data.totalAmount : mockOrder.totalAmount;
        return { ...mockOrder, status, totalAmount };
      }),
    },
    menuItem: {
      findUnique: jest.fn().mockResolvedValue(mockMenuItem),
    },
    orderItem: {
      create: jest.fn().mockResolvedValue({}),
    },
    paymentMethod: {
      findUnique: jest.fn().mockResolvedValue(mockPaymentMethod),
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  let managerToken = '';
  let memberToken = '';

  it('POST /graphql → login mutation returns token', async () => {
    const query = `
      mutation {
        login(email: "captainmarvel@shield.gov", password: "password123") {
          token
          user {
            id
            email
          }
        }
      }
    `;

    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query })
      .expect(200);

    expect(res.body.data.login).toHaveProperty('token');
    managerToken = res.body.data.login.token;

    // Also fetch member token
    const queryMem = `
      mutation {
        login(email: "thanos@shield.gov", password: "password123") {
          token
        }
      }
    `;
    const resMem = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: queryMem })
      .expect(200);

    memberToken = resMem.body.data.login.token;
  });

  it('POST /graphql → restaurants query (with INDIA manager token) returns only Indian data', async () => {
    const query = `
      query {
        restaurants {
          id
          name
          country
        }
      }
    `;

    const res = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ query })
      .expect(200);

    expect(res.body.data.restaurants).toHaveLength(1);
    expect(res.body.data.restaurants[0].country).toBe(Country.INDIA);
  });

  it('POST /graphql → placeOrder mutation with MEMBER token returns 403', async () => {
    const query = `
      mutation {
        placeOrder(orderId: "order-id", paymentMethodId: "pm-id") {
          id
        }
      }
    `;

    const res = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ query })
      .expect(200);

    expect(res.body.errors).toBeDefined();
    expect(res.body.errors[0].message).toContain('Forbidden');
  });

  it('POST /graphql → addPaymentMethod with MANAGER token returns 403', async () => {
    const query = `
      mutation {
        addPaymentMethod(type: CARD, label: "Visa ending 4242") {
          id
        }
      }
    `;

    const res = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ query })
      .expect(200);

    expect(res.body.errors).toBeDefined();
    expect(res.body.errors[0].message).toContain('Forbidden');
  });

  it('Full happy path: login → createOrder → addItem → placeOrder (as Manager)', async () => {
    // 1. Create order
    const queryCreate = `
      mutation {
        createOrder(restaurantId: "rest-id") {
          id
          status
        }
      }
    `;
    const resCreate = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ query: queryCreate })
      .expect(200);

    expect(resCreate.body.data.createOrder.id).toBe('order-id');

    // 2. Add item to order
    const queryAddItem = `
      mutation {
        addItemToOrder(orderId: "order-id", menuItemId: "item-id", qty: 2) {
          id
          totalAmount
        }
      }
    `;
    const resAdd = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ query: queryAddItem })
      .expect(200);

    expect(resAdd.body.data.addItemToOrder.totalAmount).toBe(600.0);

    // 3. Place order
    const queryPlace = `
      mutation {
        placeOrder(orderId: "order-id", paymentMethodId: "pm-id") {
          id
          status
        }
      }
    `;
    const resPlace = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ query: queryPlace })
      .expect(200);

    expect(resPlace.body.data.placeOrder.status).toBe(OrderStatus.PLACED);
  });
});
