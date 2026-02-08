import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
  jwtExpiration: process.env.JWT_EXPIRATION || '7d',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'change-me-in-production-refresh',
  jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '30d',
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 10,
}));