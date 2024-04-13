import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtVerifyOptions } from '@nestjs/jwt';
import { Response } from 'express';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  VerifyMessageDto,
  ForgotPasswordDto,
  LoginDto,

  RegisterUserDto,
  ResetPasswordDto,
  VerificationStepOneDto,
  VerificationStepTwoDto,
} from './dto/user.dto';
import * as bcrypt from 'bcrypt';
import { EmailService } from './email/email.service';
import { TokenSender } from './utils/sendToken';
import { Account, User } from '@prisma/client';
import { KavenegarService } from '@fraybabak/kavenegar_nest';
import { OrderStatusType } from './types/types';
// const Kavenegar = require('kavenegar');
// const urlencode = require('urlencode');

interface UserData {
  name: string;
  email: string;
  password: string;
  phoneNumber: number;
}
interface AccountData {
  name: string;
  lastName: string;
  password: string;
  phoneNumber: string;
}

@Injectable()
export class AdminService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly sender: KavenegarService,
  ) {}

  async rejectStepOneVerification(phoneNumber: string) {
    const isVerified = await this.prisma.verification.findUnique({
      where: { phoneNumber },
    });
    if (isVerified) {
      throw new BadRequestException('This phone number has already verified!');
    }
    const existedReq = await this.prisma.pendingVerification.findUnique({
      where: {
        phoneNumber,
      },
    });
    if (!existedReq) {
      throw new BadRequestException(
        'This phone number has not any pending verification request!',
      );
    }
    await this.prisma.pendingVerification.delete({
      where: { phoneNumber },
    });
  }

  async rejectStepTwoVerification(phoneNumber: string) {
    const existedReq = await this.prisma.pendingVerification.findUnique({
      where: {
        phoneNumber,
      },
    });
    if (!existedReq) {
      throw new BadRequestException(
        'This phone number has not any pending verification request!',
      );
    }
    await this.prisma.pendingVerification.update({
      where: { phoneNumber },
      data: {
        isReadyToCheck: false,
        userImageUrl: null,
        userVerifyTextImageUrl: null,
      },
    });
  }

  async confirmVerification(phoneNumber: string) {
    const existedReq = await this.prisma.pendingVerification.findUnique({
      where: {
        phoneNumber,
      },
    });
    if (!existedReq) {
      throw new BadRequestException(
        'This phone number has not any pending verification request!',
      );
    }

    const verificationData = await this.prisma.verification.create({
      data: {
        personalId: existedReq.personalId,
        userLevel: 1,
        user: {
          connect: { phoneNumber }, // Associate with the user by phone number
        },
      },
    });

    await this.prisma.pendingVerification.delete({
      where: {
        phoneNumber,
      },
    });
    return verificationData;
  }
  async confirmBankAccount(phoneNumber: string) {
    const req = await this.prisma.pendingNewBankAccountRequest.findUnique({
      where: {
        phoneNumber,
      },
    });
    if (!req) {
      throw new BadRequestException('Pending request is not existed!');
    }
    const verification = await this.prisma.verification.findUnique({
      where: {
        phoneNumber,
      },
    });
    if (!verification) {
      throw new BadRequestException(
        'User is not verified!',
      );
    }
    const verifiedBankAccount = await this.prisma.bankAccount.create({
      data: {
        shabaNumber: req.shabaNumber,
        cardNumber: req.cardNumber,
        verification: {
          connect: {
            phoneNumber,
          },
        },
      },
    });

    await this.prisma.pendingNewBankAccountRequest.delete({
        where:{phoneNumber}
    })

    return verifiedBankAccount
  }
  async rejectBankAccount(phoneNumber: string) {
    const req = await this.prisma.pendingNewBankAccountRequest.findUnique({
        where: {
          phoneNumber,
        },
      });
      if (!req) {
        throw new BadRequestException('Pending request is not existed!');
      }
      await this.prisma.pendingNewBankAccountRequest.delete({
        where:{phoneNumber}
      })
  }
  async confirmBuyTokenOrder(phoneNumber: string) {

  }
  async rejectBuyTokenOrder() {}
 
  async setBuyTokenOrderStatus(orderId: number,phoneNumber:string,status: OrderStatusType) {
    const order = await this.prisma.buyCryptoOrder.findUnique({
      where:{
        phoneNumber,
        id:orderId
      }
    })
    if (!order) {
      throw new BadRequestException("Order not found")
    }
    await this.prisma.buyCryptoOrder.update({
      where: {
        phoneNumber
      },
      data:{status}
    })
  }
  async setBuyVisaOrderStatus(orderId: number,phoneNumber:string,status: OrderStatusType) {
    const order = await this.prisma.sendVisaRequest.findUnique({
      where:{
        userPhoneNumber:phoneNumber,
        id:orderId
      }
    })
    if (!order) {
      throw new BadRequestException("Order not found")
    }
    await this.prisma.sendVisaRequest.update({
      where: {
        userPhoneNumber:phoneNumber
      },
      data:{status}
    })
  }
}
