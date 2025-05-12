import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { MortgageModule } from './mortgage/mortgage.module';
import mongoose from 'mongoose';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/mortgage-calculator', {
      retryAttempts: 5,
      retryDelay: 3000,
      connectionFactory: (connection) => {
        connection.on('connected', () => {
          console.log('MongoDB connected successfully');
        });
        connection.on('error', (error: mongoose.Error) => {
          console.error('MongoDB connection error:', error);
        });
        connection._connectionOptions.socketTimeoutMS = 45000;
        connection._connectionOptions.connectTimeoutMS = 10000;
        return connection;
      }
    }),
    MortgageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
