import { Controller, Post, Body, Get, Param, Put, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductResponseDto } from './dto/create-responsive.dto';

@Controller('products')
export class ProductController {
    constructor(private readonly productService: ProductService) { }
    // create products
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() createProductDto: CreateProductDto): Promise<ProductResponseDto> {
        return this.productService.create(createProductDto);
    }
    // update product 
    @Put(':sku')
    async update(@Param('sku') sku: string, @Body() updateData: UpdateProductDto): Promise<ProductResponseDto> {
        return this.productService.update(sku, updateData);
    }
    // delete product
    @Delete(':sku')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('sku') sku: string): Promise<ProductResponseDto> {
        return this.productService.delete(sku);
    }
    // // find one product
    // @Get(':sku')
    // async findOne(@Param('sku') sku: string): Promise<ProductResponseDto> {
    //     return this.productService.findOne(sku);
    // }
    // // find all products
    // @Get()
    // async findAll(): Promise<ProductResponseDto[]> {
    //     return this.productService.findAll();
    // }
}