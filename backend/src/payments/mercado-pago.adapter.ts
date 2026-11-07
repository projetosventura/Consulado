import { Injectable, Logger } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { MercadoPagoConfig, Payment } from 'mercadopago';

export type PixCharge = {
  providerPaymentId?: string;
  pixCopyPaste: string;
  pixQrCodeBase64?: string;
};

export type ProviderPayment = {
  status?: string;
  externalReference?: string;
  transactionAmount?: number;
};

@Injectable()
export class MercadoPagoAdapter {
  private readonly logger = new Logger(MercadoPagoAdapter.name);

  isConfigured() {
    return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN);
  }

  private createClient() {
    return new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN as string,
    });
  }

  /**
   * Valida o header x-signature da notificação, conforme a documentação do Mercado Pago:
   * manifest = "id:<data.id>;request-id:<x-request-id>;ts:<ts>;" assinado com HMAC SHA-256
   * usando MERCADOPAGO_WEBHOOK_SECRET. Sem segredo configurado, nada é aceito.
   */
  verifyWebhookSignature(input: { signature?: string; requestId?: string; dataId: string }): boolean {
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    if (!secret || !input.signature) {
      return false;
    }

    const parts = new Map<string, string>();
    for (const part of input.signature.split(',')) {
      const separator = part.indexOf('=');
      if (separator > 0) {
        parts.set(part.slice(0, separator).trim(), part.slice(separator + 1).trim());
      }
    }

    const ts = parts.get('ts');
    const receivedHash = parts.get('v1');
    if (!ts || !receivedHash) {
      return false;
    }

    const dataId = /^[a-z0-9]+$/i.test(input.dataId) ? input.dataId.toLowerCase() : input.dataId;
    let manifest = `id:${dataId};`;
    if (input.requestId) {
      manifest += `request-id:${input.requestId};`;
    }
    manifest += `ts:${ts};`;

    const expectedHash = createHmac('sha256', secret).update(manifest).digest('hex');
    const expected = Buffer.from(expectedHash, 'utf8');
    const received = Buffer.from(receivedHash, 'utf8');

    return expected.length === received.length && timingSafeEqual(expected, received);
  }

  /** Busca o pagamento direto na API do Mercado Pago, para não confiar só no corpo do webhook. */
  async getPayment(providerPaymentId: string): Promise<ProviderPayment> {
    const payment = new Payment(this.createClient());
    const response = await payment.get({ id: providerPaymentId });

    return {
      status: response.status,
      externalReference: response.external_reference ?? undefined,
      transactionAmount: response.transaction_amount ?? undefined,
    };
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
