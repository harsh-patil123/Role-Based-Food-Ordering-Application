import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { Role, Country } from '@prisma/client';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUser = {
    id: 'user-id',
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: 'hashed_password',
    role: Role.MEMBER,
    country: Country.INDIA,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findOneByEmail: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mocked_jwt_token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should register a new user and return a JWT', async () => {
    jest.spyOn(usersService, 'findOneByEmail').mockResolvedValue(null);
    jest.spyOn(usersService, 'create').mockResolvedValue(mockUser as any);

    const result = await service.register(
      'Test User',
      'test@example.com',
      'password123',
      Role.MEMBER,
      Country.INDIA,
    );

    expect(result).toHaveProperty('token', 'mocked_jwt_token');
    expect(result.user).toEqual(mockUser);
  });

  it('should throw on duplicate email', async () => {
    jest
      .spyOn(usersService, 'findOneByEmail')
      .mockResolvedValue(mockUser as any);

    await expect(
      service.register(
        'Test User',
        'test@example.com',
        'password123',
        Role.MEMBER,
        Country.INDIA,
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('should login with correct credentials', async () => {
    const hash = await bcrypt.hash('password123', 10);
    const userWithHash = { ...mockUser, passwordHash: hash };

    jest
      .spyOn(usersService, 'findOneByEmail')
      .mockResolvedValue(userWithHash as any);

    const result = await service.login('test@example.com', 'password123');

    expect(result).toHaveProperty('token', 'mocked_jwt_token');
    expect(result.user.email).toBe('test@example.com');
  });

  it('should throw UnauthorizedException on wrong password', async () => {
    const hash = await bcrypt.hash('password123', 10);
    const userWithHash = { ...mockUser, passwordHash: hash };

    jest
      .spyOn(usersService, 'findOneByEmail')
      .mockResolvedValue(userWithHash as any);

    await expect(
      service.login('test@example.com', 'wrong_password'),
    ).rejects.toThrow(UnauthorizedException);
  });
});
