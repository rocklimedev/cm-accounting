import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcryptjs';
import { User } from './models/user.model';
import { Role } from '@/modules/rbac/models/role.model';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userModel.findAll({
      include: [Role],
      order: [['created_at', 'DESC']],
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({
      where: {
        email,
        is_active: true,
      },
      include: [Role],
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findByPk(id, {
      include: [Role],
    });
  }

  async create(params: {
    name: string;
    email: string;
    password: string;
    role_id: string;
  }): Promise<User> {
    const password_hash = await bcrypt.hash(params.password, 12);

    return this.userModel.create({
      name: params.name,
      email: params.email,
      password_hash,
      role_id: params.role_id,
    } as any);
  }

  async update(id: string, data: any): Promise<User> {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await user.update(data);

    return user.reload({
      include: [Role],
    });
  }

  async changePassword(
    id: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const valid = await bcrypt.compare(oldPassword, user.password_hash);

    if (!valid) {
      throw new BadRequestException('Old password is incorrect');
    }

    const password_hash = await bcrypt.hash(newPassword, 12);

    await user.update({
      password_hash,
    });
  }

  async remove(id: string): Promise<void> {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await user.update({
      is_active: false,
    });
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password_hash);
  }
}
