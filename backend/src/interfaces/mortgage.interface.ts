export interface MortgageInput {
  loanAmount: number;
  interestRate: number;
  loanTerm: {
    years: number;
    months: number;
  };
  installmentType: 'equal' | 'decreasing';
  startDate: Date;
  interestRateChanges?: InterestRateChange[];
}

export interface InterestRateChange {
  date: Date;
  newRate: number;
}

export interface Overpayment {
  date: Date;
  amount: number;
}

export interface CyclicOverpayment {
  amount: number;
  frequency: 'monthly' | 'quarterly' | 'semiannually' | 'annually';
  startDate?: Date;
  endDate?: Date;
}

export interface CalculationParams {
  mortgageInput: MortgageInput;
  overpayments?: Overpayment[];
  cyclicOverpayment?: CyclicOverpayment;
  overpaymentEffect: 'reduce_period' | 'reduce_installment' | 'progressive_overpayment';
}

export interface InstallmentDetails {
  installmentNumber: number;
  date: Date;
  totalAmount: number;
  principalAmount: number;
  interestAmount: number;
  overpaymentAmount: number;
  remainingDebt: number;
  oneTimeOverpayment?: number;
  progressiveOverpayment?: number;
}

export interface CalculationResult {
  baseScenario: {
    installments: InstallmentDetails[];
    summary: {
      totalPayment: number;
      totalInterest: number;
      loanTerm: {
        years: number;
        months: number;
      };
    };
  };
  overpaymentScenario: {
    installments: InstallmentDetails[];
    summary: {
      totalPayment: number;
      totalInterest: number;
      loanTerm: {
        years: number;
        months: number;
      };
    };
  };
  savings: {
    totalAmount: number;
    interestAmount: number;
    timeReduction?: {
      years: number;
      months: number;
    };
  };
}

export interface MortgageCalculation {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  params: CalculationParams;
  result: CalculationResult;
} 