import { Injectable, Logger } from '@nestjs/common';
import { Consumer, Kafka } from 'kafkajs';
import { KAFKA_TOPICS } from '../../config/kafka.config';
import { ProductSyncService } from '../product/product-syn.service';

@Injectable()
export class KafkaConsumerService {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private consumer: Consumer;

  constructor(
    private readonly kafka: Kafka,
    private readonly productSyncService: ProductSyncService,
  ) {
    this.consumer = this.kafka.consumer({ groupId: 'web-service-group' });
  }

  async onModuleInit() {
    await this.consumer.subscribe({
      topics: [
        KAFKA_TOPICS.PRODUCT_CREATED,
        KAFKA_TOPICS.PRODUCT_UPDATED,
        KAFKA_TOPICS.PRODUCT_DELETED,
        KAFKA_TOPICS.INVENTORY_UPDATED,
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
