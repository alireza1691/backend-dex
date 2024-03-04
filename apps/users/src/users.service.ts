import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { PrismaService } from '../../../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto/user.dto';
import * as bcrypt from 'bcrypt'
import { EmailService } from './email/email.service';

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

    await this.emailService.sendMail({
      email,
      subject: 'Active your account',
      template:'/activation-mail',
      name,
      activationCode,
    })
    return {user,response};
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

  async login(loginDto :LoginDto) {
    const { email, password } = loginDto;
    const user = {
      email,
      password
    }
    return user;
  }

  async getUsers() {

    return this.prisma.user.findMany({})

  }
}
