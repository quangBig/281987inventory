export class ProductSyncDto {
  productSku: string;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  isActive: boolean;
}

export class InventorySyncDto {
  productSku: string;
  stockQuantity: number;
  isActive: boolean;
}
