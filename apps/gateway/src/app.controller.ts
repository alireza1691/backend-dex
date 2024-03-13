import { Controller, Get, Query } from '@nestjs/common';
import Moralis from 'moralis';

@Controller()
export class AppController {
  @Get()
  getRoot(): string {
    return 'Welcome to my NestJS application!';
  }

  @Get('/tokenPrice')
  async getTokenPrice(@Query() query: { addressOne: string, addressTwo: string ,chainId: string}): Promise<any> {
    console.log("API called. fetching...");
    


    const responseOne = await Moralis.EvmApi.token.getTokenPrice({
      address: query.addressOne,chain: query.chainId
    });

    const responseTwo = await Moralis.EvmApi.token.getTokenPrice({
      address: query.addressTwo,chain: query.chainId
    });

    const usdPrices = {
      tokenOne: responseOne.raw.usdPrice,
      tokenTwo: responseTwo.raw.usdPrice,
      ratio: responseOne.raw.usdPrice / responseTwo.raw.usdPrice,
    };
    console.log(usdPrices);
    

    return usdPrices;
  }
}
