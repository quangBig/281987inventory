import { NestFactory } from '@nestjs/core';
import { WebServiceModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(WebServiceModule);
  await app.listen(process.env.port ?? 3001);
}
bootstrap();
