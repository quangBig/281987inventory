import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from '../order/schemas/order.schema';
import { OrderSyncService } from '../order/order-sync.service';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }])
    ],
    providers: [OrderSyncService],
    exports: [OrderSyncService],
})
export class OrderSyncModule {}
