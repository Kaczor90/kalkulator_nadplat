import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CalculationParams, CalculationResult } from '../../interfaces/mortgage.interface';

export interface MortgageCalculationDocument extends Document {
  _id: Types.ObjectId;
  params: CalculationParams;
  result: CalculationResult;
  createdAt: Date;
  updatedAt: Date;
}

@Schema({ timestamps: true })
export class MortgageCalculation {
  @Prop({ type: Object, required: true })
  params: CalculationParams;

  @Prop({ type: Object, required: true })
  result: CalculationResult;
}

export const MortgageCalculationSchema = SchemaFactory.createForClass(MortgageCalculation); 