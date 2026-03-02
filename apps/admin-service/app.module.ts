import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoConfig } from './config/mongo.config';
import { KafkaModule } from './modules/kafka/kafka.module';
import { ProductModule } from './modules/product/product.module';
import { OrderModule } from './modules/order/order.module';

@Module({
  imports: [
    MongooseModule.forRoot(MongoConfig.uri as string),
    KafkaModule,
    ProductModule,
    OrderModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
