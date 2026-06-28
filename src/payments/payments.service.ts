import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentType, User, Role } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async findMyPaymentMethods(user: User) {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Access denied: insufficient permissions');
    }
    return this.prisma.paymentMethod.findMany({
      where: { userId: user.id },
    });
  }

  async add(type: PaymentType, label: string, user: User) {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Access denied: insufficient permissions');
    }

    const count = await this.prisma.paymentMethod.count({
      where: { userId: user.id },
    });
    const isDefault = count === 0;

    return this.prisma.paymentMethod.create({
      data: {
        type,
        label,
        isDefault,
        userId: user.id,
      },
    });
  }

  async update(id: string, label: string, isDefault: boolean, user: User) {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Access denied: insufficient permissions');
    }

    const pm = await this.prisma.paymentMethod.findUnique({
      where: { id },
    });

    if (!pm || pm.userId !== user.id) {
      throw new NotFoundException('Payment method not found');
    }

    if (isDefault && !pm.isDefault) {
      await this.prisma.paymentMethod.updateMany({
        where: { userId: user.id, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return this.prisma.paymentMethod.update({
      where: { id },
      data: {
        label,
        isDefault,
      },
    });
  }

  async delete(id: string, user: User) {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Access denied: insufficient permissions');
    }

    const pm = await this.prisma.paymentMethod.findUnique({
      where: { id },
    });

    if (!pm || pm.userId !== user.id) {
      throw new NotFoundException('Payment method not found');
    }

    await this.prisma.paymentMethod.delete({
      where: { id },
    });
    return true;
  }
}
