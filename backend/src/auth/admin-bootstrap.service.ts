import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(AdminBootstrapService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;
    if (!email || !password) {
      this.logger.warn(
        'ADMIN_EMAIL ou ADMIN_PASSWORD ausente. Nenhum usuário admin foi criado.',
      );
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await this.prisma.user.upsert({
      where: { email },
      update: { passwordHash, name: 'Admin Consulado' },
      create: {
        email,
        passwordHash,
        name: 'Admin Consulado',
      },
    });

    this.logger.log(`Usuário admin disponível para ${email}.`);
  }
}
