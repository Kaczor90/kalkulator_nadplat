import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { MortgageModule } from './mortgage/mortgage.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/mortgage-calculator'),
    MortgageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
