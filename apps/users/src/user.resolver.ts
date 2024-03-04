import { BadRequestException, UseFilters } from "@nestjs/common";
import { Args, Context, Mutation, Query, Resolver } from "@nestjs/graphql";
import { Response } from "express";
import { RegisterDto } from "./dto/user.dto";
import { User } from "./entities/user.entity";
import { RegisterResponse } from "./types/user.types";
import { UsersService } from "./users.service";



@Resolver('User')
// @UseFilters
export class UsersResolver {
    constructor (
        private readonly usersService: UsersService
    ) {}
    @Mutation(() => RegisterResponse)
    async register(
        @Args('registerDto') registerDto: RegisterDto,
        @Context() context: {res: Response},
    )
    // : Promise<RegisterResponse>
      {
        if(!registerDto.name || !registerDto.email || !registerDto.password) {
            throw new BadRequestException (' Please fill all the fields')
        }

        const user = await this.usersService.register(registerDto,context.res);
        return {user};
        // const { activation_token } = await this.userService.register(
        //     registerDto,
        //     context.res,
        //   );
      
        //   return { activation_token };
    }

    @Query(() => [User])
    async getUsers() {
        return this.usersService.getUsers()
    }

}