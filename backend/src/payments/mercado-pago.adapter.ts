import { Injectable, Logger } from '@nestjs/common';
import { MercadoPagoConfig, Payment } from 'mercadopago';

export type PixCharge = {
  providerPaymentId?: string;
  pixCopyPaste: string;
  pixQrCodeBase64?: string;
};

@Injectable()
export class MercadoPagoAdapter {
  private readonly logger = new Logger(MercadoPagoAdapter.name);

  isConfigured() {
    return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN);
  }

  async createPixCharge(input: {
    amount: number;
    description: string;
    payerEmail: string;
    expiresAt: Date;
    externalReference: string;
  }): Promise<PixCharge> {
    if (!this.isConfigured()) {
      return {
        providerPaymentId: `mock_${input.externalReference}`,
        pixCopyPaste: `000201BR.GOV.BCB.PIX2600CONSULADO-GREMIO-${input.externalReference}5204000053039865404${input.amount.toFixed(2)}5802BR5924CONSULADO DO GREMIO FB6008BELTRAO62070503***6304TEST`,
      };
    }

    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN as string,
    });
    const payment = new Payment(client);
    const notificationUrl = process.env.API_PUBLIC_URL
      ? `${process.env.API_PUBLIC_URL}/api/payments/webhook`
      : undefined;

    try {
      const response = await payment.create({
        body: {
          transaction_amount: Number(input.amount.toFixed(2)),
          description: input.description,
          payment_method_id: 'pix',
          payer: {
            email: input.payerEmail,
          },
          date_of_expiration: input.expiresAt.toISOString(),
          external_reference: input.externalReference,
          notification_url: notificationUrl,
        },
      });

      const pix = response.point_of_interaction?.transaction_data;

      return {
        providerPaymentId: String(response.id),
        pixCopyPaste: pix?.qr_code ?? '',
        pixQrCodeBase64: pix?.qr_code_base64,
      };
    } catch (error) {
      this.logger.error('Falha ao criar cobrança PIX no Mercado Pago', error as Error);
      throw error;
    }
  }
}
