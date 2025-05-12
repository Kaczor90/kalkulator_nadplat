import { RefinanceBasicInputDto, RefinanceAdvancedInputDto } from './refinance.dto';

export class RefinanceInstallmentDto {
  date: string;
  installmentNumber: number;
  amount: number;
  principal: number;
  interest: number;
  remainingBalance: number;
}

export class RefinanceComparisonDto {
  monthlyInstallment: number;
  loanTermMonths: number;
  totalAmount: number;
  totalInterest: number;
  commissionRefund?: number;
  refinancingCosts?: number;
  totalBenefit?: number;
  paybackPeriodMonths?: number;
}

export class RefinanceVariantDto {
  comparison: RefinanceComparisonDto;
  schedule: RefinanceInstallmentDto[];
}

export class RefinanceResponseDto {
  id: string;
  input: {
    basic: RefinanceBasicInputDto;
    advanced: RefinanceAdvancedInputDto;
  };
  variantA: RefinanceVariantDto;
  variantB: RefinanceVariantDto;
  variantC: RefinanceVariantDto;
} 