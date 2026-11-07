import { Body, Controller, Get, Headers, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('checkout')
  checkout(@Body() dto: CreateCheckoutDto) {
    return this.paymentsService.checkout(dto);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.paymentsService.getById(id);
  }

  @Post('webhook')
  webhook(
    @Body() payload: { data?: { id?: string }; type?: string },
    @Query() query: Record<string, string>,
    @Headers('x-signature') signature?: string,
    @Headers('x-request-id') requestId?: string,
  ) {
    return this.paymentsService.handleWebhook({ payload, query, signature, requestId });
  }

  @Post(':id/sandbox-confirm')
  sandboxConfirm(@Param('id') id: string) {
    return this.paymentsService.sandboxConfirm(id);
  }

  @Post(':id/simulate-approve')
  @UseGuards(JwtAuthGuard)
  simulateApprove(@Param('id') id: string) {
    return this.paymentsService.simulateApprove(id);
  }
}
