import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid as MuiGrid,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  useTheme,
  Alert,
  AlertTitle,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  GetApp as GetAppIcon,
  ViewList as ViewListIcon,
  BarChart as BarChartIcon,
  Timeline as TimelineIcon,
  HelpOutline as HelpOutlineIcon,
} from '@mui/icons-material';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useGetMortgageCalculationQuery } from '../../../store/api';
import { RefinanceResult, RefinanceInstallment } from '../../../interfaces/refinance';
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  Legend, ResponsiveContainer, LineChart, Line
} from 'recharts';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { loadRobotoFonts } from '../../../fonts';

// Helper component to fix Grid issues
const Grid = (props: any) => <MuiGrid {...props} />;

// Keep mock data for fallback
const mockResultData: RefinanceResult = {
  id: 'refinance-123456',
  input: {
    basic: {
      currentLoanBalance: 300000,
      currentRemainingPeriod: { years: 20, months: 0 },
      currentInterestRate: 7.5,
      newInterestRate: 6.5,
    },
    advanced: {
      currentInstallmentType: 'equal',
      refinanceDate: new Date(),
      newLoanAmount: 300000,
      newLoanTerm: { years: 20, months: 0 }, 
      newInstallmentType: 'equal',
      newLoanCommission: { type: 'percentage', value: 0 },
      earlyRepaymentFee: { type: 'percentage', value: 0 },
      otherCosts: 0,
    },
  },
  variantA: {
    comparison: {
      monthlyInstallment: 2440,
      loanTermMonths: 240,
      totalAmount: 585600,
      totalInterest: 285600,
    },
    schedule: [
      // Example data - would have full schedule in real app
      { date: '2024-07-15', installmentNumber: 1, amount: 2440, principal: 1440, interest: 1000, remainingBalance: 298560 },
      { date: '2024-08-15', installmentNumber: 2, amount: 2440, principal: 1445, interest: 995, remainingBalance: 297115 },
    ],
  },
  variantB: {
    comparison: {
      monthlyInstallment: 2200,
      loanTermMonths: 240,
      totalAmount: 533000,
      totalInterest: 228000,
      commissionRefund: 4500,
      refinancingCosts: 5000,
      totalBenefit: 52100,
      paybackPeriodMonths: 24,
    },
    schedule: [
      { date: '2024-07-15', installmentNumber: 1, amount: 2200, principal: 1375, interest: 825, remainingBalance: 298625 },
      { date: '2024-08-15', installmentNumber: 2, amount: 2200, principal: 1378, interest: 822, remainingBalance: 297247 },
    ],
  },
  variantC: {
    comparison: {
      monthlyInstallment: 2450,
      loanTermMonths: 204,
      totalAmount: 504900,
      totalInterest: 199900,
      commissionRefund: 4500,
      refinancingCosts: 5000,
      totalBenefit: 81200,
      paybackPeriodMonths: 18,
    },
    schedule: [
      { date: '2024-07-15', installmentNumber: 1, amount: 2450, principal: 1625, interest: 825, remainingBalance: 298375 },
      { date: '2024-08-15', installmentNumber: 2, amount: 2450, principal: 1630, interest: 820, remainingBalance: 296745 },
    ],
  },
};

/**
 * Calculates refinance results locally when the server fails
 */
