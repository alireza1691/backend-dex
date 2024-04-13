import {InputType, Field} from "@nestjs/graphql"
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator"


@InputType()
export class AttachGmailDto {

    @Field()
    @IsNotEmpty({message: 'Email is required.'})
    @IsEmail({},{message: "Email is invalid."})
    email:string;

    @Field()
    @IsNotEmpty({message: 'Phone Number is required.'})
    phoneNumber:string;

}

@InputType()
export class RegisterUserDto {
    @Field()
    @IsNotEmpty({message: 'Name is required.'})
    @IsString({message: "Name must needed to be one string."})
    name:string;

    @Field()
    @IsNotEmpty({message: 'Last Name is required.'})
    @IsString({message: "LastName must needed to be one string."})
    lastName:string;


    @Field()
    @IsNotEmpty({message: 'Password is required.'})
    @MinLength(8,{message: "Password must be at least 8 characters"})
    password:string


    @Field()
    @IsNotEmpty({message: 'Phone Number is required.'})
    phoneNumber:string;

}

@InputType()
export class VerifyMessageDto {
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
    @IsNotEmpty({message: 'Phone Number is required.'})
    phoneNumber:string;

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
export class VerificationStepOneDto {
    @Field()
    @IsNotEmpty({message: 'Personal Id is required.'})
    personalId: string

    @Field()
    @IsNotEmpty({message: 'Phone Number is required.'})
    phoneNumber: string

    @Field()
    @IsNotEmpty({message: 'Personal card image url is required.'})
    personalCardImageUrl:  string
}

@InputType()
export class VerificationStepTwoDto {

    @Field()
    @IsNotEmpty({message: 'Phone Number is required.'})
    phoneNumber: string
    @Field()
    @IsNotEmpty({message: 'Personal image url is required.'})
    userImageUrl:  string


    @Field()
    @IsNotEmpty({message: 'Verify image url is required.'})
    userVerifyTextImageUrl:  string
}
export class VerifyDto {
 
    
}

