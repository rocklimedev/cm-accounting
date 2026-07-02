import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { IsEmail, IsString, IsUUID, MinLength } from 'class-validator';
import { UsersService } from './users.service';

class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsUUID()
  role_id: string;
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateUserDto) {
    const user = await this.usersService.create(dto);

    const { password_hash, ...result } = user.toJSON();

    return result;
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const user = await this.usersService.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password_hash, ...result } = user.toJSON();

    return result;
  }

  @Get('email/:email')
  async findByEmail(@Param('email') email: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password_hash, ...result } = user.toJSON();

    return result;
  }
}
