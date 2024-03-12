import { NestFactory } from '@nestjs/core';
import Moralis from 'moralis';
import { BlockchainModule } from './blockchain.module';
import * as dotenv from 'dotenv';

Moralis.start({
  apiKey: 'TsLS6Uwt4tfB5QoDEmhh82BVsIRK7zqdwPI9LmTyUmt4aLend9KxfZWfpfTc7iEF',
});

async function bootstrap() {
  const app = await NestFactory.create(BlockchainModule);
      // Call Moralis.start() here
 
  app.enableCors()

  await app.listen(3001);
  console.log("Listening for API calls...");



}
bootstrap();
