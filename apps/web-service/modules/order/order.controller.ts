import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { OrderService } from './order.service';

@Controller('orders')
export class OrderController {
    constructor(private readonly orderService: OrderService) { }

    @Post()
    async create(@Body() createOrderDto: CreateOrderDto): Promise<OrderResponseDto> {
        try {
            return await this.orderService.create(createOrderDto);
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to create order',
                HttpStatus.BAD_REQUEST
            );
        }
    }

}