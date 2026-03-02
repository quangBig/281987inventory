import { Controller, Get, Param, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ProductSyncService } from './product-syn.service';
import { ProductSync } from './schemas/product-sync.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from 'apps/admin-service/modules/product/schemas/product.schemas';

@Controller('products')
export class ProductSyncController {
    constructor(
        private readonly productSyncService: ProductSyncService,
        @InjectModel(Product.name) private readonly productModel: Model<Product>
    ) { }

    @Get()
    @HttpCode(HttpStatus.OK)
    async findAll(): Promise<ProductSync[]> {
        return this.productSyncService.findAll();
    }

    @Get(':sku')
    @HttpCode(HttpStatus.OK)
    async findBySku(@Param('sku') sku: string): Promise<ProductSync> {
        const product = await this.productSyncService.findBySku(sku);
        if (!product) {
            throw new Error('Product not found');
        }
        return product;
    }

    @Post('sync')
    @HttpCode(HttpStatus.OK)
    async syncProducts(): Promise<{ message: string; synced: number }> {
        const products = await this.productModel.find({ isActive: true }).exec();
        let syncedCount = 0;

        for (const product of products) {
            try {
                await this.productSyncService.syncProduct({
                    productSku: product.sku,
                    name: product.name,
                    description: product.description,
                    price: product.price,
                    stockQuantity: product.stockQuantity,
                    isActive: product.isActive
                });
                syncedCount++;
            } catch (error) {
                console.error(`Failed to sync product ${product.sku}:`, error);
            }
        }

        return { message: 'Sync completed', synced: syncedCount };
    }
}
