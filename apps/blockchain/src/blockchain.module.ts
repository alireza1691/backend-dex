import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { BlockchainController } from './blockchain.controller';
import { BlockchainService } from './blockchain.service';
import { ProxyController } from './proxy.controller';


@Module({
  imports:[HttpModule],
  controllers: [BlockchainController,ProxyController],
  providers: [BlockchainService],
})
export class BlockchainModule {}
