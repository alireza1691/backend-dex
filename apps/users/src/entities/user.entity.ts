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
  phone_number: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

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
  verified: VerificationData | null;


  @Field({ nullable: true })
  address?: string;

  @Field({ nullable: true })
  phone_number: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

export class VerificationData{
  @Field()
  bankAccount: string[];

  @Field()
  personalId: string;

  @Field()
  level: number;

}