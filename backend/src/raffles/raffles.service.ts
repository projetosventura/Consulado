import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, RaffleStatus, TicketStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRaffleDto } from './dto/create-raffle.dto';
import { DrawRaffleDto } from './dto/draw-raffle.dto';
import { removeUploadedFile, saveRaffleImage } from './uploads';

const publicRaffleSelect = {
  id: true,
  title: true,
  description: true,
  prize: true,
  imageUrl: true,
  ticketPrice: true,
  totalNumbers: true,
  status: true,
  startsAt: true,
  endsAt: true,
} satisfies Prisma.RaffleSelect;

@Injectable()
export class RafflesService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublic() {
    const raffles = await this.prisma.raffle.findMany({
      where: { status: { in: [RaffleStatus.OPEN, RaffleStatus.CLOSED, RaffleStatus.DRAWN] } },
      orderBy: { createdAt: 'desc' },
      select: {
        ...publicRaffleSelect,
        tickets: {
          select: { status: true },
        },
        winners: {
          include: {
            ticket: {
              select: { number: true, buyerName: true },
            },
          },
        },
      },
    });

    return raffles.map((raffle) => this.withCounters(raffle));
  }

  async getPublicById(id: string) {
    const raffle = await this.prisma.raffle.findUnique({
      where: { id },
      include: {
        tickets: {
          orderBy: { number: 'asc' },
          select: {
            id: true,
            number: true,
            status: true,
          },
        },
        winners: {
          include: {
            ticket: {
              select: { number: true, buyerName: true },
            },
          },
        },
      },
    });

    if (!raffle) {
      throw new NotFoundException('Sorteio não encontrado.');
    }

    return this.withCounters(raffle);
  }

  async listAdmin() {
    const raffles = await this.prisma.raffle.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        tickets: { select: { status: true } },
        winners: {
          include: {
            ticket: { select: { number: true, buyerName: true, buyerEmail: true } },
          },
        },
        _count: { select: { payments: true } },
      },
    });

    return raffles.map((raffle) => this.withCounters(raffle));
  }

  async getAdminById(id: string) {
    const raffle = await this.prisma.raffle.findUnique({
      where: { id },
      include: {
        tickets: {
          orderBy: { number: 'asc' },
          include: {
            payment: {
              select: { id: true, status: true, amount: true },
            },
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
        winners: {
          include: {
            ticket: {
              select: { number: true, buyerName: true, buyerEmail: true, buyerPhone: true },
            },
          },
        },
      },
    });

    if (!raffle) {
      throw new NotFoundException('Sorteio não encontrado.');
    }

    return this.withCounters(raffle);
  }

  async create(dto: CreateRaffleDto, image: Express.Multer.File) {
    const endsAt = new Date(dto.endsAt);
    if (endsAt.getTime() <= Date.now()) {
      throw new BadRequestException('A data de encerramento precisa ser futura.');
    }

    const imageUrl = await saveRaffleImage(image);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const raffle = await tx.raffle.create({
          data: {
            title: dto.title,
            description: dto.description,
            prize: dto.prize,
            imageUrl,
            ticketPrice: dto.ticketPrice,
            totalNumbers: dto.totalNumbers,
            endsAt,
            status: RaffleStatus.OPEN,
          },
        });

        await tx.ticket.createMany({
          data: Array.from({ length: dto.totalNumbers }, (_, index) => ({
            raffleId: raffle.id,
            number: index + 1,
          })),
        });

        return raffle;
      });
    } catch (error) {
      await removeUploadedFile(imageUrl);
      throw error;
    }
  }

  async updateImage(id: string, image: Express.Multer.File) {
    const raffle = await this.ensureRaffle(id);
    const imageUrl = await saveRaffleImage(image);

    try {
      const updated = await this.prisma.raffle.update({
        where: { id },
        data: { imageUrl },
      });
      if (raffle.imageUrl) {
        await removeUploadedFile(raffle.imageUrl);
      }
      return updated;
    } catch (error) {
      await removeUploadedFile(imageUrl);
      throw error;
    }
  }

  async remove(id: string) {
    const raffle = await this.ensureRaffle(id);

    await this.prisma.$transaction([
      this.prisma.winner.deleteMany({ where: { raffleId: id } }),
      this.prisma.ticket.deleteMany({ where: { raffleId: id } }),
      this.prisma.payment.deleteMany({ where: { raffleId: id } }),
      this.prisma.raffle.delete({ where: { id } }),
    ]);

    if (raffle.imageUrl) {
      await removeUploadedFile(raffle.imageUrl);
    }

    return { id };
  }

  async close(id: string) {
    const raffle = await this.ensureRaffle(id);
    if (raffle.status === RaffleStatus.DRAWN) {
      throw new BadRequestException('Este sorteio já foi realizado.');
    }

    return this.prisma.raffle.update({
      where: { id },
      data: { status: RaffleStatus.CLOSED },
    });
  }

  async draw(id: string, dto: DrawRaffleDto) {
    const winnersCount = dto.winnersCount ?? 1;
    const raffle = await this.prisma.raffle.findUnique({
      where: { id },
      include: {
        tickets: { where: { status: TicketStatus.PAID } },
        winners: true,
      },
    });

    if (!raffle) {
      throw new NotFoundException('Sorteio não encontrado.');
    }

    if (raffle.winners.length > 0) {
      throw new BadRequestException('Os ganhadores deste sorteio já foram definidos.');
    }

    const paidTickets = raffle.tickets;
    if (paidTickets.length === 0) {
      throw new BadRequestException('Não há números pagos para sortear.');
    }

    if (winnersCount > paidTickets.length) {
      throw new BadRequestException('Há menos números pagos do que ganhadores solicitados.');
    }

    const shuffled = [...paidTickets].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, winnersCount);

    const winners = await this.prisma.$transaction(async (tx) => {
      await tx.raffle.update({
        where: { id },
        data: { status: RaffleStatus.DRAWN },
      });

      return Promise.all(
        selected.map((ticket) =>
          tx.winner.create({
            data: {
              raffleId: id,
              ticketId: ticket.id,
            },
            include: {
              ticket: {
                select: { number: true, buyerName: true, buyerEmail: true },
              },
            },
          }),
        ),
      );
    });

    return winners;
  }

  async listWinners() {
    return this.prisma.winner.findMany({
      orderBy: { drawnAt: 'desc' },
      include: {
        raffle: {
          select: { id: true, title: true, prize: true },
        },
        ticket: {
          select: { number: true, buyerName: true },
        },
      },
    });
  }

  private async ensureRaffle(id: string) {
    const raffle = await this.prisma.raffle.findUnique({ where: { id } });
    if (!raffle) {
      throw new NotFoundException('Sorteio não encontrado.');
    }
    return raffle;
  }

  private withCounters<T extends { tickets: Array<{ status: TicketStatus }> }>(raffle: T) {
    const available = raffle.tickets.filter((ticket) => ticket.status === TicketStatus.AVAILABLE).length;
    const reserved = raffle.tickets.filter((ticket) => ticket.status === TicketStatus.RESERVED).length;
    const paid = raffle.tickets.filter((ticket) => ticket.status === TicketStatus.PAID).length;

    return {
      ...raffle,
      counters: { available, reserved, paid },
    };
  }
}
