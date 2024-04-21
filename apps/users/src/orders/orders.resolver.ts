import { BadRequestException, UseFilters, UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Response } from 'express';
import { stringify } from 'querystring';
import { BuyStableCoinRes } from '../types/types';
import { BuyStableCoinDto } from './dto/orders.dto';
import { OrdersService } from './orders.service';


@Resolver('Order')
// @UseFilters
export class OrdersResolver {
  constructor(private readonly ordersService: OrdersService) {}
  // @Mutation(() => RegisterResponse)
  // async register(
  //   @Args('registerDto') registerDto: RegisterDto,
  //   @Context() context: { res: Response },
  // ): Promise<RegisterResponse> {
  //   if (!registerDto.name || !registerDto.email || !registerDto.password) {
  //     throw new BadRequestException(' Please fill all the fields');
  //   }

  //   const { activation_token } = await this.usersService.register(
  //     registerDto,
  //     context.res,
  //   );
  //   return { activation_token };
  // }

  @Mutation(() => Promise<BuyStableCoinRes>)
  async buyStableCoin(
    @Args('registerUserDto') buyStableCoinDto: BuyStableCoinDto,
  ):Promise <BuyStableCoinRes> {
    const req = await this.ordersService.BuyStableCoin(
        buyStableCoinDto,
      // context.res,
    );
    console.log(req);

    
    return req;
  }


}
