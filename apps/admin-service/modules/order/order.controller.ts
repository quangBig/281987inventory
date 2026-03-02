import { Controller, Get, Param, Put, Body, NotFoundException } from '@nestjs/common';
import { OrderService, OrderSyncData } from './order.service';
import { OrderStatus } from './schemas/order.schema';

@Controller('orders')
export class OrderController {
    constructor(private readonly orderService: OrderService) { }

    @Get()
    async getAllOrders() {
        return this.orderService.getAllOrders();
    }

    @Get(':orderNumber')
    async getOrderByOrderNumber(@Param('orderNumber') orderNumber: string) {
        const order = await this.orderService.getOrderByOrderNumber(orderNumber);
        if (!order) {
            throw new NotFoundException(`Order ${orderNumber} not found`);
        }
        return order;
    }

    @Get('status/:status')
    async getOrdersByStatus(@Param('status') status: OrderStatus) {
        return this.orderService.getOrdersByStatus(status);
    }

    @Put(':orderNumber/status')
    async updateOrderStatus(
        @Param('orderNumber') orderNumber: string,
        @Body('status') status: OrderStatus
    ) {
        try {
            return await this.orderService.updateOrderStatus(orderNumber, status);
        } catch (error) {
            throw new NotFoundException(error.message);
        }
    }
}