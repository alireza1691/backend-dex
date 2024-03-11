import {InputType, Field} from "@nestjs/graphql"
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator"


@InputType()
export class RegisterDto {
    @Field()
    @IsNotEmpty({message: 'Name is required.'})
    @IsString({message: "Name must needed to be one string."})
    name:string;

    @Field()
    @IsNotEmpty({message: 'Password is required.'})
    @MinLength(8,{message: "Password must be at least 8 characters"})
    password:string

    @Field()
    @IsNotEmpty({message: 'Email is required.'})
    @IsEmail({},{message: "Email is invalid."})
    email:string;

    @Field()
    @IsNotEmpty({message: 'Phone Number is required.'})
    phone_number:number;

    // @Field()
    // @IsNotEmpty({message: 'Address is required.'})
    // address:string;
}

@InputType()
export class ActivationDto {
    @Field()
    @IsNotEmpty({message:"Activation Token is required"})
    activationToken: string;

    @Field()
    @IsNotEmpty({message : "Activation Code is required"})
    activationCode: string;
}

@InputType()
export class LoginDto {

    @Field()
    @IsNotEmpty({message: 'Email is required.'})
    @IsEmail({},{message: "Email must be valid."})
    email:string;

    @Field()
    @IsNotEmpty({message: 'Password is required.'})
    password:string

}

@InputType()
export class ForgotPasswordDto {
    @Field()
    @IsNotEmpty({message: 'Email is required.'})
    @IsEmail({},{message: "Email must be valid."})
    email:string;

}

@InputType()
export class ResetPasswordDto {
    @Field()
    @IsNotEmpty({message: 'Password is required.'})
    @MinLength(8,{message: "Password must be at least 8 characters"})
    password:string

    @Field()
    @IsNotEmpty({message: 'Activation token is requried.'})
    activationToken: string
}

@InputType()
export class VerificationDto {
    @Field()
    @IsNotEmpty({message: 'Personal Id is required.'})
    personalId: string

    @Field()
    @IsNotEmpty({message: 'Phone Number is required.'})
    phone_number: number

    @Field(() => [String])
    @IsNotEmpty({message: 'Bank Account is required.'})
    bankAccount:  string[]
}

export class VerifyDto {

}