const calculateLocalRefinance = (params: any): RefinanceResult => {
  console.log('Calculating refinance locally with params:', params);
  
  // Extract basic params from URL parameters if available
  // Otherwise use default values
  let currentLoanBalance = 300000;
  let currentRemainingYears = 20;
  let currentRemainingMonths = 0;
  let currentInterestRate = 7.5;
  let newInterestRate = 6.5;
  
  // Default advanced parameters
  let currentInstallmentType = 'equal';
  let refinanceDate = new Date();
  let newLoanAmount = 300000;
  let newLoanTermYears = 20;
  let newLoanTermMonths = 0;
  let newInstallmentType = 'equal';
  let newLoanCommissionType = 'percentage';
  let newLoanCommissionValue = 0;
  let earlyRepaymentFeeType = 'percentage';
  let earlyRepaymentFeeValue = 0;
  let otherCosts = 0;
  let originalLoanAmount = 0;
  let startDate: Date | null = null;
  let originalCommissionType = 'percentage';
  let originalCommissionValue = 0;
  let installmentDayOfMonth = new Date().getDate(); // Default to today's day
  
  // Flag to check if advanced parameters were provided
  let hasAdvancedParams = false;
  
  try {
    if (params) {
      // Basic parameters
      currentLoanBalance = Number(params.get('currentLoanBalance')) || currentLoanBalance;
      currentRemainingYears = Number(params.get('currentRemainingYears')) || currentRemainingYears;
      currentRemainingMonths = Number(params.get('currentRemainingMonths')) || currentRemainingMonths;
      currentInterestRate = Number(params.get('currentInterestRate')) || currentInterestRate;
      newInterestRate = Number(params.get('newInterestRate')) || newInterestRate;
      
      // Check and extract advanced parameters
      if (params.has('currentInstallmentType')) {
        currentInstallmentType = params.get('currentInstallmentType') || currentInstallmentType;
        hasAdvancedParams = true;
      }
      
      if (params.has('refinanceDate')) {
        try {
          refinanceDate = new Date(params.get('refinanceDate') || '');
          hasAdvancedParams = true;
        } catch (e) {
          console.warn('Invalid refinance date format', e);
        }
      }
      
      if (params.has('newLoanAmount')) {
        newLoanAmount = Number(params.get('newLoanAmount')) || newLoanAmount;
        hasAdvancedParams = true;
      }
      
      if (params.has('newLoanTermYears')) {
        newLoanTermYears = Number(params.get('newLoanTermYears')) || newLoanTermYears;
        hasAdvancedParams = true;
      }
      
      if (params.has('newLoanTermMonths')) {
        newLoanTermMonths = Number(params.get('newLoanTermMonths')) || newLoanTermMonths;
        hasAdvancedParams = true;
      }
      
      if (params.has('newInstallmentType')) {
        newInstallmentType = params.get('newInstallmentType') || newInstallmentType;
        hasAdvancedParams = true;
      }
      
      if (params.has('newLoanCommissionType')) {
        newLoanCommissionType = params.get('newLoanCommissionType') || newLoanCommissionType;
        hasAdvancedParams = true;
      }
      
      if (params.has('newLoanCommissionValue')) {
        newLoanCommissionValue = Number(params.get('newLoanCommissionValue')) || newLoanCommissionValue;
        hasAdvancedParams = true;
      }
      
      if (params.has('earlyRepaymentFeeType')) {
        earlyRepaymentFeeType = params.get('earlyRepaymentFeeType') || earlyRepaymentFeeType;
        hasAdvancedParams = true;
      }
      
      if (params.has('earlyRepaymentFeeValue')) {
        earlyRepaymentFeeValue = Number(params.get('earlyRepaymentFeeValue')) || earlyRepaymentFeeValue;
        hasAdvancedParams = true;
      }
      
      if (params.has('otherCosts')) {
        otherCosts = Number(params.get('otherCosts')) || otherCosts;
        hasAdvancedParams = true;
      }
      
      if (params.has('originalLoanAmount')) {
        originalLoanAmount = Number(params.get('originalLoanAmount')) || originalLoanAmount;
        hasAdvancedParams = true;
      }
      
      if (params.has('startDate')) {
        try {
          startDate = new Date(params.get('startDate') || '');
          hasAdvancedParams = true;
        } catch (e) {
          console.warn('Invalid start date format', e);
        }
      }
      
      if (params.has('originalCommissionType')) {
        originalCommissionType = params.get('originalCommissionType') || originalCommissionType;
        hasAdvancedParams = true;
      }
      
      if (params.has('originalCommissionValue')) {
        originalCommissionValue = Number(params.get('originalCommissionValue')) || originalCommissionValue;
        hasAdvancedParams = true;
      }
      
      if (params.has('installmentDayOfMonth')) {
        installmentDayOfMonth = Number(params.get('installmentDayOfMonth')) || installmentDayOfMonth;
        hasAdvancedParams = true;
      }
      
      // Old way of checking for advanced parameters (keeping for backwards compatibility)
      hasAdvancedParams = hasAdvancedParams || params.has('newLoanCommission') || 
                         params.has('earlyRepaymentFee') || 
                         params.has('otherCosts') ||
                         params.has('newInstallmentType');
    }
  } catch (error) {
    console.error('Error parsing URL parameters:', error);
  }
  
  // Total number of months for current loan
  const totalMonths = currentRemainingYears * 12 + currentRemainingMonths;
  
  // Calculate time periods for commission refund
  let originalTermMonths = totalMonths;
  let monthsAlreadyPaid = 0;
  
  if (startDate) {
    // Calculate the total original term
    const currentDate = refinanceDate;
    const monthsSinceStart = (currentDate.getFullYear() - startDate.getFullYear()) * 12 + 
                           currentDate.getMonth() - startDate.getMonth();
    monthsAlreadyPaid = Math.max(0, monthsSinceStart);
    originalTermMonths = totalMonths + monthsAlreadyPaid;
  }
  
  // Calculate commission refund
  let commissionRefund = 0;
  if (hasAdvancedParams && originalTermMonths > 0 && totalMonths > 0) {
    let originalCommissionAmount = 0;
    
    if (originalCommissionType === 'percentage' && originalLoanAmount > 0) {
      originalCommissionAmount = originalLoanAmount * (originalCommissionValue / 100);
    } else {
      originalCommissionAmount = originalCommissionValue;
    }
    
    // Calculate refund based on remaining percentage of loan term
    if (originalCommissionAmount > 0) {
      commissionRefund = originalCommissionAmount * (totalMonths / originalTermMonths);
    }
  }
  
  // Daily interest calculation
  // Calculate daily interest rate for both current and new loans
  const currentDailyRate = currentInterestRate / 100 / 365; // Daily interest rate for current loan
  const newDailyRate = newInterestRate / 100 / 365; // Daily interest rate for new loan
  
  // Function to calculate monthly payment with daily interest rate
  // Uses a standard annuity formula but adjusts for the daily rate and real days
  const calculateMonthlyPaymentEqualInstallments = (
    loanAmount: number, 
    dailyRate: number, 
    totalMonths: number,
    dayOfMonth: number = 15
  ): number => {
    // For equal installments, use average month length for calculation (30.4167 days)
    const averageDaysPerMonth = 365 / 12; 
    const monthlyRate = dailyRate * averageDaysPerMonth;
    
    if (monthlyRate === 0) return loanAmount / totalMonths;
    
    const paymentFactor = (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / 
                          (Math.pow(1 + monthlyRate, totalMonths) - 1);
    
    return loanAmount * paymentFactor;
  };
  
  // Function to calculate days between two dates
  const daysBetweenDates = (date1: Date, date2: Date): number => {
    const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
    const diffMs = Math.abs(date2.getTime() - date1.getTime());
    return Math.round(diffMs / oneDay);
  };
  
  // Function to get next payment date
  const getNextPaymentDate = (currentDate: Date, dayOfMonth: number): Date => {
    const result = new Date(currentDate);
    
    // Move to next month
    result.setMonth(result.getMonth() + 1);
    
    // Set the target day of month
    result.setDate(dayOfMonth);
    
    // If we went too far (short month like Feb), adjust
    if (result < currentDate) {
      result.setMonth(result.getMonth() + 1);
      result.setDate(dayOfMonth);
    }
    
    return result;
  };
  
  // Generate schedule with daily interest calculation for equal installments
  const generateScheduleWithDailyInterest = (
    loanAmount: number, 
    dailyRate: number,
    installmentAmount: number,
    startDate: Date,
    totalMonths: number,
    dayOfMonth: number,
    installmentType: 'equal' | 'decreasing' = 'equal'
  ): RefinanceInstallment[] => {
    const schedule: RefinanceInstallment[] = [];
    let remainingBalance = loanAmount;
    let nextPaymentDate = getNextPaymentDate(startDate, dayOfMonth);
    let currentDate = startDate;
    let installmentNumber = 1;
    
    // For decreasing installments, calculate fixed principal amount
    const fixedPrincipal = installmentType === 'decreasing' ? loanAmount / totalMonths : 0;
    
    while (remainingBalance > 0 && installmentNumber <= totalMonths + 1) { // +1 for safety
      const daysInPeriod = daysBetweenDates(currentDate, nextPaymentDate);
      
      // Calculate interest for this period based on actual days
      let interestForPeriod = remainingBalance * dailyRate * daysInPeriod;
      
      // For decreasing installments, use fixed principal and variable interest
      let principalForPeriod: number;
      let actualInstallmentAmount: number;
      
      if (installmentType === 'decreasing') {
        principalForPeriod = Math.min(fixedPrincipal, remainingBalance);
        actualInstallmentAmount = principalForPeriod + interestForPeriod;
      } else {
        // For the last payment, adjust to pay off the exact remaining amount
        if (remainingBalance < (loanAmount / totalMonths) || installmentNumber >= totalMonths) {
          principalForPeriod = remainingBalance;
          actualInstallmentAmount = principalForPeriod + interestForPeriod;
        } else {
          // Calculate how much of the installment goes to principal
          // For equal payments, we use the pre-calculated installment amount
          // and subtract the interest to get the principal
          principalForPeriod = Math.min(installmentAmount - interestForPeriod, remainingBalance);
          actualInstallmentAmount = installmentAmount;
          
          // Safety check: ensure principal is positive
          if (principalForPeriod < 0) {
            principalForPeriod = Math.min(remainingBalance, loanAmount / totalMonths);
            actualInstallmentAmount = principalForPeriod + interestForPeriod;
          }
        }
      }
      
      // Update remaining balance
      remainingBalance -= principalForPeriod;
      
      // Round values to 2 decimal places for display
      const roundedInstallment = Math.round(actualInstallmentAmount * 100) / 100;
      const roundedPrincipal = Math.round(principalForPeriod * 100) / 100;
      const roundedInterest = Math.round(interestForPeriod * 100) / 100;
      const roundedBalance = Math.max(0, Math.round(remainingBalance * 100) / 100);
      
      // Add to schedule
      schedule.push({
        date: nextPaymentDate.toISOString().split('T')[0],
        installmentNumber: installmentNumber,
        amount: roundedInstallment,
        principal: roundedPrincipal,
        interest: roundedInterest,
        remainingBalance: roundedBalance,
        daysInPeriod: daysInPeriod
      });
      
      // Move to next payment
      currentDate = nextPaymentDate;
      nextPaymentDate = getNextPaymentDate(currentDate, dayOfMonth);
      installmentNumber++;
      
      // Break if we've paid off the loan or reached maximum iterations
      if (remainingBalance <= 0.01 || installmentNumber > totalMonths + 5) break;
    }
    
    return schedule;
  };
  
  // Calculate monthly payment for current loan (Variant A)
  const currentMonthlyPayment = calculateMonthlyPaymentEqualInstallments(
    currentLoanBalance, 
    currentDailyRate, 
    totalMonths,
    installmentDayOfMonth
  );
  
  // Current total payment - calculate from the schedule to get accurate values with daily interest
  let currentSchedule = generateScheduleWithDailyInterest(
    currentLoanBalance,
    currentDailyRate,
    currentMonthlyPayment,
    refinanceDate,
    totalMonths,
    installmentDayOfMonth,
    currentInstallmentType as 'equal' | 'decreasing'
  );
  
  // Calculate total payment from schedule
  const currentTotalPayment = currentSchedule.reduce((sum, item) => sum + item.amount, 0);
  const currentTotalInterest = currentSchedule.reduce((sum, item) => sum + item.interest, 0);
  
  // New loan term (from advanced params if provided, otherwise same as current)
  const newTotalMonths = hasAdvancedParams ? 
                        (newLoanTermYears * 12 + newLoanTermMonths) : 
                        totalMonths;
                        
  // New loan amount (from advanced params if provided, otherwise same as current balance)
  const finalNewLoanAmount = hasAdvancedParams ? newLoanAmount : currentLoanBalance;
  
  // Calculate new monthly payment for Variant B
  const newMonthlyPayment = calculateMonthlyPaymentEqualInstallments(
    finalNewLoanAmount, 
    newDailyRate, 
    newTotalMonths,
    installmentDayOfMonth
  );
  
  // Generate schedule for Variant B
  let newSchedule = generateScheduleWithDailyInterest(
    finalNewLoanAmount,
    newDailyRate,
    newMonthlyPayment,
    refinanceDate,
    newTotalMonths,
    installmentDayOfMonth,
    newInstallmentType as 'equal' | 'decreasing'
  );
  
  // Calculate total payment from schedule
  const newTotalPayment = newSchedule.reduce((sum, item) => sum + item.amount, 0);
  const newTotalInterest = newSchedule.reduce((sum, item) => sum + item.interest, 0);
  
  // Estimate refinancing costs and commission refunds using provided advanced parameters
  let refinancingCosts = 0;
  if (hasAdvancedParams) {
    // Calculate new loan commission
    if (newLoanCommissionType === 'percentage') {
      refinancingCosts += (finalNewLoanAmount * newLoanCommissionValue / 100);
    } else {
      refinancingCosts += newLoanCommissionValue;
    }
    
    // Add early repayment fee
    if (earlyRepaymentFeeType === 'percentage') {
      refinancingCosts += (currentLoanBalance * earlyRepaymentFeeValue / 100);
    } else {
      refinancingCosts += earlyRepaymentFeeValue;
    }
    
    // Add other costs
    refinancingCosts += otherCosts;
  } else {
    // Use default estimation if no advanced parameters were provided
    refinancingCosts = currentLoanBalance * 0 + 0; // 0% commission + 0 other costs
  }
  
  // Total benefit calculation
  const totalBenefitB = currentTotalPayment - newTotalPayment - refinancingCosts + commissionRefund;
  
  // Calculate payback period for Variant B
  const monthlySavings = currentMonthlyPayment - newMonthlyPayment;
  const netCost = refinancingCosts - commissionRefund;
  const paybackPeriodB = monthlySavings > 0 && netCost > 0 ? Math.ceil(netCost / monthlySavings) : 0;
  
  // Calculate Variant C (refinancing with shorter term)
  // Find the shortest term where the payment is within the limit (current payment + 0 PLN)
  
  // Maximum allowed installment - HARD LIMIT (rata_aktualna + 0 zł)
  const PAYMENT_INCREASE_LIMIT = 0; // 0 PLN limit - rata nie może być wyższa niż aktualna
  const maxAllowedInstallment = currentMonthlyPayment + PAYMENT_INCREASE_LIMIT;
  
  // Find the shortest term where payment <= maxAllowedInstallment
  const MIN_TERM_MONTHS = 12; // Minimum 1 year
  let optimalTermC = newTotalMonths; // Default to original term
  let optimalPaymentC = 0;
  
  // Search from shortest to longest term
  for (let term = MIN_TERM_MONTHS; term <= newTotalMonths; term++) {
    const paymentForTerm = calculateMonthlyPaymentEqualInstallments(
      finalNewLoanAmount, 
      newDailyRate, 
      term,
      installmentDayOfMonth
    );
    
    // Check if this term gives a payment within our limit
    if (paymentForTerm <= maxAllowedInstallment) {
      // This is the first (shortest) term that satisfies our constraint
      optimalTermC = term;
      optimalPaymentC = paymentForTerm;
      
      console.log(`Znaleziono najkrótszy okres spełniający warunki: ${term} miesięcy, rata: ${paymentForTerm.toFixed(2)} zł (limit: ${maxAllowedInstallment.toFixed(2)} zł)`);
      
      // Since we're looking for the shortest valid term, break immediately
      break;
    }
  }
  
  // If no valid shorter term was found, use original term
  if (optimalPaymentC === 0) {
    console.log(`Nie znaleziono krótszego okresu z ratą nieprzekraczającą ${maxAllowedInstallment.toFixed(2)} zł`);
    console.log(`Używam oryginalnego okresu kredytowania: ${newTotalMonths} miesięcy`);
    
    optimalTermC = newTotalMonths;
    optimalPaymentC = calculateMonthlyPaymentEqualInstallments(
      finalNewLoanAmount, 
      newDailyRate, 
      optimalTermC,
      installmentDayOfMonth
    );
  }
  
  // Generate schedule for Variant C
  let scheduleC = generateScheduleWithDailyInterest(
    finalNewLoanAmount,
    newDailyRate,
    optimalPaymentC,
    refinanceDate,
    optimalTermC,
    installmentDayOfMonth,
    newInstallmentType as 'equal' | 'decreasing'
  );
  
  // Calculate total payment from schedule
  const totalPaymentC = scheduleC.reduce((sum, item) => sum + item.amount, 0);
  const totalInterestC = scheduleC.reduce((sum, item) => sum + item.interest, 0);
  
  // Total benefit calculation for Variant C
  const totalBenefitC = currentTotalPayment - totalPaymentC - refinancingCosts + commissionRefund;
  
  // Calculate payback period for Variant C
  // Since monthly payments are similar, payback is more about total benefit over time
  const paybackPeriodC = netCost > 0 ? Math.ceil(netCost / (totalBenefitC / optimalTermC)) : 0;
  
  // Create the result object
  const result: RefinanceResult = {
    id: `local-calculation-${Date.now()}`,
    input: {
      basic: {
        currentLoanBalance: currentLoanBalance,
        currentRemainingPeriod: { years: currentRemainingYears, months: currentRemainingMonths },
        currentInterestRate: currentInterestRate,
        newInterestRate: newInterestRate,
      },
      advanced: {
        currentInstallmentType: currentInstallmentType as 'equal' | 'decreasing',
        refinanceDate: refinanceDate,
        newLoanAmount: newLoanAmount,
        newLoanTerm: { years: newLoanTermYears, months: newLoanTermMonths },
        newInstallmentType: newInstallmentType as 'equal' | 'decreasing',
        newLoanCommission: { 
          type: newLoanCommissionType as 'amount' | 'percentage', 
          value: newLoanCommissionValue 
        },
        earlyRepaymentFee: { 
          type: earlyRepaymentFeeType as 'amount' | 'percentage', 
          value: earlyRepaymentFeeValue 
        },
        otherCosts: otherCosts,
        installmentDayOfMonth: installmentDayOfMonth
      },
    },
    variantA: {
      comparison: {
        monthlyInstallment: Math.round(currentMonthlyPayment * 100) / 100,
        loanTermMonths: totalMonths,
        totalAmount: Math.round(currentTotalPayment * 100) / 100,
        totalInterest: Math.round(currentTotalInterest * 100) / 100,
        originalTermMonths: originalTermMonths,
        monthsAlreadyPaid: monthsAlreadyPaid
      },
      schedule: currentSchedule,
    },
    variantB: {
      comparison: {
        monthlyInstallment: Math.round(newMonthlyPayment * 100) / 100,
        loanTermMonths: newTotalMonths,
        totalAmount: Math.round(newTotalPayment * 100) / 100,
        totalInterest: Math.round(newTotalInterest * 100) / 100,
        commissionRefund: Math.round(commissionRefund * 100) / 100,
        refinancingCosts: Math.round(refinancingCosts * 100) / 100,
        totalBenefit: Math.round(totalBenefitB * 100) / 100,
        paybackPeriodMonths: paybackPeriodB,
        originalTermMonths: originalTermMonths,
        monthsAlreadyPaid: monthsAlreadyPaid
      },
      schedule: newSchedule,
    },
    variantC: {
      comparison: {
        monthlyInstallment: Math.round(optimalPaymentC * 100) / 100,
        loanTermMonths: optimalTermC,
        totalAmount: Math.round(totalPaymentC * 100) / 100,
        totalInterest: Math.round(totalInterestC * 100) / 100,
        commissionRefund: Math.round(commissionRefund * 100) / 100,
        refinancingCosts: Math.round(refinancingCosts * 100) / 100,
        totalBenefit: Math.round(totalBenefitC * 100) / 100,
        paybackPeriodMonths: paybackPeriodC,
        originalTermMonths: originalTermMonths,
        monthsAlreadyPaid: monthsAlreadyPaid
      },
      schedule: scheduleC,
    },
    calculationMethod: 'daily'
  };
  
  return result;
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

// Update the formatCurrency function to make it more robust
const formatCurrency = (amount: number): string => {
  if (amount === undefined || isNaN(amount)) return '0 zł';
  return `${amount.toLocaleString('pl-PL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} zł`;
};

const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('pl-PL', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
};

const formatPeriod = (months: number, compact = false): string => {
  if (months === undefined || isNaN(months)) return '';
  
  // Ensure we have a whole number of months
  const totalMonths = Math.round(months);
  const years = Math.floor(totalMonths / 12);
  const remainingMonths = totalMonths % 12;
  
  // For compact display
  if (compact) {
    if (years === 0) return `${remainingMonths}m`;
    if (remainingMonths === 0) return `${years}r`;
    return `${years}r ${remainingMonths}m`;
  }
  
  // For full display
  let result = '';
  if (years > 0) {
    result += `${years} ${years === 1 ? 'rok' : years < 5 ? 'lata' : 'lat'}`;
  }
  
  if (remainingMonths > 0) {
    if (result) result += ' ';
    result += `${remainingMonths} ${remainingMonths === 1 ? 'miesiąc' : remainingMonths < 5 ? 'miesiące' : 'miesięcy'}`;
  }
  
  return result || '0 miesięcy';
};

// Format currency for chart labels and tooltips
const formatCurrencyValue = (value: number): string => {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Custom tooltip component for charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <Paper elevation={3} sx={{ p: 1.5, backgroundColor: 'rgba(255, 255, 255, 0.95)' }}>
        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
          {label}
        </Typography>
        {payload.map((entry: any, index: number) => (
          <Box key={`item-${index}`} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <Box 
              component="span" 
              sx={{ 
                width: 12, 
                height: 12, 
                bgcolor: entry.color, 
                display: 'inline-block',
                mr: 1 
              }}
            />
            <Typography variant="body2">
              {entry.name}: {formatCurrencyValue(entry.value)}
            </Typography>
          </Box>
        ))}
      </Paper>
    );
  }
  return null;
};

