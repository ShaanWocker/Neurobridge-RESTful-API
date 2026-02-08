import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:8080',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10485760,
  uploadDirectory: process.env.UPLOAD_DIRECTORY || './uploads',
}));