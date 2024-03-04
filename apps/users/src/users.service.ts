import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtVerifyOptions } from '@nestjs/jwt';
import { Response } from 'express';
import { PrismaService } from '../../../prisma/prisma.service';
import { ActivationDto, LoginDto, RegisterDto } from './dto/user.dto';
import * as bcrypt from 'bcrypt'
import { EmailService } from './email/email.service';
import { TokenSender } from './utils/sendToken';

interface UserData {
  name: string;
  email: string;
  password: string;
  phone_number: number
}

@Injectable()
export class UsersService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ){}

  async register(registerDto: RegisterDto,response: Response) {
    const { name,email,password,phone_number} = registerDto;
    const IsEmailExist = await this.prisma.user.findUnique({
      where: {
        email,
      },
    })
    if (IsEmailExist) {
      throw new BadRequestException("User already registered with this email ")
    }

    const isPhoneNumberExist = await this.prisma.user.findUnique({
      where : {
        phone_number,
      }
    })
    if (isPhoneNumberExist) {
      throw new BadRequestException("User already registered with this phone number ")
    }

    const hashedPassword = await bcrypt.hash(password,10)
    const user = {
        name,
        email,
        password: hashedPassword,
        phone_number
        // address
    }
    const activationToken = await this.createActivationToken(user)
    const activationCode = activationToken.activationCode
    const activation_token = activationToken.token

    await this.emailService.sendMail({
      email,
      subject: 'Active your account',
      template:'./activation-mail',
      name,
      activationCode,
    })
    return {activation_token,response};
  }

  async createActivationToken(user: UserData) {
    const activationCode = Math.floor(1000+ Math.random() * 9000).toString()
    const token = this.jwtService.sign(
      {
        user,
        activationCode,
      },
      {
        secret: this.configService.get<string>('ACTIVATION_SECRET'),
        expiresIn: "5m",
      }
    )
    return {token, activationCode}
  }

  async activateUser(activationDto: ActivationDto, response: Response) {
    const {activationCode, activationToken} = activationDto;
    const newUser: { user: UserData,activationCode : string} = this.jwtService.verify(
      activationToken,
      {secret: this.configService.get<string>('ACTIVATION_SECRET')} as JwtVerifyOptions
    ) as { user: UserData, activationCode: string}
    if (newUser.activationCode !== activationCode){
      throw new BadRequestException('Invalid activation code')
    }

    const { name, email, password, phone_number } = newUser.user
    const existUser = await this.prisma.user.findUnique({
      where:{
        email,
      }
    })
    if (existUser) {
      throw new BadRequestException('A user is already exist with this email!')
    }

    const user = await this.prisma.user.create({
      data:{
        name,
        email,
        password,
        phone_number
      }
    })

    return { user ,response}
  }

  async Login(loginDto :LoginDto) {
    const { email, password } = loginDto;
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      }
    })
    if ( user && await this.comparePassword(password, user.password)) {
      const tokenSender = new TokenSender(this.configService,this.jwtService)
      return tokenSender.sendToken(user)
    } else {
      // throw new BadRequestException('Invalid credentials')
      return {
        user: null,
        accessToken: null,
        refreshToken: null,
        error: {
          message: "Invalid email or password",
        }
      }
    }


  }

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }


  async getLoggedInUser(req: any) {
    const user = req.user;
    const refreshToken = req.refreshToken;
    const accessToken = req.accessToken;
    // console.log({user, refreshToken, accessToken});
    return {user, refreshToken, accessToken}

  }

  async getUsers() {

    return this.prisma.user.findMany({})

  }
}
