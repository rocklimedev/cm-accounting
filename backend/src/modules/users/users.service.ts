import { Injectable } from '@nestjs/common';
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

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({
      where: {
        email,
        is_active: true,
      },
      include: [
        {
          model: Role,
        },
      ],
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findByPk(id, {
      include: [
        {
          model: Role,
        },
      ],
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

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password_hash);
  }
}
