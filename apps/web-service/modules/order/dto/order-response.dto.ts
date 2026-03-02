import { OrderStatus } from '../schemas/order.schema';

export class OrderItemResponseDto {
    sku: string;
    name: string;
    quantity: number;
    price: number;
}

export class OrderResponseDto {
    _id: string;
    orderNumber: string;
    customerEmail: string;
    customerName: string;
    items: OrderItemResponseDto[];
    totalAmount: number;
    status: OrderStatus;
    createdAt: Date;
    updatedAt: Date;
}
