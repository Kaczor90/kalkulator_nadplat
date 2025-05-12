import { Module, Logger } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { MortgageModule } from './mortgage/mortgage.module';
import { Error } from 'mongoose';

const logger = new Logger('MongooseModule');

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: () => {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mortgage-calculator';
        logger.log(`Connecting to MongoDB: ${uri.substring(0, uri.indexOf('?') > 0 ? uri.indexOf('?') : uri.length)}`);
        
        return {
          uri,
          retryAttempts: 10,
          retryDelay: 5000,
          // Set the timeout options
          connectionFactory: (connection) => {
            // Add connection event handlers
            connection.on('connected', () => {
              logger.log('MongoDB connection established successfully');
            });
            
            connection.on('disconnected', () => {
              logger.warn('MongoDB disconnected');
            });
            
            connection.on('error', (err: Error) => {
              logger.error(`MongoDB connection error: ${err.message}`, err.stack);
            });
            
            // Apply socket timeout settings if not already set in the connection string
            if (!uri.includes('socketTimeoutMS')) {
              logger.log('Setting custom socket timeout parameters');
              connection._connectionOptions = {
                ...connection._connectionOptions,
                socketTimeoutMS: 60000,
                connectTimeoutMS: 30000,
              };
            }
            
            return connection;
          }
        };
      },
    }),
    MortgageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
