import { PrismaClient, TicketStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? 'admin@consulado.local').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? 'admin123';
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: { passwordHash, name: 'Admin Consulado' },
    create: {
      email,
      passwordHash,
      name: 'Admin Consulado',
    },
  });

  const existing = await prisma.raffle.findFirst({
    where: { title: 'Camisa oficial do Grêmio' },
  });

  if (existing) {
    return;
  }

  const endsAt = new Date();
  endsAt.setDate(endsAt.getDate() + 20);

  const raffle = await prisma.raffle.create({
    data: {
      title: 'Camisa oficial do Grêmio',
      description:
        'Rifa beneficente do Consulado do Grêmio de Francisco Beltrão. Toda a arrecadação apoia as ações da organização sem fins lucrativos.',
      prize: 'Camisa oficial do Grêmio 2026',
      ticketPrice: 10,
      totalNumbers: 80,
      status: 'OPEN',
      endsAt,
    },
  });

  await prisma.ticket.createMany({
    data: Array.from({ length: 80 }, (_, index) => ({
      raffleId: raffle.id,
      number: index + 1,
    })),
  });

  const payment = await prisma.payment.create({
    data: {
      raffleId: raffle.id,
      status: 'APPROVED',
      amount: 20,
      payerName: 'Torcedor Tricolor',
      payerEmail: 'torcedor@example.com',
      payerPhone: '46999990000',
      expiresAt: new Date(),
      approvedAt: new Date(),
      pixCopyPaste: 'PIX-TESTE-SEED',
    },
  });

  await prisma.ticket.updateMany({
    where: { raffleId: raffle.id, number: { in: [7, 13] } },
    data: {
      status: TicketStatus.PAID,
      buyerName: 'Torcedor Tricolor',
      buyerEmail: 'torcedor@example.com',
      buyerPhone: '46999990000',
      paymentId: payment.id,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
