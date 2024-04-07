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
  AttachGmailDto,
} from './dto/user.dto';
import * as bcrypt from 'bcrypt';
import { EmailService } from './email/email.service';
import { TokenSender } from './utils/sendToken';
import { Account, User } from '@prisma/client';
import { KavenegarService } from '@fraybabak/kavenegar_nest';
import { PendingVerificationData } from './entities/user.entity';
import axios from 'axios';
import { get } from 'http';

// const Kavenegar = require('kavenegar');
// const urlencode = require('urlencode');

interface UserData {
  name: string;
  email: string;
  password: string;
  phone_number: string;
}
interface AccountData {
  name: string;
  lastName: string;
  password: string;
  phone_number: string;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly sender: KavenegarService,
  ) {}

  async IsUserRegistered(phone_number: string) {
    const isUserRegistered = await this.prisma.account.findUnique({
      where: {
        phone_number,
      },
    });
    const isNumberExist = await this.prisma.interactedUser.findUnique({
      where: {
        phone_number,
      },
    });
    if (!isNumberExist) {
      await this.prisma.interactedUser.create({
        data: {
          phone_number,
        },
      });
    }
    return !!isUserRegistered;
  }

  async RegisterUser(registerUserDto: RegisterUserDto) {
    const { name, lastName, password, phone_number } = registerUserDto;
    const IsNumberExist = await this.prisma.account.findUnique({
      where: {
        phone_number,
      },
    });
    if (IsNumberExist) {
      throw new BadRequestException(
        'User already registered with this phone number ',
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user: AccountData = {
      name,
      lastName,
      password: hashedPassword,
      phone_number,
    };

    const activationToken = await this.createActivationToken(user);
    const activationCode = activationToken.activationCode;
    const activation_token = activationToken.token;

    // await this.sendMessage(phone_number,activationCode)
    return { activation_token, activationCode };
  }

  async VerifyRegistrationMessage(verifyMessageDto: VerifyMessageDto) {
    const { activationCode, activationToken } = verifyMessageDto;
    const newUser: { user: AccountData; activationCode: string } =
      this.jwtService.verify(activationToken, {
        secret: this.configService.get<string>('ACTIVATION_SECRET'),
      } as JwtVerifyOptions) as { user: AccountData; activationCode: string };
    if (newUser.activationCode !== activationCode) {
      throw new BadRequestException('Invalid activation code');
    }
    console.log(
      newUser.activationCode == activationCode ? 'matched' : 'deos not match',
    );

    const { name, lastName, password, phone_number } = newUser.user;
    const existUser = await this.prisma.account.findUnique({
      where: {
        phone_number,
      },
    });
    if (existUser) {
      throw new BadRequestException(
        'A user is already exist with this phone number!',
      );
    }
    const user = await this.prisma.account.create({
      data: {
        name,
        lastName,
        phone_number,
        password,
      },
    });

    return { user };
  }

  async Login(loginDto: LoginDto, response: Response) {
    const { phone_number, password } = loginDto;
    const user = await this.prisma.account.findUnique({
      where: {
        phone_number,
      },
    });
    console.log(password, user.password);

    if (user && (await this.comparePassword(password, user.password))) {
      const activationToken = await this.createActivationToken(user);
      const activationCode = activationToken.activationCode;
      const activation_token = activationToken.token;

      // await this.sendMessage(phone_number,activationCode)

      // const tokenSender = new TokenSender(this.configService, this.jwtService);
      // return tokenSender.sendLoginToken(user);
      return { activation_token, activationCode, response };
    } else {
      throw new BadRequestException('Invalid credentials');
      // return {
      //   user: null,
      //   accessToken: null,
      //   refreshToken: null,
      //   error: {
      //     message: 'Invalid user name or password',
      //   },
      // };
    }
  }

  async VerifyLogin(verifyMessageDto: VerifyMessageDto) {
    console.log('verify login called');

    const { isMessageVerified, userPhoneNumber } =
      await this.verifyMessage(verifyMessageDto);

    if (isMessageVerified) {
      const tokenSender = new TokenSender(this.configService, this.jwtService);
      const account = await this.prisma.account.findUnique({
        where: {
          phone_number: userPhoneNumber,
        },
      });
      return tokenSender.sendLoginToken(account);
    } else {
      return {
        user: null,
        accessToken: null,
        refreshToken: null,
        error: {
          message: 'Invalid user name or password',
        },
      };
      // throw new BadRequestException('Invalid activation code');
    }

    // const { name, lastName, password, phone_number } = newUser.user;
  }

  async generateForgotPasswordLink(user: User) {
    const forgotPasswordToken = this.jwtService.sign(
      {
        user,
      },
      {
        secret: this.configService.get<string>('FORGOT_PASSWORD_SECRET'),
        expiresIn: '5m',
      },
    );

    return forgotPasswordToken;
  }

  async ForgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (!user) {
      throw new BadRequestException('User with this email not existed!');
    }

    const forgotPasswordToken = await this.generateForgotPasswordLink(user);
    const resetPasswordUrl =
      this.configService.get<string>('CLIENT_SIDE_URI') +
      `/reset-password?verify=${forgotPasswordToken}`;
    await this.emailService.sendMail({
      email,
      subject: 'Reset your password',
      template: './forgot-password',
      name: user.name,
      activationCode: resetPasswordUrl,
    });
    return { message: 'Your forgot password request successfully sended!' };
  }

  async ResetPassword(resetPasswordDto: ResetPasswordDto) {
    const { password, activationToken } = resetPasswordDto;
    const decoded = await this.jwtService.decode(activationToken);
    console.log('decoded expiration:', decoded.exp);

    if (!decoded || decoded?.exp * 1000 < Date.now()) {
      throw new BadRequestException('Invalid Token!');
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.update({
      where: {
        id: decoded.user.id,
      },
      data: {
        password: hashedPassword,
      },
    });
    return { user };
  }

  async GetLoggedInUser(req: any) {
    const user = req.user;
    const refreshToken = req.refreshtoken;
    const accessToken = req.accesstoken;
    // console.log({user, refreshToken, accessToken});
    console.log(user);

    return { user, refreshToken, accessToken };
  }

  async LogOut(req: any) {
    req.user = null;
    req.refreshtoken = null;
    req.accesstoken = null;
    return { message: 'Logged out successfully!' };
  }

  async GetUsers() {
    return this.prisma.user.findMany({});
  }

  async VerifyAccountStepOne(verificationStepOneDto: VerificationStepOneDto) {
    const { personalId, personalCardImageUrl, phone_number } =
      verificationStepOneDto;
    const pendingVerification =
      await this.prisma.pendingVerification.findUnique({
        where: {
          phone_number,
        },
      });

    if (pendingVerification) {
      throw new BadRequestException(
        'A verification request with this phone number is already exist',
      );
    }

    const verificationData: PendingVerificationData =
      await this.prisma.pendingVerification.create({
        data: {
          personalId,
          phone_number,
          personalCardImageUrl,
          isReadyToCheck: false,
        },
      });
    return verificationData;
  }

  async VerifyAccountStepTwo(verificationStepTwoDto: VerificationStepTwoDto) {
    const { userImageUrl, phone_number, userVerifyTextImageUrl } =
      verificationStepTwoDto;
    const pendingVerification =
      await this.prisma.pendingVerification.findUnique({
        where: {
          phone_number,
        },
      });

    if (pendingVerification && pendingVerification?.isReadyToCheck) {
      throw new BadRequestException(
        'A pending verification request is already exist',
      );
    }

    const verificationData = this.prisma.pendingVerification.update({
      where: {
        phone_number,
      },
      data: {
        userVerifyTextImageUrl,
        userImageUrl,
        isReadyToCheck: true,
      },
    });

    return verificationData;
  }

  // async AddNewBankAccountRequest(
  //   phone_number: string,
  //   cardNumber: string,
  //   shabaNumber: string,
  // ) {
  //   const existedPendingReq =
  //     await this.prisma.pendingNewBankAccountRequest.findUnique({
  //       where: {
  //         phone_number,
  //       },
  //     });
  //   if (existedPendingReq) {
  //     throw new BadRequestException('Pending request is already existed!');
  //   }
  //   const verification = await this.prisma.verification.findUnique({
  //     where: {
  //       phone_number,
  //     },
  //   });
  //   if (!verification) {
  //     throw new BadRequestException(
  //       'User with this personal ID is not verified or may not existed!',
  //     );
  //   }
  //   const req = await this.prisma.pendingNewBankAccountRequest.create({
  //     data: {
  //       phone_number,
  //       shabaNumber,
  //       cardNumber,
  //     },
  //   });

  //   return req;
  // }

  async comparePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  async createActivationToken(user: UserData | AccountData) {
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
    const token = this.jwtService.sign(
      {
        user,
        activationCode,
      },
      {
        secret: this.configService.get<string>('ACTIVATION_SECRET'),
        expiresIn: '5m',
      },
    );
    return { token, activationCode };
  }

  async verifyMessage(verifyMessageDto: VerifyMessageDto) {
    const { activationCode, activationToken } = verifyMessageDto;
    const account: { user: AccountData; activationCode: string } =
      this.jwtService.verify(activationToken, {
        secret: this.configService.get<string>('ACTIVATION_SECRET'),
      } as JwtVerifyOptions) as { user: AccountData; activationCode: string };
    const isMessageVerified = account.activationCode == activationCode;
    const userPhoneNumber = account.user.phone_number || '';
    return { isMessageVerified, userPhoneNumber };
  }

  async sendMessage(phone_number: string, activation_code: string) {
    // const api = Kavenegar.KavenegarApi({
    //   apikey:
    //     '5675342B5473762B7A756262526B2F686D38784C424F71644E426D582B466B6E39316447624B75462B57633D', // Replace {Your API Key} with your actual API key
    // });
    // try {
    //   const res = api.Send(
    //     {
    //       message: 'وب سرویس تخصصی کاوه نگار',
    //       sender: '10004346',
    //       receptor: phoneNumber,
    //     },

    //     // function (response: any, status: any) {
    //     //   console.log(response);
    //     //   console.log(status);
    //     // }
    //   );
    //   console.log(res);
    //   console.log('message sent');
    // } catch (error) {
    //   console.log(error);
    // }
    // const encodedMessage = encodeURIComponent( 'وب سرویس تخصصی کاوه نگار')

    //   template: string;
    // token: string;
    // token2?: string;
    // receptor: string;
    await this.sender.Send({
      message: 'وب سرویس تخصصی کاوه نگار',
      // message: encodedMessage,
      sender: '10008663',
      receptor: phone_number,
    });
    console.log('sended');
  }

  async AttachGmail(registerDto: AttachGmailDto) {
    const { email, phone_number } = registerDto;
    const IsEmailExist = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (IsEmailExist) {
      throw new BadRequestException('User already registered with this email ');
    }

    const isUserExist = await this.prisma.account.findUnique({
      where: {
        phone_number,
      },
    });
    if (!isUserExist) {
      throw new BadRequestException(
        'User is not registered with this phone number ',
      );
    }

    const user: UserData = {
      name: isUserExist.name,
      email,
      password: isUserExist.password,
      phone_number,
      // address
    };

    const activationToken = await this.createActivationToken(user);
    const activationCode = activationToken.activationCode;
    const activation_token = activationToken.token;

    await this.emailService.sendMail({
      email,
      subject: 'Active your account',
      template: './activation-mail',
      name: isUserExist.name,
      activationCode,
    });
    return { activation_token };
  }

  async ActivateGmail(activationDto: VerifyMessageDto) {
    const { activationCode, activationToken } = activationDto;
    const relevantUser: { user: UserData; activationCode: string } =
      this.jwtService.verify(activationToken, {
        secret: this.configService.get<string>('ACTIVATION_SECRET'),
      } as JwtVerifyOptions) as { user: UserData; activationCode: string };
    if (relevantUser.activationCode !== activationCode) {
      throw new BadRequestException('Invalid activation code');
    }

    const { email, phone_number } = relevantUser.user;
    // const existUser = await this.prisma.account.findUnique({
    //   where: {
    //     phone_number,
    //   },
    // });
    // if (existUser.email) {
    //   throw new BadRequestException('A user is already exist with this email!');
    // }

    const user = await this.prisma.account.update({
      where: { phone_number },
      data: {
        email,
      },
    });

    return { user };
  }

  async getVerificationStatus(phone_number: string) {
    let req: PendingVerificationData =
      await this.prisma.pendingVerification.findUnique({
        where: {
          phone_number,
        },
      });

    if (!req) {
      req = {
        id: null,
        personalId: null,
        personalCardImageUrl: null,
        phone_number: null,
        isReadyToCheck: false,
      };
    }

    console.log(req);
    
    return req ;
  }
}
