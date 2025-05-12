import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { MortgageModule } from './mortgage/mortgage.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';

// Import configuration based on environment
const isProduction = process.env.NODE_ENV === 'production';
const renderConfig = isProduction ? require('./config/render.config') : null;

// Default MongoDB options
const defaultMongoOptions = {
  connectTimeoutMS: 10000,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  retryReads: true,
  heartbeatFrequencyMS: 10000,
};

// Connection options based on environment
const mongoOptions = isProduction && renderConfig ? renderConfig.mongodb.options : defaultMongoOptions;

// Handle MongoDB connection string - replace password placeholder if needed
let mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mortgage-calculator';
if (mongoUri.includes('<MONGODB_PASSWORD>') && process.env.MONGODB_PASSWORD) {
  mongoUri = mongoUri.replace('<MONGODB_PASSWORD>', process.env.MONGODB_PASSWORD);
}

@Module({
  imports: [
    MongooseModule.forRoot(mongoUri, mongoOptions),
    MortgageModule,
    DatabaseModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
