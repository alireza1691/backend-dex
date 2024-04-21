import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtVerifyOptions } from '@nestjs/jwt';
import { Response } from 'express';
import { PrismaService } from '../../../../prisma/prisma.service';
import {
  VerifyMessageDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterUserDto,
  ResetPasswordDto,
  VerificationStepOneDto,
  VerificationStepTwoDto,
  AttachGmailDto,
} from '../dto/user.dto';
import * as bcrypt from 'bcrypt';

import { Account, User } from '@prisma/client';
import { KavenegarService } from '@fraybabak/kavenegar_nest';

import axios from 'axios';
import { get } from 'http';
import {
  BuyStableCoinDto,
  BuyTokenOrderDto,
  BuyVisaDto,
  ExecuteFeeDto,
  ReceiveVisaDto,
  SellTokenOrderDto,
  SendVisaDto,
} from './dto/orders.dto';

// const Kavenegar = require('kavenegar');
// const urlencode = require('urlencode');

interface UserData {
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
}
interface AccountData {
  name: string;
  lastName: string;
  password: string;
  phoneNumber: string;
}

type PayAsset = 'Toman' | 'Paypal' | 'Visa';

// type OrderStatus = 'Pending' | 'Rejected' | 'Sending' | 'Confirmed';

type BuyPayMethod =
  | 'TomanBalance'
  | 'DollarBalance'
  | 'BankPayment'
  | 'AbstractAccountBalance';

