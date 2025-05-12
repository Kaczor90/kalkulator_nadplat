import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  useTheme,
  useMediaQuery,
  Divider,
  Collapse,
  IconButton,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import SavingsIcon from '@mui/icons-material/Savings';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { pl } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import RefinanceBasicForm from './RefinanceBasicForm';
import RefinanceAdvancedForm from './RefinanceAdvancedForm';
import { RefinanceBasicInput, RefinanceAdvancedInput, RefinanceParams } from '../../interfaces/refinance';
import { useCalculateRefinanceMutation } from '../../store/api';

const RefinanceCalculator: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [calculateRefinance, { isLoading }] = useCalculateRefinanceMutation();
  const [activeStep, setActiveStep] = useState(0);

  // Default basic input values
  const [basicInput, setBasicInput] = useState<RefinanceBasicInput>({
    currentLoanBalance: 300000,
    currentRemainingPeriod: { years: 20, months: 0 },
    currentInterestRate: 7.5,
    newInterestRate: 6.5,
  });

  // Default advanced input values
  const [advancedInput, setAdvancedInput] = useState<RefinanceAdvancedInput>({
    currentInstallmentType: 'equal',
    refinanceDate: new Date(),
    newLoanAmount: 300000,
    newLoanTerm: { years: 20, months: 0 },
    newInstallmentType: 'equal',
    newLoanCommission: { type: 'percentage', value: 0 },
    earlyRepaymentFee: { type: 'percentage', value: 0 },
    installmentDayOfMonth: new Date().getDate(),
  });

  const handleBasicInputChange = (name: string, value: any) => {
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      if (parent === 'currentRemainingPeriod') {
        setBasicInput({
          ...basicInput,
          currentRemainingPeriod: {
            ...basicInput.currentRemainingPeriod,
            [child]: value,
          },
        });
      }
    } else {
      setBasicInput({
        ...basicInput,
        [name]: value,
      });
    }

    // Sync values that should be the same in basic and advanced inputs
    if (name === 'currentLoanBalance') {
      setAdvancedInput({
        ...advancedInput,
        newLoanAmount: value,
      });
    } else if (name.includes('currentRemainingPeriod')) {
      const [, child] = name.split('.');
      setAdvancedInput({
        ...advancedInput,
        newLoanTerm: {
          ...advancedInput.newLoanTerm,
          [child]: value,
        },
      });
    }
  };

  const handleAdvancedInputChange = (name: string, value: any) => {
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      if (parent === 'newLoanTerm') {
        setAdvancedInput({
          ...advancedInput,
          newLoanTerm: {
            ...advancedInput.newLoanTerm,
            [child]: value,
          },
        });
      } else if (parent === 'originalCommission') {
        setAdvancedInput({
          ...advancedInput,
          originalCommission: {
            ...advancedInput.originalCommission || { type: 'amount', value: 0 },
            [child]: value,
          },
        });
      } else if (parent === 'newLoanCommission') {
        setAdvancedInput({
          ...advancedInput,
          newLoanCommission: {
            ...advancedInput.newLoanCommission,
            [child]: value,
          },
        });
      } else if (parent === 'earlyRepaymentFee') {
        setAdvancedInput({
          ...advancedInput,
          earlyRepaymentFee: {
            ...advancedInput.earlyRepaymentFee,
            [child]: value,
          },
        });
      }
    } else {
      setAdvancedInput({
        ...advancedInput,
        [name]: value,
      });
    }
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleCalculate = async () => {
    try {
      const params: RefinanceParams = {
        refinanceInput: {
          basic: basicInput,
          advanced: advancedInput,
        },
      };

      console.log('Wysyłam żądanie obliczenia refinansowania z parametrami:', JSON.stringify(params));
      
      // Use the real API endpoint
      const result = await calculateRefinance(params).unwrap();
      
      console.log('Otrzymano wynik refinansowania:', result);
      
      if (result.id) {
        navigate(`/refinance-results/${result.id}`);
      } else {
        console.error('Brak ID w odpowiedzi API');
        alert('Wystąpił błąd podczas przetwarzania odpowiedzi. Spróbuj ponownie później.');
      }
    } catch (error) {
      console.error('Failed to calculate refinancing:', error);
      
      // Use local calculation as fallback
      console.log('Switching to local calculation as fallback');
      const queryParams = new URLSearchParams();
      
      // Add basic parameters to query string
      queryParams.append('currentLoanBalance', basicInput.currentLoanBalance.toString());
      queryParams.append('currentRemainingYears', basicInput.currentRemainingPeriod.years.toString());
      queryParams.append('currentRemainingMonths', basicInput.currentRemainingPeriod.months.toString());
      queryParams.append('currentInterestRate', basicInput.currentInterestRate.toString());
      queryParams.append('newInterestRate', basicInput.newInterestRate.toString());
      
      // Add advanced parameters to query string
      if (activeStep === 1) {
        queryParams.append('currentInstallmentType', advancedInput.currentInstallmentType);
        queryParams.append('refinanceDate', advancedInput.refinanceDate.toISOString());
        queryParams.append('newLoanAmount', advancedInput.newLoanAmount.toString());
        queryParams.append('newLoanTermYears', advancedInput.newLoanTerm.years.toString());
        queryParams.append('newLoanTermMonths', advancedInput.newLoanTerm.months.toString());
        queryParams.append('newInstallmentType', advancedInput.newInstallmentType);
        queryParams.append('newLoanCommissionType', advancedInput.newLoanCommission.type);
        queryParams.append('newLoanCommissionValue', advancedInput.newLoanCommission.value.toString());
        queryParams.append('earlyRepaymentFeeType', advancedInput.earlyRepaymentFee.type);
        queryParams.append('earlyRepaymentFeeValue', advancedInput.earlyRepaymentFee.value.toString());
        if (advancedInput.otherCosts !== undefined) {
          queryParams.append('otherCosts', advancedInput.otherCosts.toString());
        }
        if (advancedInput.originalLoanAmount !== undefined) {
          queryParams.append('originalLoanAmount', advancedInput.originalLoanAmount.toString());
        }
        if (advancedInput.startDate !== undefined) {
          queryParams.append('startDate', advancedInput.startDate.toISOString());
        }
        if (advancedInput.originalCommission !== undefined) {
          queryParams.append('originalCommissionType', advancedInput.originalCommission.type);
          queryParams.append('originalCommissionValue', advancedInput.originalCommission.value.toString());
        }
        if (advancedInput.currentMonthlyInstallment !== undefined) {
          queryParams.append('currentMonthlyInstallment', advancedInput.currentMonthlyInstallment.toString());
        }
        if (advancedInput.installmentDayOfMonth !== undefined) {
          queryParams.append('installmentDayOfMonth', advancedInput.installmentDayOfMonth.toString());
        }
      }
      
      // Redirect to local calculation results
      navigate(`/refinance-results/local?${queryParams.toString()}`);
    }
  };

  // Add a direct local calculation option
  const handleLocalCalculate = () => {
    const queryParams = new URLSearchParams();
    
    // Add basic parameters to query string
    queryParams.append('currentLoanBalance', basicInput.currentLoanBalance.toString());
    queryParams.append('currentRemainingYears', basicInput.currentRemainingPeriod.years.toString());
    queryParams.append('currentRemainingMonths', basicInput.currentRemainingPeriod.months.toString());
    queryParams.append('currentInterestRate', basicInput.currentInterestRate.toString());
    queryParams.append('newInterestRate', basicInput.newInterestRate.toString());
    
    // Add advanced parameters to query string
    if (activeStep === 1) {
      queryParams.append('currentInstallmentType', advancedInput.currentInstallmentType);
      queryParams.append('refinanceDate', advancedInput.refinanceDate.toISOString());
      queryParams.append('newLoanAmount', advancedInput.newLoanAmount.toString());
      queryParams.append('newLoanTermYears', advancedInput.newLoanTerm.years.toString());
      queryParams.append('newLoanTermMonths', advancedInput.newLoanTerm.months.toString());
      queryParams.append('newInstallmentType', advancedInput.newInstallmentType);
      queryParams.append('newLoanCommissionType', advancedInput.newLoanCommission.type);
      queryParams.append('newLoanCommissionValue', advancedInput.newLoanCommission.value.toString());
      queryParams.append('earlyRepaymentFeeType', advancedInput.earlyRepaymentFee.type);
      queryParams.append('earlyRepaymentFeeValue', advancedInput.earlyRepaymentFee.value.toString());
      if (advancedInput.otherCosts !== undefined) {
        queryParams.append('otherCosts', advancedInput.otherCosts.toString());
      }
      if (advancedInput.originalLoanAmount !== undefined) {
        queryParams.append('originalLoanAmount', advancedInput.originalLoanAmount.toString());
      }
      if (advancedInput.startDate !== undefined) {
        queryParams.append('startDate', advancedInput.startDate.toISOString());
      }
      if (advancedInput.originalCommission !== undefined) {
        queryParams.append('originalCommissionType', advancedInput.originalCommission.type);
        queryParams.append('originalCommissionValue', advancedInput.originalCommission.value.toString());
      }
      if (advancedInput.currentMonthlyInstallment !== undefined) {
        queryParams.append('currentMonthlyInstallment', advancedInput.currentMonthlyInstallment.toString());
      }
      if (advancedInput.installmentDayOfMonth !== undefined) {
        queryParams.append('installmentDayOfMonth', advancedInput.installmentDayOfMonth.toString());
      }
    }
    
    // Redirect to local calculation results
    navigate(`/refinance-results/local?${queryParams.toString()}`);
  };

  // Define steps for the stepper
  const steps = [
    'Parametry podstawowe',
    'Parametry zaawansowane'
  ];

  // Calculate estimated savings (basic version for visual feedback)
  const estimatedMonthlySavings = () => {
    const currentMonthlyRate = basicInput.currentInterestRate / 100 / 12;
    const newMonthlyRate = basicInput.newInterestRate / 100 / 12;
    
    const totalMonths = basicInput.currentRemainingPeriod.years * 12 + basicInput.currentRemainingPeriod.months;
    
    // Simple monthly payment calculation (approximation)
    const currentMonthlyPayment = 
      (basicInput.currentLoanBalance * currentMonthlyRate * Math.pow(1 + currentMonthlyRate, totalMonths)) / 
      (Math.pow(1 + currentMonthlyRate, totalMonths) - 1);
    
    const newMonthlyPayment = 
      (basicInput.currentLoanBalance * newMonthlyRate * Math.pow(1 + newMonthlyRate, totalMonths)) / 
      (Math.pow(1 + newMonthlyRate, totalMonths) - 1);
    
    return Math.max(0, currentMonthlyPayment - newMonthlyPayment);
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <RefinanceBasicForm basicData={basicInput} onChange={handleBasicInputChange} />
          </Box>
        );
      case 1:
        return (
          <Box>
            <RefinanceAdvancedForm advancedData={advancedInput} onChange={handleAdvancedInputChange} />
          </Box>
        );
      default:
        return null;
    }
  };

  const savings = estimatedMonthlySavings();
  const totalPotentialSavings = savings * (basicInput.currentRemainingPeriod.years * 12 + basicInput.currentRemainingPeriod.months);
  const interestDifference = basicInput.currentInterestRate - basicInput.newInterestRate;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={pl}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* Hero Section with Illustration */}
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 4,
            gap: 3,
            p: 3,
            borderRadius: 3,
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)',
          }}
        >
          <Box sx={{ maxWidth: isMobile ? '100%' : '60%' }}>
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                fontWeight: 800,
                mb: 2,
                background: 'linear-gradient(to right, #2563EB, #10B981)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Kalkulator Refinansowania Kredytu
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Sprawdź ile możesz zaoszczędzić refinansując swój kredyt hipoteczny. 
              Wprowadź podstawowe informacje o swoim obecnym kredycie i porównaj z nowymi warunkami.
            </Typography>
            <Chip 
              icon={<CompareArrowsIcon />} 
              label="Porównaj oferty" 
              color="primary" 
              sx={{ mr: 1, mb: isMobile ? 1 : 0 }} 
            />
            <Chip 
              icon={<SavingsIcon />} 
              label="Oszczędź na ratach" 
              color="secondary" 
            />
          </Box>
          <Box 
            sx={{ 
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <CompareArrowsIcon sx={{ fontSize: 100, color: 'rgba(16, 185, 129, 0.3)' }} />
          </Box>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3 },
            mb: 4,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 3,
          }}
        >
          <Stepper
            activeStep={activeStep}
            alternativeLabel
            sx={{
              mb: 4,
              display: isMobile ? 'none' : 'flex',
            }}
          >
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {isMobile && (
            <Typography
              variant="h6"
              sx={{
                mb: 2,
                fontWeight: 600,
                color: 'primary.main',
              }}
            >
              {steps[activeStep]}
            </Typography>
          )}

          <Box sx={{ mb: 4 }}>{renderStepContent()}</Box>

          {/* Real-time financial summary */}
          {basicInput.currentInterestRate > basicInput.newInterestRate && (
            <Card 
              variant="outlined" 
              sx={{ 
                mb: 4, 
                backgroundColor: 'rgba(16, 185, 129, 0.05)',
                borderColor: theme.palette.secondary.main,
                borderRadius: 2,
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'secondary.main' }}>
                  Potencjalne oszczędności
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  justifyContent: 'space-between',
                  gap: 2 
                }}>
                  <Box sx={{ 
                    flex: '1 1 30%', 
                    minWidth: '140px', 
                    textAlign: 'center',
                    p: 2
                  }}>
                    <TrendingDownIcon color="secondary" sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="subtitle2" color="text.secondary">
                      Różnica stóp
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                      {interestDifference.toFixed(2)}%
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    flex: '1 1 30%', 
                    minWidth: '140px', 
                    textAlign: 'center',
                    p: 2
                  }}>
                    <SavingsIcon color="secondary" sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="subtitle2" color="text.secondary">
                      Miesięcznie
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                      ~{savings.toFixed(0)} PLN
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    flex: '1 1 30%', 
                    minWidth: '140px', 
                    textAlign: 'center',
                    p: 2
                  }}>
                    <CompareArrowsIcon color="secondary" sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="subtitle2" color="text.secondary">
                      Całkowicie
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                      ~{totalPotentialSavings.toFixed(0)} PLN
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}

          <Divider sx={{ my: 3 }} />

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              mt: 2,
            }}
          >
            {activeStep > 0 && (
              <Button
                variant="outlined"
                onClick={handleBack}
                sx={{ minWidth: 100 }}
              >
                Wstecz
              </Button>
            )}

            <Box sx={{ marginLeft: 'auto' }}>
              {activeStep === 0 && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleNext}
                  sx={{
                    minWidth: 140,
                    py: 1.2,
                    mr: 2,
                  }}
                >
                  Parametry Zaawansowane
                </Button>
              )}

              <Button
                variant="contained"
                color="secondary"
                onClick={handleCalculate}
                disabled={isLoading}
                sx={{
                  minWidth: 140,
                  py: 1.2,
                }}
                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
              >
                {isLoading ? 'Obliczanie...' : 'Oblicz i Porównaj'}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </LocalizationProvider>
  );
};

export default RefinanceCalculator; 