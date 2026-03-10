import { Injectable, Logger } from '@nestjs/common';
import { Consumer, Kafka } from 'kafkajs';
import { KAFKA_TOPICS } from '../../config/kafka.config';
import { ProductSyncService } from '../product/product-syn.service';
import { OrderSyncService } from '../order/order-sync.service';

@Injectable()
export class KafkaConsumerService {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private consumer: Consumer;

  constructor(
    private readonly kafka: Kafka,
    private readonly productSyncService: ProductSyncService,
    private readonly orderSyncService: OrderSyncService,
  ) {
    this.consumer = this.kafka.consumer({ groupId: 'web-service-group' });
  }

  async onModuleInit() {
    // Wait a bit for Kafka to be ready
    await new Promise(resolve => setTimeout(resolve, 3000));

    await this.consumer.subscribe({
      topics: [
        KAFKA_TOPICS.PRODUCT_CREATED,
        KAFKA_TOPICS.PRODUCT_UPDATED,
        KAFKA_TOPICS.PRODUCT_DELETED,
        KAFKA_TOPICS.INVENTORY_UPDATED,
        KAFKA_TOPICS.ORDER_CREATED, // Topic để nhận status update từ admin-service
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

          // Admin-service gửi structure: { event, data, eventId, timestamp }
          const event = messageData.event;
          const data = messageData.data;

          if (!data) {
            this.logger.error(`No data field in message from topic ${topic}`);
            return;
          }

          switch (topic) {
            case KAFKA_TOPICS.PRODUCT_CREATED:
              await this.productSyncService.syncProduct(data);
              this.logger.log(`Product created: ${data.productSku}`);
              break;
            case KAFKA_TOPICS.PRODUCT_UPDATED:
              await this.productSyncService.syncProduct(data);
              this.logger.log(`Product updated: ${data.productSku}`);
              break;
            case KAFKA_TOPICS.PRODUCT_DELETED:
              await this.productSyncService.deleteProduct(data.productSku);
              this.logger.log(`Product deleted: ${data.productSku}`);
              break;
            case KAFKA_TOPICS.INVENTORY_UPDATED:
              await this.productSyncService.updateInventory(data);
              this.logger.log(`Inventory updated: ${data.productSku}, new stock: ${data.stockQuantity}`);
              break;
            case KAFKA_TOPICS.ORDER_CREATED:
              if (event === 'order-status.updated') {
                await this.orderSyncService.updateOrderStatus(data);
                this.logger.log(`Order status synced: ${data.orderNumber} → ${data.status}`);
              } else {
                this.logger.warn(`Loại event không xác định: ${event}`);
              }
              break;
          }

        } catch (error) {
          this.logger.error(`Error processing message from topic ${topic}:`, error);
        }
      },
    });
  }

  async onModuleDestroy() {
    await this.consumer.disconnect();
  }
}
