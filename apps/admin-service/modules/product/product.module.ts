import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductService } from './product.service';

import { KafkaModule } from '../kafka/kafka.module';
import { Product, ProductSchema } from './schemas/product.schemas';
import { ProductController } from './product.controller';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
        forwardRef(() => KafkaModule),
        InventoryModule,
    ],
    controllers: [ProductController],
    providers: [ProductService],
    exports: [ProductService],
})
export class ProductModule { }