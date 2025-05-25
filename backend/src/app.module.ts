import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { MortgageModule } from './mortgage/mortgage.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import * as path from 'path';
import * as fs from 'fs';

// Import configuration based on environment
const isProduction = process.env.NODE_ENV === 'production';
let renderConfig = null;

// Define default MongoDB options first
const defaultMongoOptions = {
  connectTimeoutMS: 10000,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  retryReads: true,
  heartbeatFrequencyMS: 10000,
};

// Try to load render.config.js in different ways
if (isProduction) {
  try {
    // First try direct import 
    try {
      renderConfig = require('./config/render.config');
      console.log('Loaded render.config.js from direct import');
    } catch (directError) {
      console.warn('Could not load render.config.js directly:', directError.message);
      
      // Try with path resolve
      const possiblePaths = [
        path.resolve(__dirname, './config/render.config.js'),
        path.resolve(__dirname, '../config/render.config.js'),
        path.resolve(__dirname, '../dist/config/render.config.js'),
        path.resolve(process.cwd(), './dist/config/render.config.js')
      ];
      
      let loaded = false;
      for (const configPath of possiblePaths) {
        try {
          if (fs.existsSync(configPath)) {
            renderConfig = require(configPath);
            console.log(`Loaded render.config.js from ${configPath}`);
            loaded = true;
            break;
          }
        } catch (e) {
          console.warn(`Failed to load from ${configPath}:`, e.message);
        }
      }
      
      if (!loaded) {
        console.warn('render.config.js not found in any expected location, using default MongoDB options');
      }
    }
  } catch (error) {
    console.warn('Error loading render.config.js, using default options:', error.message);
  }
}

// Connection options based on environment
// Add additional validation to ensure we have a valid config
const mongoOptions = (isProduction && 
  renderConfig && 
  renderConfig.mongodb && 
  renderConfig.mongodb.options) 
  ? renderConfig.mongodb.options 
  : defaultMongoOptions;

// Choose MongoDB URI based on environment
// Development environment uses local MongoDB
// Production environment uses cloud MongoDB
let mongoUri;
if (isProduction) {
  // Use cloud MongoDB in production
  mongoUri = process.env.MONGODB_URI || 
    (renderConfig && renderConfig.mongodb && renderConfig.mongodb.uri) || 
    "mongodb+srv://radekdsa:<MONGODB_PASSWORD>@cluster0.h9egut1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
} else {
  // Use local MongoDB in development - either from environment or default to container name "db"
  mongoUri = process.env.MONGODB_URI || 'mongodb://db:27017/mortgage-calculator';
  console.log('Using local MongoDB for development environment');
}

// Handle MongoDB connection string - replace password placeholder if needed
if (mongoUri.includes('<MONGODB_PASSWORD>') && process.env.MONGODB_PASSWORD) {
  mongoUri = mongoUri.replace('<MONGODB_PASSWORD>', process.env.MONGODB_PASSWORD);
}

// Log the MongoDB connection info (with redacted password)
const redactedUri = mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//\\1:***@');
console.log(`Connecting to MongoDB: ${redactedUri}`);
console.log('Using MongoDB options:', JSON.stringify(mongoOptions));

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
