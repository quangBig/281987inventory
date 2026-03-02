// src/schemas/order.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum OrderStatus {
    CONFIRMED = 'confirmed',
    PENDING = 'pending',
    PROCESSING = 'processing',
    SHIPPED = 'shipped',
    DELIVERED = 'delivered',
    CANCELLED = 'cancelled'
}  
@Schema()
export class OrderItem {
    @Prop({ required: true })
    sku: string;

    @Prop({ required: true })
    name: string;

    @Prop({ required: true, min: 1 })
    quantity: number;

    @Prop({ required: true, min: 0 })
    price: number;
}

@Schema({
    collection: 'orders',
    timestamps: true
})
export class Order extends Document {
    // Mã đơn hàng
    @Prop({ required: true, unique: true })
    orderNumber: string;

    // Email khách hàng
    @Prop({ required: true })
    customerEmail: string;

    // Tên khách hàng
    @Prop({ required: true })
    customerName: string;

    // Danh sách sản phẩm trong đơn hàng
    @Prop({
        type: [OrderItem],
        required: true
    })
    items: OrderItem[];

    // Tổng số tiền
    @Prop({ required: true, min: 0 })
    totalAmount: number;

    // Trạng thái đơn hàng
    @Prop({
        type: String,
        enum: OrderStatus,
        default: OrderStatus.PENDING
    })
    status: OrderStatus;

    @Prop()
    createdAt: Date;

    @Prop()
    updatedAt: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);