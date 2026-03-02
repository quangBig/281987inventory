import { Injectable, Logger } from "@nestjs/common";
import { KAFKA_TOPICS } from "apps/admin-service/config/kafka.config";
import { Consumer, Kafka } from "kafkajs";
import { OrderService } from "../order/order.service";

@Injectable()
export class KafkaConsumerService {
    private readonly logger = new Logger(KafkaConsumerService.name);
    private consumer: Consumer;

    constructor(
        private readonly kafka: Kafka,
        private readonly orderService: OrderService
    ) {
        this.consumer = this.kafka.consumer({ groupId: 'admin-service-group' });
    }

    async onModuleInit() {
        // Wait a bit for Kafka to be ready
        await new Promise(resolve => setTimeout(resolve, 2000));

        await this.consumer.subscribe({
            topics: [
                KAFKA_TOPICS.ORDER_CREATED
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

    async onModuleDestroy() {
        await this.consumer.disconnect();
    }
}
