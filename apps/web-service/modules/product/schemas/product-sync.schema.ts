import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductSyncDocument = ProductSync & Document;

@Schema({ timestamps: true })
export class ProductSync {
  @Prop({ required: true, unique: true })
  sku: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ required: true, min: 0, default: 0 })
  stockQuantity: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const ProductSyncSchema = SchemaFactory.createForClass(ProductSync);
