import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProxyController } from './proxy.controller';
import { HttpModule } from '@nestjs/axios';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloGatewayDriver, ApolloGatewayDriverConfig } from '@nestjs/apollo';
import { IntrospectAndCompose } from '@apollo/gateway';
import { BlockchainModule } from '../../blockchain/src/blockchain.module';

@Module({
  imports: [
    HttpModule,
    GraphQLModule.forRoot<ApolloGatewayDriverConfig>({
      driver: ApolloGatewayDriver,
      gateway: { supergraphSdl: new IntrospectAndCompose({ subgraphs: [] }) },
    }),
    BlockchainModule,
  ],
  controllers: [AppController, ProxyController],
  providers: [AppService],
})
export class AppModule {}
