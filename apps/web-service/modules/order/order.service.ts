import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Order, OrderStatus } from "./schemas/order.schema";
import { Model } from "mongoose";
import { KafkaService } from "../kafka/kafka.service";
import { ProductSyncService } from "../product/product-syn.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { OrderResponseDto } from "./dto/order-response.dto";
import { KAFKA_TOPICS } from "apps/web-service/config/kafka.config";

@Injectable()
export class OrderService {
    constructor(
        @InjectModel(Order.name) private readonly orderModel: Model<Order>,
        private readonly kafkaServicee: KafkaService,
        private readonly productSyncService: ProductSyncService
    ) { }

    //create order
    async create(createOrderDto: CreateOrderDto): Promise<OrderResponseDto> {
        const existingOrder = await this.orderModel.findOne({
            orderNumber: createOrderDto.orderNumber
        })
        if (existingOrder) {
            throw new Error("Order already exists")
        }
        // check inventory 
        const inventoryCheck = await this.checkInventory(createOrderDto.items);
        if (inventoryCheck.outOfStockProducts.length > 0) throw new Error(`Inventory not enough: ${inventoryCheck.outOfStockProducts.join(", ")}`);

        // total amount
        const totalAmount = createOrderDto.items.reduce((total, item) => total + item.quantity * item.price, 0);

        // create order
        const orderCerate = new this.orderModel({
            ...createOrderDto,
            totalAmount: totalAmount,
            status: OrderStatus.CONFIRMED
        })

        const savedOrder = await orderCerate.save();
        await this.updateIventoryAfterOrder(createOrderDto.items);

        //publish kafka topic order
        const orderSyncData = {
            orderNumber: savedOrder.orderNumber,
            customerEmail: savedOrder.customerEmail,
            customerName: savedOrder.customerName,
            items: savedOrder.items.map(item => ({
                sku: item.sku,
                name: item.name,
                quantity: item.quantity,
                price: item.price
            })),
            totalAmount: savedOrder.totalAmount,
            status: savedOrder.status,
            createdAt: savedOrder.createdAt.toISOString(),
            updatedAt: savedOrder.updatedAt.toISOString()
        };
        await this.kafkaServicee.publish(
            KAFKA_TOPICS.ORDER_CREATED,
            'order.created',
            savedOrder.orderNumber,
            orderSyncData
        )
        return this.mapToResponseDto(savedOrder);
    }
    // cancel order
    // 
    // 
    private async checkInventory(items: any[]) {
        const outOfStockProducts: string[] = [];

        for (const item of items) {
            const product = await this.productSyncService.findBySku(item.sku);

            if (!product) {
                outOfStockProducts.push(item.sku);
                continue;
            }

            if (product.stockQuantity <= 0) {
                outOfStockProducts.push(`${item.sku} (out of stock)`);
            } else if (product.stockQuantity < item.quantity) {
                outOfStockProducts.push(`${item.sku} (only ${product.stockQuantity} available)`);
            }
        }

        return {
            success: outOfStockProducts.length === 0,
            outOfStockProducts
        };
    }

    private async updateIventoryAfterOrder(items: any[]) {
        for (const item of items) {
            const product = await this.productSyncService.findBySku(item.sku);
            if (product) {
                const newStock = product.stockQuantity - item.quantity;

                // update quantity available
                await this.productSyncService.updateInventory({
                    productSku: item.sku,
                    stockQuantity: newStock,
                    isActive: newStock > 0
                })

                // publish Kafka
                await this.kafkaServicee.publish(
                    KAFKA_TOPICS.INVENTORY_UPDATED,
                    item.sku,
                    'inventory.updated',
                    {
                        productSku: item.sku,
                        stockQuantity: newStock,
                        isActive: newStock > 0,
                        timestamp: new Date().toISOString()
                    }
                )
            }
        }
    }

    private mapToResponseDto(order: Order): OrderResponseDto {
        return {
            _id: order._id.toString(),
            orderNumber: order.orderNumber,
            customerEmail: order.customerEmail,
            customerName: order.customerName,
            items: order.items.map(item => ({
                sku: item.sku,
                name: item.name,
                quantity: item.quantity,
                price: item.price
            })),
            totalAmount: order.totalAmount,
            status: order.status,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt
        };
    }
}