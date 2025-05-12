import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configure CORS
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost',
      'http://frontend:3000',
      'http://mortgage-calculator-frontend:3000',
      // Render.com domains
      'https://mortgage-calculator-frontend.onrender.com',
      'https://mortgage-calculator-backend.onrender.com',
      // Allow any subdomain of onrender.com
      /.+\.onrender\.com$/
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type,Authorization,X-Requested-With',
  });
  
  app.setGlobalPrefix('api');
  
  // Set up validation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Set up Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Mortgage Overpayment Calculator API')
    .setDescription('API for calculating mortgage overpayments')
    .setVersion('1.0')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Try to use port from environment, fallback to 3010
  const defaultPort = process.env.PORT ?? 3010;
  try {
    await app.listen(defaultPort);
    console.log(`Application started on port ${defaultPort}`);
  } catch (error) {
    if (error.code === 'EADDRINUSE') {
      const fallbackPort = 3011;
      console.log(`Port ${defaultPort} is in use, trying fallback port ${fallbackPort}`);
      await app.listen(fallbackPort);
      console.log(`Application started on fallback port ${fallbackPort}`);
    } else {
      throw error;
    }
  }
}
bootstrap();
