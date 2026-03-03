import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Order, OrderSchema } from './schemas/order.schema';
import { KafkaModule } from '../kafka/kafka.module';
import { OrderService } from './order.service';
import { OrderSyncService } from './order-sync.service';
import { ProductSyncModule } from '../product/product-sync.module';
import { OrderController } from './order.controller';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
        KafkaModule,
        ProductSyncModule,
    ],
    controllers: [OrderController],
    providers: [OrderService, OrderSyncService],
    exports: [OrderService, OrderSyncService],
})
export class OrderModule { }
