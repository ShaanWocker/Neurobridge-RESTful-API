import 'tsconfig-paths/register';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

// Use require for CommonJS modules
const helmet = require('helmet');
const compression = require('compression');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security
  app.use(helmet());
  app.use(compression());

  // CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGIN') || 'http://localhost:8080',
    credentials: true,
  });

  // Global prefix
  const apiPrefix = configService.get('API_PREFIX', 'api/v1');
  app.setGlobalPrefix(apiPrefix);

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger Documentation
  if (configService.get('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('NeuroBridge API')
      .setDescription('B2B SaaS API for neurodiverse education collaboration')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication & Authorization')
      .addTag('users', 'User Management')
      .addTag('institutions', 'Institution Profiles')
      .addTag('learners', 'Learner Case Management')
      .addTag('transfers', 'Case Transfers')
      .addTag('messages', 'Secure Messaging')
      .addTag('discovery', 'Search & Discovery')
      .addTag('audit', 'Audit Logs')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = configService.get('PORT', 3001);
  await app.listen(port);

  console.log('\n🎉 ==========================================');
  console.log('🚀 NeuroBridge API is running!');
  console.log('==========================================');
  console.log(`📍 URL: http://localhost:${port}/${apiPrefix}`);
  if (configService.get('NODE_ENV') !== 'production') {
    console.log(`📚 API Docs: http://localhost:${port}/api/docs`);
  }
  console.log(`🗄️  Database: ${configService.get('database.database')}`);
  console.log(`🌍 Environment: ${configService.get('NODE_ENV')}`);
  console.log('==========================================\n');
}

bootstrap();