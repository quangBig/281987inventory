import { Module } from '@nestjs/common';
import { Kafka } from 'kafkajs';
import { KafkaService } from './kafka.service';

@Module({
  imports: [],
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
