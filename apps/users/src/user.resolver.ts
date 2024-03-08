import { BadRequestException, UseFilters, UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Response } from 'express';
import { ActivationDto, ForgotPasswordDto, RegisterDto, ResetPasswordDto } from './dto/user.dto';
import { User } from './entities/user.entity';
import { AuthGuard } from './guards/auth.guard';
import { ActivationResponse, ForgotPasswordResponse, LoginResponse, LogoutResposne, RegisterResponse, ResetPasswordResponse } from './types/user.types';
import { UsersService } from './users.service';

@Resolver('User')
// @UseFilters
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}
  @Mutation(() => RegisterResponse)
  async register(
    @Args('registerDto') registerDto: RegisterDto,
    @Context() context: { res: Response },
  ): Promise<RegisterResponse> {
    if (!registerDto.name || !registerDto.email || !registerDto.password) {
      throw new BadRequestException(' Please fill all the fields');
    }

    const { activation_token } = await this.usersService.register(
      registerDto,
      context.res,
    );
    return { activation_token };

  }

  @Mutation(() => ActivationResponse)
  async activateUser(
    @Args('activationDto') activationDto: ActivationDto,
    @Context() context: { res : Response},
  ): Promise<ActivationResponse> {
    return await this.usersService.activateUser(activationDto,context.res)
  }

  @Mutation(() => LoginResponse)
  async Login(
    @Args('email') email: string,
    @Args('password') password: string
  ): Promise<LoginResponse> {
    return this.usersService.Login({email,password})
  }

  @Query(() => LoginResponse)
  @UseGuards(AuthGuard)
  async getLoggedInUser (@Context() context: {req: Request}) {  
    return await this.usersService.getLoggedInUser(context.req)
  }

  @Mutation(() => ForgotPasswordResponse)
  async forgotPassword (
    @Args('forgotPasswordDto') forgotPasswordDto: ForgotPasswordDto,
    // @Context() context: {res: Response}
    ):Promise<ForgotPasswordResponse> {  
    return await this.usersService.forgotPassword(forgotPasswordDto)
  }

  @Mutation(() => ResetPasswordResponse)
  async resetPassword (
    @Args('resetPasswordDto') resetPasswordDto: ResetPasswordDto,
    // @Context() context: {res: Response}
    ):Promise<ResetPasswordResponse> {  
    return await this.usersService.resetPassword(resetPasswordDto)
  }


  @Query(() => LogoutResposne)
  @UseGuards(AuthGuard)
  async LogOutUser (@Context() context: {req: Request}) {  
    return await this.usersService.LogOut(context.req)
  }

  @Query(() => [User])
  async getUsers() {
    return this.usersService.getUsers();
  }
}
