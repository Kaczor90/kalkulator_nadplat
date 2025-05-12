import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { 
  CalculationParams, 
  CalculationResult, 
  CyclicOverpayment, 
  InstallmentDetails, 
  MortgageCalculation,
  Overpayment
} from '../interfaces/mortgage.interface';
import { MortgageCalculationDocument } from './schemas/mortgage-calculation.schema';
import { RefinanceDto, CommissionType, InstallmentType } from './dto/refinance.dto';
import { RefinanceResponseDto, RefinanceVariantDto, RefinanceComparisonDto, RefinanceInstallmentDto } from './dto/refinance-response.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MortgageService {
  private readonly logger = new Logger(MortgageService.name);
  private readonly useDatabase: boolean;

  constructor(
    @Optional() @InjectModel('MortgageCalculation')
    private mortgageCalculationModel?: Model<MortgageCalculationDocument>,
  ) {
    this.useDatabase = !!this.mortgageCalculationModel;
    this.logger.log(`MortgageService initialized with database: ${this.useDatabase}`);
  }

  async calculateMortgage(params: CalculationParams): Promise<MortgageCalculation> {
    const result = this.performCalculation(params);
    
    if (!this.useDatabase || !this.mortgageCalculationModel) {
      this.logger.warn('Database is disabled, returning in-memory result');
      const id = uuidv4();
      const now = new Date();
      
      return {
        id,
        createdAt: now,
        updatedAt: now,
        params,
        result,
      };
    }
    
    const calculation = await this.mortgageCalculationModel.create({
      params,
      result,
    });
    
    return {
      id: calculation._id.toString(),
      createdAt: calculation.createdAt,
      updatedAt: calculation.updatedAt,
      params,
      result,
    };
  }

  async findById(id: string): Promise<MortgageCalculation | null> {
    if (!this.useDatabase || !this.mortgageCalculationModel) {
      this.logger.warn('Database is disabled, cannot find by ID');
      return null;
    }
    
    const calculation = await this.mortgageCalculationModel.findById(id).exec();
    
    if (!calculation) {
      return null;
    }
    
    return {
      id: calculation._id.toString(),
      createdAt: calculation.createdAt,
      updatedAt: calculation.updatedAt,
      params: calculation.params,
      result: calculation.result,
    };
  }

  async findAll(): Promise<MortgageCalculation[]> {
    if (!this.useDatabase || !this.mortgageCalculationModel) {
      this.logger.warn('Database is disabled, returning empty list');
      return [];
    }
    
    const calculations = await this.mortgageCalculationModel.find().exec();
    
    return calculations.map(calculation => ({
      id: calculation._id.toString(),
      createdAt: calculation.createdAt,
      updatedAt: calculation.updatedAt,
      params: calculation.params,
      result: calculation.result,
    }));
  }

  protected performCalculation(params: CalculationParams): CalculationResult {
    console.log('Rozpoczynam obliczenia dla typu nadpłaty:', params.overpaymentEffect);
    
    if (params.overpaymentEffect === 'progressive_overpayment') {
      console.log('Nadpłata progresywna - parametry:', {
        cyclicOverpayment: params.cyclicOverpayment ? 'Ustawiona' : 'Brak',
        kwota: params.cyclicOverpayment?.amount,
        czestotliwosc: params.cyclicOverpayment?.frequency
      });
    }
    
    // Prepare a modified parameter set for reduce_period when user requests progressive_overpayment
    // This ensures both calculations will produce identical results, just with different presentation
    let reduceParams = { ...params };
    if (params.overpaymentEffect === 'progressive_overpayment') {
      // Create a copy with 'reduce_period' effect for comparison
      reduceParams = { 
        ...params,
        overpaymentEffect: 'reduce_period'
      };
    }
    
    // Calculate base scenario (without overpayments)
    const baseScenario = this.calculateScenario(params, false);
    
    // Calculate overpayment scenario - use appropriate params based on the mode
    const overpaymentScenario = params.overpaymentEffect === 'progressive_overpayment' 
      ? this.calculateScenario(params, true) 
      : this.calculateScenario(params, true);
      
    // For progressive overpayment, ensure we also calculate with reduce_period to verify matching results
    if (params.overpaymentEffect === 'progressive_overpayment') {
      const reduceScenario = this.calculateScenario(reduceParams, true);
      
      // Verify the total payment amounts should match between progressive and reduce_period
      const progressiveTotal = overpaymentScenario.summary.totalPayment;
      const reduceTotal = reduceScenario.summary.totalPayment;
      const difference = Math.abs(progressiveTotal - reduceTotal);
      
      console.log(`Weryfikacja zgodności nadpłaty progresywnej: Progressive=${progressiveTotal.toFixed(2)}, ReducePeriod=${reduceTotal.toFixed(2)}, Różnica=${difference.toFixed(2)}`);
      
      if (difference > 1) {  // Allow small rounding differences (< 1 PLN)
        console.warn('Uwaga: Wyniki dla nadpłaty progresywnej i skrócenia okresu różnią się znacząco');
      }
    }
    
    // Calculate savings
    const savings: {
      totalAmount: number;
      interestAmount: number;
      timeReduction?: { years: number; months: number }
    } = {
      totalAmount: baseScenario.summary.totalPayment - overpaymentScenario.summary.totalPayment,
      interestAmount: baseScenario.summary.totalInterest - overpaymentScenario.summary.totalInterest,
    };
    
    // Add time reduction if applicable 
    if (params.overpaymentEffect === 'reduce_period' || params.overpaymentEffect === 'progressive_overpayment') {
      const baseMonths = baseScenario.summary.loanTerm.years * 12 + baseScenario.summary.loanTerm.months;
      const overpaymentMonths = overpaymentScenario.summary.loanTerm.years * 12 + overpaymentScenario.summary.loanTerm.months;
      const differenceMonths = baseMonths - overpaymentMonths;
      
      savings.timeReduction = {
        years: Math.floor(differenceMonths / 12),
        months: differenceMonths % 12,
      };
    }
    
    return {
      baseScenario,
      overpaymentScenario,
      savings,
    };
  }

  private calculateScenario(params: CalculationParams, includeOverpayments: boolean): {
    installments: InstallmentDetails[];
    summary: {
      totalPayment: number;
      totalInterest: number;
      loanTerm: { years: number; months: number };
    };
  } {
    const { mortgageInput, overpaymentEffect } = params;
    const { loanAmount, interestRate, loanTerm, installmentType, startDate, interestRateChanges } = mortgageInput;
    
    console.log(`Obliczenia: overpaymentEffect=${overpaymentEffect}, includeOverpayments=${includeOverpayments}, cyclicOverpayment=${params.cyclicOverpayment ? 'TAK' : 'NIE'}`);
    
    // Convert loan term to months
    const totalMonths = loanTerm.years * 12 + loanTerm.months;
    
    // Initialize variables
    let remainingDebt = loanAmount;
    let currentDate = new Date(startDate);
    const installments: InstallmentDetails[] = [];
    let totalPayment = 0;
    let totalInterest = 0;
    let installmentNumber = 1;
    
    // Process all interest rate changes and sort by date
    const rateChanges = interestRateChanges ? [...interestRateChanges].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    ) : [];
    
    // Current interest rate (may change over time)
    let currentInterestRate = interestRate;
    
    // Calculate and process all overpayments (one-time and cyclic)
    const allOverpayments: Overpayment[] = includeOverpayments ? this.getAllOverpayments(params, totalMonths) : [];
    
    // Keep track of the number of months to process
    let monthsRemaining = totalMonths;
    
    // Calculate base installment amount for progressive overpayment
    let baseInstallmentAmount = 0;
    if (includeOverpayments && overpaymentEffect === 'progressive_overpayment' && installmentType === 'equal') {
      const monthlyRate = interestRate / 100 / 12;
      baseInstallmentAmount = this.calculateEqualInstallment(loanAmount, monthlyRate, totalMonths);
      console.log(`Nadpłata progresywna - rata bazowa (equal): ${baseInstallmentAmount.toFixed(2)}`);
    } else if (includeOverpayments && overpaymentEffect === 'progressive_overpayment' && installmentType === 'decreasing') {
      // For decreasing installments, we'll use the first installment as base
      const principalAmount = loanAmount / totalMonths;
      const interestAmount = loanAmount * (interestRate / 100 / 12);
      baseInstallmentAmount = principalAmount + interestAmount;
      console.log(`Nadpłata progresywna - rata bazowa (decreasing): ${baseInstallmentAmount.toFixed(2)}`);
    }
    
    // For progressive overpayment, store the initial overpayment amount
    let initialOverpaymentAmount = 0;
    if (includeOverpayments && overpaymentEffect === 'progressive_overpayment' && params.cyclicOverpayment) {
      initialOverpaymentAmount = params.cyclicOverpayment.amount;
      console.log(`Nadpłata progresywna - początkowa kwota nadpłaty: ${initialOverpaymentAmount.toFixed(2)}`);
    }
    
    // Continue processing until debt is fully paid
    while (remainingDebt > 0 && monthsRemaining > 0) {
      // Check if interest rate changes this month
      if (rateChanges.length > 0) {
        const nextChange = rateChanges[0];
        if (new Date(nextChange.date) <= currentDate) {
          currentInterestRate = nextChange.newRate;
          rateChanges.shift(); // Remove the processed change
        }
      }
      
      // Calculate monthly interest rate (daily interest calculation)
      const monthlyInterestRate = currentInterestRate / 100 / 365 * this.getDaysInMonth(currentDate);
      
      // Calculate installment details based on type
      let principalAmount: number;
      let interestAmount: number;
      let totalAmount: number;
      
      if (installmentType === 'equal') {
        if ((overpaymentEffect === 'reduce_installment' || overpaymentEffect === 'progressive_overpayment') && includeOverpayments) {
          // Recalculate the equal installment amount
          const monthlyRate = currentInterestRate / 100 / 12;
          totalAmount = this.calculateEqualInstallment(remainingDebt, monthlyRate, monthsRemaining);
        } else {
          // Use original loan term
          const monthlyRate = currentInterestRate / 100 / 12;
          totalAmount = this.calculateEqualInstallment(loanAmount, monthlyRate, totalMonths);
        }
        
        interestAmount = remainingDebt * monthlyInterestRate;
        principalAmount = Math.min(totalAmount - interestAmount, remainingDebt);
      } else { // decreasing installments
        if ((overpaymentEffect === 'reduce_installment' || overpaymentEffect === 'progressive_overpayment') && includeOverpayments) {
          // Recalculate the principal part with new months remaining
          principalAmount = remainingDebt / monthsRemaining;
        } else {
          // Use original loan term
          principalAmount = loanAmount / totalMonths;
        }
        
        interestAmount = remainingDebt * monthlyInterestRate;
        totalAmount = principalAmount + interestAmount;
      }
      
      // Handle overpayments for this month
      let overpaymentAmount = 0;
      let oneTimeOverpaymentAmount = 0;
      let progressiveOverpaymentAmount = 0;
      
      if (includeOverpayments) {
        // First handle one-time overpayments regardless of overpayment type
        const monthOverpayments = allOverpayments.filter(
          op => this.isSameMonth(new Date(op.date), currentDate)
        );
        
        if (monthOverpayments.length > 0) {
          oneTimeOverpaymentAmount = monthOverpayments.reduce((sum, op) => sum + op.amount, 0);
          overpaymentAmount = oneTimeOverpaymentAmount;
          console.log(`Nadpłata jednorazowa - miesiąc ${installmentNumber}: Kwota nadpłaty ${oneTimeOverpaymentAmount.toFixed(2)}`);
        }
        
        // Then add progressive overpayment if applicable
        if (overpaymentEffect === 'progressive_overpayment' && params.cyclicOverpayment) {
          // Check if this is a month where cyclic overpayment should occur
          const isOverpaymentMonth = this.shouldApplyCyclicOverpayment(
            currentDate, 
            params.cyclicOverpayment, 
            new Date(startDate)
          );
          
          if (isOverpaymentMonth) {
            // Calculate the difference between base installment and current installment
            const installmentDifference = Math.max(0, baseInstallmentAmount - totalAmount);
            
            // Progressive overpayment = initial amount + difference
            progressiveOverpaymentAmount = initialOverpaymentAmount + installmentDifference;
            
            // Add progressive overpayment to any one-time overpayments
            overpaymentAmount += progressiveOverpaymentAmount;
            
            console.log(`Nadpłata progresywna - miesiąc ${installmentNumber}: Kwota bazowa ${baseInstallmentAmount.toFixed(2)}, Aktualna rata ${totalAmount.toFixed(2)}, Różnica ${installmentDifference.toFixed(2)}, Nadpłata progresywna ${progressiveOverpaymentAmount.toFixed(2)}, Łączna nadpłata ${overpaymentAmount.toFixed(2)}`);
          } else {
            console.log(`Nadpłata progresywna - miesiąc ${installmentNumber}: Pominięto miesiąc zgodnie z częstotliwością ${params.cyclicOverpayment.frequency}`);
          }
        }
      }
      
      // Ensure we don't overpay
      overpaymentAmount = Math.min(overpaymentAmount, remainingDebt - principalAmount);
      
      // Update remaining debt
      remainingDebt -= (principalAmount + overpaymentAmount);
      
      // Ensure we don't have negative debt due to rounding
      remainingDebt = Math.max(0, remainingDebt);
      
      // Create installment detail
      const installment: InstallmentDetails = {
        installmentNumber,
        date: new Date(currentDate),
        totalAmount,
        principalAmount,
        interestAmount,
        overpaymentAmount,
        remainingDebt,
        oneTimeOverpayment: oneTimeOverpaymentAmount,
        progressiveOverpayment: progressiveOverpaymentAmount
      };
      
      installments.push(installment);
      
      // Update totals
      totalPayment += totalAmount + overpaymentAmount;
      totalInterest += interestAmount;
      
      // Move to next month
      currentDate = this.addMonths(currentDate, 1);
      monthsRemaining--;
      installmentNumber++;
      
      // If debt is paid off, break out of the loop
      if (remainingDebt === 0) {
        break;
      }
    }
    
    // Calculate actual loan term (may be less than original if overpayments were made)
    const actualMonths = installments.length;
    const actualYears = Math.floor(actualMonths / 12);
    const actualMonthsRemainder = actualMonths % 12;
    
    return {
      installments,
      summary: {
        totalPayment,
        totalInterest,
        loanTerm: {
          years: actualYears,
          months: actualMonthsRemainder,
        },
      },
    };
  }

  private calculateEqualInstallment(principal: number, monthlyRate: number, months: number): number {
    if (monthlyRate === 0) {
      return principal / months;
    }
    
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
           (Math.pow(1 + monthlyRate, months) - 1);
  }

  private getAllOverpayments(params: CalculationParams, totalMonths: number): Overpayment[] {
    const { overpayments, cyclicOverpayment, overpaymentEffect } = params;
    const allOverpayments: Overpayment[] = [];
    
    // Add one-time overpayments
    if (overpayments && overpayments.length > 0) {
      allOverpayments.push(...overpayments);
      console.log(`Dodano ${overpayments.length} nadpłat jednorazowych`);
    }
    
    // Generate cyclic overpayments - but skip for progressive overpayment
    // For progressive overpayment, we will handle it separately in the calculation loop
    if (cyclicOverpayment && overpaymentEffect !== 'progressive_overpayment') {
      const cyclicOps = this.generateCyclicOverpayments(
        cyclicOverpayment, 
        new Date(params.mortgageInput.startDate), 
        totalMonths
      );
      allOverpayments.push(...cyclicOps);
      
      console.log(`Wygenerowano ${cyclicOps.length} standardowych nadpłat cyklicznych`);
    } else if (overpaymentEffect === 'progressive_overpayment' && cyclicOverpayment) {
      console.log('Nadpłata progresywna: pominięto generowanie standardowych nadpłat cyklicznych, będą obsłużone oddzielnie');
    }
    
    // Sort overpayments by date
    return allOverpayments.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }

  private generateCyclicOverpayments(
    cyclicOverpayment: CyclicOverpayment, 
    startDate: Date, 
    totalMonths: number
  ): Overpayment[] {
    const { amount, frequency, startDate: customStartDate, endDate } = cyclicOverpayment;
    const overpayments: Overpayment[] = [];
    
    // Determine start date for cyclic overpayments
    let currentDate = customStartDate ? new Date(customStartDate) : new Date(startDate);
    
    // Determine frequency in months
    let frequencyInMonths: number;
    switch (frequency) {
      case 'monthly':
        frequencyInMonths = 1;
        break;
      case 'quarterly':
        frequencyInMonths = 3;
        break;
      case 'semiannually':
        frequencyInMonths = 6;
        break;
      case 'annually':
        frequencyInMonths = 12;
        break;
      default:
        frequencyInMonths = 1;
    }
    
    // Generate overpayments until end date or max number of months
    for (let i = 0; i < totalMonths; i += frequencyInMonths) {
      // Skip if before custom start date
      if (currentDate < startDate) {
        currentDate = this.addMonths(currentDate, frequencyInMonths);
        continue;
      }
      
      // Stop if end date is reached
      if (endDate && currentDate > new Date(endDate)) {
        break;
      }
      
      overpayments.push({
        date: new Date(currentDate),
        amount,
      });
      
      // Move to next payment date
      currentDate = this.addMonths(currentDate, frequencyInMonths);
    }
    
    return overpayments;
  }

  // Helper methods
  private addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    const currentMonth = result.getMonth();
    result.setMonth(currentMonth + months);
    
    // Handle cases where the resulting month is not as expected due to different month lengths
    if (result.getMonth() !== ((currentMonth + months) % 12)) {
      result.setDate(0); // Set to the last day of the previous month
    }
    
    return result;
  }

  private getDaysInMonth(date: Date): number {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  }

  private isSameMonth(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() && 
           date1.getMonth() === date2.getMonth();
  }

  // Add helper method to check if a cyclic overpayment should be applied
  private shouldApplyCyclicOverpayment(
    currentDate: Date,
    cyclicOverpayment: CyclicOverpayment,
    loanStartDate: Date
  ): boolean {
    const { frequency, startDate: customStartDate, endDate } = cyclicOverpayment;
    
    console.log(`Sprawdzanie nadpłaty: ${currentDate.toISOString()}, częstotliwość: ${frequency}`);
    
    // If there's a custom start date and current date is before it, don't apply
    if (customStartDate && currentDate < new Date(customStartDate)) {
      console.log('Nadpłata odrzucona: przed datą początkową');
      return false;
    }
    
    // If there's an end date and current date is after it, don't apply
    if (endDate && currentDate > new Date(endDate)) {
      console.log('Nadpłata odrzucona: po dacie końcowej');
      return false;
    }
    
    // Check frequency
    const startDate = customStartDate ? new Date(customStartDate) : loanStartDate;
    const monthsDiff = this.getMonthsDifference(startDate, currentDate);
    
    let result = false;
    
    switch (frequency) {
      case 'monthly':
        result = true; // Every month
        break;
      case 'quarterly':
        result = monthsDiff % 3 === 0;
        break;
      case 'semiannually':
        result = monthsDiff % 6 === 0;
        break;
      case 'annually':
        result = monthsDiff % 12 === 0;
        break;
      default:
        result = false;
    }
    
    console.log(`Wynik kontroli nadpłaty: ${result ? 'Zastosuj' : 'Pomiń'}, różnica miesięcy: ${monthsDiff}`);
    return result;
  }
  
  private getMonthsDifference(startDate: Date, endDate: Date): number {
    return (endDate.getFullYear() - startDate.getFullYear()) * 12 
      + endDate.getMonth() - startDate.getMonth();
  }

  async calculateRefinance(refinanceDto: RefinanceDto): Promise<RefinanceResponseDto> {
    try {
      const id = uuidv4();
      const input = refinanceDto.refinanceInput;

      console.log('Rozpoczynam obliczenia refinansowania dla ID:', id);

      // Convert input to safe numbers
      const currentBalance = Number(input.basic.currentLoanBalance);
      const currentRemainingYears = Number(input.basic.currentRemainingPeriod.years);
      const currentRemainingMonths = Number(input.basic.currentRemainingPeriod.months);
      const currentInterestRate = Number(input.basic.currentInterestRate);
      const newInterestRate = Number(input.basic.newInterestRate);
      
      const currentInstallmentType = input.advanced.currentInstallmentType;
      const newInstallmentType = input.advanced.newInstallmentType;
      const newLoanAmount = Number(input.advanced.newLoanAmount);
      const newLoanYears = Number(input.advanced.newLoanTerm.years);
      const newLoanMonths = Number(input.advanced.newLoanTerm.months);
      
      const refinanceDate = new Date(input.advanced.refinanceDate);
      const totalRemainingMonths = currentRemainingYears * 12 + currentRemainingMonths;
      const totalNewLoanMonths = newLoanYears * 12 + newLoanMonths;

      // Validate inputs
      if (isNaN(currentBalance) || currentBalance <= 0) {
        throw new Error('Saldo kredytu musi być liczbą większą od zera');
      }
      if (isNaN(totalRemainingMonths) || totalRemainingMonths <= 0) {
        throw new Error('Pozostały okres kredytu musi być liczbą większą od zera');
      }
      if (isNaN(currentInterestRate) || currentInterestRate <= 0) {
        throw new Error('Aktualne oprocentowanie musi być liczbą większą od zera');
      }
      if (isNaN(newInterestRate) || newInterestRate <= 0) {
        throw new Error('Nowe oprocentowanie musi być liczbą większą od zera');
      }
      if (isNaN(newLoanAmount) || newLoanAmount <= 0) {
        throw new Error('Kwota nowego kredytu musi być liczbą większą od zera');
      }
      if (isNaN(totalNewLoanMonths) || totalNewLoanMonths <= 0) {
        throw new Error('Okres nowego kredytu musi być liczbą większą od zera');
      }
      if (refinanceDate.toString() === 'Invalid Date') {
        throw new Error('Data refinansowania jest nieprawidłowa');
      }

      console.log('Walidacja parametrów zakończona pomyślnie, rozpoczynam obliczenia...');

      // Calculate current loan (Variant A)
      console.log('Obliczam wariant A (obecny kredyt)...');
      const variantA = this.calculateCurrentLoanScenario(
        currentBalance,
        totalRemainingMonths,
        currentInterestRate / 100,
        currentInstallmentType,
        refinanceDate
      );
      console.log('Wariant A obliczony pomyślnie.');

      // Calculate refinancing with lower installment (Variant B)
      console.log('Obliczam wariant B (refinansowanie z niższą ratą)...');
      const variantB = this.calculateRefinancingWithLowerInstallment(
        newLoanAmount,
        totalNewLoanMonths,
        newInterestRate / 100,
        input,
        variantA,
        refinanceDate
      );
      console.log('Wariant B obliczony pomyślnie.');

      // Calculate refinancing with shorter term (Variant C)
      console.log('Obliczam wariant C (refinansowanie z krótszym okresem)...');
      const variantC = this.calculateRefinancingWithShorterTerm(
        newLoanAmount,
        newInterestRate / 100,
        input,
        variantA,
        refinanceDate
      );
      console.log('Wariant C obliczony pomyślnie.');

      console.log('Wszystkie obliczenia zakończone pomyślnie, przygotowuję wynik...');

      return {
        id,
        input: {
          basic: input.basic,
          advanced: input.advanced,
        },
        variantA,
        variantB,
        variantC,
      };
    } catch (error) {
      console.error('Błąd w trakcie obliczeń refinansowania:', error.message);
      console.error('Stack błędu:', error.stack);
      throw error;
    }
  }

  private calculateCurrentLoanScenario(
    balance: number,
    months: number,
    interestRate: number,
    installmentType: InstallmentType,
    startDate: Date
  ): RefinanceVariantDto {
    const schedule: RefinanceInstallmentDto[] = [];
    
    // Calculate monthly installment
    let monthlyInstallment: number;
    
    if (installmentType === InstallmentType.EQUAL) {
      // Equal installments formula: PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
      const monthlyRate = interestRate / 12;
      monthlyInstallment = balance * (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                          (Math.pow(1 + monthlyRate, months) - 1);
    } else {
      // Decreasing installments - first installment
      const principalPart = balance / months;
      const interestPart = balance * interestRate / 12;
      monthlyInstallment = principalPart + interestPart;
    }

    // Create schedule (first few installments for demonstration)
    let remainingBalance = balance;
    let totalInterest = 0;
    let paymentDate = new Date(startDate);
    
    // Only calculate first 12 installments for preview
    // In a real implementation, we'd calculate all or use paging
    const installmentsToCalculate = Math.min(months, 12);
    
    for (let i = 0; i < installmentsToCalculate; i++) {
      paymentDate = new Date(paymentDate);
      paymentDate.setMonth(paymentDate.getMonth() + 1);
      
      let principalPart: number;
      let interestPart: number;
      
      if (installmentType === InstallmentType.EQUAL) {
        // For equal installments, recalculate parts each time
        interestPart = remainingBalance * interestRate / 12;
        principalPart = monthlyInstallment - interestPart;
      } else {
        // For decreasing installments
        principalPart = balance / months;
        interestPart = remainingBalance * interestRate / 12;
        monthlyInstallment = principalPart + interestPart;
      }
      
      remainingBalance -= principalPart;
      totalInterest += interestPart;
      
      // Adjust for rounding errors in last installment
      if (i === months - 1 && Math.abs(remainingBalance) < 0.01) {
        principalPart += remainingBalance;
        remainingBalance = 0;
      }
      
      schedule.push({
        date: paymentDate.toISOString().split('T')[0],
        installmentNumber: i + 1,
        amount: monthlyInstallment,
        principal: principalPart,
        interest: interestPart,
        remainingBalance: Math.max(0, remainingBalance),
      });
    }
    
    // Project total cost
    let totalAmount: number;
    if (installmentType === InstallmentType.EQUAL) {
      totalAmount = monthlyInstallment * months;
    } else {
      // For decreasing installments, calculate a more accurate estimate
      // First installment is balance/n + balance*rate
      // Last installment is balance/n + balance/n*rate
      // This is an arithmetic sequence where we can calculate the sum
      const firstInstallment = balance / months + balance * interestRate / 12;
      const lastInstallment = balance / months + (balance / months) * interestRate / 12;
      totalAmount = months * (firstInstallment + lastInstallment) / 2;
    }
    
    const comparison: RefinanceComparisonDto = {
      monthlyInstallment: installmentType === InstallmentType.EQUAL ? 
                         monthlyInstallment : schedule[0].amount,
      loanTermMonths: months,
      totalAmount: totalAmount,
      totalInterest: totalAmount - balance,
    };
    
    return {
      comparison,
      schedule,
    };
  }

  private calculateRefinancingWithLowerInstallment(
    newLoanAmount: number,
    newLoanMonths: number,
    newInterestRate: number,
    input: RefinanceDto['refinanceInput'],
    variantA: RefinanceVariantDto,
    startDate: Date
  ): RefinanceVariantDto {
    // Calculate costs
    const refinancingCosts = this.calculateRefinancingCosts(newLoanAmount, input.advanced);
    const commissionRefund = this.calculateCommissionRefund(input);
    
    // Calculate schedule similar to variant A but with new parameters
    const baseVariant = this.calculateCurrentLoanScenario(
      newLoanAmount,
      newLoanMonths,
      newInterestRate,
      input.advanced.newInstallmentType,
      startDate
    );
    
    // Calculate total benefit
    const originalTotalCost = variantA.comparison.totalAmount;
    const newTotalCost = baseVariant.comparison.totalAmount + refinancingCosts - commissionRefund;
    const totalBenefit = originalTotalCost - newTotalCost;
    
    // Calculate payback period based on monthly savings
    let paybackPeriodMonths: number | undefined = undefined;
    const monthlySavings = variantA.comparison.monthlyInstallment - baseVariant.comparison.monthlyInstallment;
    if (monthlySavings > 0) {
      const netCost = refinancingCosts - commissionRefund;
      if (netCost > 0) {
        paybackPeriodMonths = Math.ceil(netCost / monthlySavings);
      } else {
        // Immediate payback if commission refund exceeds costs
        paybackPeriodMonths = 0;
      }
    }
    
    // Return the result with adjusted values
    return {
      comparison: {
        ...baseVariant.comparison,
        commissionRefund,
        refinancingCosts,
        totalBenefit,
        paybackPeriodMonths,
      },
      schedule: baseVariant.schedule,
    };
  }

  private calculateRefinancingWithShorterTerm(
    newLoanAmount: number,
    newInterestRate: number,
    input: RefinanceDto['refinanceInput'],
    variantA: RefinanceVariantDto,
    startDate: Date
  ): RefinanceVariantDto {
    try {
      console.log('Rozpoczynam obliczanie wariantu C (z krótszym okresem)...');
      
      // Calculate costs
      const refinancingCosts = this.calculateRefinancingCosts(newLoanAmount, input.advanced);
      const commissionRefund = this.calculateCommissionRefund(input);
      
      // Original monthly installment
      const originalMonthlyInstallment = variantA.comparison.monthlyInstallment;
      console.log(`Oryginalna miesięczna rata: ${originalMonthlyInstallment.toFixed(2)} zł`);
      
      // Maximum allowed installment - HARD LIMIT
      const PAYMENT_INCREASE_LIMIT = 30; // 30 PLN limit
      const maxAllowedInstallment = originalMonthlyInstallment + PAYMENT_INCREASE_LIMIT;
      console.log(`Maksymalna dozwolona rata (oryginalna + ${PAYMENT_INCREASE_LIMIT} zł): ${maxAllowedInstallment.toFixed(2)} zł`);
      
      // Original term in months
      const originalTermMonths = variantA.comparison.loanTermMonths;
      console.log(`Oryginalny okres kredytowania: ${originalTermMonths} miesięcy`);
      
      // NEW APPROACH: Simple linear search from the shortest term (12 months)
      // to the original term to find the shortest term with payment <= maxAllowedInstallment
      
      // Start with minimum term (12 months) and increase until we find a valid term
      const MIN_TERM_MONTHS = 12; // Minimum 1 year
      let validTerm = originalTermMonths; // Default to original term if no shorter valid term is found
      let validVariant = null;
      
      // First check: is the payment at original term - 1 already too high?
      const testVariant = this.calculateCurrentLoanScenario(
        newLoanAmount,
        originalTermMonths - 1,
        newInterestRate,
        input.advanced.newInstallmentType,
        startDate
      );
      
      const testInstallment = testVariant.comparison.monthlyInstallment;
      console.log(`Test: payment at ${originalTermMonths - 1} months = ${testInstallment.toFixed(2)} zł (limit: ${maxAllowedInstallment.toFixed(2)} zł)`);
      
      if (testInstallment > maxAllowedInstallment) {
        console.log(`Nawet przy skróceniu o 1 miesiąc rata (${testInstallment.toFixed(2)} zł) przekracza dozwoloną (${maxAllowedInstallment.toFixed(2)} zł)`);
        console.log(`Używam oryginalnego okresu kredytowania: ${originalTermMonths} miesięcy`);
        
        // Use original term
        validTerm = originalTermMonths;
        validVariant = this.calculateCurrentLoanScenario(
          newLoanAmount,
          validTerm,
          newInterestRate,
          input.advanced.newInstallmentType,
          startDate
        );
      } else {
        // Check each potential term from shortest to longest until we find a valid one
        // Start from shortest possible (12 months) and work up
        for (let term = MIN_TERM_MONTHS; term < originalTermMonths; term++) {
          const currentVariant = this.calculateCurrentLoanScenario(
            newLoanAmount,
            term,
            newInterestRate,
            input.advanced.newInstallmentType,
            startDate
          );
          
          const currentInstallment = currentVariant.comparison.monthlyInstallment;
          
          // Log every 12 months to avoid excessive logging
          if (term % 12 === 0 || term === MIN_TERM_MONTHS) {
            console.log(`Sprawdzam okres ${term} miesięcy: rata = ${currentInstallment.toFixed(2)} zł (limit: ${maxAllowedInstallment.toFixed(2)} zł)`);
          }
          
          // Check if this term gives a payment within our limit
          if (currentInstallment <= maxAllowedInstallment) {
            validTerm = term;
            validVariant = currentVariant;
            console.log(`Znaleziono najkrótszy okres: ${term} miesięcy, rata: ${currentInstallment.toFixed(2)} zł`);
            break; // Exit the loop as soon as we find a valid term
          }
        }
        
        // If no valid term was found, use original term
        if (validVariant === null) {
          console.log(`Nie znaleziono krótszego okresu z ratą nieprzekraczającą ${maxAllowedInstallment.toFixed(2)} zł`);
          console.log(`Używam oryginalnego okresu kredytowania: ${originalTermMonths} miesięcy`);
          
          validTerm = originalTermMonths;
          validVariant = this.calculateCurrentLoanScenario(
            newLoanAmount,
            validTerm,
            newInterestRate,
            input.advanced.newInstallmentType,
            startDate
          );
        }
      }
      
      // Final verification
      const finalInstallment = validVariant.comparison.monthlyInstallment;
      const difference = finalInstallment - originalMonthlyInstallment;
      
      console.log(`-----------------------------------`);
      console.log(`PODSUMOWANIE:`);
      console.log(`  Oryginalny okres: ${originalTermMonths} miesięcy`);
      console.log(`  Wybrany okres: ${validTerm} miesięcy (skrócenie o ${originalTermMonths - validTerm} miesięcy)`);
      console.log(`  Oryginalna rata: ${originalMonthlyInstallment.toFixed(2)} zł`);
      console.log(`  Nowa rata: ${finalInstallment.toFixed(2)} zł`);
      console.log(`  Różnica rat: ${difference.toFixed(2)} zł (limit: ${PAYMENT_INCREASE_LIMIT} zł)`);
      console.log(`-----------------------------------`);
      
      // Final safety check - if somehow we still exceed the limit, use original term
      if (finalInstallment > maxAllowedInstallment) {
        console.log(`BŁĄD KRYTYCZNY: Finalna rata ${finalInstallment.toFixed(2)} zł nadal przekracza limit ${maxAllowedInstallment.toFixed(2)} zł!`);
        console.log(`Wymuszam użycie oryginalnego okresu kredytowania: ${originalTermMonths} miesięcy`);
        
        validTerm = originalTermMonths;
        validVariant = this.calculateCurrentLoanScenario(
          newLoanAmount,
          validTerm,
          newInterestRate,
          input.advanced.newInstallmentType,
          startDate
        );
      }
      
      // Calculate total benefit
      const originalTotalCost = variantA.comparison.totalAmount;
      const newTotalCost = validVariant.comparison.totalAmount + refinancingCosts - commissionRefund;
      const totalBenefit = originalTotalCost - newTotalCost;
      
      // Calculate payback period
      let paybackPeriodMonths: number;
      
      if (refinancingCosts <= commissionRefund) {
        // Immediate payback if commission refund exceeds costs
        paybackPeriodMonths = 0;
      } else {
        // Simplified estimate based on term reduction
        paybackPeriodMonths = Math.max(1, Math.floor(validTerm * 0.075));
      }
      
      // Return the result with adjusted values
      return {
        comparison: {
          ...validVariant.comparison,
          commissionRefund,
          refinancingCosts,
          totalBenefit,
          paybackPeriodMonths,
        },
        schedule: validVariant.schedule,
      };
    } catch (error) {
      console.error('Błąd w obliczaniu wariantu z krótszym okresem:', error.message);
      console.error('Stack błędu:', error.stack);
      
      // Fallback to a very safe default - use original term
      const fallbackMonths = variantA.comparison.loanTermMonths; // Original term for safety
      console.log(`BŁĄD KRYTYCZNY: Używam oryginalnego okresu: ${fallbackMonths} miesięcy`);
      
      const baseVariant = this.calculateCurrentLoanScenario(
        newLoanAmount,
        fallbackMonths,
        newInterestRate,
        input.advanced.newInstallmentType,
        startDate
      );
      
      const refinancingCosts = this.calculateRefinancingCosts(newLoanAmount, input.advanced);
      const commissionRefund = this.calculateCommissionRefund(input);
      
      return {
        comparison: {
          ...baseVariant.comparison,
          commissionRefund,
          refinancingCosts,
          totalBenefit: 0, // Cannot reliably calculate benefit in fallback mode
          paybackPeriodMonths: 0, // Conservative fallback estimate
        },
        schedule: baseVariant.schedule,
      };
    }
  }

  private calculateRefinancingCosts(
    loanAmount: number, 
    advancedInput: RefinanceDto['refinanceInput']['advanced']
  ): number {
    // Calculate new loan commission
    let newLoanCommission = 0;
    if (advancedInput.newLoanCommission.type === CommissionType.PERCENTAGE) {
      newLoanCommission = loanAmount * (advancedInput.newLoanCommission.value / 100);
    } else {
      newLoanCommission = advancedInput.newLoanCommission.value;
    }
    
    // Calculate early repayment fee
    let earlyRepaymentFee = 0;
    if (advancedInput.earlyRepaymentFee.type === CommissionType.PERCENTAGE) {
      earlyRepaymentFee = loanAmount * (advancedInput.earlyRepaymentFee.value / 100);
    } else {
      earlyRepaymentFee = advancedInput.earlyRepaymentFee.value;
    }
    
    // Add other costs if present
    const otherCosts = advancedInput.otherCosts || 0;
    
    return newLoanCommission + earlyRepaymentFee + otherCosts;
  }

  private calculateCommissionRefund(input: RefinanceDto['refinanceInput']): number {
    // If original commission data is not provided, no refund
    if (!input.advanced.originalCommission || !input.advanced.startDate || !input.advanced.originalLoanAmount) {
      return 0;
    }
    
    // Calculate original commission amount
    let originalCommissionAmount = 0;
    if (input.advanced.originalCommission.type === CommissionType.PERCENTAGE) {
      originalCommissionAmount = input.advanced.originalLoanAmount * 
                                (input.advanced.originalCommission.value / 100);
    } else {
      originalCommissionAmount = input.advanced.originalCommission.value;
    }
    
    // Calculate total original loan term and elapsed time
    const startDate = new Date(input.advanced.startDate);
    const refinanceDate = new Date(input.advanced.refinanceDate);
    const currentRemainingMonths = input.basic.currentRemainingPeriod.years * 12 + 
                                 input.basic.currentRemainingPeriod.months;
    
    // Calculate elapsed months using difference between dates
    const elapsedMonths = (refinanceDate.getFullYear() - startDate.getFullYear()) * 12 + 
                         (refinanceDate.getMonth() - startDate.getMonth());
    
    // Calculate total original term
    const totalOriginalMonths = elapsedMonths + currentRemainingMonths;
    
    // Calculate refund proportion based on remaining term
    if (totalOriginalMonths <= 0) return 0;
    
    const refundProportion = currentRemainingMonths / totalOriginalMonths;
    return originalCommissionAmount * refundProportion;
  }

  private findMonthsForTargetInstallment(
    loanAmount: number,
    interestRate: number,
    targetInstallment: number,
    installmentType: InstallmentType
  ): number {
    try {
      console.log(`Obliczam skrócony okres dla kredytu: kwota=${loanAmount}, oprocentowanie=${interestRate*100}%, docelowa rata=${targetInstallment}, typ rat=${installmentType}`);
      
      // For decreasing installments, we can directly calculate
      if (installmentType === InstallmentType.DECREASING) {
        // First installment of decreasing is principal + full interest
        // principal = loanAmount / months
        // interest = loanAmount * interestRate / 12
        // targetInstallment = principal + interest
        // Solve for months
        
        const monthlyInterest = loanAmount * interestRate / 12;
        console.log(`Miesięczne odsetki przy pełnym kapitale: ${monthlyInterest}`);
        
        // If target installment is less than or equal to the interest, we can't calculate a valid term
        if (targetInstallment <= monthlyInterest) {
          console.log(`Docelowa rata (${targetInstallment}) jest mniejsza lub równa miesięcznym odsetkom (${monthlyInterest}). Zwracam domyślny okres 360 miesięcy.`);
          return 360; // Default to 30 years if impossible
        }
        
        const availableForPrincipal = targetInstallment - monthlyInterest;
        console.log(`Kwota dostępna na spłatę kapitału miesięcznie: ${availableForPrincipal}`);
        
        // Calculate months and round to nearest whole month
        let months = Math.round(loanAmount / availableForPrincipal);
        console.log(`Obliczony okres spłaty po zaokrągleniu: ${months} miesięcy`);
        
        return Math.max(12, Math.min(months, 360)); // Limit between 1 year and 30 years
      }
      
      // For equal installments, we need to use numerical methods
      const monthlyRate = interestRate / 12;
      console.log(`Miesięczna stopa procentowa: ${monthlyRate}`);
      
      // Check if target installment is reasonable
      // Minimum installment would be interest-only (which isn't actually possible with equal installments)
      const minPossibleInstallment = loanAmount * monthlyRate; // Theoretical minimum (interest-only payment)
      console.log(`Teoretyczne minimum raty (tylko odsetki): ${minPossibleInstallment}`);
      
      // Let's calculate for 30 years to get a practical minimum
      const installment30Years = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, 360)) / 
                              (Math.pow(1 + monthlyRate, 360) - 1);
      console.log(`Miesięczna rata dla 30 lat: ${installment30Years}`);
      
      // If target is less than the 30-year installment, we can't achieve it
      if (targetInstallment < installment30Years) {
        console.log(`Docelowa rata (${targetInstallment}) jest niższa niż minimalna możliwa rata na 30 lat (${installment30Years}). Zwracam 360 miesięcy.`);
        return 360; // Just return 30 years as the maximum term
      }
      
      // Let's calculate for 1 year to get a practical maximum
      const installment1Year = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, 12)) / 
                            (Math.pow(1 + monthlyRate, 12) - 1);
      console.log(`Miesięczna rata dla 1 roku: ${installment1Year}`);
      
      // If target is higher than the 1-year installment, we'll use 12 months
      if (targetInstallment >= installment1Year) {
        console.log(`Docelowa rata (${targetInstallment}) jest wyższa niż rata na 1 rok (${installment1Year}). Zwracam 12 miesięcy.`);
        return 12;
      }
      
      // Now do binary search to find the right term with whole months only
      console.log(`Rozpoczynam wyszukiwanie dla okresu z ratą najbliższą ${targetInstallment}`);
      
      // Start with a reasonable search range
      let minMonths = 12; // min 1 year
      let maxMonths = 360; // max 30 years
      let bestMonths = 360; // Default to longest term
      let bestDifference = Number.MAX_VALUE;
      
      // First make sure we have a valid starting point with installment <= targetInstallment
      const initialInstallment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, bestMonths)) / 
                       (Math.pow(1 + monthlyRate, bestMonths) - 1);
      if (initialInstallment > targetInstallment) {
        console.log(`Początkowa rata dla 360 miesięcy jest wyższa niż docelowa, nie można znaleźć odpowiedniego okresu.`);
        return 360; // Can't find a solution, return maximum term
      }
      
      // Binary search to narrow down the closest whole number of months
      while (minMonths <= maxMonths) {
        const midMonths = Math.floor((minMonths + maxMonths) / 2);
        
        // Calculate installment for this term
        const installment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, midMonths)) / 
                          (Math.pow(1 + monthlyRate, midMonths) - 1);
        
        // Keep track of best match that doesn't exceed target
        if (installment <= targetInstallment && (targetInstallment - installment < bestDifference)) {
          bestDifference = targetInstallment - installment;
          bestMonths = midMonths;
        }
        
        // If we found an exact match or we're getting very close, return it
        if (Math.abs(installment - targetInstallment) < 0.01) {
          console.log(`Znaleziono dokładne dopasowanie: ${midMonths} miesięcy`);
          return midMonths;
        }
        
        // Adjust search range - note this logic is reversed from the usual binary search
        // because installments decrease as months increase
        if (installment > targetInstallment) {
          minMonths = midMonths + 1; // Need more months to decrease installment
        } else {
          maxMonths = midMonths - 1; // Need fewer months to increase installment
        }
      }
      
      // Compare the two closest options directly to find the best
      const installmentBest = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, bestMonths)) / 
                            (Math.pow(1 + monthlyRate, bestMonths) - 1);
      
      console.log(`Najlepsze dopasowanie: ${bestMonths} miesięcy (rata: ${installmentBest}, cel: ${targetInstallment})`);
      
      // Return the closest whole month count
      return bestMonths;
    } catch (error) {
      console.error('Błąd w metodzie findMonthsForTargetInstallment:', error);
      // Default to 20 years if calculation fails
      return 240;
    }
  }
} 