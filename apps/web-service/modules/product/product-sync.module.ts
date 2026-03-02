import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductSyncService } from './product-syn.service';
import { ProductSyncController } from './product-sync.controller';
import { ProductSync, ProductSyncSchema } from './schemas/product-sync.schema';
import { KafkaModule } from '../kafka/kafka.module';
import { KafkaConsumerService } from '../kafka/kafka.consumer.service';
import { Product, ProductSchema } from 'apps/admin-service/modules/product/schemas/product.schemas';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: ProductSync.name, schema: ProductSyncSchema },
            { name: Product.name, schema: ProductSchema }
        ]),
        forwardRef(() => KafkaModule),
    ],
    controllers: [ProductSyncController],
    providers: [ProductSyncService, KafkaConsumerService],
    exports: [ProductSyncService],
})
export class ProductSyncModule { }
