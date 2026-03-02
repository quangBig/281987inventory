import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type InventoryDocument = Inventory & Document;

@Schema({ timestamps: true })
export class Inventory extends Document {
  @Prop({ required: true, unique: true })
  productSku: string;

  @Prop({ required: true })
  productName: string;

  @Prop({ required: true, default: 0 })
  quantity: number;

  @Prop({ required: true, default: true })
  isActive: boolean;

  @Prop()
  lastUpdated: Date;
}

export const InventorySchema = SchemaFactory.createForClass(Inventory);
