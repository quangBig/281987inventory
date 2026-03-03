import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Inventory, InventoryDocument } from './schemas/inventory.schema';
import { Model } from 'mongoose';

@Injectable()
export class InventoryService {
    private readonly logger = new Logger(InventoryService.name);

    constructor(
        @InjectModel(Inventory.name) private readonly inventoryModel: Model<InventoryDocument>
    ) { }

    async createInventory(productSku: string, productName: string, quantity: number): Promise<Inventory> {
        try {
            const inventory = await this.inventoryModel.create({
                productSku,
                productName,
                quantity,
                isActive: true,
            });

            this.logger.log(`Đã tạo inventory cho sản phẩm ${productSku} với số lượng ${quantity}`);
            return inventory;
        } catch (error) {
            this.logger.error(`Thất bại khi tạo inventory cho sản phẩm ${productSku}: ${error.message}`);
            throw error;
        }
    }

    async updateInventory(productSku: string, quantity: number, productName?: string): Promise<Inventory> {
        const inventory = await this.inventoryModel.findOne({ productSku });

        if (!inventory) {
            throw new Error(`Inventory not found for product ${productSku}`);
        }

        inventory.quantity = quantity;
        if (productName) {
            inventory.productName = productName;
        }
        inventory.lastUpdated = new Date();

        return await inventory.save();
    }

    async deleteInventory(productSku: string): Promise<void> {
        const result = await this.inventoryModel.deleteOne({ productSku });

        if (result.deletedCount === 0) {
            this.logger.warn(`Không tìm thấy inventory để xóa cho sản phẩm ${productSku}`);
        } else {
            this.logger.log(`Đã xóa inventory cho sản phẩm ${productSku}`);
        }
    }

    async findByProductSku(productSku: string): Promise<Inventory | null> {
        return this.inventoryModel.findOne({ productSku });
    }
}
