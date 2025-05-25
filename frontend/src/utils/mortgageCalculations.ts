import { 
  CalculationParams, 
  CalculationResult, 
  InstallmentDetails, 
  MortgageInput,
  Overpayment,
  CyclicOverpayment,
  InterestRateChange,
  LoanTerm 
} from '../interfaces/mortgage';

/**
 * Lokalne obliczenia kredytowe - fallback gdy API nie działa
 * Wzorowane na implementacji kalkulatora refinansowania
 */

/**
 * Oblicza ratę równą dla kredytu
 */
export const calculateEqualInstallment = (
  principal: number, 
  monthlyRate: number, 
  months: number
): number => {
  if (monthlyRate === 0) return principal / months;
  
  const paymentFactor = (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                        (Math.pow(1 + monthlyRate, months) - 1);
  
  return principal * paymentFactor;
};

/**
 * Oblicza ratę malejącą dla kredytu
 */
export const calculateDecreasingInstallment = (
  originalPrincipal: number,
  remainingBalance: number,
  monthlyRate: number,
  originalTotalMonths: number
): { principalAmount: number; interestAmount: number; totalAmount: number } => {
  // Dla rat malejących kapitał jest stały przez cały okres
  const principalAmount = originalPrincipal / originalTotalMonths;
  const interestAmount = remainingBalance * monthlyRate;
  const totalAmount = principalAmount + interestAmount;
  
  return { principalAmount, interestAmount, totalAmount };
};

/**
 * Generuje wszystkie nadpłaty (jednorazowe + cykliczne)
 */
export const getAllOverpayments = (
  params: CalculationParams,
  totalMonths: number
): Overpayment[] => {
  const allOverpayments: Overpayment[] = [];
  
  // Dodaj nadpłaty jednorazowe
  if (params.overpayments) {
    allOverpayments.push(...params.overpayments);
  }
  
  // Generuj nadpłaty cykliczne
  if (params.cyclicOverpayment) {
    const cyclicOverpayments = generateCyclicOverpayments(
      params.cyclicOverpayment,
      new Date(params.mortgageInput.startDate),
      totalMonths
    );
    allOverpayments.push(...cyclicOverpayments);
  }
  
  // Sortuj według daty
  return allOverpayments.sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
};

/**
 * Generuje nadpłaty cykliczne
 */
export const generateCyclicOverpayments = (
  cyclicOverpayment: CyclicOverpayment,
  startDate: Date,
  totalMonths: number
): Overpayment[] => {
  const overpayments: Overpayment[] = [];
  const { amount, frequency, startDate: overpaymentStartDate, endDate } = cyclicOverpayment;
  
  const actualStartDate = overpaymentStartDate ? new Date(overpaymentStartDate) : startDate;
  const actualEndDate = endDate ? new Date(endDate) : null;
  
  let currentDate = new Date(actualStartDate);
  const loanEndDate = addMonths(startDate, totalMonths);
  
  // Określ interwał w miesiącach
  const intervalMonths = getIntervalMonths(frequency);
  
  // Zabezpieczenie przed nieskończoną pętlą
  let iterationCount = 0;
  const maxIterations = totalMonths * 2; // Maksymalnie 2x więcej iteracji niż miesięcy kredytu
  
  while (currentDate <= loanEndDate && iterationCount < maxIterations) {
    iterationCount++;
    
    // Sprawdź czy data mieści się w zakresie
    if (actualEndDate && currentDate > actualEndDate) {
      break;
    }
    
    // Dodaj nadpłatę jeśli data jest po dacie rozpoczęcia kredytu i przed końcem
    if (currentDate >= startDate && currentDate <= loanEndDate) {
      overpayments.push({
        date: new Date(currentDate),
        amount: amount
      });
    }
    
    // Przejdź do następnej daty
    currentDate = addMonths(currentDate, intervalMonths);
  }
  
  console.log(`Wygenerowano ${overpayments.length} nadpłat cyklicznych dla ${frequency}, kwota: ${amount}`);
  
  return overpayments;
};

/**
 * Dodaje miesiące do daty
 */
export const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

/**
 * Zwraca interwał w miesiącach dla częstotliwości
 */
export const getIntervalMonths = (frequency: CyclicOverpayment['frequency']): number => {
  switch (frequency) {
    case 'monthly': return 1;
    case 'quarterly': return 3;
    case 'semiannually': return 6;
    case 'annually': return 12;
    default: return 1;
  }
};

/**
 * Sprawdza czy w danym miesiącu jest nadpłata
 */
export const getOverpaymentForMonth = (
  overpayments: Overpayment[],
  currentDate: Date
): number => {
  return overpayments
    .filter(overpayment => isSameMonth(new Date(overpayment.date), currentDate))
    .reduce((sum, overpayment) => sum + overpayment.amount, 0);
};

/**
 * Sprawdza czy dwie daty są w tym samym miesiącu
 */
export const isSameMonth = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() && 
         date1.getMonth() === date2.getMonth();
};

