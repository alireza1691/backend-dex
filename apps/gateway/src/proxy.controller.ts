// proxy.controller.ts

import { Controller, Get, Query } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AxiosResponse } from 'axios';
import { HttpService } from '@nestjs/axios';


@Controller('proxy')
export class ProxyController {
  constructor(private httpService: HttpService) {}

  @Get('allowance')
  getAllowance(@Query('tokenAddress') tokenAddress: string, @Query('walletAddress') walletAddress: string, @Query('chainId') chainId: string): Observable<AxiosResponse<any>> {
    return this.httpService.get(
      `https://api.1inch.io/v5.0/${chainId}/approve/allowance`, {
      params: {
        tokenAddress,
        walletAddress,
      },
    }
    );
  }
}
