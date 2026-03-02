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
    collection: 'admin_orders',
    timestamps: true
})
export class AdminOrder extends Document {
    @Prop({ required: true, unique: true })
    orderNumber: string;

    @Prop({ required: true })
    customerEmail: string;

    @Prop({ required: true })
    customerName: string;

    @Prop({
        type: [OrderItem],
        required: true
    })
    items: OrderItem[];

    @Prop({ required: true, min: 0 })
    totalAmount: number;

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

export const AdminOrderSchema = SchemaFactory.createForClass(AdminOrder);
