import { ObjectType, Field } from '@nestjs/graphql';

import { Account, User } from '../entities/user.entity';


@ObjectType()
export class ErrorType {
  @Field()
  message: string;

  @Field({ nullable: true })
  code?: string;
}

@ObjectType()
export class RegisterResponse {
  @Field()
  activation_token: string;

  @Field()
  activationCode: string;

  // @Field(() => User, { nullable: true }) // Include the user field of type User
  // user?: User; // Optional user field


  @Field(() => ErrorType, { nullable: true })
  error?: ErrorType;
}


@ObjectType()
export class RegistrationConfirmResponse{
  @Field()
  user: Account 

 
  @Field(() => ErrorType, { nullable: true })
  error?: ErrorType;
}

@ObjectType()
export class ActivationResponse {
  @Field(() => User)
  user: User | any;
  

  @Field(() => ErrorType, { nullable: true })
  error?: ErrorType;
}

@ObjectType()
export class LoginResponse {
  @Field(() => Account, { nullable: true })
  user?: Account | any;

  @Field({ nullable: true })
  accessToken?: string;

  @Field({ nullable: true })
  refreshToken?: string;

  @Field(() => ErrorType, { nullable: true })
  error?: ErrorType;
}

@ObjectType()
export class LogoutResposne {
  @Field()
  message?: string;
}

@ObjectType()
export class ForgotPasswordResponse {
  @Field()
  message: string;

  @Field(() => ErrorType, { nullable: true })
  error?: ErrorType;
}

@ObjectType()
export class ResetPasswordResponse {
  @Field(() => User)
  user: User | any;

  @Field(() => ErrorType, { nullable: true })
  error?: ErrorType;
}

@ObjectType()
export class VerifyRequestResponse {

  @Field()
  id: number

  @Field(() => [String])
  bankAccount: string[]

  @Field()
  personalId: string

  @Field()
  phoneNumber: string


  @Field(() => ErrorType, { nullable: true })
  error?: ErrorType;
}

@ObjectType()
export class SendMessageResponse {
  @Field()
  message: string;
}

@ObjectType()
export class LoginReqResponse {

  @Field()
  activation_token: string;


  @Field()
  activationCode: string;


  @Field(() => ErrorType, { nullable: true })
  error?: ErrorType;
}

 