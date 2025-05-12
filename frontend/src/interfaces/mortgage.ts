export interface LoanTerm {
  years: number;
  months: number;
}

export interface InterestRateChange {
  date: Date | string;
  newRate: number;
}

export interface Overpayment {
  date: Date | string;
  amount: number;
}

export interface CyclicOverpayment {
  amount: number;
  frequency: 'monthly' | 'quarterly' | 'semiannually' | 'annually';
  startDate?: Date | string;
  endDate?: Date | string;
}

export interface MortgageInput {
  loanAmount: number;
  interestRate: number;
  loanTerm: LoanTerm;
  installmentType: 'equal' | 'decreasing';
  startDate: Date | string;
  interestRateChanges?: InterestRateChange[];
}

export interface CalculationParams {
  mortgageInput: MortgageInput;
  overpayments?: Overpayment[];
  cyclicOverpayment?: CyclicOverpayment;
  overpaymentEffect: 'reduce_period' | 'reduce_installment' | 'progressive_overpayment';
}

export interface InstallmentDetails {
  installmentNumber: number;
  date: Date | string;
  totalAmount: number;
  principalAmount: number;
  interestAmount: number;
  overpaymentAmount: number;
  remainingDebt: number;
  oneTimeOverpayment?: number;
  progressiveOverpayment?: number;
}

export interface ScenarioSummary {
  totalPayment: number;
  totalInterest: number;
  loanTerm: LoanTerm;
}

export interface CalculationResult {
  baseScenario: {
    installments: InstallmentDetails[];
    summary: ScenarioSummary;
  };
  overpaymentScenario: {
    installments: InstallmentDetails[];
    summary: ScenarioSummary;
  };
  savings: {
    totalAmount: number;
    interestAmount: number;
    timeReduction?: LoanTerm;
  };
}

export interface MortgageCalculation {
  id?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  params: CalculationParams;
  result: CalculationResult;
} 