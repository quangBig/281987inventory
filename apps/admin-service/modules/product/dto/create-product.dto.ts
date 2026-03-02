import { IsString, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  sku: string;

  @IsString()
  name: string;
  
  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  stockQuantity?: number = 0;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}