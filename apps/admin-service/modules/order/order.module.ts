import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderService } from './order.service';
import { AdminOrder, AdminOrderSchema } from './schemas/order.schema';
import { OrderController } from './order.controller';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: AdminOrder.name, schema: AdminOrderSchema }
        ])
    ],
    controllers: [OrderController],
    providers: [OrderService],
    exports: [OrderService],
})
export class OrderModule { }