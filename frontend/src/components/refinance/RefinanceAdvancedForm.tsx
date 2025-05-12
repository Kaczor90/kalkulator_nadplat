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
  RadioGroup,
  FormControlLabel,
  Radio,
  Tooltip,
  IconButton,
  Divider,
  Paper,
  Alert,
  Stack,
  Switch,
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import PaymentsIcon from '@mui/icons-material/Payments';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PercentIcon from '@mui/icons-material/Percent';
import EventIcon from '@mui/icons-material/Event';
import PaymentIcon from '@mui/icons-material/Payment';
import SettingsIcon from '@mui/icons-material/Settings';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { RefinanceAdvancedInput } from '../../interfaces/refinance';

// Utworzenie komponentu pomocniczego
const Grid = (props: any) => <MuiGrid {...props} />;

interface RefinanceAdvancedFormProps {
  advancedData: RefinanceAdvancedInput;
  onChange: (name: string, value: any) => void;
}

const RefinanceAdvancedForm: React.FC<RefinanceAdvancedFormProps> = ({ advancedData, onChange }) => {
  const handleNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const numValue = value === '' ? '' : Number(value);
    onChange(name, numValue);
  };

  const handleSelectChange = (event: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const name = event.target.name as string;
    const value = event.target.value;
    onChange(name, value);
  };

  const handleRadioChange = (group: string, subfield: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(`${group}.${subfield}`, event.target.value);
  };

  const handleDateChange = (name: string, value: Date | null) => {
    onChange(name, value);
  };

  const handlePeriodChange = (type: 'years' | 'months', value: string) => {
    const numValue = value === '' ? 0 : Number(value);
    onChange(`newLoanTerm.${type}`, numValue);
  };

  return (
    <Box>
      {/* Current Loan Details */}
      <Paper elevation={0} sx={{ 
        p: 3, 
        mb: 4, 
        border: '1px solid', 
        borderColor: 'divider',
        borderRadius: 2,
        borderLeftWidth: 4,
        borderLeftColor: 'primary.main',
        background: 'linear-gradient(to right, rgba(37, 99, 235, 0.03), transparent)',
      }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
          <SettingsIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
            Aktualny Kredyt (Szczegóły Zaawansowane)
          </Typography>
        </Stack>

        <Grid container spacing={3}>
          {/* Pierwotna kwota aktualnego kredytu */}
          <Grid item xs={12} sm={6}>
            <Stack spacing={1}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <PaymentsIcon color="primary" fontSize="small" />
                <Typography variant="subtitle2">
                  Pierwotna kwota aktualnego kredytu (PLN)
                  <Tooltip title="Pełna kwota kredytu z dnia jego udzielenia (potrzebna do obliczenia zwrotu prowizji)">
                    <IconButton size="small">
                      <HelpOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Typography>
              </Stack>
              <TextField
                fullWidth
                name="originalLoanAmount"
                value={advancedData.originalLoanAmount === 0 ? '0' : advancedData.originalLoanAmount || ''}
                onChange={handleNumberChange}
                type="number"
                variant="outlined"
                InputProps={{
                  endAdornment: <InputAdornment position="end">PLN</InputAdornment>,
                }}
              />
            </Stack>
          </Grid>

          {/* Data uruchomienia aktualnego kredytu */}
          <Grid item xs={12} sm={6}>
            <Stack spacing={1}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <EventIcon color="primary" fontSize="small" />
                <Typography variant="subtitle2">
                  Data uruchomienia aktualnego kredytu
                  <Tooltip title="Data uruchomienia aktualnego kredytu (potrzebna do obliczenia zwrotu prowizji)">
                    <IconButton size="small">
                      <HelpOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Typography>
              </Stack>
              <DatePicker
                value={advancedData.startDate || null}
                onChange={(date) => handleDateChange('startDate', date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    variant: 'outlined',
                  },
                }}
              />
            </Stack>
          </Grid>

          {/* Typ rat aktualnego kredytu */}
          <Grid item xs={12} sm={6}>
            <Stack spacing={1}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <PaymentIcon color="primary" fontSize="small" />
                <Typography variant="subtitle2">
                  Typ rat aktualnego kredytu
                  <Tooltip title="Wybierz czy Twój aktualny kredyt ma raty równe (annuitetowe) czy malejące">
                    <IconButton size="small">
                      <HelpOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Typography>
              </Stack>
              <FormControl fullWidth variant="outlined">
                <Select
                  name="currentInstallmentType"
                  value={advancedData.currentInstallmentType}
                  onChange={handleSelectChange as any}
                >
                  <MenuItem value="equal">Równe (annuitetowe)</MenuItem>
                  <MenuItem value="decreasing">Malejące</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Grid>

          {/* Prowizja zapłacona za udzielenie aktualnego kredytu */}
          <Grid item xs={12} sm={6}>
            <Stack spacing={1}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <PercentIcon color="primary" fontSize="small" />
                <Typography variant="subtitle2">
                  Prowizja za udzielenie aktualnego kredytu
                  <Tooltip title="Prowizja zapłacona bankowi za udzielenie aktualnego kredytu (część może podlegać zwrotowi przy refinansowaniu)">
                    <IconButton size="small">
                      <HelpOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Typography>
              </Stack>
              <Box>
                <RadioGroup
                  row
                  name="originalCommissionType"
                  value={advancedData.originalCommission?.type || 'amount'}
                  onChange={handleRadioChange('originalCommission', 'type')}
                  sx={{ mb: 1 }}
                >
                  <FormControlLabel
                    value="amount"
                    control={<Radio size="small" color="primary" />}
                    label="Kwota (PLN)"
                  />
                  <FormControlLabel
                    value="percentage"
                    control={<Radio size="small" color="primary" />}
                    label="Procent (%)"
                  />
                </RadioGroup>
                <TextField
                  fullWidth
                  label={advancedData.originalCommission?.type === 'percentage' ? 'Prowizja (%)' : 'Prowizja (PLN)'}
                  name="originalCommission.value"
                  value={advancedData.originalCommission?.value === 0 ? '0' : advancedData.originalCommission?.value || ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : Number(e.target.value);
                    onChange('originalCommission.value', val);
                  }}
                  type="number"
                  variant="outlined"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        {advancedData.originalCommission?.type === 'percentage' ? '%' : 'PLN'}
                      </InputAdornment>
                    ),
                    inputProps: { 
                      min: 0, 
                      step: advancedData.originalCommission?.type === 'percentage' ? 0.01 : 1 
                    }
                  }}
                />
              </Box>
            </Stack>
          </Grid>

          {/* Aktualna miesięczna rata kredytu (opcjonalnie) */}
          <Grid item xs={12} sm={6}>
            <Stack spacing={1}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <PaymentIcon color="primary" fontSize="small" />
                <Typography variant="subtitle2">
                  Aktualna miesięczna rata kredytu (PLN, opcjonalnie)
                  <Tooltip title="Opcjonalnie podaj aktualną ratę kredytu do weryfikacji obliczeń">
                    <IconButton size="small">
                      <HelpOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Typography>
              </Stack>
              <TextField
                fullWidth
                name="currentMonthlyInstallment"
                value={advancedData.currentMonthlyInstallment === 0 ? '0' : advancedData.currentMonthlyInstallment || ''}
                onChange={handleNumberChange}
                type="number"
                variant="outlined"
                InputProps={{
                  endAdornment: <InputAdornment position="end">PLN</InputAdornment>,
                }}
              />
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* New Loan Details */}
      <Paper elevation={0} sx={{ 
        p: 3, 
        mb: 4, 
        border: '1px solid', 
        borderColor: 'divider',
        borderRadius: 2,
        borderLeftWidth: 4,
        borderLeftColor: 'secondary.main',
        background: 'linear-gradient(to right, rgba(16, 185, 129, 0.03), transparent)',
      }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
          <SettingsIcon color="secondary" />
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'secondary.main' }}>
            Nowy Kredyt (Refinansowanie - Szczegóły Zaawansowane)
          </Typography>
        </Stack>

        <Grid container spacing={3}>
          {/* Data refinansowania */}
          <Grid item xs={12} sm={6}>
            <Stack spacing={1}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <EventIcon color="secondary" fontSize="small" />
                <Typography variant="subtitle2">
                  Data refinansowania
                  <Tooltip title="Data planowanego refinansowania kredytu">
                    <IconButton size="small">
                      <HelpOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Typography>
              </Stack>
              <DatePicker
                value={advancedData.refinanceDate}
                onChange={(date) => handleDateChange('refinanceDate', date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    variant: 'outlined',
                    required: true,
                  },
                }}
              />
            </Stack>
          </Grid>

          {/* Nowa kwota kredytu */}
          <Grid item xs={12} sm={6}>
            <Stack spacing={1}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <PaymentsIcon color="secondary" fontSize="small" />
                <Typography variant="subtitle2">
                  Nowa kwota kredytu (PLN)
                  <Tooltip title="Kwota nowego kredytu refinansującego. Domyślnie równa aktualnemu saldu.">
                    <IconButton size="small">
                      <HelpOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Typography>
              </Stack>
              <TextField
                required
                fullWidth
                name="newLoanAmount"
                value={advancedData.newLoanAmount || ''}
                onChange={handleNumberChange}
                type="number"
                variant="outlined"
                InputProps={{
                  endAdornment: <InputAdornment position="end">PLN</InputAdornment>,
                }}
              />
            </Stack>
          </Grid>

          {/* Nowy okres kredytowania */}
          <Grid item xs={12} sm={6}>
            <Stack spacing={1}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <AccessTimeIcon color="secondary" fontSize="small" />
                <Typography variant="subtitle2">
                  Nowy okres kredytowania
                  <Tooltip title="Okres kredytowania nowego kredytu refinansującego. Domyślnie równy pozostałemu okresowi aktualnego kredytu.">
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
                    name="newLoanTerm.years"
                    value={advancedData.newLoanTerm?.years || ''}
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
                    name="newLoanTerm.months"
                    value={advancedData.newLoanTerm?.months || ''}
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

          {/* Typ rat nowego kredytu */}
          <Grid item xs={12} sm={6}>
            <Stack spacing={1}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <PaymentIcon color="secondary" fontSize="small" />
                <Typography variant="subtitle2">
                  Typ rat nowego kredytu
                  <Tooltip title="Wybierz typ rat dla nowego kredytu refinansującego">
                    <IconButton size="small">
                      <HelpOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Typography>
              </Stack>
              <FormControl fullWidth variant="outlined">
                <Select
                  name="newInstallmentType"
                  value={advancedData.newInstallmentType}
                  onChange={handleSelectChange as any}
                >
                  <MenuItem value="equal">Równe (annuitetowe)</MenuItem>
                  <MenuItem value="decreasing">Malejące</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Grid>

          {/* Prowizja za udzielenie nowego kredytu */}
          <Grid item xs={12} sm={6}>
            <Stack spacing={1}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <PercentIcon color="secondary" fontSize="small" />
                <Typography variant="subtitle2">
                  Prowizja za udzielenie nowego kredytu
                  <Tooltip title="Prowizja pobierana przez bank za udzielenie nowego kredytu refinansującego">
                    <IconButton size="small">
                      <HelpOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Typography>
              </Stack>
              <Box>
                <RadioGroup
                  row
                  name="newLoanCommissionType"
                  value={advancedData.newLoanCommission?.type || 'percentage'}
                  onChange={handleRadioChange('newLoanCommission', 'type')}
                  sx={{ mb: 1 }}
                >
                  <FormControlLabel
                    value="amount"
                    control={<Radio size="small" color="secondary" />}
                    label="Kwota (PLN)"
                  />
                  <FormControlLabel
                    value="percentage"
                    control={<Radio size="small" color="secondary" />}
                    label="Procent (%)"
                  />
                </RadioGroup>
                <TextField
                  fullWidth
                  label={advancedData.newLoanCommission?.type === 'percentage' ? 'Prowizja (%)' : 'Prowizja (PLN)'}
                  name="newLoanCommission.value"
                  value={advancedData.newLoanCommission?.value === 0 ? '0' : advancedData.newLoanCommission?.value || ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : Number(e.target.value);
                    onChange('newLoanCommission.value', val);
                  }}
                  type="number"
                  variant="outlined"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        {advancedData.newLoanCommission?.type === 'percentage' ? '%' : 'PLN'}
                      </InputAdornment>
                    ),
                    inputProps: { 
                      min: 0, 
                      step: advancedData.newLoanCommission?.type === 'percentage' ? 0.01 : 1 
                    }
                  }}
                />
              </Box>
            </Stack>
          </Grid>

          {/* Opłata za wcześniejszą spłatę aktualnego kredytu */}
          <Grid item xs={12} sm={6}>
            <Stack spacing={1}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <PercentIcon color="secondary" fontSize="small" />
                <Typography variant="subtitle2">
                  Opłata za wcześniejszą spłatę aktualnego kredytu
                  <Tooltip title="Opłata pobierana przez bank za wcześniejszą spłatę aktualnego kredytu">
                    <IconButton size="small">
                      <HelpOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Typography>
              </Stack>
              <Box>
                <RadioGroup
                  row
                  name="earlyRepaymentFeeType"
                  value={advancedData.earlyRepaymentFee?.type || 'percentage'}
                  onChange={handleRadioChange('earlyRepaymentFee', 'type')}
                  sx={{ mb: 1 }}
                >
                  <FormControlLabel
                    value="amount"
                    control={<Radio size="small" color="secondary" />}
                    label="Kwota (PLN)"
                  />
                  <FormControlLabel
                    value="percentage"
                    control={<Radio size="small" color="secondary" />}
                    label="Procent (%)"
                  />
                </RadioGroup>
                <TextField
                  fullWidth
                  label={advancedData.earlyRepaymentFee?.type === 'percentage' ? 'Opłata (%)' : 'Opłata (PLN)'}
                  name="earlyRepaymentFee.value"
                  value={advancedData.earlyRepaymentFee?.value === 0 ? '0' : advancedData.earlyRepaymentFee?.value || ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : Number(e.target.value);
                    onChange('earlyRepaymentFee.value', val);
                  }}
                  type="number"
                  variant="outlined"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        {advancedData.earlyRepaymentFee?.type === 'percentage' ? '%' : 'PLN'}
                      </InputAdornment>
                    ),
                    inputProps: { 
                      min: 0, 
                      step: advancedData.earlyRepaymentFee?.type === 'percentage' ? 0.01 : 1 
                    }
                  }}
                />
              </Box>
            </Stack>
          </Grid>

          {/* Inne koszty */}
          <Grid item xs={12} sm={6}>
            <Stack spacing={1}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <PaymentsIcon color="secondary" fontSize="small" />
                <Typography variant="subtitle2">
                  Inne koszty (PLN, opcjonalnie)
                  <Tooltip title="Dodatkowe koszty związane z refinansowaniem (np. opłaty notarialne, wycena nieruchomości)">
                    <IconButton size="small">
                      <HelpOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Typography>
              </Stack>
              <TextField
                fullWidth
                name="otherCosts"
                value={advancedData.otherCosts === 0 ? '0' : advancedData.otherCosts || ''}
                onChange={handleNumberChange}
                type="number"
                variant="outlined"
                InputProps={{
                  endAdornment: <InputAdornment position="end">PLN</InputAdornment>,
                }}
              />
            </Stack>
          </Grid>

          {/* Dzień miesiąca płatności raty */}
          <Grid item xs={12} sm={6}>
            <Stack spacing={1}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <EventIcon color="secondary" fontSize="small" />
                <Typography variant="subtitle2">
                  Dzień miesiąca płatności raty
                  <Tooltip title="Dzień miesiąca, w którym będzie płacona rata nowego kredytu">
                    <IconButton size="small">
                      <HelpOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Typography>
              </Stack>
              <TextField
                fullWidth
                name="installmentDayOfMonth"
                value={advancedData.installmentDayOfMonth || ''}
                onChange={handleNumberChange}
                type="number"
                variant="outlined"
                InputProps={{
                  inputProps: { min: 1, max: 31 },
                }}
              />
            </Stack>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default RefinanceAdvancedForm; 