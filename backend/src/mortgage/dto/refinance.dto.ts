import { IsEnum, IsDateString, IsNumber, IsObject, IsOptional, ValidateNested, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export enum InstallmentType {
  EQUAL = 'equal',
  DECREASING = 'decreasing'
}

export enum CommissionType {
  AMOUNT = 'amount',
  PERCENTAGE = 'percentage'
}

export class PeriodDto {
  @IsNumber()
  years: number;

  @IsNumber()
  months: number;
}

export class CommissionDto {
  @IsEnum(CommissionType)
  type: CommissionType;

  @IsNumber()
  value: number;
}

export class RefinanceBasicInputDto {
  @IsNumber()
  currentLoanBalance: number;

  @ValidateNested()
  @Type(() => PeriodDto)
  currentRemainingPeriod: PeriodDto;

  @IsNumber()
  currentInterestRate: number;

  @IsNumber()
  newInterestRate: number;
}

export class RefinanceAdvancedInputDto {
  @IsOptional()
  @IsNumber()
  originalLoanAmount?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsEnum(InstallmentType)
  currentInstallmentType: InstallmentType;

  @IsOptional()
  @ValidateNested()
  @Type(() => CommissionDto)
  originalCommission?: CommissionDto;

  @IsOptional()
  @IsNumber()
  currentMonthlyInstallment?: number;

  @IsDateString()
  refinanceDate: string;

  @IsNumber()
  newLoanAmount: number;

  @ValidateNested()
  @Type(() => PeriodDto)
  newLoanTerm: PeriodDto;

  @IsEnum(InstallmentType)
  newInstallmentType: InstallmentType;

  @ValidateNested()
  @Type(() => CommissionDto)
  newLoanCommission: CommissionDto;

  @ValidateNested()
  @Type(() => CommissionDto)
  earlyRepaymentFee: CommissionDto;

  @IsOptional()
  @IsNumber()
  otherCosts?: number;
}

export class RefinanceInputDto {
  @ValidateNested()
  @Type(() => RefinanceBasicInputDto)
  basic: RefinanceBasicInputDto;

  @ValidateNested()
  @Type(() => RefinanceAdvancedInputDto)
  advanced: RefinanceAdvancedInputDto;
}

export class RefinanceDto {
  @ValidateNested()
  @Type(() => RefinanceInputDto)
  refinanceInput: RefinanceInputDto;
} 