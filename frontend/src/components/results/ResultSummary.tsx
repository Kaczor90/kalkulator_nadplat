import React from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Divider,
  Alert,
  useTheme,
  useMediaQuery,
  Stack,
  Chip
} from '@mui/material';
import { CalculationResult } from '../../interfaces/mortgage';
import SavingsIcon from '@mui/icons-material/Savings';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PaymentsIcon from '@mui/icons-material/Payments';

interface Props {
  result: CalculationResult;
  overpaymentEffect?: 'reduce_period' | 'reduce_installment' | 'progressive_overpayment';
  mortgageInput?: {
    loanAmount: number;
    interestRate: number;
  };
}

const ResultSummary: React.FC<Props> = ({ result, overpaymentEffect, mortgageInput }) => {
  const { baseScenario, overpaymentScenario, savings } = result;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  console.log('ResultSummary - mortgageInput:', mortgageInput);

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('pl-PL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatPercentage = (value: number, total: number) => {
    const percentage = (value / total) * 100;
    return percentage.toLocaleString('pl-PL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + '%';
  };

  const formatTerm = (years: number, months: number) => {
    return `${years} lat ${months > 0 ? `${months} mies.` : ''}`;
  };

  return (
    <>
      <Box sx={{ mb: 3, px: { xs: 1, sm: 2 } }}>
        <Typography 
          variant="h5" 
          sx={{ 
            fontWeight: 600, 
            color: 'text.primary',
            mb: 1
          }}
        >
          Podsumowanie kalkulacji
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Zestawienie wyników dla wariantu standardowego i wariantu z nadpłatami
        </Typography>
      </Box>

      {/* Basic Loan Information */}
      {mortgageInput && (
        <Card
          elevation={0}
          sx={{
            mb: 4,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 3,
          }}
        >
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PaymentsIcon sx={{ color: theme.palette.info.main, mr: 1.5 }} />
              <Typography
                variant="h6"
                component="h3"
                sx={{
                  fontWeight: 600,
                  color: 'text.primary',
                }}
              >
                Podstawowe informacje o kredycie
              </Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={4}
              divider={<Divider orientation="vertical" flexItem />}
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Kwota kredytu
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                  }}
                >
                  {formatAmount(mortgageInput.loanAmount)} PLN
                </Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Oprocentowanie nominalne
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                  }}
                >
                  {mortgageInput.interestRate.toLocaleString('pl-PL', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}%
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Comparison Cards */}
      <Stack 
        direction={{ xs: 'column', md: 'row' }}
        spacing={3}
        sx={{ mb: 4, px: { xs: 0.5, sm: 1 } }}
      >
        {/* Base Scenario Card */}
        <Box sx={{ flex: 1 }}>
          <Card 
            elevation={0} 
            sx={{ 
              height: '100%',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
            }}
          >
            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
              <Typography 
                variant="h6" 
                gutterBottom 
                sx={{ 
                  fontWeight: 600,
                  color: 'text.primary',
                  mb: 2,
                }}
              >
                Wariant bez nadpłat
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Stack spacing={3}>
                <Stack 
                  direction={{ xs: 'column', sm: 'row' }} 
                  spacing={3}
                  sx={{ width: '100%' }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Łączna kwota do spłaty
                  </Typography>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600
                      }}
                    >
                    {formatAmount(baseScenario.summary.totalPayment)} PLN
                  </Typography>
                </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Suma odsetek
                  </Typography>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600
                      }}
                    >
                    {formatAmount(baseScenario.summary.totalInterest)} PLN
                  </Typography>
                </Box>
                </Stack>
                
                <Stack 
                  direction={{ xs: 'column', sm: 'row' }} 
                  spacing={3}
                  sx={{ width: '100%' }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Okres spłaty
                  </Typography>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600
                      }}
                    >
                    {formatTerm(
                      baseScenario.summary.loanTerm.years,
                      baseScenario.summary.loanTerm.months
                    )}
                  </Typography>
                </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Udział odsetek w spłacie
                  </Typography>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600
                      }}
                    >
                    {formatPercentage(
                      baseScenario.summary.totalInterest,
                      baseScenario.summary.totalPayment
                    )}
                  </Typography>
                </Box>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Box>

        {/* Overpayment Scenario Card */}
        <Box sx={{ flex: 1 }}>
          <Card
            elevation={0} 
            sx={{
              height: '100%',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              backgroundImage: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.primary.light}10 100%)`,
            }}
          >
            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
              <Typography 
                variant="h6" 
                gutterBottom 
                sx={{ 
                  fontWeight: 600,
                  color: theme.palette.primary.main,
                  mb: 2,
                }}
              >
                Wariant z nadpłatami
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Stack spacing={3}>
                <Stack 
                  direction={{ xs: 'column', sm: 'row' }} 
                  spacing={3}
                  sx={{ width: '100%' }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Łączna kwota do spłaty
                  </Typography>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600,
                        color: theme.palette.primary.dark
                      }}
                    >
                    {formatAmount(overpaymentScenario.summary.totalPayment)} PLN
                  </Typography>
                </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Suma odsetek
                  </Typography>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600,
                        color: theme.palette.primary.dark
                      }}
                    >
                    {formatAmount(overpaymentScenario.summary.totalInterest)} PLN
                  </Typography>
                </Box>
                </Stack>
                
                <Stack 
                  direction={{ xs: 'column', sm: 'row' }} 
                  spacing={3}
                  sx={{ width: '100%' }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Okres spłaty
                  </Typography>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600,
                        color: theme.palette.primary.dark
                      }}
                    >
                    {formatTerm(
                      overpaymentScenario.summary.loanTerm.years,
                      overpaymentScenario.summary.loanTerm.months
                    )}
                  </Typography>
                </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Udział odsetek w spłacie
                  </Typography>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600,
                        color: theme.palette.primary.dark
                      }}
                    >
                    {formatPercentage(
                      overpaymentScenario.summary.totalInterest,
                      overpaymentScenario.summary.totalPayment
                    )}
                  </Typography>
                </Box>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Stack>

      {/* Progressive Overpayment Info */}
      {overpaymentEffect === 'progressive_overpayment' && (
        <Box sx={{ mt: 3, px: { xs: 0.5, sm: 1 }, mb: 2 }}>
          <Alert 
            severity="info" 
            variant="outlined"
            icon={false}
            sx={{ 
              borderRadius: 2,
              p: { xs: 2.5, sm: 3 },
              backgroundColor: theme.palette.info.light + '20',
              borderColor: theme.palette.info.light,
              '& .MuiAlert-message': {
                width: '100%'
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <SavingsIcon sx={{ color: theme.palette.info.main, mt: 0.5 }} />
              <Box>
                <Typography variant="subtitle1" fontWeight="600" gutterBottom color="info.dark">
                Strategia nadpłaty progresywnej
              </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                W strategii nadpłaty progresywnej rata formalna jest stopniowo obniżana przy jednoczesnym
                zwiększaniu kwoty nadpłaty o wartość obniżki. Dzięki temu efektywna miesięczna płatność
                pozostaje stała, ale większa jej część trafia na spłatę kapitału, znacząco skracając czas
                kredytowania i redukując całkowity koszt kredytu.
              </Typography>
                <Typography variant="body2" color="text.secondary">
                W przypadku dodania nadpłat jednorazowych, kalkulator najpierw uwzględnia korzyści z tych
                nadpłat, a następnie kontynuuje strategię nadpłaty progresywnej. Oznacza to, że jednorazowe
                nadpłaty są dodawane do regularnie rosnących nadpłat progresywnych w miesiącach ich wystąpienia.
              </Typography>
              </Box>
            </Box>
            </Alert>
          </Box>
        )}
    </>
  );
};

export default ResultSummary; 