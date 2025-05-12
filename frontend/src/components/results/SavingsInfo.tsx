import React from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  Stack,
  Chip
} from '@mui/material';
import { CalculationResult } from '../../interfaces/mortgage';
import SavingsIcon from '@mui/icons-material/Savings';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

interface Props {
  result: CalculationResult;
  overpaymentEffect?: 'reduce_period' | 'reduce_installment' | 'progressive_overpayment';
}

const SavingsInfo: React.FC<Props> = ({ result, overpaymentEffect }) => {
  const { savings } = result;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('pl-PL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatTerm = (years: number, months: number) => {
    return `${years} lat ${months > 0 ? `${months} mies.` : ''}`;
  };

  return (
    <Card
      elevation={0} 
      sx={{ 
        mb: 4,
        mx: { xs: 0.5, sm: 1 },
        background: `linear-gradient(135deg, ${theme.palette.primary.light}20, ${theme.palette.secondary.light}30)`,
        border: `1px solid ${theme.palette.primary.light}40`,
        borderRadius: 3,
      }}
    >
      <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 3,
          flexDirection: { xs: 'column', sm: 'row' },
          textAlign: { xs: 'center', sm: 'left' },
        }}>
          <Typography 
            variant="h6" 
            component="h3" 
            sx={{
              fontWeight: 600,
              color: theme.palette.primary.dark,
              mr: { sm: 2 },
              mb: { xs: 1, sm: 0 },
            }}
          >
            Twoje oszczędności dzięki nadpłatom
          </Typography>

          {overpaymentEffect && (
            <Chip 
              label={
                overpaymentEffect === 'reduce_period' 
                  ? 'Skrócenie okresu' 
                  : overpaymentEffect === 'reduce_installment' 
                    ? 'Zmniejszenie raty' 
                    : 'Nadpłata progresywna'
              }
              size="small"
              color={overpaymentEffect === 'progressive_overpayment' ? 'secondary' : 'primary'}
              sx={{ 
                fontWeight: 500,
                color: 'white'
              }}
            />
          )}
        </Box>

        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={4}
        >
          <Box sx={{ flex: 1 }}>
            <Card 
              elevation={0} 
              sx={{ 
                p: { xs: 2.5, sm: 3 }, 
                textAlign: 'center',
                height: '100%',
                background: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
              }}
            >
              <SavingsIcon 
                sx={{ 
                  fontSize: 40, 
                  color: theme.palette.primary.main,
                  mb: 2
                }} 
              />
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Łączna oszczędność
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 700, 
                  color: theme.palette.primary.main,
                  mt: 1
                }}
              >
                {formatAmount(savings.totalAmount)} PLN
              </Typography>
            </Card>
          </Box>

          {savings.timeReduction && (
            <Box sx={{ flex: 1 }}>
              <Card 
                elevation={0}
                sx={{ 
                  p: { xs: 2.5, sm: 3 }, 
                  textAlign: 'center',
                  height: '100%',
                  background: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 2,
                }}
              >
                <AccessTimeIcon 
                  sx={{ 
                    fontSize: 40, 
                    color: theme.palette.info.main,
                    mb: 2
                  }} 
                />
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Skrócenie okresu
                </Typography>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 700, 
                    color: theme.palette.info.main,
                    mt: 1
                  }}
                >
                  {formatTerm(
                    savings.timeReduction.years,
                    savings.timeReduction.months
                  )}
                </Typography>
              </Card>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default SavingsInfo; 