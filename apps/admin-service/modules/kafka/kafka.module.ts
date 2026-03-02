import { Module, forwardRef } from "@nestjs/common";
import { Kafka } from "kafkajs";
import { KafkaService } from "./kafka.service";
import { KafkaConsumerService } from "./kafka.comsumer.service";
import { OrderModule } from "../order/order.module";
import { InventoryModule } from "../inventory/inventory.module";
import { ProductModule } from "../product/product.module";

@Module({
    imports: [OrderModule, InventoryModule, forwardRef(() => ProductModule)],
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