import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import Moralis from 'moralis';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
      // Call Moralis.start() here
 
  app.enableCors()
  await app.listen(4000);
  console.log("Listening for API calls...");

  // Moralis.start({
  //   apiKey: 'TsLS6Uwt4tfB5QoDEmhh82BVsIRK7zqdwPI9LmTyUmt4aLend9KxfZWfpfTc7iEF',
  // });

}
bootstrap();
