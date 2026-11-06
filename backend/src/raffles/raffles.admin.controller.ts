import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateRaffleDto } from './dto/create-raffle.dto';
import { DrawRaffleDto } from './dto/draw-raffle.dto';
import { MulterExceptionFilter } from './multer-exception.filter';
import { RafflesService } from './raffles.service';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

@Controller('admin/raffles')
@UseGuards(JwtAuthGuard)
export class RafflesAdminController {
  constructor(private readonly rafflesService: RafflesService) {}

  @Get()
  list() {
    return this.rafflesService.listAdmin();
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.rafflesService.getAdminById(id);
  }

  @Post()
  @UseFilters(MulterExceptionFilter)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_IMAGE_BYTES },
    }),
  )
  create(@Body() dto: CreateRaffleDto, @UploadedFile() image?: Express.Multer.File) {
    if (!image) {
      throw new BadRequestException('A foto do produto é obrigatória.');
    }
    return this.rafflesService.create(dto, image);
  }

  @Post(':id/image')
  @UseFilters(MulterExceptionFilter)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_IMAGE_BYTES },
    }),
  )
  updateImage(@Param('id') id: string, @UploadedFile() image?: Express.Multer.File) {
    if (!image) {
      throw new BadRequestException('A foto do produto é obrigatória.');
    }
    return this.rafflesService.updateImage(id, image);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rafflesService.remove(id);
  }

  @Post(':id/close')
  close(@Param('id') id: string) {
    return this.rafflesService.close(id);
  }

  @Post(':id/draw')
  draw(@Param('id') id: string, @Body() dto: DrawRaffleDto) {
    return this.rafflesService.draw(id, dto);
  }
}
