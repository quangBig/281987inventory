import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Consumer } from "kafkajs";
import { Kafka, Producer } from "kafkajs";

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
    private kafka: Kafka;
    private producer: Producer;
    private consumers: Map<string, Consumer> = new Map();

    constructor() {
        this.kafka = new Kafka({
            brokers: [`${process.env.KAFKA_BROKER_HOST || 'localhost'}:${process.env.KAFKA_BROKER_PORT || '9092'}`],
        })
        this.producer = this.kafka.producer();
    }

    async onModuleInit() {
        await this.producer.connect();
    }

    async onModuleDestroy() {
        await this.producer.disconnect();
        for (const consumer of this.consumers.values()) {
            await consumer.disconnect();
        }
    }
    // Producer
    async publish(topic: string, key: string, event: string, data: any) {
        console.log(`Publishing to topic: ${topic}, key: ${key}, event: ${event}`);
        await this.producer.send({
            topic,
            messages: [
                {
                    key,
                    value: JSON.stringify({
                        event,
                        data,
                        eventId: crypto.randomUUID(),
                        timestamp: new Date().toISOString(),
                    }),

                },
            ],
        })
    }
    // Cosumer mối group cần 1 Cosumer riêng
    async subcribe(groupId: string, topics: string[], handler: (topic: string, data: any) => Promise<void>) {
        const cosumer = this.kafka.consumer({ groupId });
        await cosumer.connect();
        await cosumer.subscribe({ topics, fromBeginning: false });
        await cosumer.run({
            eachMessage: async ({ topic, message }) => {
                try {
                    const parsed = JSON.parse(message.value?.toString() || '{}');
                    await handler(topic, parsed);
                } catch (error) {
                    console.error(`[${groupId}] Error processing ${topic}:`, error);
                }
            },
        });
        this.consumers.set(groupId, cosumer);
    }
}
