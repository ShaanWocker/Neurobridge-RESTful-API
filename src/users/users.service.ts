import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { User, UserRole, UserStatus } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto, PaginatedResponseDto } from '@common/dto/pagination.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private configService: ConfigService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      this.configService.get('auth.bcryptRounds'),
    );

    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return this.usersRepository.save(user);
  }

  async findAll(
    paginationDto: PaginationDto,
    filters?: { role?: string; status?: UserStatus; institutionId?: string; search?: string },
  ): Promise<PaginatedResponseDto<User>> {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<User> = {};

    if (filters?.role) where.role = filters.role as any;
    if (filters?.status) where.status = filters.status;
    if (filters?.institutionId) where.institutionId = filters.institutionId;
    if (filters?.search) {
      // Simple search - in production, consider full-text search
      where.email = ILike(`%${filters.search}%`);
    }

    const [users, totalItems] = await this.usersRepository.findAndCount({
      where,
      relations: ['institution'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: users,
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['institution'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User> {
    return this.usersRepository.findOne({
      where: { email },
      relations: ['institution'],
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    Object.assign(user, updateUserDto);

    return this.usersRepository.save(user);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.usersRepository.update(id, {
      lastLoginAt: new Date(),
    });
  }

  async updateRefreshToken(id: string, refreshToken: string | null): Promise<void> {
    const hashedRefreshToken = refreshToken
      ? await bcrypt.hash(refreshToken, this.configService.get('auth.bcryptRounds'))
      : null;

    await this.usersRepository.update(id, {
      refreshToken: hashedRefreshToken,
    });
  }

  async changePassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: ['id', 'password'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(
      newPassword,
      this.configService.get('auth.bcryptRounds'),
    );

    await this.usersRepository.update(id, { password: hashedPassword });
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.softDelete(id);
  }

  async createOrActivateFromInvite(
    email: string,
    password: string,
    role: UserRole,
    firstName: string,
    lastName: string,
    institutionId?: string,
  ): Promise<User> {
    const hashedPassword = await bcrypt.hash(
      password,
      this.configService.get('auth.bcryptRounds'),
    );

    let user = await this.usersRepository.findOne({ where: { email } });

    if (user) {
      user.password = hashedPassword;
      user.role = role;
      user.status = UserStatus.ACTIVE;
      if (institutionId) user.institutionId = institutionId;
    } else {
      user = this.usersRepository.create({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
        status: UserStatus.ACTIVE,
        institutionId: institutionId ?? null,
      });
    }

    return this.usersRepository.save(user);
  }
}