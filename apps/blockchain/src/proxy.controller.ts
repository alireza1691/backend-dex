// proxy.controller.ts

import { Body, Controller, Get, Post, Query } from '@nestjs/common';
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

  @Get('/getRequestedTokenPricesFrom1Inch')
  async getRequestedTokenPricesFrom1Inch(@Body() payload: any): Promise<AxiosResponse<any>> {
    console.log("hello");
    
    console.log(process.env.NEXT_PUBLIC_1INCH_API_KEY);
    
    const url = 'https://api.1inch.dev/price/v1.1/1';
    const YOUR_API_KEY = process.env.NEXT_PUBLIC_1INCH_API_KEY; // Replace this with your actual API key
    let response
    try {
      response = await this.httpService.post(url, payload, {
        headers: {
          Authorization: `Bearer ${YOUR_API_KEY}`,
        },
      });
      console.log(response);
      
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch token prices from 1inch.');
    }
  }
}
