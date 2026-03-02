import { MongooseModuleOptions } from "@nestjs/mongoose";

export const MongoConfig: MongooseModuleOptions = {
    uri: 'mongodb+srv://dailq_db_user:OSsvvuXOdCbY7cSn@inventory.uhheb3a.mongodb.net/',
};

export const DATABASE_NAMES = {
    PRODUCT: 'productdb',
    INVENTORY: 'inventorydb',
    ORDER: 'orderdb',
}

export const COLLECTION = {
    PRODUCTS: 'products',
    INVENTORIES: 'inventories',
    ORDERS: 'orders',
    INVENTORY_LOGS: 'inventory_logs',
}