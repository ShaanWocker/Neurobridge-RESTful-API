import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '@users/users.service';
import { User, UserStatus } from '@users/entities/user.entity';
import { LoginDto } from './dto/login';
import { RegisterDto } from './dto/register';
import { AuthResponseDto } from './dto/auth-response.dto';
import { AuditService } from '@audit/audit.service';
import { AuditAction } from '@audit/entities/audit-log.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private auditService: AuditService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return null;
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user);

    // Update refresh token in database
    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

    // Update last login time
    await this.usersService.updateLastLogin(user.id);

    // Log the login
    await this.auditService.log({
      userId: user.id,
      action: AuditAction.USER_LOGIN,
      entityType: 'User',
      entityId: user.id,
      metadata: {
        email: user.email,
        role: user.role,
      },
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        institutionId: user.institutionId,
      },
    };
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(registerDto.email);

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Create user (this is typically restricted in production - invite-only)
    const user = await this.usersService.create({
      ...registerDto,
      role: null, // Role should be assigned by admin via invitation
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Update refresh token
    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

    // Log registration
    await this.auditService.log({
      userId: user.id,
      action: AuditAction.USER_CREATED,
      entityType: 'User',
      entityId: user.id,
      metadata: { email: user.email },
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        institutionId: user.institutionId,
      },
    };
  }

  async refreshTokens(userId: string, refreshToken: string): Promise<AuthResponseDto> {
    const user = await this.usersService.findOne(userId);

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Access denied');
    }

    const refreshTokenMatches = await bcrypt.compare(refreshToken, user.refreshToken);

    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.generateTokens(user);

    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        institutionId: user.institutionId,
      },
    };
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.updateRefreshToken(userId, null);

    await this.auditService.log({
      userId,
      action: AuditAction.USER_LOGOUT,
      entityType: 'User',
      entityId: userId,
    });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    await this.usersService.changePassword(userId, currentPassword, newPassword);

    await this.auditService.log({
      userId,
      action: AuditAction.PASSWORD_CHANGED,
      entityType: 'User',
      entityId: userId,
    });
  }

  private async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      institutionId: user.institutionId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('auth.jwtSecret'),
        expiresIn: this.configService.get('auth.jwtExpiration'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('auth.jwtRefreshSecret'),
        expiresIn: this.configService.get('auth.jwtRefreshExpiration'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async validateToken(token: string): Promise<any> {
    try {
      return await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('auth.jwtSecret'),
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}