import { InjectModel } from "@nestjs/mongoose";
import { KafkaService } from "../kafka/kafka.service";
import { Injectable, Logger, Inject, forwardRef } from "@nestjs/common";
import { Product } from "./schemas/product.schemas";
import { Model } from "mongoose";
import { CreateProductDto } from "./dto/create-product.dto";
import { ProductResponseDto } from "./dto/create-responsive.dto";
import { KAFKA_TOPICS } from "apps/admin-service/config/kafka.config";
import { InventoryService } from "../inventory/inventory.service";
import { UpdateProductDto } from "./dto/update-product.dto";

@Injectable()
export class ProductService {
    private readonly logger = new Logger(ProductService.name)
    constructor(
        @InjectModel(Product.name) private readonly productModel: Model<Product>,
        @Inject(forwardRef(() => KafkaService)) private readonly kafkaService: KafkaService,
        private readonly inventoryService: InventoryService
    ) { }


    // create product
    async create(dto: CreateProductDto): Promise<ProductResponseDto> {
        // check product is exist
        const product = await this.productModel.findOne({
            sku: dto.sku,
            name: dto.name,
            price: dto.price,
        })
        if (product) {
            // if exist, and stock quantity
            const updateProductQuantity = await this.productModel.findOneAndUpdate(
                { sku: dto.sku },
                {
                    $inc: { stockQuantity: dto.stockQuantity },
                    $set: { isActive: dto.isActive }
                },
                { new: true }
            )

            if (!updateProductQuantity) {
                throw new Error('Update product quantity failed')
            }

            // Update inventory record
            const existingInventory = await this.inventoryService.findByProductSku(updateProductQuantity.sku);

            if (existingInventory) {
                await this.inventoryService.updateInventory(
                    updateProductQuantity.sku,
                    dto.stockQuantity || 0
                );
            } else {
                // Create inventory if it doesn't exist
                await this.inventoryService.createInventory(
                    updateProductQuantity.sku,
                    updateProductQuantity.name,
                    updateProductQuantity.stockQuantity
                );
            }

            // pushlish inventory update
            await this.kafkaService.publish(
                KAFKA_TOPICS.INVENTORY_UPDATED,
                updateProductQuantity.sku,
                'INVENTORY_UPDATED',
                this.toPayload(updateProductQuantity),
            )
            return this.toResponse(updateProductQuantity);
        }

        //if not exists, create new product
        const productNew = await this.productModel.create(dto)

        // Create inventory record for new product
        await this.inventoryService.createInventory(
            productNew.sku,
            productNew.name,
            productNew.stockQuantity
        );

        // puslish inventory update for new product
        await this.kafkaService.publish(
            KAFKA_TOPICS.INVENTORY_UPDATED,
            productNew.sku,
            'INVENTORY_UPDATED_CREATE',
            {
                sku: productNew.sku,
                name: productNew.name,
                price: productNew.price,
                stockQuantity: productNew.stockQuantity,
                isActive: productNew.isActive,
            }
        )

        // pushlish product 
        await this.kafkaService.publish(
            KAFKA_TOPICS.PRODUCT_CREATED,
            productNew.sku,
            'PRODUCT_CREATED',
            this.toPayload(productNew),
        )

        return this.toResponse(productNew)
    }
    async update(sku: string, dto: UpdateProductDto): Promise<ProductResponseDto> {
        if (dto.sku && dto.sku !== sku) {
            throw new Error('Sku not match')
        }
        const productUpdate = await this.productModel.findOneAndUpdate(
            { sku },
            { $set: dto },
            { new: true }
        )
        if (!productUpdate) {
            throw new Error('Update product failed')
        }

        // publish update
        await this.kafkaService.publish(
            KAFKA_TOPICS.PRODUCT_UPDATED,
            productUpdate.sku,
            'PRODUCT_UPDATED',
            this.toPayload(productUpdate),
        )
        // update inventory
        await this.inventoryService.updateInventory(
            productUpdate.sku,
            productUpdate.stockQuantity,
            productUpdate.name
        )

        // publish inventory update
        await this.kafkaService.publish(
            KAFKA_TOPICS.INVENTORY_UPDATED,
            productUpdate.sku,
            'INVENTORY_UPDATED',
            {
                productSku: productUpdate.sku,
                productName: productUpdate.name,
                quantity: productUpdate.stockQuantity,
                isActive: productUpdate.isActive,
                action: 'UPDATED'
            }
        )

        return this.toResponse(productUpdate)
    }

    async delete(sku: string): Promise<ProductResponseDto> {
        const productDelete = await this.productModel.findOneAndDelete({ sku })
        if (!productDelete) {
            throw new Error('Delete product failed')
        }

        // delete inventory
        const inventory = await this.inventoryService.findByProductSku(sku);
        if (inventory) {
            await this.inventoryService.deleteInventory(sku);

            // publish inventory update (deleted)
            await this.kafkaService.publish(
                KAFKA_TOPICS.INVENTORY_UPDATED,
                sku,
                'INVENTORY_DELETED',
                {
                    productSku: sku,
                    productName: inventory.productName,
                    quantity: 0,
                    isActive: false,
                    action: 'DELETED'
                }
            )
        }

        // publish product delete
        await this.kafkaService.publish(
            KAFKA_TOPICS.PRODUCT_DELETED,
            productDelete.sku,
            'PRODUCT_DELETED',
            this.toPayload(productDelete),
        )

        return this.toResponse(productDelete)
    }

    async updateStockQuantity(sku: string, stockQuantity: number): Promise<Product> {
        const product = await this.productModel.findOne({ sku });

        if (!product) {
            throw new Error(`Product with SKU ${sku} not found`);
        }

        product.stockQuantity = stockQuantity;
        product.isActive = stockQuantity > 0;

        await this.inventoryService.updateInventory(
            sku,
            stockQuantity,
            product.name
        );

        return await product.save();
    }

    private toPayload(product: Product) {
        return {
            productSku: product.sku,
            name: product.name,
            description: product.description,
            price: product.price,
            stockQuantity: product.stockQuantity,
            isActive: product.isActive,
        };
    }
    // convert to response
    private toResponse(product: any): ProductResponseDto {
        return {
            sku: product.sku,
            name: product.name,
            price: product.price,
            stockQuantity: product.stockQuantity,
            isActive: product.isActive,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
        };
    }
}