import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

import { LogOperation } from '../../common/decorators/log-operation.decorator';
import { AuthSuccess } from './interface/supra.interfaces';
import { handleSupraError } from './supra.errors';

@Injectable()
export class SupraService {
  private readonly logger = new Logger(SupraService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  // Get env variables
  // * MIGRADA
  private get apiUrl(): string {
    return this.configService.getOrThrow<string>('supra.apiUrl');
  }

  private get clientId(): string {
    return this.configService.getOrThrow<string>('supra.clientId');
  }

  private get secret(): string {
    return this.configService.getOrThrow<string>('supra.secret');
  }

  @LogOperation({ name: 'getToken', logOutput: false })
  private async getToken(): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<AuthSuccess>(
          `${this.apiUrl}/v1/auth/token`,
          {
            clientId: this.clientId,
            clientSecret: this.secret,
          },
          {
            headers: { 'X-API-TYPE': 'public' },
          },
        ),
      );

      return response.data.token;
    } catch (e) {
      throw handleSupraError(e);
    }
  }

  // @LogOperation({ name: 'getBalance' })
  // async getBalance(): Promise<AppBalance> {
  //   try {
  //     const token = await this.getToken();

  //     const response = await firstValueFrom(
  //       this.httpService.get<SupraBalanceResponse>(`${this.apiUrl}/v1/payout/user/balances`, {
  //         headers: { Authorization: `Bearer ${token}`, 'X-API-TYPE': 'public' },
  //       }),
  //     );

  //     const data = response.data;

  //     if (Array.isArray(data)) {
  //       return SupraMapper.toBalances(data);
  //     }

  //     throw new Error(`Error getting balances: ${JSON.stringify(data)}`);
  //   } catch (e) {
  //     throw handleSupraError(e);
  //   }
  // }
}
