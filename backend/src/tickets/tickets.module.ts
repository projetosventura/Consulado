import { Module } from '@nestjs/common';
import { ReservationCleanupService } from './reservation-cleanup.service';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';

@Module({
  controllers: [TicketsController],
  providers: [TicketsService, ReservationCleanupService],
  exports: [TicketsService],
})
export class TicketsModule {}
