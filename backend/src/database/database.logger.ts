import { Injectable, Logger } from '@nestjs/common';
import * as mongoose from 'mongoose';

@Injectable()
export class DatabaseLogger {
  private readonly logger = new Logger('Database');

  constructor() {
    // Log MongoDB connection string (with password redacted)
    if (process.env.MONGODB_URI) {
      const redactedUri = this.redactConnectionString(process.env.MONGODB_URI);
      this.logger.log(`Attempting to connect to MongoDB: ${redactedUri}`);
    }

    // Listen to Mongoose connection events
    mongoose.connection.on('connected', () => {
      this.logger.log('MongoDB connection established successfully');
      
      // Log additional connection information for debugging
      const { host, port, name } = mongoose.connection;
      this.logger.log(`Connected to MongoDB at ${host}:${port}/${name}`);
    });

    mongoose.connection.on('disconnected', () => {
      this.logger.warn('MongoDB connection disconnected');
    });

    mongoose.connection.on('error', (err) => {
      this.logger.error(`MongoDB connection error: ${err.message}`, err.stack);
      
      // Log more specific error information for Atlas connections
      if (err.message && err.message.includes('ENOTFOUND')) {
        this.logger.error('DNS resolution failed. Check your MongoDB hostname and network connection.');
      } else if (err.message && err.message.includes('authentication failed')) {
        this.logger.error('Authentication failed. Check your MongoDB username and password.');
      } else if (err.message && err.message.includes('timed out')) {
        this.logger.error('Connection timed out. Check your network or firewall settings.');
      }
    });

    mongoose.connection.on('reconnected', () => {
      this.logger.log('MongoDB connection reestablished');
    });
  }

  // Helper method to redact password from connection string for logging
  private redactConnectionString(uri: string): string {
    try {
      // Replace password in connection string with ***
      return uri.replace(/\/\/([^:]+):([^@]+)@/, '//\\1:***@');
    } catch (error) {
      return '[Connection string redaction failed]';
    }
  }
} 