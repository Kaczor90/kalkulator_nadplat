import React from 'react';
import {
  Box,
  TextField,
  Grid as MuiGrid,
  Typography,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  IconButton,
  Paper,
  Slider,
  Stack,
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import PaymentsIcon from '@mui/icons-material/Payments';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PercentIcon from '@mui/icons-material/Percent';
import { RefinanceBasicInput } from '../../interfaces/refinance';

// Utworzenie komponentu pomocniczego
const Grid = (props: any) => <MuiGrid {...props} />;

interface RefinanceBasicFormProps {
  basicData: RefinanceBasicInput;
  onChange: (name: string, value: any) => void;
}

const RefinanceBasicForm: React.FC<RefinanceBasicFormProps> = ({ basicData, onChange }) => {
  const handleNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const numValue = value === '' ? '' : Number(value);
    onChange(name, numValue);
  };

  const handleSliderChange = (name: string) => (event: Event, newValue: number | number[]) => {
    onChange(name, newValue as number);
  };

  const handlePeriodChange = (type: 'years' | 'months', value: string) => {
    const numValue = value === '' ? 0 : Number(value);
    onChange(`currentRemainingPeriod.${type}`, numValue);
  };

  // Calculate rate difference for visual feedback
  const interestRateDifference = (basicData.currentInterestRate - basicData.newInterestRate).toFixed(2);
  const isPositiveDifference = Number(interestRateDifference) > 0;

  return (
    <Box>
      {/* Current Loan Section */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 4, 
          border: '1px solid', 
          borderColor: 'divider',
          borderRadius: 2,
          borderLeftWidth: 4,
          borderLeftColor: 'primary.main',
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600, mb: 2 }}>
          Obecny Kredyt
        </Typography>

        <Grid container spacing={3}>
          {/* Aktualne saldo kredytu */}
          <Grid item xs={12}>
            <Stack spacing={1}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <PaymentsIcon color="primary" fontSize="small" />
                <Typography variant="subtitle2">
                  Aktualne saldo kredytu (PLN)
                  <Tooltip title="Pozostała kwota kapitału do spłaty na dzień refinansowania">
                    <IconButton size="small">
                      <HelpOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Typography>
              </Stack>
              <TextField
                required
                fullWidth
                name="currentLoanBalance"
                value={basicData.currentLoanBalance || ''}
                onChange={handleNumberChange}
                type="number"
                variant="outlined"
                InputProps={{
                  endAdornment: <InputAdornment position="end">PLN</InputAdornment>,
                }}
                size="medium"
              />
              <Slider
                value={typeof basicData.currentLoanBalance === 'number' ? basicData.currentLoanBalance : 300000}
                onChange={handleSliderChange('currentLoanBalance')}
                aria-labelledby="current-loan-balance-slider"
                min={10000}
                max={2000000}
                step={10000}
                marks={[
                  { value: 10000, label: '10K' },
                  { value: 500000, label: '500K' },
                  { value: 1000000, label: '1M' },
                  { value: 2000000, label: '2M' },
                ]}
                sx={{ mt: 2 }}
              />
            </Stack>
          </Grid>

          {/* Pozostały okres kredytowania */}
          <Grid item xs={12} sm={6}>
            <Stack spacing={1}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <AccessTimeIcon color="primary" fontSize="small" />
                <Typography variant="subtitle2">
                  Pozostały okres kredytowania
                  <Tooltip title="Pozostała liczba lat i miesięcy do końca spłaty aktualnego kredytu">
                    <IconButton size="small">
                      <HelpOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Typography>
              </Stack>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    required
                    fullWidth
                    label="Lata"
                    name="currentRemainingPeriod.years"
                    value={basicData.currentRemainingPeriod?.years || ''}
                    onChange={(e) => handlePeriodChange('years', e.target.value)}
                    type="number"
                    variant="outlined"
                    InputProps={{
                      inputProps: { min: 0, max: 35 },
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    required
                    fullWidth
                    label="Miesiące"
                    name="currentRemainingPeriod.months"
                    value={basicData.currentRemainingPeriod?.months || ''}
                    onChange={(e) => handlePeriodChange('months', e.target.value)}
                    type="number"
                    variant="outlined"
                    InputProps={{
                      inputProps: { min: 0, max: 11 },
                    }}
                  />
                </Grid>
              </Grid>
            </Stack>
          </Grid>

          {/* Aktualne oprocentowanie nominalne */}
          <Grid item xs={12} sm={6}>
            <Stack spacing={1}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <PercentIcon color="primary" fontSize="small" />
                <Typography variant="subtitle2">
                  Aktualne oprocentowanie nominalne (rocznie %)
                  <Tooltip title="Aktualne oprocentowanie roczne Twojego kredytu (bez prowizji i innych opłat)">
                    <IconButton size="small">
                      <HelpOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Typography>
              </Stack>
              <TextField
                required
                fullWidth
                name="currentInterestRate"
                value={basicData.currentInterestRate || ''}
                onChange={handleNumberChange}
                type="number"
                variant="outlined"
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  inputProps: { min: 0, max: 30, step: 0.01 },
                }}
              />
              <Slider
                value={typeof basicData.currentInterestRate === 'number' ? basicData.currentInterestRate : 7.5}
                onChange={handleSliderChange('currentInterestRate')}
                aria-labelledby="current-interest-rate-slider"
                min={0}
                max={15}
                step={0.1}
                marks={[
                  { value: 0, label: '0%' },
                  { value: 5, label: '5%' },
                  { value: 10, label: '10%' },
                  { value: 15, label: '15%' },
                ]}
                sx={{ mt: 2 }}
              />
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* New Loan Section */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 4, 
          border: '1px solid', 
          borderColor: 'divider',
          borderRadius: 2,
          borderLeftWidth: 4,
          borderLeftColor: 'secondary.main',
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ color: 'secondary.main', fontWeight: 600, mb: 2 }}>
          Nowy Kredyt (Refinansowanie)
        </Typography>

        <Grid container spacing={3}>
          {/* Nowe oprocentowanie nominalne */}
          <Grid item xs={12}>
            <Stack spacing={1}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <PercentIcon color="secondary" fontSize="small" />
                  <Typography variant="subtitle2">
                    Nowe oprocentowanie nominalne (rocznie %)
                    <Tooltip title="Oprocentowanie roczne nowego kredytu w ramach refinansowania (bez prowizji i innych opłat)">
                      <IconButton size="small">
                        <HelpOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Typography>
                </Stack>
                {interestRateDifference && (
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 700,
                      color: isPositiveDifference ? 'success.main' : 'error.main',
                    }}
                  >
                    {isPositiveDifference ? '-' : '+'}{Math.abs(Number(interestRateDifference))}%
                  </Typography>
                )}
              </Stack>
              <TextField
                required
                fullWidth
                name="newInterestRate"
                value={basicData.newInterestRate || ''}
                onChange={handleNumberChange}
                type="number"
                variant="outlined"
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  inputProps: { min: 0, max: 30, step: 0.01 },
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: isPositiveDifference ? 'success.light' : 'inherit',
                    },
                    '&:hover fieldset': {
                      borderColor: isPositiveDifference ? 'success.main' : 'inherit',
                    },
                  }
                }}
              />
              <Slider
                value={typeof basicData.newInterestRate === 'number' ? basicData.newInterestRate : 6.5}
                onChange={handleSliderChange('newInterestRate')}
                aria-labelledby="new-interest-rate-slider"
                min={0}
                max={15}
                step={0.1}
                color="secondary"
                marks={[
                  { value: 0, label: '0%' },
                  { value: 5, label: '5%' },
                  { value: 10, label: '10%' },
                  { value: 15, label: '15%' },
                ]}
                sx={{ mt: 2 }}
              />
            </Stack>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default RefinanceBasicForm; 