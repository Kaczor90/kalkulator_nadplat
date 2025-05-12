export interface RefinanceBasicInput {
  currentLoanBalance: number;
  currentRemainingPeriod: {
    years: number;
    months: number;
  };
  currentInterestRate: number;
  newInterestRate: number;
}

export interface RefinanceAdvancedInput {
  // Current loan details
  originalLoanAmount?: number;
  startDate?: Date;
  currentInstallmentType: 'equal' | 'decreasing';
  originalCommission?: {
    type: 'amount' | 'percentage';
    value: number;
  };
  currentMonthlyInstallment?: number;

  // New loan details
  refinanceDate: Date;
  newLoanAmount: number;
  newLoanTerm: {
    years: number;
    months: number;
  };
  newInstallmentType: 'equal' | 'decreasing';

  // Refinancing costs
  newLoanCommission: {
    type: 'amount' | 'percentage';
    value: number;
  };
  earlyRepaymentFee: {
    type: 'amount' | 'percentage';
    value: number;
  };
  otherCosts?: number;
  
  // Payment schedule details
  installmentDayOfMonth?: number; // Day of the month when the installment is paid (1-31)
}

export interface RefinanceInstallment {
  date: string;
  installmentNumber: number;
  amount: number;
  principal: number;
  interest: number;
  remainingBalance: number;
  daysInPeriod?: number; // Number of days since the last installment (for daily interest calculation)
}

export interface RefinanceComparison {
  monthlyInstallment: number;
  loanTermMonths: number;
  totalAmount: number;
  totalInterest: number;
  commissionRefund?: number;
  refinancingCosts?: number;
  totalBenefit?: number;
  paybackPeriodMonths?: number;
  originalTermMonths?: number; // Total original loan term before refinancing
  monthsAlreadyPaid?: number; // Number of months already paid before refinancing
}

export interface RefinanceResult {
  id: string;
  input: {
    basic: RefinanceBasicInput;
    advanced: RefinanceAdvancedInput;
  };
  variantA: {
    comparison: RefinanceComparison;
    schedule: RefinanceInstallment[];
  };
  variantB: {
    comparison: RefinanceComparison;
    schedule: RefinanceInstallment[];
  };
  variantC: {
    comparison: RefinanceComparison;
    schedule: RefinanceInstallment[];
  };
  calculationMethod?: 'daily' | 'monthly'; // Indicates whether the interest was calculated daily or monthly
}

export interface RefinanceParams {
  refinanceInput: {
    basic: RefinanceBasicInput;
    advanced: RefinanceAdvancedInput;
  };
} 