/**
 * Pobiera aktualną stopę procentową na podstawie zmian stóp
 */
export const getCurrentInterestRate = (
  baseRate: number,
  rateChanges: InterestRateChange[],
  currentDate: Date
): number => {
  if (!rateChanges || rateChanges.length === 0) {
    return baseRate;
  }
  
  // Znajdź ostatnią zmianę stopy przed lub w dniu currentDate
  const applicableChanges = rateChanges
    .filter(change => new Date(change.date) <= currentDate)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  return applicableChanges.length > 0 ? applicableChanges[0].newRate : baseRate;
};

/**
 * Główna funkcja obliczająca scenariusz kredytowy
 */
export const calculateScenario = (
  params: CalculationParams,
  includeOverpayments: boolean
): {
  installments: InstallmentDetails[];
  summary: {
    totalPayment: number;
    totalInterest: number;
    loanTerm: LoanTerm;
  };
} => {
  const { mortgageInput, overpaymentEffect } = params;
  const { loanAmount, interestRate, loanTerm, installmentType, startDate, interestRateChanges } = mortgageInput;
  
  // Konwertuj okres kredytu na miesiące
  const totalMonths = loanTerm.years * 12 + loanTerm.months;
  
  // Inicjalizuj zmienne
  let remainingDebt = loanAmount;
  let currentDate = new Date(startDate);
  const installments: InstallmentDetails[] = [];
  let totalPayment = 0;
  let totalInterest = 0;
  let installmentNumber = 1;
  
  // Pobierz wszystkie nadpłaty
  const allOverpayments = includeOverpayments ? getAllOverpayments(params, totalMonths) : [];
  
  // Śledź liczbę pozostałych miesięcy
  let monthsRemaining = totalMonths;
  
  // Oblicz bazową ratę dla nadpłaty progresywnej
  let baseInstallmentAmount = 0;
  if (includeOverpayments && overpaymentEffect === 'progressive_overpayment' && installmentType === 'equal') {
    const monthlyRate = interestRate / 100 / 12;
    baseInstallmentAmount = calculateEqualInstallment(loanAmount, monthlyRate, totalMonths);
  }
  
  // Główna pętla obliczeniowa
  while (remainingDebt > 0.01 && monthsRemaining > 0) {
    // Pobierz aktualną stopę procentową
    const currentInterestRate = getCurrentInterestRate(interestRate, interestRateChanges || [], currentDate);
    const monthlyRate = currentInterestRate / 100 / 12;
    
    // Oblicz ratę podstawową
    let installmentAmount: number;
    let principalAmount: number;
    let interestAmount: number;
    
    if (installmentType === 'equal') {
      if (overpaymentEffect === 'reduce_installment' && includeOverpayments) {
        // Dla reduce_installment przelicz ratę na podstawie aktualnego długu
        installmentAmount = calculateEqualInstallment(remainingDebt, monthlyRate, monthsRemaining);
      } else if (overpaymentEffect === 'progressive_overpayment' && includeOverpayments) {
        // Użyj bazowej raty
        installmentAmount = baseInstallmentAmount;
      } else {
        // Standardowe obliczenie raty
        installmentAmount = calculateEqualInstallment(remainingDebt, monthlyRate, monthsRemaining);
      }
      
      interestAmount = remainingDebt * monthlyRate;
      principalAmount = Math.min(installmentAmount - interestAmount, remainingDebt);
    } else {
      // Raty malejące
      const decreasing = calculateDecreasingInstallment(loanAmount, remainingDebt, monthlyRate, totalMonths);
      installmentAmount = decreasing.totalAmount;
      principalAmount = decreasing.principalAmount;
      interestAmount = decreasing.interestAmount;
    }
    
    // Sprawdź nadpłaty w tym miesiącu
    const overpaymentAmount = getOverpaymentForMonth(allOverpayments, currentDate);
    
    // Oblicz progresywną nadpłatę
    let progressiveOverpayment = 0;
    if (overpaymentEffect === 'progressive_overpayment' && includeOverpayments && params.cyclicOverpayment) {
      // Progresywna nadpłata to różnica między bazową ratą a aktualną ratą
      if (installmentType === 'equal') {
        const currentInstallmentAmount = interestAmount + principalAmount;
        const savedAmount = Math.max(0, baseInstallmentAmount - currentInstallmentAmount);
        progressiveOverpayment = savedAmount; // Tylko oszczędność, bez dodatkowej kwoty
      } else {
        // Dla rat malejących nie ma progresywnej nadpłaty
        progressiveOverpayment = 0;
      }
    }
    
    // Całkowita nadpłata
    const totalOverpayment = overpaymentAmount + progressiveOverpayment;
    
    // Zastosuj nadpłatę do spłaty kapitału
    if (totalOverpayment > 0) {
      if (overpaymentEffect === 'reduce_period' || overpaymentEffect === 'progressive_overpayment') {
        // Nadpłata zmniejsza kapitał - dodaj do spłaty kapitału
        const maxAdditionalPrincipal = remainingDebt - principalAmount;
        const additionalPrincipal = Math.min(totalOverpayment, maxAdditionalPrincipal);
        principalAmount += additionalPrincipal;
      } else if (overpaymentEffect === 'reduce_installment') {
        // Dla reduce_installment rata jest już przeliczona, ale nadpłata i tak zmniejsza kapitał
        const maxAdditionalPrincipal = remainingDebt - principalAmount;
        const additionalPrincipal = Math.min(totalOverpayment, maxAdditionalPrincipal);
        principalAmount += additionalPrincipal;
      }
    }
    
    // Upewnij się, że nie przekraczamy pozostałego długu
    principalAmount = Math.min(principalAmount, remainingDebt);
    const finalInstallmentAmount = interestAmount + principalAmount;
    
    // Aktualizuj pozostały dług
    remainingDebt -= principalAmount;
    
    // Dodaj ratę do harmonogramu
    installments.push({
      installmentNumber,
      date: new Date(currentDate),
      totalAmount: finalInstallmentAmount,
      principalAmount,
      interestAmount,
      overpaymentAmount: totalOverpayment,
      remainingDebt,
      oneTimeOverpayment: overpaymentAmount,
      progressiveOverpayment: progressiveOverpayment
    });
    
    // Aktualizuj sumy - nadpłaty są częścią całkowitej płatności
    totalPayment += finalInstallmentAmount + totalOverpayment;
    totalInterest += interestAmount;
    
    // Przejdź do następnego miesiąca
    currentDate = addMonths(currentDate, 1);
    installmentNumber++;
    monthsRemaining--;
    
    // Przerwij jeśli dług został spłacony
    if (remainingDebt <= 0.01) {
      break;
    }
    
    // Zabezpieczenie przed nieskończoną pętlą
    if (installmentNumber > totalMonths + 120) { // +120 miesięcy jako zabezpieczenie
      console.warn('Przerwano obliczenia - zbyt wiele iteracji');
      break;
    }
  }
  
  // Oblicz rzeczywisty okres kredytu
  const actualMonths = installments.length;
  const actualLoanTerm: LoanTerm = {
    years: Math.floor(actualMonths / 12),
    months: actualMonths % 12
  };
  
  return {
    installments,
    summary: {
      totalPayment,
      totalInterest,
      loanTerm: actualLoanTerm
    }
  };
};

