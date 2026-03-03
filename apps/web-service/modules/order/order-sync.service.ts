import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderStatus } from './schemas/order.schema';

export interface OrderStatusSyncData {
    orderNumber: string;
    status: string;
}

@Injectable()
export class OrderSyncService {
    private readonly logger = new Logger(OrderSyncService.name);

    constructor(
        @InjectModel(Order.name)
        private readonly orderModel: Model<Order>
    ) { }

    async updateOrderStatus(statusData: OrderStatusSyncData): Promise<void> {
        try {
            this.logger.log(`Đồng bộ trạng thái đơn hàng: ${statusData.orderNumber} thành ${statusData.status}`);

            // Tìm đơn hàng trong web-service
            const order = await this.orderModel.findOne({
                orderNumber: statusData.orderNumber
            });

            if (!order) {
                this.logger.warn(`Không tìm thấy đơn hàng ${statusData.orderNumber} trong web-service để đồng bộ trạng thái`);
                return;
            }

            // Cập nhật trạng thái
            const oldStatus = order.status;
            order.status = statusData.status as OrderStatus;
            order.updatedAt = new Date();

            await order.save();

            this.logger.log(`Đã đồng bộ thành công trạng thái đơn hàng ${statusData.orderNumber}: ${oldStatus} → ${statusData.status}`);
        } catch (error) {
            this.logger.error(`Thất bại khi đồng bộ trạng thái đơn hàng ${statusData.orderNumber}:`, error);
            throw error;
        }
    }
}