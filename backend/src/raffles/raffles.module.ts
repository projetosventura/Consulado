import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RafflesAdminController } from './raffles.admin.controller';
import { RafflesController } from './raffles.controller';
import { RafflesService } from './raffles.service';

@Module({
  imports: [AuthModule],
  controllers: [RafflesController, RafflesAdminController],
  providers: [RafflesService],
  exports: [RafflesService],
})
export class RafflesModule {}
