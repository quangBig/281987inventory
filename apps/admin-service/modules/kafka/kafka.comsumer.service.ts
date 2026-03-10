import { Injectable, Logger } from "@nestjs/common";
import { KAFKA_TOPICS } from "apps/admin-service/config/kafka.config";
import { Consumer, Kafka } from "kafkajs";
import { OrderService } from "../order/order.service";
import { InventoryService } from "../inventory/inventory.service";
import { ProductService } from "../product/product.service";

@Injectable()
export class KafkaConsumerService {
    private readonly logger = new Logger(KafkaConsumerService.name);
    private consumer: Consumer;

    constructor(
        private readonly kafka: Kafka,
        private readonly orderService: OrderService,
        private readonly inventoryService: InventoryService,
        private readonly productService: ProductService
    ) {
        this.consumer = this.kafka.consumer({ groupId: 'admin-service-group' });
    }

    async onModuleInit() {
        // Wait a bit for Kafka to be ready
        await new Promise(resolve => setTimeout(resolve, 2000));

        await this.consumer.subscribe({
            topics: [
                KAFKA_TOPICS.ORDER_CREATED,
                KAFKA_TOPICS.INVENTORY_UPDATED
            ],
        });

        await this.consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                try {
                    if (!message.value) {
                        this.logger.warn(`Nhận được message null từ topic ${topic}`);
                        return;
                    }

                    const messageData = JSON.parse(message.value.toString());
                    this.logger.log(`Nhận được message từ topic ${topic}:`, messageData);

                    const data = messageData.data;

                    if (!data) {
                        this.logger.error(`Không có trường data trong message từ topic ${topic}`);
                        return;
                    }

                    switch (topic) {
                        case KAFKA_TOPICS.ORDER_CREATED:
                            if (data.event === 'order.created') {
                                await this.handleOrderCreated(data.data);
                            } else if (data.event === 'order-status.updated') {
                                await this.handleOrderStatusUpdated(data.data);
                            } else {
                                this.logger.warn(`Loại event không xác định: ${data.event}`);
                            }
                            break;
                        case KAFKA_TOPICS.INVENTORY_UPDATED:
                            await this.handleInventoryUpdated(data);
                            break;
                    }

                } catch (error) {
                    this.logger.error(`Lỗi xử lý message từ topic ${topic}:`, error);
                }
            },
        });
    }

    private async handleOrderCreated(orderData: any) {
        this.logger.log(`Tạo đơn hàng trong admin service: ${orderData.orderNumber}`);
        this.logger.log(`Dữ liệu đơn hàng nhận được:`, JSON.stringify(orderData, null, 2));

        try {
            await this.orderService.createOrderFromWebService(orderData);
            this.logger.log(`Xử lý thành công việc tạo đơn hàng: ${orderData.orderNumber}`);
        } catch (error) {
            this.logger.error(`Thất bại khi tạo đơn hàng ${orderData.orderNumber}:`, error);
            this.logger.error(`Dữ liệu đơn hàng thất bại:`, JSON.stringify(orderData, null, 2));
        }
    }

    private async handleOrderStatusUpdated(statusData: any) {
        this.logger.log(`Cập nhật trạng thái đơn hàng trong admin service: ${statusData.orderNumber} thành ${statusData.status}`);
        this.logger.log(`Dữ liệu cập nhật trạng thái nhận được:`, JSON.stringify(statusData, null, 2));
        this.logger.log(`[DEBUG] Nguồn message: order-status.updated từ Kafka topic`);

        try {
            // Chuyển đổi status string sang OrderStatus enum
            const status = statusData.status.toLowerCase();
            await this.orderService.updateOrderStatus(statusData.orderNumber, status as any);
            this.logger.log(`Cập nhật thành công trạng thái đơn hàng: ${statusData.orderNumber} thành ${statusData.status}`);
        } catch (error) {
            this.logger.error(`Thất bại khi cập nhật trạng thái đơn hàng ${statusData.orderNumber}:`, error);
            this.logger.error(`Dữ liệu trạng thái thất bại:`, JSON.stringify(statusData, null, 2));
        }
    }

    private async handleInventoryUpdated(inventoryData: any) {
        this.logger.log(`Cập nhật inventory trong admin service: ${inventoryData.productSku}`);

        try {
            // Cập nhật inventory trong admin service
            await this.inventoryService.updateInventory(
                inventoryData.productSku,
                inventoryData.stockQuantity,
                inventoryData.productName
            );

            // Cũng cập nhật số lượng sản phẩm
            try {
                await this.productService.updateStockQuantity(
                    inventoryData.productSku,
                    inventoryData.stockQuantity
                );
                this.logger.log(`Cập nhật số lượng sản phẩm: ${inventoryData.productSku}, số tồn mới: ${inventoryData.stockQuantity}`);
            } catch (productError) {
                this.logger.warn(`Thất bại khi cập nhật số lượng sản phẩm cho ${inventoryData.productSku}: ${productError.message}`);
            }

            this.logger.log(`Đã cập nhật inventory: ${inventoryData.productSku}, số tồn mới: ${inventoryData.stockQuantity}`);
        } catch (error) {
            this.logger.error(`Thất bại khi cập nhật inventory ${inventoryData.productSku}:`, error);
        }
    }

    async onModuleDestroy() {
        await this.consumer.disconnect();
    }
}
