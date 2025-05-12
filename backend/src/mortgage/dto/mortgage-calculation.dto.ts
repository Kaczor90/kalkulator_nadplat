import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class LoanTermDto {
  @IsInt()
  @Min(0)
  @Max(35) // Maximum loan term is 35 years
  years: number;

  @IsInt()
  @Min(0)
  @Max(11) // Maximum months is 11 (12 months = 1 year)
  months: number;
}

export class InterestRateChangeDto {
  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsNumber()
  @IsPositive()
  @Min(0)
  @Max(100) // Maximum interest rate 100%
  newRate: number;
}

export class OverpaymentDto {
  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsNumber()
  @IsPositive()
  amount: number;
}

export class CyclicOverpaymentDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsEnum(['monthly', 'quarterly', 'semiannually', 'annually'])
  frequency: 'monthly' | 'quarterly' | 'semiannually' | 'annually';

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  startDate?: Date;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  endDate?: Date;
}

export class MortgageInputDto {
  @IsNumber()
  @IsPositive()
  loanAmount: number;

  @IsNumber()
  @IsPositive()
  @Min(0)
  @Max(100) // Maximum interest rate 100%
  interestRate: number;

  @IsObject()
  @ValidateNested()
  @Type(() => LoanTermDto)
  loanTerm: LoanTermDto;

  @IsEnum(['equal', 'decreasing'])
  installmentType: 'equal' | 'decreasing';

  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @IsArray()
  @ValidateNested({ each: true })
  @IsOptional()
  @Type(() => InterestRateChangeDto)
  interestRateChanges?: InterestRateChangeDto[];
}

export class CalculationParamsDto {
  @IsObject()
  @ValidateNested()
  @Type(() => MortgageInputDto)
  mortgageInput: MortgageInputDto;

  @IsArray()
  @ValidateNested({ each: true })
  @IsOptional()
  @Type(() => OverpaymentDto)
  overpayments?: OverpaymentDto[];

  @IsObject()
  @ValidateNested()
  @IsOptional()
  @Type(() => CyclicOverpaymentDto)
  cyclicOverpayment?: CyclicOverpaymentDto;

  @IsEnum(['reduce_period', 'reduce_installment', 'progressive_overpayment'])
  overpaymentEffect: 'reduce_period' | 'reduce_installment' | 'progressive_overpayment';
}

export class MortgageCalculationResponseDto {
  @IsString()
  id: string;

  @IsDate()
  createdAt: Date;

  @IsDate()
  updatedAt: Date;

  @IsObject()
  @ValidateNested()
  @Type(() => CalculationParamsDto)
  params: CalculationParamsDto;

  @IsObject()
  @IsNotEmpty()
  result: any; // Using any for simplicity, but in a real app, we would define a specific structure
} 