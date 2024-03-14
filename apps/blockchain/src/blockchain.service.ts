import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class BlockchainService {


  async getQuote(src: string, dst: string, amount: string): Promise<any> {
    console.log("Getting price from 1Inch !");
    console.log("src:",src,"dst:",dst,"amount:",amount);
    // const apiKey =process.env.ONEINCH_API_KEY
    const apiKey = "GWUfUd03Z8rEwi83iStpmPgtkiLBm4S4"
    console.log("api key:",apiKey);
    const requestData = {src:src,dst:dst,amount:amount}
    const headers = {'Content-Type':"application/json",
  'Api-Key':apiKey}
    
    const url = `https://api.1inch.io/v6.0/1/quote?src=${src}&dst=${dst}&amount=${amount}`;
    const pureUrl = `https://api.1inch.io/v6.0/1/quote`;
    try {
      // const response = await axios.get(url);
      const response = await axios.get(url,{headers});
      console.log(response.data);
      
      return response.data;
    } catch (error) {
      console.log(error);
      throw new Error(`Failed to fetch data from 1inch API: ${error.message}`);
   
      
    }
  }

  async fetchDexSwap(tokenAddress: string, walletAddress: string,chainId : string): Promise<any> {
console.log("getting.........");
    return axios.get(`http://api.1inch.io/v6.0/${chainId}/approve/allowance?tokenAddress=${tokenAddress}&walletAddress=${walletAddress}`);
  }

}
