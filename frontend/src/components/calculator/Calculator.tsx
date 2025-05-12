import React, { useState } from 'react';
import { 
  Button, 
  Container, 
  Paper, 
  Typography, 
  Box, 
  CircularProgress, 
  Stepper,
  Step,
  StepLabel,
  useTheme,
  useMediaQuery,
  Divider,
  Chip
} from '@mui/material';
import { useCalculateMortgageMutation } from '../../store/api';
import LoanBasicForm from './LoanBasicForm';
import OverpaymentForm from './OverpaymentForm';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { pl } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import PaymentsIcon from '@mui/icons-material/Payments';
import ScheduleIcon from '@mui/icons-material/Schedule';
import SavingsIcon from '@mui/icons-material/Savings';
import {
  CalculationParams,
  CyclicOverpayment,
  InterestRateChange,
  MortgageInput,
  Overpayment,
} from '../../interfaces/mortgage';

const Calculator: React.FC = () => {
  const [calculateMortgage, { isLoading }] = useCalculateMortgageMutation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeStep, setActiveStep] = useState(0);

  // Default mortgage input values
  const [mortgageInput, setMortgageInput] = useState<MortgageInput>({
    loanAmount: 300000,
    interestRate: 7.5,
    loanTerm: { years: 25, months: 0 },
    installmentType: 'equal',
    startDate: new Date(),
    interestRateChanges: [],
  });

  // Overpayment settings
  const [overpayments, setOverpayments] = useState<Overpayment[]>([]);
  const [cyclicOverpayment, setCyclicOverpayment] = useState<CyclicOverpayment | null>(null);
  const [overpaymentEffect, setOverpaymentEffect] = useState<'reduce_period' | 'reduce_installment' | 'progressive_overpayment'>(
    'reduce_period'
  );

  const handleMortgageInputChange = (name: string, value: any) => {
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      if (parent === 'loanTerm') {
        setMortgageInput({
          ...mortgageInput,
          loanTerm: {
            ...mortgageInput.loanTerm,
            [child]: value,
          },
        });
      }
    } else {
      setMortgageInput({
        ...mortgageInput,
        [name]: value,
      });
    }
  };

  const handleAddOverpayment = (overpayment: Overpayment) => {
    setOverpayments([...overpayments, overpayment]);
  };

  const handleRemoveOverpayment = (index: number) => {
    const updatedOverpayments = [...overpayments];
    updatedOverpayments.splice(index, 1);
    setOverpayments(updatedOverpayments);
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleCalculate = async () => {
    try {
      const params: CalculationParams = {
        mortgageInput,
        overpayments: overpayments.length > 0 ? overpayments : undefined,
        cyclicOverpayment: cyclicOverpayment || undefined,
        overpaymentEffect,
      };

      console.log('Wysyłam żądanie obliczenia kredytu z parametrami:', JSON.stringify(params));
      console.log('Typ nadpłaty:', overpaymentEffect);
      console.log('Parametry cyklicznej nadpłaty:', cyclicOverpayment ? JSON.stringify(cyclicOverpayment) : 'BRAK');

      const result = await calculateMortgage(params).unwrap();
      
      if (result.id) {
        navigate(`/results/${result.id}`);
      }
    } catch (error) {
      console.error('Failed to calculate mortgage:', error);
      // You could add a snackbar or other notification here
    }
  };

  // Define steps for the stepper
  const steps = [
    'Podstawowe parametry kredytu',
    'Nadpłaty kredytu'
  ];

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return <LoanBasicForm loanData={mortgageInput} onChange={handleMortgageInputChange} />;
      case 1:
        return (
          <OverpaymentForm
            oneTimeOverpayments={overpayments}
            cyclicOverpayment={cyclicOverpayment}
            overpaymentEffect={overpaymentEffect}
            onAddOneTimeOverpayment={handleAddOverpayment}
            onRemoveOneTimeOverpayment={handleRemoveOverpayment}
            onCyclicOverpaymentChange={setCyclicOverpayment}
            onOverpaymentEffectChange={setOverpaymentEffect}
          />
        );
      default:
        return null;
    }
  };

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
            background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(76, 175, 80, 0.1) 100%)',
          }}
        >
          <Box sx={{ maxWidth: isMobile ? '100%' : '60%' }}>
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                fontWeight: 800,
                mb: 2,
                background: 'linear-gradient(to right, #1976d2, #4caf50)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Kalkulator Nadpłat Kredytu
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Sprawdź jak nadpłaty wpłyną na Twój kredyt hipoteczny. 
              Oblicz oszczędności na odsetkach, skrócenie okresu kredytowania lub zmniejszenie miesięcznej raty.
            </Typography>
            <Chip 
              icon={<ScheduleIcon />} 
              label="Skróć okres kredytowania" 
              color="primary" 
              sx={{ mr: 1, mb: isMobile ? 1 : 0 }} 
            />
            <Chip 
              icon={<SavingsIcon />} 
              label="Oszczędź na odsetkach" 
              color="success" 
            />
          </Box>
          <Box 
            sx={{ 
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <PaymentsIcon sx={{ fontSize: 100, color: 'rgba(76, 175, 80, 0.3)' }} />
          </Box>
        </Box>

        <Paper 
          elevation={0} 
          sx={{ 
            p: { xs: 2, sm: 3 }, 
            mb: 5,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 3,
          }}
        >
          <Typography 
            variant="h6" 
            align="center" 
            sx={{ 
              mb: 4,
              color: 'text.secondary',
              fontWeight: 600
            }}
          >
            Wprowadź dane kredytu i zaplanuj strategię nadpłat
          </Typography>

          <Stepper 
            activeStep={activeStep} 
            alternativeLabel 
            sx={{ 
              mb: 4,
              display: isMobile ? 'none' : 'flex'
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
                color: 'primary.main'
              }}
            >
              {steps[activeStep]}
            </Typography>
          )}

          <Box sx={{ mb: 4 }}>
            {renderStepContent()}
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              mt: 2 
            }}
          >
            <Button
              variant="outlined"
              onClick={handleBack}
              disabled={activeStep === 0}
              sx={{ minWidth: 100 }}
            >
              Wstecz
            </Button>
            
            {activeStep < steps.length - 1 ? (
              <Button
                variant="contained"
                color="primary"
                onClick={handleNext}
                sx={{ minWidth: 100, fontWeight: 600 }}
              >
                Dalej
              </Button>
            ) : (
              <Button
                variant="contained"
                color="success"
                onClick={handleCalculate}
                disabled={isLoading}
                sx={{ 
                  minWidth: 140,
                  py: 1.2,
                  fontWeight: 600
                }}
                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
              >
                {isLoading ? 'Obliczanie...' : 'Oblicz i Porównaj'}
              </Button>
            )}
          </Box>
        </Paper>
      </Container>
    </LocalizationProvider>
  );
};

export default Calculator; 