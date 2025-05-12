import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe, Logger } from '@nestjs/common';
import * as mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  // Create fallback config directory and file if needed
  try {
    const configDir = path.resolve(__dirname, 'config');
    const configFile = path.resolve(configDir, 'render.config.js');
    
    if (!fs.existsSync(configDir)) {
      Logger.log(`Creating config directory: ${configDir}`, 'Bootstrap');
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    if (!fs.existsSync(configFile)) {
      Logger.log(`Creating fallback render.config.js: ${configFile}`, 'Bootstrap');
      const fallbackConfig = `
// Fallback configuration for render.com deployment (created at runtime)
module.exports = {
  debug: process.env.DEBUG === 'true',
  mongodb: {
    uri: process.env.MONGODB_URI,
    options: {
      connectTimeoutMS: 30000,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 60000,
      heartbeatFrequencyMS: 30000,
      tls: true,
      tlsAllowInvalidCertificates: false,
      retryWrites: true,
      retryReads: true,
      maxPoolSize: 10,
      minPoolSize: 1,
      maxIdleTimeMS: 45000,
    }
  }
};
`;
      fs.writeFileSync(configFile, fallbackConfig);
    }
  } catch (error) {
    Logger.warn(`Failed to create fallback config: ${error.message}`, 'Bootstrap');
  }

  // Set up global Mongoose debug mode if needed
  if (process.env.MONGOOSE_DEBUG === 'true') {
    mongoose.set('debug', true);
  }

  try {
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });
    
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
      Logger.log(`Application started on port ${defaultPort}`, 'Bootstrap');
    } catch (error) {
      if (error.code === 'EADDRINUSE') {
        const fallbackPort = 3011;
        Logger.warn(`Port ${defaultPort} is in use, trying fallback port ${fallbackPort}`, 'Bootstrap');
        await app.listen(fallbackPort);
        Logger.log(`Application started on fallback port ${fallbackPort}`, 'Bootstrap');
      } else {
        throw error;
      }
    }
  } catch (error) {
    Logger.error(`Failed to start application: ${error.message}`, error.stack, 'Bootstrap');
    
    // Check for MongoDB connection errors specifically
    if (error.name === 'MongoNetworkError' || error.name === 'MongooseServerSelectionError') {
      Logger.error(
        'MongoDB connection error. Please check your connection string, network connectivity, and database status.',
        'Database'
      );
    }
    
    process.exit(1);
  }
}
bootstrap();
