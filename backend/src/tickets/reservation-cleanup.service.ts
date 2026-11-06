import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TicketsService } from './tickets.service';

@Injectable()
export class ReservationCleanupService {
  private readonly logger = new Logger(ReservationCleanupService.name);

  constructor(private readonly ticketsService: TicketsService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiredReservations() {
    const result = await this.ticketsService.releaseExpiredReservations();
    if (result.released > 0) {
      this.logger.log(`Liberadas ${result.released} reservas expiradas.`);
    }
  }
}
