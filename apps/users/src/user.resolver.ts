import { BadRequestException, UseFilters, UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Response } from 'express';
import { stringify } from 'querystring';
import {
  // ActivationDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  RegisterUserDto,
  ResetPasswordDto,
  VerificationDto,
  VerifyMessageDto,
} from './dto/user.dto';
import { User,Account } from './entities/user.entity';
import { AuthGuard } from './guards/auth.guard';
import {
  ActivationResponse,
  ForgotPasswordResponse,
  LoginReqResponse,
  LoginResponse,
  LogoutResposne,
  RegisterResponse,
  RegistrationConfirmResponse,
  ResetPasswordResponse,
  SendMessageResponse,
  VerifyRequestResponse,
} from './types/user.types';
import { UsersService } from './users.service';

@Resolver('User')
// @UseFilters
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}
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

  @Mutation(() => RegisterResponse)
  async registerUser(
    @Args('registerUserDto') registerUserDto: RegisterUserDto,
    @Context() context: {res: Response},
  ):Promise <RegisterResponse> {
    if (!registerUserDto.name || !registerUserDto.lastName || !registerUserDto.password) {
      throw new BadRequestException(' Please fill all the fields');
    }

    const { activation_token,activationCode,response } = await this.usersService.registerUser(
      registerUserDto,
      context.res,
    );
    console.log(activation_token,activationCode);
    if (!activation_token || !activationCode) {
      throw new Error('Activation tokens not provided');
    }
    
    return { activation_token,activationCode};
  }

  @Mutation(()=> RegistrationConfirmResponse)
  async verifyRegistrationMessage(
    @Args('verifyMessageDto')verifyMessageDto: VerifyMessageDto,
    @Context() context: {res: Response},
  ):Promise <RegistrationConfirmResponse>{
    const {user} = await this.usersService.verifyRegistrationMessage(verifyMessageDto,context.res)
    return {user}
  }

  @Mutation(()=> Boolean)
  async isNumberExist(
    @Args('phone_number')phone_number: string,
    // @Context() context: {res: Response},
  ): Promise <boolean>{
    console.log("number entered");
    
    return await this.usersService.isUserRegistered(phone_number)
  }

  // @Mutation(() => ActivationResponse)
  // async activateUser(
  //   @Args('activationDto') activationDto: ActivationDto,
  //   @Context() context: { res: Response },
  // ): Promise<ActivationResponse> {
  //   return await this.usersService.activateUser(activationDto, context.res);
  // }

  @Mutation(() => LoginReqResponse)
  async Login(
    @Args('loginDto') loginDto: LoginDto,
    @Context() context: {res: Response},
  ): Promise<LoginReqResponse> {
    return this.usersService.Login(loginDto, context.res);
  }

  @Mutation(() => LoginResponse)
  async ConfirmLoginByMessage(
    @Args('verifyMessageDto') verifyMessageDto: VerifyMessageDto,
  ): Promise<LoginResponse> {
    return this.usersService.ConfirmLoginByMessage(verifyMessageDto)
  }

  @Query(() => LoginResponse)
  @UseGuards(AuthGuard)
  async getLoggedInUser(@Context() context: { req: Request }) {
    return await this.usersService.getLoggedInUser(context.req);
  }

  @Mutation(() => ForgotPasswordResponse)
  async forgotPassword(
    @Args('forgotPasswordDto') forgotPasswordDto: ForgotPasswordDto,
    // @Context() context: {res: Response}
  ): Promise<ForgotPasswordResponse> {
    return await this.usersService.forgotPassword(forgotPasswordDto);
  }

  @Mutation(() => ResetPasswordResponse)
  async resetPassword(
    @Args('resetPasswordDto') resetPasswordDto: ResetPasswordDto,
    // @Context() context: {res: Response}
  ): Promise<ResetPasswordResponse> {
    return await this.usersService.resetPassword(resetPasswordDto);
  }

  @Query(() => LogoutResposne)
  @UseGuards(AuthGuard)
  async LogOutUser(@Context() context: { req: Request }) {
    return await this.usersService.LogOut(context.req);
  }

  @Query(() => [User])
  async getUsers() {
    return this.usersService.getUsers();
  }



  @Mutation(() => SendMessageResponse)
  async sendMessage(
    @Args('phoneNumber') phoneNumber: string,
  ): Promise<SendMessageResponse> {
    await this.usersService.sendMessage(phoneNumber,"1234");
    return { message: 'Message sent successfully' };
  }


}
