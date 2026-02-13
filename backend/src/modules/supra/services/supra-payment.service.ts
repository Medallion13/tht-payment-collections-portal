import { Injectable } from '@nestjs/common';
import {
  CreatePaymentResponse,
  PaymentStatusResponse,
  type CreatePaymentRequest,
} from '@tht/shared';
import { randomUUID } from 'crypto';
import { LogOperation } from '../../../common/decorators/log-operation.decorator';
import {
  SupraPaymentCreateRequest,
  SupraPaymentCreateResponse,
  SupraPaymentStatusResponse,
} from '../interface/supra.interfaces';
import { handleSupraError } from '../supra.errors';
import { SupraMapper } from '../supra.mapper';
import { SupraClientService } from './supra-client.service';

@Injectable()
export class SupraPaymentService {
  constructor(private readonly client: SupraClientService) {}

  @LogOperation({ name: 'createPayment' })
  async createPayment(
    paymentData: CreatePaymentRequest,
    totalCost: number,
  ): Promise<CreatePaymentResponse> {
    try {
      const paymentRequest: SupraPaymentCreateRequest = {
        currency: 'COP',
        amount: totalCost,
        referenceId: randomUUID(),
        documentType: paymentData.documentType,
        email: paymentData.email,
        cellPhone: paymentData.cellPhone,
        document: paymentData.document,
        fullName: paymentData.fullName,
        description: 'Collection Payment',
        redirectUrl: `http://localhost:5173/confirmation?orderId=${paymentData.orderId}`,
        quoteId: paymentData.quoteId,
      };

      const data = await this.client.authenticatedRequest<SupraPaymentCreateResponse>(
        'POST',
        '/v1/payin/payment',
        paymentRequest,
      );

      return SupraMapper.toPayment(data);
    } catch (e) {
      throw handleSupraError(e);
    }
  }

  @LogOperation({ name: 'getPaymentStatus' })
  async getPaymentStatus(paymentId: string): Promise<PaymentStatusResponse> {
    try {
      const data = await this.client.authenticatedRequest<SupraPaymentStatusResponse>(
        'GET',
        `/v1/payin/payment/${paymentId}`,
      );

      return SupraMapper.toPaymentStatus(data);
    } catch (e) {
      throw handleSupraError(e, { notFoundOn500: true });
    }
  }
}
