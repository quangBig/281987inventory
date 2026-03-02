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
                KAFKA_TOPICS.ORDER_CREATED, // Revert back to order.created
                KAFKA_TOPICS.INVENTORY_UPDATED
            ],
        });

        await this.consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                try {
                    if (!message.value) {
                        this.logger.warn(`Received null message from topic ${topic}`);
                        return;
                    }

                    const messageData = JSON.parse(message.value.toString());
                    this.logger.log(`Received message from topic ${topic}:`, messageData);

                    const data = messageData.data;

                    if (!data) {
                        this.logger.error(`No data field in message from topic ${topic}`);
                        return;
                    }

                    switch (topic) {
                        case KAFKA_TOPICS.ORDER_CREATED:
                            await this.handleOrderCreated(data);
                            break;
                        case KAFKA_TOPICS.INVENTORY_UPDATED:
                            await this.handleInventoryUpdated(data);
                            break;
                    }

                } catch (error) {
                    this.logger.error(`Error processing message from topic ${topic}:`, error);
                }
            },
        });
    }

    private async handleOrderCreated(orderData: any) {
        this.logger.log(`Creating order in admin service: ${orderData.orderNumber}`);

        try {
            await this.orderService.createOrderFromWebService(orderData);
            this.logger.log(`Successfully processed order creation: ${orderData.orderNumber}`);
        } catch (error) {
            this.logger.error(`Failed to create order ${orderData.orderNumber}:`, error);
        }
    }

    private async handleInventoryUpdated(inventoryData: any) {
        this.logger.log(`Updating inventory in admin service: ${inventoryData.productSku}`);

        try {
            // Update inventory in admin service
            await this.inventoryService.updateInventory(
                inventoryData.productSku,
                inventoryData.stockQuantity,
                inventoryData.productName
            );

            // Also update product stock quantity
            try {
                await this.productService.updateStockQuantity(
                    inventoryData.productSku,
                    inventoryData.stockQuantity
                );
                this.logger.log(`Product stock updated: ${inventoryData.productSku}, new stock: ${inventoryData.stockQuantity}`);
            } catch (productError) {
                this.logger.warn(`Failed to update product stock for ${inventoryData.productSku}: ${productError.message}`);
            }

            this.logger.log(`Inventory updated: ${inventoryData.productSku}, new stock: ${inventoryData.stockQuantity}`);
        } catch (error) {
            this.logger.error(`Failed to update inventory ${inventoryData.productSku}:`, error);
        }
    }

    async onModuleDestroy() {
        await this.consumer.disconnect();
    }
}
