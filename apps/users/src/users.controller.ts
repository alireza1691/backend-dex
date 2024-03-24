import { Controller, Get } from '@nestjs/common';
import { UsersService } from './users.service';
const Kavenegar = require('kavenegar');

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}


  // @Get()
  // async sendMessage(phoneNumber: string) {
  //   await this.usersService.sendMessage("09171091691")
  // }
}
