import { Controller, Get, Post } from '@nestjs/common';

@Controller('orders')
export class OrdersController {

@Post()
findAall():string {
    return 'This action returns all cats';
}

@Get()
findAll():string {
    return 'This action returns all cats';
}
    
}
