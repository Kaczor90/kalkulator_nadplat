import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MortgageController } from './mortgage.controller';
import { MortgageService } from './mortgage.service';
import { MortgageCalculationSchema } from './schemas/mortgage-calculation.schema';

@Module({
  imports: [
    ...(process.env.DISABLE_DATABASE === 'true' 
      ? [] 
      : [
        MongooseModule.forFeature([
          { name: 'MortgageCalculation', schema: MortgageCalculationSchema },
        ])
      ]
    ),
  ],
  controllers: [MortgageController],
  providers: [MortgageService],
  exports: [MortgageService],
})
export class MortgageModule {} 