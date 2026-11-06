import { Controller, Get, Param } from '@nestjs/common';
import { RafflesService } from './raffles.service';

@Controller('raffles')
export class RafflesController {
  constructor(private readonly rafflesService: RafflesService) {}

  @Get()
  list() {
    return this.rafflesService.listPublic();
  }

  @Get('winners')
  winners() {
    return this.rafflesService.listWinners();
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.rafflesService.getPublicById(id);
  }
}