// Total Costs Chart Component
const TotalCostsChart: React.FC<{ resultData: RefinanceResult }> = ({ resultData }) => {
  const theme = useTheme();
  
  // Extract data from result
  const variantA = resultData.variantA.comparison;
  const variantB = resultData.variantB.comparison;
  const variantC = resultData.variantC.comparison;
  
  // Calculate principal amount (same for all variants in most cases)
  const principal = resultData.input.basic.currentLoanBalance;
  
  // For variants B and C - include refinancing costs and commission refund effects
  const refinancingCostsB = variantB.refinancingCosts || 0;
  const commissionRefundB = variantB.commissionRefund || 0;
  const totalInterestB = variantB.totalInterest;
  
  const refinancingCostsC = variantC.refinancingCosts || 0;
  const commissionRefundC = variantC.commissionRefund || 0;
  const totalInterestC = variantC.totalInterest;

  // Format data for the stacked bar chart
  const chartData = [
    {
      name: 'Obecny kredyt',
      label: 'Obecny kredyt',
      Principal: principal,
      Interest: variantA.totalInterest,
      Costs: 0,
      Refund: 0
    },
    {
      name: 'Refinansowanie z niższą ratą',
      label: 'Refinansowanie z niższą ratą',
      Principal: principal,
      Interest: totalInterestB,
      Costs: refinancingCostsB,
      Refund: -commissionRefundB // Negative to show as reduction
    },
    {
      name: 'Refinansowanie z krótszym okresem',
      label: 'Refinansowanie z krótszym okresem',
      Principal: principal,
      Interest: totalInterestC,
      Costs: refinancingCostsC,
      Refund: -commissionRefundC // Negative to show as reduction
    }
  ];
  
  return (
    <Box sx={{ mt: 3, mb: 5 }}>
      <Typography variant="h6" sx={{ textAlign: 'center', mb: 2 }}>
        Porównanie całkowitych kosztów kredytu
      </Typography>
      
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 30,
            bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis 
            tickFormatter={(value) => formatCurrencyValue(value).replace(' zł', '')}
            label={{ value: 'Kwota (PLN)', angle: -90, position: 'insideLeft', dy: 50 }}
          />
          <RechartsTooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            dataKey="Principal" 
            name="Kapitał" 
            stackId="stack" 
            fill={theme.palette.grey[400]} 
            isAnimationActive={true}
          />
          <Bar 
            dataKey="Interest" 
            name="Odsetki" 
            stackId="stack" 
            fill={theme.palette.primary.main} 
            isAnimationActive={true}
          />
          <Bar 
            dataKey="Costs" 
            name="Koszty refinansowania" 
            stackId="stack" 
            fill={theme.palette.error.main} 
            isAnimationActive={true}
          />
          <Bar 
            dataKey="Refund" 
            name="Zwrot prowizji" 
            stackId="stack" 
            fill={theme.palette.success.main} 
            isAnimationActive={true}
          />
        </BarChart>
      </ResponsiveContainer>
      
      {(commissionRefundB > 0 || commissionRefundC > 0) && (
        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 1, fontStyle: 'italic' }}>
          * Zwrot prowizji w wysokości {formatCurrencyValue(commissionRefundB)} (refinansowanie z niższą ratą) oraz {formatCurrencyValue(commissionRefundC)} (refinansowanie z krótszym okresem) zmniejsza realny koszt refinansowania
        </Typography>
      )}
    </Box>
  );
};

