import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { Role, Country } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(
    name: string,
    email: string,
    passwordRaw: string,
    role: Role,
    country?: Country | null,
  ) {
    const existing = await this.usersService.findOneByEmail(email);
    if (existing) {
      throw new ConflictException('Email already exists');
    }
    const passwordHash = await bcrypt.hash(passwordRaw, 10);
    const user = await this.usersService.create({
      name,
      email,
      passwordHash,
      role,
      country: country || null,
    });
    const token = this.jwtService.sign({
      sub: user.id,
      role: user.role,
      country: user.country,
    });
    return { token, user };
  }

  async login(email: string, passwordRaw: string) {
    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isPasswordValid = await bcrypt.compare(
      passwordRaw,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const token = this.jwtService.sign({
      sub: user.id,
      role: user.role,
      country: user.country,
    });
    return { token, user };
  }

  async validateUserById(id: string) {
    return this.usersService.findOneById(id);
  }
}
