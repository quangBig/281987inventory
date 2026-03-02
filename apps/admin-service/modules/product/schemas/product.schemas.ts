import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { COLLECTION } from 'apps/admin-service/config/mongo.config';

@Schema({ collection: COLLECTION.PRODUCTS })
export class Product extends Document {
    // Mã sản phẩm
    @Prop({ required: true, unique: true })
    sku: string;

    // Tên sản phẩm
    @Prop({ required: true })
    name: string;

    // Mô tả sản phẩm
    @Prop({ required: true })
    description: string;

    // Giá sản phẩm
    @Prop({ required: true, min: 0 })
    price: number;

    // Số lượng trong kho
    @Prop({ required: true, default: 0 })
    stockQuantity: number;

    // Trạng thái sản phẩm
    @Prop({ required: true, default: true })
    isActive: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);