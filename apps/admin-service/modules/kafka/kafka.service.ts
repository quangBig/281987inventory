import { Injectable } from "@nestjs/common";
import { Consumer, Kafka, Producer } from "kafkajs";
import { timestamp } from "rxjs";


@Injectable()
export class KafkaService {
    private kafka: Kafka;
    private producer: Producer;
    private comsumers: Map<string, Consumer> = new Map();

    constructor() {
        this.kafka = new Kafka({
            brokers: [`${process.env.KAFKA_BROKER_HOST || 'localhost'}:${process.env.KAFKA_BROKER_PORT || '9092'}`],
        })
        this.producer = this.kafka.producer();
    }

    async onModuleInit() {
        await this.producer.connect();
    }

    async onModuleSestroy() {
        await this.producer.disconnect();
        for (const consumer of this.comsumers.values()) {
            await consumer.disconnect();
        }
    }

    //Producer
    async publish(topic: string, key: string, event: string, data: any) {
        await this.producer.send({
            topic,
            messages: [
                {
                    key,
                    value: JSON.stringify({
                        event,
                        data,
                        eventId: crypto.randomUUID(),
                        timestamp: new Date().toISOString()
                    }),
                }
            ]
        })
    }
    // Cosumer mỗi group cần 1 Consumer riêng
    async subcribe(groudId: string, topics: string[], handler: (topic: string, data: any) => Promise<void>) {
        const consumer = this.kafka.consumer({ groupId: groudId });
        await consumer.connect();
        await consumer.subscribe({ topics, fromBeginning: true })
        await consumer.run({
            eachMessage: async ({ topic, message }) => {
                try {
                    const parsed = JSON.parse(message.value?.toString() || '{}');
                    await handler(topic, parsed);
                } catch (error) {
                    console.error(`[${groudId}] Error processing ${topic}:`, error);
                }
            }
        });
        this.comsumers.set(groudId, consumer);
    }
}