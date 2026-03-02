import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoConfig } from './config/mongo.config';
import { KafkaModule } from './modules/kafka/kafka.module';
import { ProductSyncModule } from './modules/product/product-sync.module';
import { OrderModule } from './modules/order/order.module';

@Module({
  imports: [
    MongooseModule.forRoot(MongoConfig.uri as string),
    ProductSyncModule,
    KafkaModule,
    OrderModule,

  ],
  controllers: [],
  providers: [],
})
export class WebServiceModule { }
