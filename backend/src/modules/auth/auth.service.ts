import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
  ) {}

  async register(dto: RegisterDto) {
    // Check if email already exists
    const existing = await this.usersService.findByEmail(dto.email);

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    // Create user
    await this.usersService.create(dto);

    // Reload user with Role relation
    const createdUser = await this.usersService.findByEmail(dto.email);

    if (!createdUser) {
      throw new InternalServerErrorException(
        'Failed to retrieve newly created user',
      );
    }

    await this.auditService.log({
      userId: createdUser.id,
      action: 'USER_REGISTERED',
      tableName: 'users',
      recordId: createdUser.id,
      newValue: {
        email: createdUser.email,
        role: createdUser.role?.name,
      },
    });

    return {
      id: createdUser.id,
      name: createdUser.name,
      email: createdUser.email,
      role: createdUser.role
        ? {
            id: createdUser.role.id,
            name: createdUser.role.name,
          }
        : null,
    };
  }

  async login(dto: LoginDto, ipAddress?: string) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await this.usersService.validatePassword(user, dto.password);

    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role?.name,
      roleId: user.role?.id,
    };

    const accessToken = this.jwtService.sign(payload);

    await this.auditService.log({
      userId: user.id,
      action: 'LOGIN',
      tableName: 'users',
      recordId: user.id,
      ipAddress,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
          ? {
              id: user.role.id,
              name: user.role.name,
            }
          : null,
      },
    };
  }
}
