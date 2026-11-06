import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaymentStatus, RaffleStatus, TicketStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TicketsService } from '../tickets/tickets.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { MercadoPagoAdapter } from './mercado-pago.adapter';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ticketsService: TicketsService,
    private readonly mercadoPago: MercadoPagoAdapter,
  ) {}

  async checkout(dto: CreateCheckoutDto) {
    const numbers = this.ticketsService.ensureUniqueNumbers(dto.numbers);
    const reservationMinutes = Number(process.env.RESERVATION_MINUTES ?? 15);
    const expiresAt = new Date(Date.now() + reservationMinutes * 60 * 1000);

    const raffle = await this.prisma.raffle.findUnique({
      where: { id: dto.raffleId },
    });

    if (!raffle) {
      throw new NotFoundException('Sorteio não encontrado.');
    }

    if (raffle.status !== RaffleStatus.OPEN || raffle.endsAt.getTime() <= Date.now()) {
      throw new BadRequestException('Este sorteio não está aceitando compras.');
    }

    const invalidNumber = numbers.find((number) => number > raffle.totalNumbers);
    if (invalidNumber) {
      throw new BadRequestException(`O número ${invalidNumber} não existe neste sorteio.`);
    }

    const amount = Number(raffle.ticketPrice) * numbers.length;
    const buyerEmail = dto.buyerEmail.toLowerCase();

    const payment = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.ticket.updateMany({
        where: {
          raffleId: raffle.id,
          number: { in: numbers },
          status: TicketStatus.AVAILABLE,
        },
        data: {
          status: TicketStatus.RESERVED,
          reservedUntil: expiresAt,
          buyerName: dto.buyerName,
          buyerEmail,
          buyerPhone: dto.buyerPhone,
        },
      });

      if (updated.count !== numbers.length) {
        throw new ConflictException('Um ou mais números acabaram de ser reservados. Escolha outros.');
      }

      const created = await tx.payment.create({
        data: {
          raffleId: raffle.id,
          amount,
          payerName: dto.buyerName,
          payerEmail: buyerEmail,
          payerPhone: dto.buyerPhone,
          expiresAt,
        },
      });

      await tx.ticket.updateMany({
        where: {
          raffleId: raffle.id,
          number: { in: numbers },
        },
        data: { paymentId: created.id },
      });

      return created;
    });

    try {
      const pix = await this.mercadoPago.createPixCharge({
        amount,
        description: `${raffle.title} — números ${numbers.join(', ')}`,
        payerEmail: buyerEmail,
        expiresAt,
        externalReference: payment.id,
      });

      return this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          providerPaymentId: pix.providerPaymentId,
          pixCopyPaste: pix.pixCopyPaste,
          pixQrCodeBase64: pix.pixQrCodeBase64,
        },
        include: {
          tickets: {
            select: { number: true, status: true },
            orderBy: { number: 'asc' },
          },
          raffle: {
            select: { id: true, title: true, prize: true },
          },
        },
      });
    } catch {
      await this.releasePayment(payment.id);
      throw new BadRequestException('Não foi possível gerar o PIX agora. Tente novamente.');
    }
  }

  async getById(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        tickets: {
          select: { number: true, status: true },
          orderBy: { number: 'asc' },
        },
        raffle: {
          select: { id: true, title: true, prize: true },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Pagamento não encontrado.');
    }

    return {
      ...payment,
      sandbox: !this.mercadoPago.isConfigured(),
    };
  }

  async simulateApprove(id: string) {
    if (this.mercadoPago.isConfigured()) {
      throw new BadRequestException('Confirmação manual só está disponível no modo teste.');
    }

    return this.approvePayment(id);
  }

  async sandboxConfirm(id: string) {
    if (this.mercadoPago.isConfigured()) {
      throw new BadRequestException('No ambiente com Mercado Pago, o pagamento é confirmado pelo PIX.');
    }

    return this.approvePayment(id);
  }

  async handleWebhook(payload: { data?: { id?: string }; type?: string }) {
    const providerPaymentId = payload.data?.id;
    if (!providerPaymentId || payload.type !== 'payment') {
      return { ignored: true };
    }

    const payment = await this.prisma.payment.findFirst({
      where: { providerPaymentId: String(providerPaymentId) },
    });

    if (!payment) {
      return { ignored: true };
    }

    return this.approvePayment(payment.id);
  }

  private async approvePayment(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: { tickets: true },
    });

    if (!payment) {
      throw new NotFoundException('Pagamento não encontrado.');
    }

    if (payment.status === PaymentStatus.APPROVED) {
      return payment;
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Este pagamento não pode mais ser confirmado.');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.ticket.updateMany({
        where: { paymentId: id },
        data: {
          status: TicketStatus.PAID,
          reservedUntil: null,
        },
      });

      return tx.payment.update({
        where: { id },
        data: {
          status: PaymentStatus.APPROVED,
          approvedAt: new Date(),
        },
        include: {
          tickets: {
            select: { number: true, status: true },
            orderBy: { number: 'asc' },
          },
          raffle: {
            select: { id: true, title: true, prize: true },
          },
        },
      });
    });
  }

  private async releasePayment(paymentId: string) {
    await this.prisma.$transaction([
      this.prisma.ticket.updateMany({
        where: { paymentId, status: TicketStatus.RESERVED },
        data: {
          status: TicketStatus.AVAILABLE,
          reservedUntil: null,
          buyerName: null,
          buyerEmail: null,
          buyerPhone: null,
          paymentId: null,
        },
      }),
      this.prisma.payment.update({
        where: { id: paymentId },
        data: { status: PaymentStatus.CANCELLED },
      }),
    ]);
  }
}
