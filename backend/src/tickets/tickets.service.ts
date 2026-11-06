import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TicketStatus } from '@prisma/client';

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.ticket.findMany({
      where: {
        buyerEmail: email.toLowerCase(),
        status: { in: [TicketStatus.RESERVED, TicketStatus.PAID] },
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        raffle: {
          select: { id: true, title: true, prize: true, status: true },
        },
        payment: {
          select: { id: true, status: true, amount: true },
        },
      },
    });
  }

  async releaseExpiredReservations() {
    const now = new Date();

    const expiredPayments = await this.prisma.payment.findMany({
      where: {
        status: 'PENDING',
        expiresAt: { lte: now },
      },
      select: { id: true },
    });

    if (expiredPayments.length === 0) {
      return { released: 0 };
    }

    const paymentIds = expiredPayments.map((payment) => payment.id);

    await this.prisma.$transaction([
      this.prisma.ticket.updateMany({
        where: { paymentId: { in: paymentIds }, status: TicketStatus.RESERVED },
        data: {
          status: TicketStatus.AVAILABLE,
          reservedUntil: null,
          buyerName: null,
          buyerEmail: null,
          buyerPhone: null,
          paymentId: null,
        },
      }),
      this.prisma.payment.updateMany({
        where: { id: { in: paymentIds } },
        data: { status: 'EXPIRED' },
      }),
    ]);

    return { released: paymentIds.length };
  }

  ensureUniqueNumbers(numbers: number[]) {
    const unique = [...new Set(numbers)];
    if (unique.length !== numbers.length) {
      throw new BadRequestException('Há números repetidos na seleção.');
    }
    return unique;
  }
}
