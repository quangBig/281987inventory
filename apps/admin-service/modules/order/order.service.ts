import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AdminOrder, OrderStatus } from './schemas/order.schema';

export interface OrderSyncData {
    orderNumber: string;
    customerEmail: string;
    customerName: string;
    items: Array<{
        sku: string;
        name: string;
        quantity: number;
        price: number;
    }>;
    totalAmount: number;
    status: string;
    createdAt: string;
    updatedAt: string;
}

@Injectable()
export class OrderService {
    private readonly logger = new Logger(OrderService.name);

    constructor(
        @InjectModel(AdminOrder.name)
        private readonly orderModel: Model<AdminOrder>,
    ) { }

    async createOrderFromWebService(orderData: OrderSyncData): Promise<AdminOrder> {
        try {
            this.logger.log(`Creating order in admin service: ${orderData.orderNumber}`);

            // Check if order already exists
            const existingOrder = await this.orderModel.findOne({
                orderNumber: orderData.orderNumber
            });

            if (existingOrder) {
                this.logger.warn(`Order ${orderData.orderNumber} already exists in admin service`);
                return existingOrder;
            }

            // Create new order with admin service processing status
            const newOrder = new this.orderModel({
                orderNumber: orderData.orderNumber,
                customerEmail: orderData.customerEmail,
                customerName: orderData.customerName,
                items: orderData.items,
                totalAmount: orderData.totalAmount,
                status: OrderStatus.PENDING, // Start with PENDING for admin processing
                createdAt: new Date(orderData.createdAt),
                updatedAt: new Date(orderData.updatedAt),
            });

            const savedOrder = await newOrder.save();
            this.logger.log(`Successfully created order ${orderData.orderNumber} in admin service`);

            return savedOrder;
        } catch (error) {
            this.logger.error(`Failed to create order ${orderData.orderNumber}:`, error);
            throw error;
        }
    }

    async updateOrderStatus(orderNumber: string, status: OrderStatus): Promise<AdminOrder> {
        try {
            const order = await this.orderModel.findOneAndUpdate(
                { orderNumber },
                {
                    status,
                    updatedAt: new Date()
                },
                { new: true }
            );

            if (!order) {
                throw new Error(`Order ${orderNumber} not found`);
            }

            this.logger.log(`Updated order ${orderNumber} status to ${status}`);
            return order;
        } catch (error) {
            this.logger.error(`Failed to update order status for ${orderNumber}:`, error);
            throw error;
        }
    }

    async getOrderByOrderNumber(orderNumber: string): Promise<AdminOrder | null> {
        return this.orderModel.findOne({ orderNumber });
    }

    async getAllOrders(): Promise<AdminOrder[]> {
        return this.orderModel.find().sort({ createdAt: -1 });
    }

    async getOrdersByStatus(status: OrderStatus): Promise<AdminOrder[]> {
        return this.orderModel.find({ status }).sort({ createdAt: -1 });
    }
}