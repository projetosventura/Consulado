import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TicketsModule } from '../tickets/tickets.module';
import { MercadoPagoAdapter } from './mercado-pago.adapter';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [AuthModule, TicketsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, MercadoPagoAdapter],
})
export class PaymentsModule {}
