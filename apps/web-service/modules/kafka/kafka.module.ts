import { Module } from '@nestjs/common';
import { Kafka } from 'kafkajs';
import { KafkaService } from './kafka.service';
import { OrderSyncModule } from '../order/order-sync.module';

@Module({
  imports: [OrderSyncModule],
  providers: [
    {
      provide: Kafka,
      useFactory: () => {
        return new Kafka({
          clientId: 'web-service',
          brokers: ['localhost:9092'],
        });
      },
    },
    KafkaService,
  ],
  exports: [Kafka, KafkaService],
})
export class KafkaModule { }
