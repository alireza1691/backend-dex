import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtVerifyOptions } from '@nestjs/jwt';
import { Response } from 'express';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  ActivationDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  RegisterUserDto,
  ResetPasswordDto,
  VerificationDto,
} from './dto/user.dto';
import * as bcrypt from 'bcrypt';
import { EmailService } from './email/email.service';
import { TokenSender } from './utils/sendToken';
import { User } from '@prisma/client';
import { KavenegarService } from '@fraybabak/kavenegar_nest';
const Kavenegar = require('kavenegar');
const urlencode = require('urlencode');



interface UserData {
  name: string;
  email: string;
  password: string;
  phone_number: number;
}
interface UserRegisterData {
  name: string;
  lastName: string;
  password: string;
  phone_number: number;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly sender: KavenegarService
  ) {}

  async isUserRegistered(phone_number:number) {
    const isUserRegistered = await this.prisma.account.findUnique({
      where:{
        phone_number,
      }
    })
    const isNumberExist = await this.prisma.interactedUser.findUnique({
      where:{
        phone_number,
      }
    })
    if (!isNumberExist) {
      await this.prisma.interactedUser.create({
        data:{
          phone_number,
        }
      })
    }
    return isUserRegistered
  }



  async registerUser(registerUserDto: RegisterUserDto, response: Response) {
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
    const user = {
      name,
      lastName,
      password: hashedPassword,
      phone_number,
    };


    const activationToken = await this.createActivationToken(user);
    const activationCode = activationToken.activationCode;
    const activation_token = activationToken.token;

    await this.sendMessage(phone_number,activation_token)
    return {activation_token, response };
  }

  async verifyRegistrationMessage (activationDto: ActivationDto, response: Response) {
    const { activationCode, activationToken } = activationDto;
    const newUser: { user: UserRegisterData; activationCode: string } =
      this.jwtService.verify(activationToken, {
        secret: this.configService.get<string>('ACTIVATION_SECRET'),
      } as JwtVerifyOptions) as { user: UserRegisterData; activationCode: string };
    if (newUser.activationCode !== activationCode) {
      throw new BadRequestException('Invalid activation code');
    }

    const { name, lastName, password, phone_number } = newUser.user;
    const existUser = await this.prisma.user.findUnique({
      where: {
        phone_number,
      },
    });
    if (existUser) {
      throw new BadRequestException('A user is already exist with this phone number!');
    }
    const user = await this.prisma.account.create({
      data:{
        name,
        lastName,
        phone_number,
        password
      }
    })

    return {user, response}
  }

  async register(registerDto: RegisterDto, response: Response) {
    const { name, email, password, phone_number } = registerDto;
    const IsEmailExist = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (IsEmailExist) {
      throw new BadRequestException('User already registered with this email ');
    }

    const isPhoneNumberExist = await this.prisma.user.findUnique({
      where: {
        phone_number,
      },
    });
    if (isPhoneNumberExist) {
      throw new BadRequestException(
        'User already registered with this phone number ',
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      name,
      email,
      password: hashedPassword,
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
      name,
      activationCode,
    });
    return { activation_token, response };
  }

  async createActivationToken(user: UserData | UserRegisterData | string) {
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

  async activateUser(activationDto: ActivationDto, response: Response) {
    const { activationCode, activationToken } = activationDto;
    const newUser: { user: UserData; activationCode: string } =
      this.jwtService.verify(activationToken, {
        secret: this.configService.get<string>('ACTIVATION_SECRET'),
      } as JwtVerifyOptions) as { user: UserData; activationCode: string };
    if (newUser.activationCode !== activationCode) {
      throw new BadRequestException('Invalid activation code');
    }

    const { name, email, password, phone_number } = newUser.user;
    const existUser = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (existUser) {
      throw new BadRequestException('A user is already exist with this email!');
    }

    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        password,
        phone_number,
      },
    });

    return { user, response };
  }

  async Login(loginDto: LoginDto) {
    const { phone_number, password } = loginDto;
    const user = await this.prisma.account.findUnique({
      where: {
        phone_number,
      },
    });
    if (user && (await this.comparePassword(password, user.password))) {
      const tokenSender = new TokenSender(this.configService, this.jwtService);
      return tokenSender.sendLoginToken(user);
    } else {
      // throw new BadRequestException('Invalid credentials')
      return {
        user: null,
        accessToken: null,
        refreshToken: null,
        error: {
          message: 'Invalid user name or password',
        },
      };
    }
  }

  async comparePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
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

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
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

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
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

  async getLoggedInUser(req: any) {
    const user = req.user;
    const refreshToken = req.refreshtoken;
    const accessToken = req.accesstoken;
    // console.log({user, refreshToken, accessToken});
    return { user, refreshToken, accessToken };
  }

  async LogOut(req: any) {
    req.user = null;
    req.refreshtoken = null;
    req.accesstoken = null;
    return { message: 'Logged out successfully!' };
  }

  async getUsers() {
    return this.prisma.user.findMany({});
  }

  async sendVerificationData(verificationDto: VerificationDto) {
    const { personalId, bankAccount, phone_number } = verificationDto;
    const pendingVerification =
      await this.prisma.pendingVerification.findUnique({
        where: {
          phone_number,
        },
      });

    if (pendingVerification) {
      throw new BadRequestException('A pending verification request is exist');
    }

    const verificationData = this.prisma.pendingVerification.create({
      data: {
        bankAccount,
        personalId,
        phone_number,
      },
    });

    return verificationData;
  }

  async rejectVerification(phone_number: number, id: number) {
    const pendingVerification =
      await this.prisma.pendingVerification.findUnique({
        where: {
          phone_number,
          id,
        },
      });

    if (!pendingVerification) {
      throw new BadRequestException('Pending verification not found');
    }

    await this.prisma.pendingVerification.delete({
      where: {
        phone_number,
        id,
      },
    });
  }

  async verify(phone_number: number, id: number) {
    const pendingVerification =
      await this.prisma.pendingVerification.findUnique({
        where: {
          phone_number,
          id,
        },
      });

    if (!pendingVerification) {
      throw new BadRequestException('Pending verification not found');
    }

    const newVerification = await this.prisma.verification.create({
      data: {
        personalId: pendingVerification.personalId,
        bankAccount: pendingVerification.bankAccount,
        userLevel: 1,
        user: {
          connect: { phone_number }, // Associate with the user by phone number
        },
      },
    });
    await this.prisma.pendingVerification.delete({
      where: {
        phone_number,
        id,
      },
    });

    return newVerification;
  }

  async addNewBankAccountRequest(
    phone_number: number,
    personalId: string,
    newBankAccount: string,
  ) {
    const existedPendingReq =
      await this.prisma.pendingNewBankAccountRequest.findUnique({
        where: {
          personalId,
        },
      });
    if (existedPendingReq) {
      throw new BadRequestException('Pending request is already existed!');
    }
    const verification = await this.prisma.verification.findUnique({
      where: {
        personalId,
      },
    });
    if (!verification) {
      throw new BadRequestException(
        'User with this personal ID is not verified or may not existed!',
      );
    }
    const req = await this.prisma.pendingNewBankAccountRequest.create({
      data: {
        personalId,
        newBankAccount,
      },
    });

    return req;
  }

  async verifyNewBankAccount(
    phone_number: number,
    personalId: string,
    newBankAccount: string,
  ) {
    const req = await this.prisma.pendingNewBankAccountRequest.findUnique({
      where: {
        personalId,
      },
    });
    if (!req) {
      throw new BadRequestException('Pending request is not existed!');
    }
    const verification = await this.prisma.verification.findUnique({
      where: {
        personalId,
      },
    });
    if (!verification) {
      throw new BadRequestException(
        'User with this personal ID is not verified!',
      );
    }
    const bankAccounts = verification.bankAccount.slice();
    bankAccounts.push(newBankAccount);
    const updatedVerificationData = await this.prisma.verification.update({
      where: {
        personalId,
      },
      data: {
        bankAccount: bankAccounts,
        user: {
          connect: { phone_number }, // Associate with the user by phone number
        },
      },
    });
    return updatedVerificationData;
  }

  async sendMessage(phone_number: number, activation_code: string) {
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
      await this.sender.Send(
        {
          message: 'وب سرویس تخصصی کاوه نگار',
          // message: encodedMessage,
          sender: '10008663',
          receptor: phone_number.toString(),

        },
      )
      console.log("sended");
 


  }

  async verifyMessage(activationDto:ActivationDto, response: Response) {

    const { activationCode, activationToken } = activationDto;
    const userObj: { phone_number: string; activationCode: string } =
      this.jwtService.verify(activationToken, {
        secret: this.configService.get<string>('ACTIVATION_SECRET'),
      } as JwtVerifyOptions) as { phone_number: string; activationCode: string };
      const isMatched = userObj.activationCode == activationCode
    // if (!isMatched) {
    //   throw new BadRequestException('Invalid activation code');
    // }

    return {isMatched,response}
  }


}
