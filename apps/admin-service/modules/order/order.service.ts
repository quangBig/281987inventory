import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AdminOrder, OrderStatus } from './schemas/order.schema';
import { KafkaService } from '../kafka/kafka.service';
import { KAFKA_TOPICS } from 'apps/admin-service/config/kafka.config';
import { OrderResponseDto } from './dto/order-response.dto';

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
        @Inject(forwardRef(() => KafkaService))
        private readonly kafkaService: KafkaService
    ) { }

    async createOrderFromWebService(orderData: OrderSyncData): Promise<AdminOrder> {
        try {
            this.logger.log(`Tạo đơn hàng trong admin service: ${orderData.orderNumber}`);

            // Kiểm tra các trường bắt buộc
            if (!orderData.orderNumber || !orderData.customerEmail || !orderData.customerName || !orderData.totalAmount) {
                throw new Error(`Missing required fields: orderNumber: ${orderData.orderNumber}, customerEmail: ${orderData.customerEmail}, customerName: ${orderData.customerName}, totalAmount: ${orderData.totalAmount}`);
            }

            // Kiểm tra xem đơn hàng đã tồn tại chưa
            const existingOrder = await this.orderModel.findOne({
                orderNumber: orderData.orderNumber
            });

            if (existingOrder) {
                this.logger.warn(`Đơn hàng ${orderData.orderNumber} đã tồn tại trong admin service`);
                return existingOrder;
            }

            // Phân tích ngày tháng an toàn, fallback về ngày hiện tại nếu không hợp lệ
            const parseDate = (dateString: string): Date => {
                if (!dateString) return new Date();
                const date = new Date(dateString);
                return isNaN(date.getTime()) ? new Date() : date;
            };

            // Tạo đơn hàng mới với trạng thái xử lý của admin service
            const newOrder = new this.orderModel({
                orderNumber: orderData.orderNumber,
                customerEmail: orderData.customerEmail,
                customerName: orderData.customerName,
                items: orderData.items || [],
                totalAmount: orderData.totalAmount,
                status: OrderStatus.PENDING, // Bắt đầu với trạng thái chờ xử lý
                createdAt: parseDate(orderData.createdAt),
                updatedAt: parseDate(orderData.updatedAt),
            });

            const savedOrder = await newOrder.save();
            this.logger.log(`Tạo thành công đơn hàng ${orderData.orderNumber} trong admin service`);

            return savedOrder;
        } catch (error) {
            this.logger.error(`Thất bại khi tạo đơn hàng ${orderData?.orderNumber}:`, error);
            throw error;
        }
    }

    async updateOrderStatus(orderNumber: string, status: OrderStatus): Promise<any> {
        this.logger.log(`[DEBUG] updateOrderStatus được gọi với orderNumber: ${orderNumber}, status: ${status}`);

        try {
            const orderUpdate = await this.orderModel.findOneAndUpdate(
                { orderNumber },
                {
                    status,
                    updatedAt: new Date()
                },
                { new: true }
            );

            if (!orderUpdate) {
                throw new Error(`Order ${orderNumber} not found`);
            }

            this.logger.log(`Đã cập nhật trạng thái đơn hàng ${orderNumber} thành ${status}`);

            // Publish message đến web-service để đồng bộ trạng thái
            await this.kafkaService.publish(KAFKA_TOPICS.ORDER_CREATED, orderNumber, 'order-status.updated', {
                orderNumber,
                status
            });

            this.logger.log(`Đã publish message cập nhật trạng thái đơn hàng ${orderNumber} đến topic ${KAFKA_TOPICS.ORDER_CREATED}`);

            // Ánh xạ thủ công sang OrderResponseDto để tránh lỗi TypeScript
            return {
                _id: (orderUpdate._id?.toString() || '') as string,
                orderNumber: orderUpdate.orderNumber,
                customerEmail: orderUpdate.customerEmail,
                customerName: orderUpdate.customerName,
                items: orderUpdate.items.map(item => ({
                    sku: item.sku,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price
                })),
                totalAmount: orderUpdate.totalAmount,
                status: orderUpdate.status,
                createdAt: orderUpdate.createdAt,
                updatedAt: orderUpdate.updatedAt
            };
        } catch (error) {
            this.logger.error(`Thất bại khi cập nhật trạng thái đơn hàng cho ${orderNumber}:`, error);
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