// Balance Over Time Chart Component
const BalanceOverTimeChart: React.FC<{ resultData: RefinanceResult }> = ({ resultData }) => {
  const theme = useTheme();
  
  // Extract schedules
  const scheduleA = resultData.variantA.schedule;
  const scheduleB = resultData.variantB.schedule;
  const scheduleC = resultData.variantC.schedule;
  
  // Find the maximum number of months to show for all variants
  const maxMonths = Math.max(scheduleA.length, scheduleB.length, scheduleC.length);
  
  // If we have too many points, reduce for clearer visualization
  // Determine the step size based on the number of points
  const step = maxMonths > 120 ? 12 : maxMonths > 60 ? 6 : 3;
  
  // Prepare data for the line chart
  // Use a sample of points to prevent the chart from getting too crowded
  const chartData: any[] = [];
  
  // Find the maximum length needed for the chart
  const maxLength = Math.max(scheduleA.length, scheduleB.length, scheduleC.length);
  
  // Create data points at regular intervals
  for (let i = 0; i < maxLength; i += step) {
    const dataPoint: any = {
      month: i + 1,
    };
    
    // Add dates at step intervals
    if (i < scheduleA.length) {
      const date = new Date(scheduleA[i].date);
      dataPoint.date = date.toLocaleDateString('pl-PL', { year: 'numeric', month: 'short' });
      dataPoint['Wariant A'] = scheduleA[i].remainingBalance;
    }
    
    if (i < scheduleB.length) {
      dataPoint['Wariant B'] = scheduleB[i].remainingBalance;
    }
    
    if (i < scheduleC.length) {
      dataPoint['Wariant C'] = scheduleC[i].remainingBalance;
    }
    
    chartData.push(dataPoint);
  }
  
  // Always include the final points of each schedule
  const finalPoint: any = { month: maxLength, isFinal: true };
  
  if (scheduleA.length > 0) {
    const date = new Date(scheduleA[scheduleA.length - 1].date);
    finalPoint.date = date.toLocaleDateString('pl-PL', { year: 'numeric', month: 'short' });
    finalPoint['Wariant A'] = scheduleA[scheduleA.length - 1].remainingBalance;
  }
  
  if (scheduleB.length > 0) {
    finalPoint['Wariant B'] = scheduleB[scheduleB.length - 1].remainingBalance;
  }
  
  if (scheduleC.length > 0) {
    finalPoint['Wariant C'] = scheduleC[scheduleC.length - 1].remainingBalance;
  }
  
  // Add final point only if it's not already included
  if (chartData.length > 0 && chartData[chartData.length - 1].month !== maxLength) {
    chartData.push(finalPoint);
  }
  
  return (
    <Box sx={{ mt: 3, mb: 5 }}>
      <Typography variant="h6" sx={{ textAlign: 'center', mb: 2 }}>
        Saldo zadłużenia w czasie
      </Typography>
      
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 30,
            bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            tickFormatter={(value) => formatCurrencyValue(value).replace(' zł', '')} 
            label={{ value: 'Saldo zadłużenia (PLN)', angle: -90, position: 'insideLeft', dy: 50 }}
          />
          <RechartsTooltip content={<CustomTooltip />} />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="Wariant A" 
            name="Obecny kredyt" 
            stroke={theme.palette.primary.main} 
            strokeWidth={2}
            dot={{ r: 0 }}
            activeDot={{ r: 6 }}
            isAnimationActive={true}
          />
          <Line 
            type="monotone" 
            dataKey="Wariant B" 
            name="Refinansowanie z niższą ratą" 
            stroke={theme.palette.warning.main} 
            strokeWidth={2}
            dot={{ r: 0 }}
            activeDot={{ r: 6 }}
            isAnimationActive={true}
          />
          <Line 
            type="monotone" 
            dataKey="Wariant C" 
            name="Refinansowanie z krótszym okresem" 
            stroke={theme.palette.success.main} 
            strokeWidth={2}
            dot={{ r: 0 }}
            activeDot={{ r: 6 }}
            isAnimationActive={true}
          />
        </LineChart>
      </ResponsiveContainer>
      <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 1, fontStyle: 'italic' }}>
        * Wykres pokazuje, jak szybko zmniejsza się saldo kredytu w różnych wariantach
      </Typography>
    </Box>
  );
};

// Monthly Installment Chart Component
const MonthlyInstallmentChart: React.FC<{ resultData: RefinanceResult }> = ({ resultData }) => {
  const theme = useTheme();
  
  // Extract data from result
  const installmentA = resultData.variantA.comparison.monthlyInstallment;
  const installmentB = resultData.variantB.comparison.monthlyInstallment;
  const installmentC = resultData.variantC.comparison.monthlyInstallment;
  
  // Extract schedules to check if installments are decreasing
  const scheduleA = resultData.variantA.schedule;
  const scheduleB = resultData.variantB.schedule;
  const scheduleC = resultData.variantC.schedule;
  
  // Check if any variant has decreasing installments
  const hasDecreasingInstallments = 
    (scheduleA.length > 1 && scheduleA[0].amount !== scheduleA[1].amount) ||
    (scheduleB.length > 1 && scheduleB[0].amount !== scheduleB[1].amount) ||
    (scheduleC.length > 1 && scheduleC[0].amount !== scheduleC[1].amount);
  
  // Prepare data based on installment type
  let chartData: any[] = [];
  
  if (hasDecreasingInstallments) {
    // For decreasing installments, show multiple points over time
    const samplePoints = [1, 12, 24, 36, 48];
    
    // Helper function to get installment at specific month
    const getInstallmentAtMonth = (schedule: RefinanceInstallment[], month: number) => {
      const index = month - 1;
      if (index < 0 || index >= schedule.length) return null;
      return schedule[index].amount;
    };
    
    // Create data points for specific months
    samplePoints.forEach(month => {
      const dataPoint: any = {
        name: `Rata ${month}`,
        month
      };
      
      const installA = getInstallmentAtMonth(scheduleA, month);
      if (installA !== null) dataPoint['Wariant A'] = installA;
      
      const installB = getInstallmentAtMonth(scheduleB, month);
      if (installB !== null) dataPoint['Wariant B'] = installB;
      
      const installC = getInstallmentAtMonth(scheduleC, month);
      if (installC !== null) dataPoint['Wariant C'] = installC;
      
      chartData.push(dataPoint);
    });
    
    // Add final installments
    const finalDataPoint: any = {
      name: 'Ostatnia rata',
      month: Math.max(scheduleA.length, scheduleB.length, scheduleC.length)
    };
    
    if (scheduleA.length > 0) {
      finalDataPoint['Wariant A'] = scheduleA[scheduleA.length - 1].amount;
    }
    
    if (scheduleB.length > 0) {
      finalDataPoint['Wariant B'] = scheduleB[scheduleB.length - 1].amount;
    }
    
    if (scheduleC.length > 0) {
      finalDataPoint['Wariant C'] = scheduleC[scheduleC.length - 1].amount;
    }
    
    chartData.push(finalDataPoint);
  } else {
    // For equal installments, just show one bar for each variant
    chartData = [
      {
        name: 'Obecny kredyt',
        label: 'Obecny kredyt',
        value: installmentA,
        fill: theme.palette.primary.main
      },
      {
        name: 'Refinansowanie z niższą ratą',
        label: 'Refinansowanie z niższą ratą',
        value: installmentB,
        fill: theme.palette.warning.main
      },
      {
        name: 'Refinansowanie z krótszym okresem',
        label: 'Refinansowanie z krótszym okresem',
        value: installmentC,
        fill: theme.palette.success.main
      }
    ];
  }
  
  return (
    <Box sx={{ mt: 3, mb: 5 }}>
      <Typography variant="h6" sx={{ textAlign: 'center', mb: 2 }}>
        Porównanie wysokości miesięcznych rat
      </Typography>
      
      <ResponsiveContainer width="100%" height={400}>
        {hasDecreasingInstallments ? (
          // Line chart for decreasing installments
          <LineChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 30,
              bottom: 20,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis 
              tickFormatter={(value) => formatCurrencyValue(value).replace(' zł', '')}
              label={{ value: 'Rata (PLN)', angle: -90, position: 'insideLeft', dy: 50 }}
            />
            <RechartsTooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="Wariant A" 
              name="Obecny kredyt" 
              stroke={theme.palette.primary.main} 
              strokeWidth={2}
              dot={{ r: 3 }}
              isAnimationActive={true}
            />
            <Line 
              type="monotone" 
              dataKey="Wariant B" 
              name="Refinansowanie z niższą ratą" 
              stroke={theme.palette.warning.main} 
              strokeWidth={2}
              dot={{ r: 3 }}
              isAnimationActive={true}
            />
            <Line 
              type="monotone" 
              dataKey="Wariant C" 
              name="Refinansowanie z krótszym okresem" 
              stroke={theme.palette.success.main} 
              strokeWidth={2}
              dot={{ r: 3 }}
              isAnimationActive={true}
            />
          </LineChart>
        ) : (
          // Bar chart for equal installments
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 30,
              bottom: 20,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis 
              tickFormatter={(value) => formatCurrencyValue(value).replace(' zł', '')}
              label={{ value: 'Rata (PLN)', angle: -90, position: 'insideLeft', dy: 50 }}
            />
            <RechartsTooltip formatter={(value: any) => formatCurrencyValue(value)} />
            <Legend />
            <Bar 
              dataKey="value" 
              name="Miesięczna rata" 
              isAnimationActive={true}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
      <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 1, fontStyle: 'italic' }}>
        {hasDecreasingInstallments 
          ? '* Wykres pokazuje zmianę wysokości rat w miarę spłaty kredytu' 
          : '* Wysokość raty miesięcznej pozostaje stała przez cały okres kredytowania'}
      </Typography>
    </Box>
  );
};

