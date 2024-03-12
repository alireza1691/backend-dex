import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import Moralis from 'moralis';
import { BlockchainService } from './blockchain.service';

@Controller('blockchain')
export class BlockchainController {

  constructor(private readonly oneInchService: BlockchainService) {}

  @Get()
  getRoot(): string {
    return 'Welcome to my NestJS application!';
  }

  @Get('/tokenPrice')
  async getTokenPrice(@Query() query: { addressOne: string, addressTwo: string ,chainId: string}): Promise<any> {
    console.log("API called. fetching...");
    
    // Moralis.start({
    //   // apiKey: "TsLS6Uwt4tfB5QoDEmhh82BVsIRK7zqdwPI9LmTyUmt4aLend9KxfZWfpfTc7iEF"
    //   apiKey: process.env.MORALIS_KEY,
    //   // apiKey:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6Ijk4NGFmNjBjLTlhNWQtNDkxYi1hYWUyLTc2ODcyMDM2ZDRmOSIsIm9yZ0lkIjoiMjY4MzY2IiwidXNlcklkIjoiMjczMTUwIiwidHlwZUlkIjoiYmE0NmRjZTEtYTE3Ni00NTgwLTliZGMtZjM0MGJjYTk4ZDFlIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3MDc2NzgzMDksImV4cCI6NDg2MzQzODMwOX0.Lwf22ngYdnKoCSE1J-WCUrstQXUvtnLiY4MrZ6ST1qI"
    // });

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

  @Get('/quote')
  async getQuote(
    @Query('src') src: string,
    @Query('dst') dst: string,
    @Query('amount') amount: string,
  ) {
    console.log("A request detected in backend");
    
    try {
      const quote = await this.oneInchService.getQuote(src, dst, amount);
      return quote;
    } catch (error) {
      return { error: error.message };
    }
  }


}
