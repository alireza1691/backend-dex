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
// const Kavenegar = require('kavenegar');
// const urlencode = require('urlencode');

interface UserData {
  name: string;
  email: string;
  password: string;
  phone_number: number;
}
interface AccountData {
  name: string;
  lastName: string;
  password: string;
  phone_number: string;
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

  async rejectStepOneVerification(phone_number: string) {
    const isVerified = await this.prisma.verification.findUnique({
      where: { phone_number },
    });
    if (isVerified) {
      throw new BadRequestException('This phone number has already verified!');
    }
    const existedReq = await this.prisma.pendingVerification.findUnique({
      where: {
        phone_number,
      },
    });
    if (!existedReq) {
      throw new BadRequestException(
        'This phone number has not any pending verification request!',
      );
    }
    await this.prisma.pendingVerification.delete({
      where: { phone_number },
    });
  }

  async rejectStepTwoVerification(phone_number: string) {
    const existedReq = await this.prisma.pendingVerification.findUnique({
      where: {
        phone_number,
      },
    });
    if (!existedReq) {
      throw new BadRequestException(
        'This phone number has not any pending verification request!',
      );
    }
    await this.prisma.pendingVerification.update({
      where: { phone_number },
      data: {
        isReadyToCheck: false,
        userImageUrl: null,
        userVerifyTextImageUrl: null,
      },
    });
  }

  async confirmVerification(phone_number: string) {
    const existedReq = await this.prisma.pendingVerification.findUnique({
      where: {
        phone_number,
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
          connect: { phone_number }, // Associate with the user by phone number
        },
      },
    });

    await this.prisma.pendingVerification.delete({
      where: {
        phone_number,
      },
    });
    return verificationData;
  }
  async confirmBankAccount(phone_number: string) {
    const req = await this.prisma.pendingNewBankAccountRequest.findUnique({
      where: {
        phone_number,
      },
    });
    if (!req) {
      throw new BadRequestException('Pending request is not existed!');
    }
    const verification = await this.prisma.verification.findUnique({
      where: {
        phone_number,
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
            phone_number,
          },
        },
      },
    });

    await this.prisma.pendingNewBankAccountRequest.delete({
        where:{phone_number}
    })

    return verifiedBankAccount
  }
  async rejectBankAccount(phone_number: string) {
    const req = await this.prisma.pendingNewBankAccountRequest.findUnique({
        where: {
          phone_number,
        },
      });
      if (!req) {
        throw new BadRequestException('Pending request is not existed!');
      }
      await this.prisma.pendingNewBankAccountRequest.delete({
        where:{phone_number}
      })
  }
  async fufillOrder() {}
  async rejectOrder() {}
}