@Injectable()
export class OrdersService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly sender: KavenegarService,
  ) {}

  async increaseTomanBal(phoneNumber: string, amount: Number) {}
  async decreaseTomanBal(phoneNumber: string, amount: Number) {}

  async useBalance(phoneNumber: string, amount: number, method: PayAsset) {
    const userWallet = await this.getWallet(phoneNumber);
    if (method == 'Toman') {
      const currentBalance = userWallet.tomanBalance;
      if (currentBalance > amount) {
        await this.prisma.accountWallet.update({
          where: { phoneNumber },
          data: {
            tomanBalance: currentBalance - amount,
          },
        });
      } else {
        throw new BadRequestException('Insufficient Toman balance');
      }
    }
    if (method == 'Visa') {
      const currentBalance = userWallet.visaBalance;
      if (currentBalance > amount) {
        await this.prisma.accountWallet.update({
          where: { phoneNumber },
          data: {
            visaBalance: currentBalance - amount,
          },
        });
      } else {
        throw new BadRequestException('Insufficient Visa balance');
      }
    }
    if (method == 'Paypal') {
      const currentBalance = userWallet.paypalBalance;
      if (currentBalance > amount) {
        await this.prisma.accountWallet.update({
          where: { phoneNumber },
          data: {
            paypalBalance: currentBalance - amount,
          },
        });
      } else {
        throw new BadRequestException('Insufficient Paypal balance');
      }
    }
    return { userWallet };
  }

  async BuyVisa(buyVisaDto: BuyVisaDto) {
    const {
      paidAmount,
      payMethod,
      phoneNumber,
      expectedReceiveAmount,
      feeAmount,
    } = buyVisaDto;
    const { userWallet } = await this.useBalance(
      phoneNumber,
      paidAmount,
      payMethod,
    );
    await this.executeFee({
      amount: feeAmount,
      asset: payMethod,
      destinationAsset: 'Visa',
      phoneNumber,
    });
    await this.prisma.accountWallet.update({
      where: { phoneNumber },
      data: {
        visaBalance: userWallet.visaBalance + expectedReceiveAmount,
      },
    });
  }
  async SendVisaReq(sendVisaDto: SendVisaDto) {
    const { amount, expectedReceiveAmount, receiverAddress, phoneNumber } =
      sendVisaDto;
    const userWallet = await this.getWallet(phoneNumber);
    if (userWallet.visaBalance < amount) {
      throw new BadRequestException('InsufiicientBalance');
    }
    await this.executeFee({
      amount: amount - expectedReceiveAmount,
      asset: 'Toman',
      destinationAsset: 'Visa',
      phoneNumber,
    });
    await this.prisma.sendVisaRequest.create({
      data: {
        amountInDollar: expectedReceiveAmount,
        receiverAddress,
        userPhoneNumber: phoneNumber,
        status: 'Pending',
      },
    });
  }

  async ReceiveVisaReq(receiveVisaDto: ReceiveVisaDto) {
    const { phoneNumber, expectedReceiveAmount } = receiveVisaDto;
  }

  async  BuyStableCoin(buyStableCoinDto: BuyStableCoinDto) {
    const {
      phoneNumber,
      expectedTokenAmount,
      tokenAddress,
      paidAmount,
      receiverAddress,
      payMethod,
      priceRatio,
      feeAmount
    } = buyStableCoinDto;
    const token = await this.getToken(tokenAddress);
    await this.useBalance(phoneNumber, paidAmount, payMethod);
    await this.executeFee({amount: feeAmount , asset: "Toman" ,destinationAsset:"Tether", phoneNumber})
    const req = await this.prisma.buyStableCoinOrder.create({
      data: {
        tokenName: token.name,
        tokenAddress,
        priceRatio,
        paidAmount,
        network:token.chain,
        chainId:1,
        status: 'Pending',
        receiverAddress,
        outAmount: expectedTokenAmount,
        payMethod: 'Toman',
        phoneNumber,
        feeAmount
      },
    });
    return req;
  }

  async BuyTokenOrder(buyOrderDto: BuyTokenOrderDto) {
    const {
      phoneNumber,
      expectedTokenAmount,
      tokenAddress,
      tokenPriceInDollar,
      paidAmount,
      receiverAddress,
      payMethod,
    } = buyOrderDto;

    const token = await this.getToken(tokenAddress);
    await this.useBalance(phoneNumber, paidAmount, payMethod);
    const req = await this.prisma.buyCryptoOrder.create({
      data: {
        tokenName: token.name,
        tokenAddress,
        tokenPriceInDollar,
        paidAmount,
        status: 'Pending',
        receiverAddress,
        outAmount: expectedTokenAmount,
        payMethod: 'Toman',
        phoneNumber,
      },
    });

    return req;
  }
  async sellTokenOrderByConnection(sellTokenOrderDto: SellTokenOrderDto) {
    const {
      expectedReceiveAmount,
      receiverAddress,
      receiveAsset,
      tokenAmount,
      tokenAddress,
      phoneNumber,
      tokenPriceInDollar,
      senderAddress,
    } = sellTokenOrderDto;
    const token = await this.getToken(tokenAddress);
    // const wallet = await this.getWallet(phoneNumber);
    const order = await this.prisma.sellCryptoOrder.create({
      data: {
        tokenName: token.name,
        tokenAddress,
        paidAmount: tokenAmount,
        payMethod: receiveAsset,
        receiverAddress,
        outAmount: expectedReceiveAmount,
        phoneNumber,
        status: 'Sending',
        tokenPriceInDollar,
        senderAddress,
      },
    });
    return order
  }
  async sellTokenOrderByTransfer(sellTokenOrderDto: SellTokenOrderDto) {
    const {
      expectedReceiveAmount,
      receiverAddress,
      receiveAsset,
      tokenAmount,
      tokenAddress,
      tokenPriceInDollar,
      senderAddress,
      phoneNumber
    } = sellTokenOrderDto;
    const token = await this.getToken(tokenAddress);
    // const wallet = await this.getWallet(phoneNumber);
    const order = await this.prisma.sellCryptoOrder.create({
      data: {
        tokenName: token.name,
        tokenAddress,
        paidAmount: tokenAmount,
        payMethod: receiveAsset,
        receiverAddress,
        outAmount: expectedReceiveAmount,
        phoneNumber,
        status: 'Pending',
        tokenPriceInDollar,
        senderAddress,
      },
    });
    return order
  }

  async getToken(contractAddress: string) {
    const token = await this.prisma.supportedToken.findUnique({
      where: { contractAddress },
    });
    if (!token) {
      throw new BadRequestException('Token is not supported');
    }
    return token;
  }
  async getWallet(phoneNumber: string) {
    const userWallet = await this.prisma.accountWallet.findUnique({
      where: {
        phoneNumber,
      },
    });
    if (!userWallet) {
      throw new BadRequestException(
        'User wallet not found, User may  not verified or not exist',
      );
    }
    return userWallet;
  }

  async getOrders(phoneNumber: string) {}

  async getAssetPrices() {
    const prices = {
      thether: 65,
      visa: 64,
      paypal: 62,
    };
    return prices;
  }

  async executeFee(executefFeeDto: ExecuteFeeDto) {
    const { amount, asset, destinationAsset, phoneNumber } = executefFeeDto;
    const req = await this.prisma.orderFee.create({
      data: {
        amount,
        asset,
        destinationAsset,
        userPhoneNumber: phoneNumber,
      },
    });
    return req;
  }

  async getAllSendVisaRequests() {
    const pendingReqs = await this.prisma.sendVisaRequest.findMany({
      where: {
        status: 'Pending',
      },
    });
    const confirmedReqs = await this.prisma.sendVisaRequest.findMany({
      where: {
        status: 'Cofirmed',
      },
    });
    const rejectededReqs = await this.prisma.sendVisaRequest.findMany({
      where: {
        status: 'Rejected',
      },
    });
    const sendingReqs = await this.prisma.sendVisaRequest.findMany({
      where: {
        status: 'Sending',
      },
    });
    return {
      pendingReqs,
      confirmedReqs,
      rejectededReqs,
      sendingReqs,
    };
  }

}
