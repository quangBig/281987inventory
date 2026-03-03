import {
    IsString,
    IsEmail,
    IsNumber,
    IsArray,
    ValidateNested,
    Min,
    ArrayMinSize,
    IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
    @IsString()
    sku: string;

    @IsString()
    name: string;

    @IsNumber()
    @Min(1)
    quantity: number;

    @IsNumber()
    @Min(0)
    price: number;
}

export class CreateOrderDto {
    @IsString()
    orderNumber: string;

    @IsEmail()
    customerEmail: string;

    @IsString()
    customerName: string;

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    items: OrderItemDto[];

    @IsNumber()
    @Min(0)
    totalAmount: number;

    @IsString()
    @IsOptional()
    status?: string;

    @IsString()
    @IsOptional()
    createdAt?: string;

    @IsString()
    @IsOptional()
    updatedAt?: string;
}








