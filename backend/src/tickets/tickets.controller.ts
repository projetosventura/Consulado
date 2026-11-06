import { Controller, Get, Query } from '@nestjs/common';
import { EmailQueryDto } from './dto/email-query.dto';
import { TicketsService } from './tickets.service';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  findByEmail(@Query() query: EmailQueryDto) {
    return this.ticketsService.findByEmail(query.email);
  }
}