const RefinanceResults: React.FC = () => {
  const { calculationId } = useParams<{ calculationId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const location = useLocation();
  const [mainTab, setMainTab] = useState(0);
  const [scheduleTab, setScheduleTab] = useState(0);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [useLocalCalculation, setUseLocalCalculation] = useState(false);
  const [localResult, setLocalResult] = useState<RefinanceResult | null>(null);
  
  // Fetch calculation results from the API
  const { data, isLoading, error } = useGetMortgageCalculationQuery(
    calculationId || '',
    { skip: !calculationId || useLocalCalculation }
  );
  
  // Add detailed error logging
  useEffect(() => {
    if (error) {
      console.error('Error fetching refinance calculation:', error);
      
      // Try local calculation as fallback on server error
      if (calculationId !== 'local') {
        console.log('Attempting local calculation fallback...');
        const queryParams = new URLSearchParams(location.search);
        const localResult = calculateLocalRefinance(queryParams);
        setLocalResult(localResult);
        setUseLocalCalculation(true);
      }
    }
    if (data) {
      console.log('Fetched refinance data:', data);
    }
  }, [data, error, calculationId, location.search]);
  
  // Handle local calculation if direct URL with 'local' ID is used
  useEffect(() => {
    if (calculationId === 'local') {
      console.log('Local calculation requested via URL');
      const queryParams = new URLSearchParams(location.search);
      const localResult = calculateLocalRefinance(queryParams);
      setLocalResult(localResult);
      setUseLocalCalculation(true);
    }
  }, [calculationId, location.search]);

  // Sprawdzenie, czy dane są typu RefinanceResult
  const isRefinanceResult = (result: any): result is RefinanceResult => {
    return result && 
           result.variantA && 
           result.variantB && 
           result.variantC && 
           result.variantA.comparison && 
           result.variantB.comparison && 
           result.variantC.comparison;
  };
  
  // Konwersja danych do odpowiedniego typu
  const resultData: RefinanceResult = useMemo(() => {
    // If using local calculation, return that result
    if (useLocalCalculation && localResult) {
      return localResult;
    }
    
    // Otherwise use server data with mock as fallback
    if (!data) return process.env.NODE_ENV === 'development' ? mockResultData : undefined as any;
    
    if (isRefinanceResult(data)) {
      return data;
    } else {
      console.error('Received data is not a valid RefinanceResult:', data);
      return process.env.NODE_ENV === 'development' ? mockResultData : undefined as any;
    }
  }, [data, useLocalCalculation, localResult]);

  const handleMainTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setMainTab(newValue);
  };

  const handleScheduleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setScheduleTab(newValue);
  };

  const handleBackToCalculator = () => {
    navigate('/refinance');
  };

  const handleGeneratePDF = async () => {
    setIsGeneratingPDF(true);
    
    try {
      console.log('Starting refinance PDF report generation...');
      
      // Create PDF document with increased precision
      const pdf = new jsPDF({
        unit: 'mm',
        format: 'a4',
        precision: 4
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Set up font configuration
      console.log('Setting up font configuration...');
      let fontConfig = {
        useFont: 'helvetica',
        fontStyle: 'normal',
        fontLoadError: false
      };

      try {
        console.log('Attempting to load fonts...');
        const fontsLoaded = await loadRobotoFonts(pdf);
        if (fontsLoaded) {
          console.log('Roboto fonts loaded successfully.');
          fontConfig.useFont = 'Roboto';
        } else {
          console.warn('Roboto fonts failed to load, using Helvetica.');
          fontConfig.useFont = 'helvetica';
          fontConfig.fontLoadError = true;
        }
      } catch (fontError) {
        console.error('Error loading fonts:', fontError);
        fontConfig.useFont = 'helvetica';
        fontConfig.fontLoadError = true;
      }

      const margin = { top: 10, right: 10, bottom: 15, left: 10 };
      const contentWidth = pdfWidth - margin.left - margin.right;

      // Load and add logo to PDF
      console.log('Loading logo for PDF...');
      let logoLoaded = false;
      try {
        const logoResponse = await fetch('/logo192.png');
        if (logoResponse.ok) {
          const logoBlob = await logoResponse.blob();
          const logoDataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(logoBlob);
          });
          
          // Add logo to PDF (top left)
          const logoSize = 15; // 15mm
          pdf.addImage(logoDataUrl, 'PNG', margin.left, margin.top, logoSize, logoSize);
          logoLoaded = true;
          console.log('Logo loaded successfully to PDF.');
        }
      } catch (logoError) {
        console.warn('Could not load logo for PDF:', logoError);
      }

      // Header with generation date
      console.log('Rendering generation date header');
      try {
        pdf.setFont(fontConfig.useFont, fontConfig.fontStyle);
        pdf.setFontSize(9);
        const today = new Date();
        pdf.text(
          `Wygenerowano: ${format(today, 'd MMMM yyyy, HH:mm', { locale: pl })}`,
          pdfWidth - margin.right,
          margin.top,
          { align: 'right' }
        );
        
        // Add title next to logo if logo was loaded
        if (logoLoaded) {
          pdf.setFontSize(12);
          if (fontConfig.useFont === 'Roboto') {
            pdf.setFont('Roboto-Bold');
          } else {
            pdf.setFont(fontConfig.useFont, 'bold');
          }
          pdf.text('Raport Refinansowania Kredytu', margin.left + 18, margin.top + 8);
        }
      } catch (headerError) {
        console.error('Error rendering header:', headerError);
        throw new Error('Błąd podczas generowania nagłówka raportu');
      }

      let yPosition = margin.top + (logoLoaded ? 20 : 5);

      // Title (centered, larger)
      if (fontConfig.useFont === 'Roboto') {
        pdf.setFont('Roboto-Bold');
      } else {
        pdf.setFont(fontConfig.useFont, 'bold');
      }
      pdf.setFontSize(16);
      pdf.text('Raport Refinansowania Kredytu', pdfWidth / 2, yPosition + 10, { align: 'center' });
      yPosition += 20;

      // Render summary sections
      const sections = [
        'summary-section', 
        'variant-comparison-table',
        'charts-section'
      ];

      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          try {
            console.log(`Rendering section: ${sectionId}...`);
            const canvas = await html2canvas(element, { 
              scale: 2,
              useCORS: true,
              logging: true,
              allowTaint: true
            });
            
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = contentWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            if (yPosition + imgHeight > pdfHeight - margin.bottom) {
              pdf.addPage();
              yPosition = margin.top;
            }
            
            pdf.addImage(imgData, 'PNG', margin.left, yPosition, imgWidth, imgHeight);
            yPosition += imgHeight + 10;
            
          } catch (sectionError) {
            console.error(`Error rendering ${sectionId} section:`, sectionError);
            console.error(sectionError);
          }
        } else {
          console.warn(`Element with ID "${sectionId}" not found`);
        }
      }

      console.log('PDF generation complete. Saving file...');
      pdf.save(`Raport_Refinansowania_Kredytu${calculationId ? '_' + calculationId : ''}.pdf`);
      setIsGeneratingPDF(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Wystąpił błąd podczas generowania PDF. Spróbuj ponownie później.');
      setIsGeneratingPDF(false);
    }
  };

  // Format days for display
  const formatDays = (days: number): string => {
    if (days === 1) return '1 dzień';
    if (days < 5) return `${days} dni`;
    return `${days} dni`;
  };

  // Find if there are days in period to determine calculation method
  const hasDailyCalculation = useMemo(() => {
    if (resultData?.calculationMethod === 'daily') return true;
    
    if (resultData?.variantA?.schedule?.[0]?.daysInPeriod !== undefined) {
      return true;
    }
    
    return false;
  }, [resultData]);

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 3 }}>
          Ładowanie wyników...
        </Typography>
      </Container>
    );
  }

  if (error && !useLocalCalculation) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          Nie udało się załadować wyników. Spróbuj ponownie później.
          {process.env.NODE_ENV === 'development' && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Szczegóły błędu: {JSON.stringify(error)}
            </Typography>
          )}
        </Alert>
        <Button 
          variant="contained" 
          startIcon={<ArrowBackIcon />} 
          onClick={handleBackToCalculator}
        >
          Wróć do kalkulatora
        </Button>
      </Container>
    );
  }

  if (!resultData) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Nie znaleziono danych dla tego obliczenia. Wykonaj obliczenia ponownie.
        </Alert>
        <Button 
          variant="contained" 
          startIcon={<ArrowBackIcon />} 
          onClick={handleBackToCalculator}
        >
          Wróć do kalkulatora
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ px: { xs: 3, sm: 5 }, py: 5 }}>
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToCalculator}
          variant="outlined"
          sx={{ mb: 2 }}
        >
          Powrót do kalkulatora
        </Button>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: 700 }}
          >
            Analiza Refinansowania Kredytu
          </Typography>
        </Box>
        <Typography
          variant="subtitle1"
          sx={{ color: 'text.secondary' }}
        >
          Szczegółowe porównanie wyników dla różnych scenariuszy refinansowania Twojego kredytu.
        </Typography>
      </Box>

      <Paper 
        elevation={0} 
        sx={{ 
          border: `1px solid ${theme.palette.divider}`, 
          borderRadius: 2,
          overflow: 'hidden',
          mb: 4,
          mx: { xs: 1, sm: 2 }
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={mainTab}
            onChange={handleMainTabChange}
            aria-label="refinance results tabs"
            variant="fullWidth"
            sx={{
              backgroundColor: theme.palette.background.default,
              '& .MuiTab-root': {
                py: 2,
              },
            }}
          >
            <Tab 
              icon={<ViewListIcon />} 
              iconPosition="start" 
              label="Podsumowanie" 
              id="tab-0" 
              aria-controls="tabpanel-0" 
            />
            <Tab 
              icon={<BarChartIcon />} 
              iconPosition="start" 
              label="Wizualizacje" 
              id="tab-1" 
              aria-controls="tabpanel-1" 
            />
            <Tab 
              icon={<TimelineIcon />} 
              iconPosition="start" 
              label="Harmonogramy" 
              id="tab-2" 
              aria-controls="tabpanel-2" 
            />
          </Tabs>
        </Box>

        <TabPanel value={mainTab} index={0}>
          <Box>
            {/* Karty wariantów */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                gap: 3,
                mt: 2,
                mb: 4,
                mx: { xs: 1, sm: 2 }
              }}
              id="summary-section"
            >
              {/* Wariant A */}
              <Paper
                elevation={2}
                sx={{
                  borderRadius: 2,
                  overflow: 'hidden',
                  transition: 'transform 0.2s',
                  m: 0.5
                }}
              >
                <Box
                  sx={{
                    p: 2,
                    bgcolor: theme.palette.grey[100],
                    borderBottom: `1px solid ${theme.palette.divider}`
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600, textAlign: 'center' }}>
                    Obecny kredyt
                  </Typography>
                </Box>
                <Box sx={{ p: 3 }}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Miesięczna rata
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {formatCurrency(resultData.variantA.comparison.monthlyInstallment)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Pozostały okres
                    </Typography>
                    <Typography variant="h6">
                      {formatPeriod(resultData.variantA.comparison.loanTermMonths)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Całkowity koszt kredytu
                    </Typography>
                    <Typography variant="h6">
                      {formatCurrency(resultData.variantA.comparison.totalAmount)}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Całkowity koszt odsetek
                    </Typography>
                    <Typography variant="h6">
                      {formatCurrency(resultData.variantA.comparison.totalInterest)}
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Wariant B */}
              <Paper
                elevation={3}
                sx={{
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: `2px solid ${(resultData.variantB.comparison.totalBenefit || 0) > (resultData.variantC.comparison.totalBenefit || 0) ? theme.palette.primary.main : theme.palette.divider}`,
                  boxShadow: (resultData.variantB.comparison.totalBenefit || 0) > (resultData.variantC.comparison.totalBenefit || 0) ? `0 0 15px ${theme.palette.primary.light}` : undefined,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: `0 8px 16px rgba(0, 0, 0, 0.1)`
                  }
                }}
              >
                <Box
                  sx={{
                    p: 2,
                    bgcolor: theme.palette.primary.light,
                    borderBottom: `1px solid ${theme.palette.divider}`
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600, textAlign: 'center', color: theme.palette.primary.dark }}>
                    Refinansowanie z niższą ratą
                  </Typography>
                </Box>
                <Box sx={{ p: 3 }}>
                  <Box 
                    sx={{ 
                      mb: 3, 
                      p: 2, 
                      bgcolor: (resultData.variantB.comparison.totalBenefit || 0) > 0 ? theme.palette.success.light : theme.palette.error.light,
                      borderRadius: 2,
                      textAlign: 'center'
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Całkowita oszczędność
                    </Typography>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontWeight: 700, 
                        color: (resultData.variantB.comparison.totalBenefit || 0) > 0 ? '#006400' : theme.palette.error.dark 
                      }}
                    >
                      {formatCurrency(resultData.variantB.comparison.totalBenefit || 0)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Nowa miesięczna rata
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {formatCurrency(resultData.variantB.comparison.monthlyInstallment)}
                      </Typography>
                      {resultData.variantA.comparison.monthlyInstallment > resultData.variantB.comparison.monthlyInstallment && (
                        <Chip 
                          size="small" 
                          color="success" 
                          label={`-${formatCurrency(resultData.variantA.comparison.monthlyInstallment - resultData.variantB.comparison.monthlyInstallment)}`} 
                        />
                      )}
                    </Box>
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Okres kredytowania
                    </Typography>
                    <Typography variant="h6">
                      {formatPeriod(resultData.variantB.comparison.loanTermMonths)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Okres zwrotu kosztów
                    </Typography>
                    <Typography variant="h6">
                      {formatPeriod(resultData.variantB.comparison.paybackPeriodMonths || 0)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Koszty refinansowania
                      </Typography>
                      <Typography variant="body1" color="text.primary">
                        {formatCurrency(resultData.variantB.comparison.refinancingCosts || 0)}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Zwrot prowizji
                      </Typography>
                      <Typography variant="body1" color="text.primary">
                        {formatCurrency(resultData.variantB.comparison.commissionRefund || 0)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Paper>

              {/* Wariant C */}
              <Paper
                elevation={3}
                sx={{
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: `2px solid ${(resultData.variantC.comparison.totalBenefit || 0) > (resultData.variantB.comparison.totalBenefit || 0) ? theme.palette.secondary.main : theme.palette.divider}`,
                  boxShadow: (resultData.variantC.comparison.totalBenefit || 0) > (resultData.variantB.comparison.totalBenefit || 0) ? `0 0 15px ${theme.palette.secondary.light}` : undefined,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: `0 8px 16px rgba(0, 0, 0, 0.1)`
                  }
                }}
              >
                <Box
                  sx={{
                    p: 2,
                    bgcolor: theme.palette.secondary.light,
                    borderBottom: `1px solid ${theme.palette.divider}`
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600, textAlign: 'center', color: theme.palette.secondary.dark }}>
                    Refinansowanie z krótszym okresem
                  </Typography>
                </Box>
                <Box sx={{ p: 3 }}>
                  <Box 
                    sx={{ 
                      mb: 3, 
                      p: 2, 
                      bgcolor: (resultData.variantC.comparison.totalBenefit || 0) > 0 ? theme.palette.success.light : theme.palette.error.light,
                      borderRadius: 2,
                      textAlign: 'center'
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Całkowita oszczędność
                    </Typography>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontWeight: 700, 
                        color: (resultData.variantC.comparison.totalBenefit || 0) > 0 ? '#006400' : theme.palette.error.dark 
                      }}
                    >
                      {formatCurrency(resultData.variantC.comparison.totalBenefit || 0)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Nowa miesięczna rata
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {formatCurrency(resultData.variantC.comparison.monthlyInstallment)}
                      </Typography>
                      {resultData.variantA.comparison.monthlyInstallment !== resultData.variantC.comparison.monthlyInstallment && (
                        <Chip 
                          size="small" 
                          color={resultData.variantA.comparison.monthlyInstallment > resultData.variantC.comparison.monthlyInstallment ? "success" : "error"} 
                          label={resultData.variantA.comparison.monthlyInstallment > resultData.variantC.comparison.monthlyInstallment 
                            ? `-${formatCurrency(resultData.variantA.comparison.monthlyInstallment - resultData.variantC.comparison.monthlyInstallment)}`
                            : `+${formatCurrency(resultData.variantC.comparison.monthlyInstallment - resultData.variantA.comparison.monthlyInstallment)}`} 
                        />
                      )}
                    </Box>
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Skrócony okres kredytowania
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6">
                        {formatPeriod(resultData.variantC.comparison.loanTermMonths)}
                      </Typography>
                      {resultData.variantA.comparison.loanTermMonths > resultData.variantC.comparison.loanTermMonths && (
                        <Chip 
                          size="small" 
                          color="success" 
                          label={`-${formatPeriod(resultData.variantA.comparison.loanTermMonths - resultData.variantC.comparison.loanTermMonths)}`} 
                        />
                      )}
                    </Box>
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Okres zwrotu kosztów
                    </Typography>
                    <Typography variant="h6">
                      {formatPeriod(resultData.variantC.comparison.paybackPeriodMonths || 0)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Koszty refinansowania
                      </Typography>
                      <Typography variant="body1" color="text.primary">
                        {formatCurrency(resultData.variantC.comparison.refinancingCosts || 0)}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Zwrot prowizji
                      </Typography>
                      <Typography variant="body1" color="text.primary">
                        {formatCurrency(resultData.variantC.comparison.commissionRefund || 0)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </Box>

            {/* Porównanie wizualne */}
            <Box sx={{ mt: 5, mb: 4, mx: { xs: 1, sm: 2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Szczegółowe porównanie opcji
                </Typography>
                <Button
                  variant="contained"
                  startIcon={isGeneratingPDF ? <CircularProgress size={20} color="inherit" /> : <GetAppIcon />}
                  onClick={handleGeneratePDF}
                  disabled={isGeneratingPDF}
                  color="secondary"
                >
                  {isGeneratingPDF ? 'Generowanie...' : 'Pobierz raport PDF'}
                </Button>
              </Box>
              
              <TableContainer 
                component={Paper} 
                sx={{ 
                  borderRadius: 2, 
                  my: 4,
                  mx: 0,
                  overflow: 'hidden'
                }}
                id="variant-comparison-table"
              >
                <Table sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow sx={{ '& th': { fontWeight: 'bold', bgcolor: theme.palette.background.default } }}>
                      <TableCell>Parametr</TableCell>
                      <TableCell align="center">
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          Obecny kredyt
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          Refinansowanie z niższą ratą
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          Refinansowanie z krótszym okresem
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {/* Miesięczna rata */}
                    <TableRow>
                      <TableCell component="th" scope="row">
                        Miesięczna rata kredytu
                      </TableCell>
                      <TableCell align="center">{formatCurrency(resultData.variantA.comparison.monthlyInstallment)}</TableCell>
                      <TableCell align="center">
                        {formatCurrency(resultData.variantB.comparison.monthlyInstallment)}
                        <Chip 
                          label={`${((resultData.variantB.comparison.monthlyInstallment - resultData.variantA.comparison.monthlyInstallment) / resultData.variantA.comparison.monthlyInstallment * 100).toFixed(2)}%`}
                          color="success"
                          size="small" 
                          variant="outlined"
                          sx={{ ml: 1 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        {formatCurrency(resultData.variantC.comparison.monthlyInstallment)}
                        <Chip 
                          label={`${((resultData.variantC.comparison.monthlyInstallment - resultData.variantA.comparison.monthlyInstallment) / resultData.variantA.comparison.monthlyInstallment * 100).toFixed(2)}%`}
                          color={resultData.variantC.comparison.monthlyInstallment > resultData.variantA.comparison.monthlyInstallment ? "error" : "success"}
                          size="small"
                          variant="outlined"
                          sx={{ ml: 1 }}
                        />
                      </TableCell>
                    </TableRow>
                    
                    {/* Okres kredytowania */}
                    <TableRow>
                      <TableCell component="th" scope="row">
                        Okres spłaty kredytu
                      </TableCell>
                      <TableCell align="center">{formatPeriod(resultData.variantA.comparison.loanTermMonths)}</TableCell>
                      <TableCell align="center">{formatPeriod(resultData.variantB.comparison.loanTermMonths)}</TableCell>
                      <TableCell align="center">
                        {formatPeriod(resultData.variantC.comparison.loanTermMonths)}
                        <Chip 
                          label={`-${formatPeriod(resultData.variantA.comparison.loanTermMonths - resultData.variantC.comparison.loanTermMonths)}`}
                          color="success"
                          size="small" 
                          variant="outlined"
                          sx={{ ml: 1 }}
                        />
                      </TableCell>
                    </TableRow>

                    {/* Całkowita kwota do spłaty */}
                    <TableRow>
                      <TableCell component="th" scope="row">
                        Całkowita kwota do spłaty
                      </TableCell>
                      <TableCell align="center">{formatCurrency(resultData.variantA.comparison.totalAmount)}</TableCell>
                      <TableCell align="center">
                        {formatCurrency(resultData.variantB.comparison.totalAmount)}
                        <Chip 
                          label={`${((resultData.variantB.comparison.totalAmount - resultData.variantA.comparison.totalAmount) / resultData.variantA.comparison.totalAmount * 100).toFixed(2)}%`}
                          color={(resultData.variantB.comparison.totalAmount < resultData.variantA.comparison.totalAmount) ? "success" : "error"}
                          size="small"
                          variant="outlined"
                          sx={{ ml: 1 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        {formatCurrency(resultData.variantC.comparison.totalAmount)}
                        <Chip 
                          label={`${((resultData.variantC.comparison.totalAmount - resultData.variantA.comparison.totalAmount) / resultData.variantA.comparison.totalAmount * 100).toFixed(2)}%`}
                          color={(resultData.variantC.comparison.totalAmount < resultData.variantA.comparison.totalAmount) ? "success" : "error"}
                          size="small"
                          variant="outlined"
                          sx={{ ml: 1 }}
                        />
                      </TableCell>
                    </TableRow>
                    
                    {/* Łączna suma odsetek */}
                    <TableRow>
                      <TableCell component="th" scope="row">
                        Łączna suma zapłaconych odsetek
                      </TableCell>
                      <TableCell align="center">{formatCurrency(resultData.variantA.comparison.totalInterest)}</TableCell>
                      <TableCell align="center">
                        {formatCurrency(resultData.variantB.comparison.totalInterest)}
                        <Chip 
                          label={`${((resultData.variantB.comparison.totalInterest - resultData.variantA.comparison.totalInterest) / resultData.variantA.comparison.totalInterest * 100).toFixed(2)}%`}
                          color={(resultData.variantB.comparison.totalInterest < resultData.variantA.comparison.totalInterest) ? "success" : "error"}
                          size="small"
                          variant="outlined"
                          sx={{ ml: 1 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        {formatCurrency(resultData.variantC.comparison.totalInterest)}
                        <Chip 
                          label={`${((resultData.variantC.comparison.totalInterest - resultData.variantA.comparison.totalInterest) / resultData.variantA.comparison.totalInterest * 100).toFixed(2)}%`}
                          color={(resultData.variantC.comparison.totalInterest < resultData.variantA.comparison.totalInterest) ? "success" : "error"}
                          size="small"
                          variant="outlined"
                          sx={{ ml: 1 }}
                        />
                      </TableCell>
                    </TableRow>
                    
                    {/* Zwrot prowizji */}
                    <TableRow>
                      <TableCell component="th" scope="row">
                        Szacowany zwrot prowizji z aktualnego kredytu
                        <Tooltip title="Kwota zwrotu części prowizji proporcjonalnie do okresu, o który został skrócony czas kredytowania poprzez wcześniejszą spłatę">
                          <IconButton size="small">
                            <HelpOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                      <TableCell align="center">-</TableCell>
                      <TableCell align="center">
                        {resultData.variantB.comparison.commissionRefund !== undefined && 
                         resultData.variantB.comparison.commissionRefund > 0 ? 
                         formatCurrency(resultData.variantB.comparison.commissionRefund || 0) : '-'}
                      </TableCell>
                      <TableCell align="center">
                        {resultData.variantC.comparison.commissionRefund !== undefined && 
                         resultData.variantC.comparison.commissionRefund > 0 ? 
                         formatCurrency(resultData.variantC.comparison.commissionRefund || 0) : '-'}
                      </TableCell>
                    </TableRow>

                    {/* Koszty refinansowania */}
                    <TableRow>
                      <TableCell component="th" scope="row">
                        Całkowity koszt operacji refinansowania
                      </TableCell>
                      <TableCell align="center">-</TableCell>
                      <TableCell align="center">
                        {resultData.variantB.comparison.refinancingCosts && 
                         resultData.variantB.comparison.refinancingCosts > 0 ? 
                         formatCurrency(resultData.variantB.comparison.refinancingCosts) : '-'}
                      </TableCell>
                      <TableCell align="center">
                        {resultData.variantC.comparison.refinancingCosts && 
                         resultData.variantC.comparison.refinancingCosts > 0 ? 
                         formatCurrency(resultData.variantC.comparison.refinancingCosts) : '-'}
                      </TableCell>
                    </TableRow>

                    {/* Całkowity zysk/strata */}
                    <TableRow sx={{ '& td, & th': { fontWeight: 'bold', borderTop: `2px solid ${theme.palette.divider}`, bgcolor: (theme.palette.background.default + '80') } }}>
                      <TableCell component="th" scope="row">
                        Całkowity zysk/strata z refinansowania
                      </TableCell>
                      <TableCell align="center">-</TableCell>
                      <TableCell align="center">
                        {formatCurrency(resultData.variantB.comparison.totalBenefit || 0)}
                      </TableCell>
                      <TableCell align="center">
                        {formatCurrency(resultData.variantC.comparison.totalBenefit || 0)}
                      </TableCell>
                    </TableRow>

                    {/* Okres zwrotu kosztów */}
                    <TableRow>
                      <TableCell component="th" scope="row">
                        Okres zwrotu kosztów refinansowania
                      </TableCell>
                      <TableCell align="center">-</TableCell>
                      <TableCell align="center">
                        {resultData.variantB.comparison.paybackPeriodMonths ? formatPeriod(resultData.variantB.comparison.paybackPeriodMonths) : "Natychmiast"}
                      </TableCell>
                      <TableCell align="center">
                        {resultData.variantC.comparison.paybackPeriodMonths ? formatPeriod(resultData.variantC.comparison.paybackPeriodMonths) : "Natychmiast"}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            <Box sx={{ mt: 4, mx: { xs: 1, sm: 2 } }}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3, 
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${theme.palette.success.light}40, ${theme.palette.success.light}20)`,
                  border: `1px solid ${theme.palette.success.light}`,
                  m: 0.5
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.success.dark }}>
                    Refinansowanie Twojego kredytu jest opłacalne
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    p: 2, 
                    bgcolor: 'rgba(255, 255, 255, 0.7)', 
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.primary.light}`
                  }}>
                    <Box sx={{ 
                      width: 32, 
                      height: 32, 
                      borderRadius: '50%', 
                      bgcolor: theme.palette.primary.main, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      mr: 2,
                      flexShrink: 0
                    }}>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: 'white' }}>1</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: theme.palette.primary.dark }}>
                        Niższa rata miesięczna
                      </Typography>
                      <Typography variant="body1" color="text.primary">
                        Refinansowanie z niższą ratą pozwala obniżyć miesięczną ratę o <strong>{formatCurrency(resultData.variantA.comparison.monthlyInstallment - resultData.variantB.comparison.monthlyInstallment)}</strong> i zaoszczędzić łącznie <strong>{formatCurrency(resultData.variantB.comparison.totalBenefit || 0)}</strong>.
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    p: 2, 
                    bgcolor: 'rgba(255, 255, 255, 0.7)', 
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.secondary.light}`
                  }}>
                    <Box sx={{ 
                      width: 32, 
                      height: 32, 
                      borderRadius: '50%', 
                      bgcolor: theme.palette.secondary.main, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      mr: 2,
                      flexShrink: 0
                    }}>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: 'white' }}>2</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: theme.palette.secondary.dark }}>
                        Krótszy okres kredytowania
                      </Typography>
                      <Typography variant="body1" color="text.primary">
                        Refinansowanie z krótszym okresem umożliwia skrócenie okresu kredytowania o <strong>{formatPeriod(resultData.variantA.comparison.loanTermMonths - resultData.variantC.comparison.loanTermMonths)}</strong> przy podobnej racie, z oszczędnością <strong>{formatCurrency(resultData.variantC.comparison.totalBenefit || 0)}</strong>.
                      </Typography>
                    </Box>
                  </Box>
                  
                  {(!resultData.variantB.comparison.refinancingCosts || resultData.variantB.comparison.refinancingCosts === 0) && (
                    <Alert severity="info" variant="outlined" sx={{ mt: 1 }}>
                      <AlertTitle>Uwaga</AlertTitle>
                      Powyższe wyliczenia nie uwzględniają kosztów refinansowania (prowizje, opłaty itp.).
                      Aby otrzymać dokładniejsze wyniki, wprowadź parametry zaawansowane w kalkulatorze.
                    </Alert>
                  )}
                </Box>
                
                <Box sx={{ 
                  mt: 3, 
                  fontSize: '0.875rem', 
                  fontStyle: 'italic', 
                  color: theme.palette.text.secondary 
                }}>
                  Wyniki oparte są na precyzyjnej metodzie dziennego naliczania odsetek, 
                  co zapewnia większą dokładność niż standardowe kalkulatory kredytowe.
                </Box>
              </Paper>

              {resultData.variantB.comparison.commissionRefund !== undefined && 
                resultData.variantB.comparison.commissionRefund > 0 && (
                <Alert 
                  severity="info" 
                  variant="outlined"
                  sx={{ 
                    mt: 2,
                    '& .MuiAlert-icon': {
                      alignItems: 'flex-start',
                      pt: 1
                    }
                  }}
                >
                  <AlertTitle>Zwrot prowizji bankowej</AlertTitle>
                  <Typography variant="body1">
                    Refinansowanie uwzględnia szacunkowy zwrot prowizji w kwocie <strong>{formatCurrency(resultData.variantB.comparison.commissionRefund || 0)}</strong> z tytułu wcześniejszej spłaty kredytu.
                  </Typography>
                  {resultData.input.advanced.originalCommission?.value ? (
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      Jest to około <strong>{(((resultData.variantB.comparison.commissionRefund || 0) / resultData.input.advanced.originalCommission.value) * 100).toFixed(1)}%</strong> pierwotnie zapłaconej prowizji, za niewykorzystany okres kredytowania.
                    </Typography>
                  ) : (
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      Zwrot dotyczy niewykorzystanego okresu kredytowania.
                    </Typography>
                  )}
                </Alert>
              )}
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={mainTab} index={1}>
          <Box id="charts-section">
            {/* Total costs */}
            <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 2, px: { xs: 2, sm: 3 } }}>
              Porównanie całkowitych kosztów
            </Typography>
            <TotalCostsChart resultData={resultData} />
            
            {/* Balance Over Time */}
            <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 2, px: { xs: 2, sm: 3 } }}>
              Saldo zadłużenia w czasie
            </Typography>
            <BalanceOverTimeChart resultData={resultData} />
            
            {/* Monthly Installment */}
            <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 2, px: { xs: 2, sm: 3 } }}>
              Porównanie wysokości miesięcznych rat
            </Typography>
            <MonthlyInstallmentChart resultData={resultData} />
          </Box>
        </TabPanel>

        <TabPanel value={mainTab} index={2}>
          <Box sx={{ p: { xs: 2, md: 3 } }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs
                value={scheduleTab}
                onChange={handleScheduleTabChange}
                aria-label="harmongram tabs"
                indicatorColor="secondary"
                textColor="secondary"
              >
                <Tab label="Obecny kredyt" id="schedule-tab-0" />
                <Tab label="Refinansowanie z niższą ratą" id="schedule-tab-1" />
                <Tab label="Refinansowanie z krótszym okresem" id="schedule-tab-2" />
              </Tabs>
            </Box>

            {hasDailyCalculation && (
              <Alert severity="info" sx={{ mb: 3 }}>
                Raty zostały wyliczone z zastosowaniem dziennego naliczania odsetek, co daje dokładniejsze wyniki. 
                Odsetki naliczane są codziennie w oparciu o aktualne saldo kredytu i rzeczywistą liczbę dni w miesiącu.
              </Alert>
            )}

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Data płatności</TableCell>
                    <TableCell align="right">Nr raty</TableCell>
                    <TableCell align="right">Rata</TableCell>
                    <TableCell align="right">Kapitał</TableCell>
                    <TableCell align="right">Odsetki</TableCell>
                    {hasDailyCalculation && (
                      <TableCell align="right">Dni w okresie</TableCell>
                    )}
                    <TableCell align="right">Saldo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {scheduleTab === 0 && resultData.variantA.schedule.map((row: RefinanceInstallment) => (
                    <TableRow key={row.installmentNumber}>
                      <TableCell>{new Date(row.date).toLocaleDateString('pl-PL')}</TableCell>
                      <TableCell align="right">{row.installmentNumber}</TableCell>
                      <TableCell align="right">{formatCurrency(row.amount)}</TableCell>
                      <TableCell align="right">{formatCurrency(row.principal)}</TableCell>
                      <TableCell align="right">{formatCurrency(row.interest)}</TableCell>
                      {hasDailyCalculation && (
                        <TableCell align="right">{row.daysInPeriod ? formatDays(row.daysInPeriod) : '—'}</TableCell>
                      )}
                      <TableCell align="right">{formatCurrency(row.remainingBalance)}</TableCell>
                    </TableRow>
                  ))}
                  {scheduleTab === 1 && resultData.variantB.schedule.map((row: RefinanceInstallment) => (
                    <TableRow key={row.installmentNumber}>
                      <TableCell>{new Date(row.date).toLocaleDateString('pl-PL')}</TableCell>
                      <TableCell align="right">{row.installmentNumber}</TableCell>
                      <TableCell align="right">{formatCurrency(row.amount)}</TableCell>
                      <TableCell align="right">{formatCurrency(row.principal)}</TableCell>
                      <TableCell align="right">{formatCurrency(row.interest)}</TableCell>
                      {hasDailyCalculation && (
                        <TableCell align="right">{row.daysInPeriod ? formatDays(row.daysInPeriod) : '—'}</TableCell>
                      )}
                      <TableCell align="right">{formatCurrency(row.remainingBalance)}</TableCell>
                    </TableRow>
                  ))}
                  {scheduleTab === 2 && resultData.variantC.schedule.map((row: RefinanceInstallment) => (
                    <TableRow key={row.installmentNumber}>
                      <TableCell>{new Date(row.date).toLocaleDateString('pl-PL')}</TableCell>
                      <TableCell align="right">{row.installmentNumber}</TableCell>
                      <TableCell align="right">{formatCurrency(row.amount)}</TableCell>
                      <TableCell align="right">{formatCurrency(row.principal)}</TableCell>
                      <TableCell align="right">{formatCurrency(row.interest)}</TableCell>
                      {hasDailyCalculation && (
                        <TableCell align="right">{row.daysInPeriod ? formatDays(row.daysInPeriod) : '—'}</TableCell>
                      )}
                      <TableCell align="right">{formatCurrency(row.remainingBalance)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default RefinanceResults; 