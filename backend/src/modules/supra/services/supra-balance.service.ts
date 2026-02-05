import { Injectable } from '@nestjs/common';
import { AppBalance } from '@tht/shared';
import { LogOperation } from '../../../common/decorators/log-operation.decorator';
import { SupraBalanceResponse } from '../interface/supra.interfaces';
import { handleSupraError } from '../supra.errors';
import { SupraMapper } from '../supra.mapper';
import { SupraClientService } from './supra-client.service';

@Injectable()
export class SupraBalanceService {
  constructor(private readonly client: SupraClientService) {}

  @LogOperation({ name: 'getBalance' })
  async getBalance(): Promise<AppBalance> {
    try {
      const data = await this.client.authenticatedRequest<SupraBalanceResponse>(
        'GET',
        '/v1/payout/user/balances',
      );

      if (Array.isArray(data)) {
        return SupraMapper.toBalances(data);
      }

      throw new Error(`Error getting balances: ${JSON.stringify(data)}`);
    } catch (e) {
      throw handleSupraError(e);
    }
  }
}
