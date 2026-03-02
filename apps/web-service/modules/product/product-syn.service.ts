import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { KafkaService } from '../kafka/kafka.service';
import { ProductSyncDto, InventorySyncDto } from './dto/product-sync.dto';
import { ProductSync, ProductSyncDocument } from './schemas/product-sync.schema';

@Injectable()
export class ProductSyncService {
    private readonly logger = new Logger(ProductSyncService.name);

    constructor(
        @InjectModel(ProductSync.name) private readonly productModel: Model<ProductSyncDocument>,
        private readonly kafkaService: KafkaService
    ) { }


    // Query methods for web service
    async findAll(): Promise<ProductSync[]> {
        return this.productModel.find({ isActive: true }).exec();
    }

    async findBySku(sku: string): Promise<ProductSync | null> {
        return this.productModel.findOne({ sku, isActive: true }).exec();
    }

    // Sync methods for Kafka consumer
    async syncProduct(data: ProductSyncDto): Promise<void> {
        try {
            await this.productModel.findOneAndUpdate(
                { sku: data.productSku },
                {
                    sku: data.productSku,
                    name: data.name,
                    description: data.description,
                    price: data.price,
                    stockQuantity: data.stockQuantity,
                    isActive: data.isActive
                },
                { upsert: true, new: true }
            );
        } catch (error) {
            this.logger.error(`Failed to sync product ${data.productSku}: ${error.message}`);
            throw error;
        }
    }

    async deleteProduct(productSku: string): Promise<void> {
        try {
            await this.productModel.deleteOne({ sku: productSku });
        } catch (error) {
            this.logger.error(`Failed to delete product ${productSku}: ${error.message}`);
            throw error;
        }
    }

    async updateInventory(data: InventorySyncDto): Promise<void> {
        try {
            await this.productModel.findOneAndUpdate(
                { sku: data.productSku },
                {
                    stockQuantity: data.stockQuantity,
                    isActive: data.isActive
                },
                { new: true }
            );
        } catch (error) {
            this.logger.error(`Failed to update inventory for product ${data.productSku}: ${error.message}`);
            throw error;
        }
    }
}