/**
 * Główna funkcja lokalnych obliczeń kredytowych
 */
export const calculateMortgageLocally = (params: CalculationParams): CalculationResult => {
  console.log('Rozpoczynam lokalne obliczenia kredytowe:', params);
  
  // Oblicz scenariusz bazowy (bez nadpłat)
  const baseScenario = calculateScenario(params, false);
  
  // Oblicz scenariusz z nadpłatami
  const overpaymentScenario = calculateScenario(params, true);
  
  // Oblicz oszczędności
  const savings: {
    totalAmount: number;
    interestAmount: number;
    timeReduction?: LoanTerm;
  } = {
    totalAmount: baseScenario.summary.totalPayment - overpaymentScenario.summary.totalPayment,
    interestAmount: baseScenario.summary.totalInterest - overpaymentScenario.summary.totalInterest,
  };
  
  // Dodaj redukcję czasu jeśli dotyczy
  if (params.overpaymentEffect === 'reduce_period' || params.overpaymentEffect === 'progressive_overpayment') {
    const baseMonths = baseScenario.summary.loanTerm.years * 12 + baseScenario.summary.loanTerm.months;
    const overpaymentMonths = overpaymentScenario.summary.loanTerm.years * 12 + overpaymentScenario.summary.loanTerm.months;
    const differenceMonths = baseMonths - overpaymentMonths;
    
    savings.timeReduction = {
      years: Math.floor(differenceMonths / 12),
      months: differenceMonths % 12,
    };
  }
  
  console.log('Lokalne obliczenia zakończone pomyślnie');
  
  return {
    baseScenario,
    overpaymentScenario,
    savings
  };
}; 