import {InputType, Field} from "@nestjs/graphql"
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator"

type WalletAsset = "Toman" | "Paypal" | "Visa"
type VisaPayAsset = "Toman" | "Paypal"
type PaypalPayAsset = "Toman" | "Visa"
@InputType()
export class BuyTokenOrderDto {


    @Field()
    @IsNotEmpty({message: 'Phone Number is required.'})
    phoneNumber:string;

    @Field()
    @IsNotEmpty({message: 'receiverAddress is required.'})
    receiverAddress:string;

    @Field()
    @IsNotEmpty({message: 'tokenAddress is required.'})
    tokenAddress:string;

    @Field()
    @IsNotEmpty({message: 'tokenAddress is required.'})
    payMethod:WalletAsset;

    @Field()
    @IsNotEmpty({message: 'tomanPaidAmount is required.'})
    paidAmount:number;

    @Field()
    @IsNotEmpty({message: 'tokenPriceInDollar is required.'})
    tokenPriceInDollar:number;

    @Field()
    @IsNotEmpty({message: 'expectedTokenAmount is required.'})
    expectedTokenAmount:number;

}

@InputType()
export class SellTokenOrderDto {

    // model SellCryptoOrder {
    //     id                 Int      @id @default(autoincrement())
    //     fromAsset          String
    //     tokenName          String
    //     tokenAddress       String   @unique
    //     tokenPriceInDollar Int
    //     payMethod          String
    //     paidAmount         Int
    //     outAmount          Int
    //     orderedAt          DateTime @default(now())
    //     status             String
    //     phoneNumber        String   @unique
    //     receiverAddress    String
    //   }
    @Field()
    @IsNotEmpty({message: 'Phone Number is required.'})
    phoneNumber:string;

    @Field()
    @IsNotEmpty({message: 'receiverAddress is required.'})
    receiverAddress:string;

    @Field()
    @IsNotEmpty({message: 'senderAddress is required.'})
    senderAddress:string;


    @Field()
    @IsNotEmpty({message: 'tokenAddress is required.'})
    tokenAddress:string;

    @Field()
    @IsNotEmpty({message: 'tokenAdreceiveAssetdress is required.'})
    receiveAsset:WalletAsset;

    @Field()
    @IsNotEmpty({message: 'tokenAmount is required.'})
    tokenAmount:number;

    @Field()
    @IsNotEmpty({message: 'tokenPriceInDollar is required.'})
    tokenPriceInDollar:number;

    @Field()
    @IsNotEmpty({message: 'expectedReceiveAmount is required.'})
    expectedReceiveAmount:number;

}


@InputType()
export class BuyVisaDto {


    @Field()
    @IsNotEmpty({message: 'Phone Number is required.'})
    phoneNumber:string;


    @Field()
    @IsNotEmpty({message: 'payMethod is required.'})
    payMethod:VisaPayAsset;

    @Field()
    @IsNotEmpty({message: 'tomanPaidAmount is required.'})
    paidAmount:number;

    @Field()
    @IsNotEmpty({message: 'expectedReceiveAmount is required.'})
    expectedReceiveAmount:number;

    @Field()
    @IsNotEmpty({message: 'feeAmount is required.'})
    feeAmount:number;
}

@InputType()
export class SendVisaDto {


    @Field()
    @IsNotEmpty({message: 'Phone Number is required.'})
    phoneNumber:string;


    @Field()
    @IsNotEmpty({message: 'receiverAddress is required.'})
    receiverAddress:string;



    @Field()
    @IsNotEmpty({message: 'amount is required.'})
    amount:number;

    @Field()
    @IsNotEmpty({message: 'expectedReceiveAmount is required.'})
    expectedReceiveAmount:number;

}

@InputType()
export class ExecuteFeeDto {

    @Field()
    @IsNotEmpty({message: 'Phone Number is required.'})
    phoneNumber:string;

    @Field()
    @IsNotEmpty({message: 'asset is required.'})
    asset:string;

    @Field()
    @IsNotEmpty({message: 'destinationAssetis required.'})
    destinationAsset:string;

    @Field()
    @IsNotEmpty({message: 'Fee amount is required.'})
    amount:number;


}

@InputType()
export class ReceiveVisaDto {
    @Field()
    @IsNotEmpty({message: 'Phone Number is required.'})
    phoneNumber:string;

    @Field()
    @IsNotEmpty({message: 'expectedReceiveAmount is required.'})
    expectedReceiveAmount:number;


}
