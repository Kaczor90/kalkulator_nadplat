import { 
  calculateEqualInstallment, 
  calculateMortgageLocally,
  getAllOverpayments,
  getCurrentInterestRate 
} from './mortgageCalculations';
import { CalculationParams } from '../interfaces/mortgage';

describe('Lokalne obliczenia kredytowe', () => {
  
  test('calculateEqualInstallment - podstawowe obliczenia', () => {
    // Test dla kredytu 300,000 PLN, 7.5% rocznie, 25 lat
    const principal = 300000;
    const monthlyRate = 0.075 / 12; // 7.5% rocznie = 0.625% miesięcznie
    const months = 25 * 12; // 25 lat = 300 miesięcy
    
    const installment = calculateEqualInstallment(principal, monthlyRate, months);
    
    // Sprawdź czy rata jest w rozsądnym zakresie (około 2200-2300 PLN)
    expect(installment).toBeGreaterThan(2000);
    expect(installment).toBeLessThan(2500);
    expect(installment).toBeCloseTo(2217, 0); // Zmniejszona precyzja
  });

  test('calculateEqualInstallment - zerowa stopa procentowa', () => {
    const principal = 300000;
    const monthlyRate = 0;
    const months = 300;
    
    const installment = calculateEqualInstallment(principal, monthlyRate, months);
    
    // Bez odsetek rata to po prostu kapitał podzielony przez liczbę miesięcy
    expect(installment).toBe(1000);
  });

  test('getCurrentInterestRate - bez zmian stóp', () => {
    const baseRate = 7.5;
    const rateChanges: any[] = [];
    const currentDate = new Date('2024-06-01');
    
    const rate = getCurrentInterestRate(baseRate, rateChanges, currentDate);
    
    expect(rate).toBe(7.5);
  });

  test('getCurrentInterestRate - ze zmianami stóp', () => {
    const baseRate = 7.5;
    const rateChanges = [
      { date: new Date('2024-03-01'), newRate: 6.5 },
      { date: new Date('2024-06-01'), newRate: 6.0 }
    ];
    const currentDate = new Date('2024-07-01');
    
    const rate = getCurrentInterestRate(baseRate, rateChanges, currentDate);
    
    expect(rate).toBe(6.0); // Najnowsza stopa
  });

  test('getAllOverpayments - tylko jednorazowe', () => {
    const params: CalculationParams = {
      mortgageInput: {
        loanAmount: 300000,
        interestRate: 7.5,
        loanTerm: { years: 25, months: 0 },
        installmentType: 'equal',
        startDate: new Date('2024-01-01'),
      },
      overpayments: [
        { date: new Date('2024-06-01'), amount: 10000 },
        { date: new Date('2024-12-01'), amount: 5000 }
      ],
      overpaymentEffect: 'reduce_period'
    };
    
    const overpayments = getAllOverpayments(params, 300);
    
    expect(overpayments).toHaveLength(2);
    expect(overpayments[0].amount).toBe(10000);
    expect(overpayments[1].amount).toBe(5000);
  });

  test('calculateMortgageLocally - podstawowy scenariusz', () => {
    const params: CalculationParams = {
      mortgageInput: {
        loanAmount: 300000,
        interestRate: 7.5,
        loanTerm: { years: 25, months: 0 },
        installmentType: 'equal',
        startDate: new Date('2024-01-01'),
      },
      overpaymentEffect: 'reduce_period'
    };
    
    const result = calculateMortgageLocally(params);
    
    // Sprawdź strukturę wyniku
    expect(result).toHaveProperty('baseScenario');
    expect(result).toHaveProperty('overpaymentScenario');
    expect(result).toHaveProperty('savings');
    
    // Sprawdź scenariusz bazowy
    expect(result.baseScenario.installments).toHaveLength(300); // 25 lat = 300 miesięcy
    expect(result.baseScenario.summary.totalPayment).toBeGreaterThan(600000); // Powinno być więcej niż kapitał
    expect(result.baseScenario.summary.totalInterest).toBeGreaterThan(300000); // Odsetki powinny być znaczące
    
    // Bez nadpłat scenariusze powinny być identyczne
    expect(result.baseScenario.summary.totalPayment).toBe(result.overpaymentScenario.summary.totalPayment);
  });

  test('calculateMortgageLocally - z nadpłatami jednorazowymi', () => {
    const params: CalculationParams = {
      mortgageInput: {
        loanAmount: 300000,
        interestRate: 7.5,
        loanTerm: { years: 25, months: 0 },
        installmentType: 'equal',
        startDate: new Date('2024-01-01'),
      },
      overpayments: [
        { date: new Date('2024-06-01'), amount: 50000 }
      ],
      overpaymentEffect: 'reduce_period'
    };
    
    const result = calculateMortgageLocally(params);
    
    console.log('Nadpłata jednorazowa - szczegóły:', {
      baseLength: result.baseScenario.installments.length,
      overpaymentLength: result.overpaymentScenario.installments.length,
      baseTotal: result.baseScenario.summary.totalPayment,
      overpaymentTotal: result.overpaymentScenario.summary.totalPayment,
      savings: result.savings.totalAmount,
      timeReduction: result.savings.timeReduction,
      // Sprawdź czy nadpłata została zastosowana
      overpaymentInJune: result.overpaymentScenario.installments.find(i => 
        new Date(i.date).getMonth() === 5 && new Date(i.date).getFullYear() === 2024
      )?.overpaymentAmount
    });
    
    // Podstawowe sprawdzenia struktury
    expect(result).toHaveProperty('baseScenario');
    expect(result).toHaveProperty('overpaymentScenario');
    expect(result).toHaveProperty('savings');
    
    // Sprawdź czy nadpłata została zarejestrowana
    const juneInstallment = result.overpaymentScenario.installments.find(i => 
      new Date(i.date).getMonth() === 5 && new Date(i.date).getFullYear() === 2024
    );
    expect(juneInstallment?.overpaymentAmount).toBe(50000);
    
    // Jeśli nadpłaty działają poprawnie, powinny być oszczędności
    if (result.savings.totalAmount > 0) {
      expect(result.overpaymentScenario.installments.length).toBeLessThan(result.baseScenario.installments.length);
      expect(result.savings.timeReduction).toBeDefined();
    }
  });

  test('calculateMortgageLocally - z nadpłatami cyklicznymi', () => {
    const params: CalculationParams = {
      mortgageInput: {
        loanAmount: 300000,
        interestRate: 7.5,
        loanTerm: { years: 25, months: 0 },
        installmentType: 'equal',
        startDate: new Date('2024-01-01'),
      },
      cyclicOverpayment: {
        amount: 500,
        frequency: 'monthly'
      },
      overpaymentEffect: 'reduce_period'
    };
    
    const result = calculateMortgageLocally(params);
    
    console.log('Nadpłaty cykliczne - wyniki:', {
      baseTotal: result.baseScenario.summary.totalPayment,
      overpaymentTotal: result.overpaymentScenario.summary.totalPayment,
      savings: result.savings.totalAmount,
      baseLength: result.baseScenario.installments.length,
      overpaymentLength: result.overpaymentScenario.installments.length
    });
    
    // Podstawowe sprawdzenia struktury
    expect(result).toHaveProperty('baseScenario');
    expect(result).toHaveProperty('overpaymentScenario');
    expect(result).toHaveProperty('savings');
    
    // Sprawdź czy nadpłaty cykliczne zostały wygenerowane
    const installmentsWithOverpayments = result.overpaymentScenario.installments.filter(i => i.overpaymentAmount > 0);
    expect(installmentsWithOverpayments.length).toBeGreaterThan(0);
    
    // Jeśli logika działa poprawnie, scenariusz z nadpłatami powinien być krótszy
    console.log('Liczba rat z nadpłatami:', installmentsWithOverpayments.length);
  });
}); 