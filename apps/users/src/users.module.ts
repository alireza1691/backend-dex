import { ApolloFederationDriver, ApolloFederationDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { ConfigModule, ConfigService } from "@nestjs/config"
import { JwtService } from "@nestjs/jwt"
import { PrismaService } from '../../../prisma/prisma.service';
import { UsersResolver } from './user.resolver';
import { EmailModule } from './email/email.module';
import { KavenegarModule } from '@fraybabak/kavenegar_nest';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    KavenegarModule.forRoot({
      apikey: "5675342B5473762B7A756262526B2F686D38784C424F71644E426D582B466B6E39316447624B75462B57633D",
    }),
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      autoSchemaFile: {
        federation: 2,
      },
    }),
    EmailModule
  ],
  controllers: [UsersController],
  providers: [UsersService,ConfigService,JwtService,PrismaService,UsersResolver],
})
export class UsersModule {}
