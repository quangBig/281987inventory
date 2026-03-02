import { Module } from "@nestjs/common";
import { Kafka } from "kafkajs";
import { KafkaService } from "./kafka.service";
import { KafkaConsumerService } from "./kafka.comsumer.service";
import { OrderModule } from "../order/order.module";

@Module({
    imports: [OrderModule],
    providers: [
        {
            provide: Kafka,
            useFactory: () => {
                return new Kafka({
                    clientId: 'admin-service',
                    brokers: ['localhost:9092'],
                });
            },
        },
        KafkaService,
        KafkaConsumerService,
    ],
    exports: [Kafka, KafkaService],
})
export class KafkaModule { }