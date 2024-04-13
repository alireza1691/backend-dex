import { ObjectType, Field, Directive } from '@nestjs/graphql';

@ObjectType()
@Directive('@key(fields:"id")')
export class Avatars {
  @Field()
  id: string;

  @Field()
  public_id: string;

  @Field()
  url: string;

  @Field()
  userId: string;
}

@ObjectType()
export class User {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field()
  password: string;

  @Field(() => Avatars, { nullable: true })
  avatar?: Avatars | null;

  @Field()
  role: string;

  @Field({ nullable: true })
  address: string;

  @Field({ nullable: true })
  phoneNumber: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class VerificationData {
  @Field()
  id: string;

  @Field()
  personalId: string;

  @Field(() => BankAccount, { nullable: true })
  bankAccount: BankAccount[] | null;

  // @Field()
  // user: Account;

  @Field()
  phoneNumber: string;

  @Field()
  userLevel: number;

  @Field()
  address?: string;

}


@ObjectType()
export class Account {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field()
  lastName: string;

  @Field()
  email?: string;

  @Field()
  password: string;

  @Field(() => VerificationData, { nullable: true })
  verification?: VerificationData | null;


  @Field()
  phoneNumber: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}


@ObjectType()
export class PendingVerificationData {
  @Field()
  id: number;

  @Field()
  personalId: string;

  @Field()
  personalCardImageUrl: string;

  @Field()
  userImageUrl?: string;

  @Field()
  userVerifyTextImageUrl?: string;

  @Field()
  phoneNumber: string;
  @Field()
  isReadyToCheck: boolean;

}


@ObjectType()
export class BankAccount {
  @Field()
  id: string;

  @Field()
  phoneNumber: string;

  @Field()
  shabaNumber: string;

  @Field()
  cardNumber: string;


  @Field(() => VerificationData, { nullable: true })
  verification?: VerificationData | null;

}


