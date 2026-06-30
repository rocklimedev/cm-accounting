import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcryptjs';
import { User } from './models/user.model';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User) private userModel: typeof User) {}

  findByEmail(email: string) {
    return this.userModel.findOne({ where: { email, is_active: true } });
  }

  findById(id: string) {
    return this.userModel.findByPk(id);
  }

  async create(params: {
    name: string;
    email: string;
    password: string;
    role: Role;
  }) {
    const password_hash = await bcrypt.hash(params.password, 12);
    return this.userModel.create({
      name: params.name,
      email: params.email,
      password_hash,
      role: params.role,
    } as any);
  }

  async validatePassword(user: User, password: string) {
    return bcrypt.compare(password, user.password_hash);
  }
}
