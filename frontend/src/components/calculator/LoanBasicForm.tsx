import React from 'react';
import {
  Box,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Typography,
  Tooltip,
  IconButton,
  InputAdornment,
  useTheme,
  Paper,
  useMediaQuery,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { MortgageInput } from '../../interfaces/mortgage';

interface Props {
  loanData: MortgageInput;
  onChange: (name: string, value: any) => void;
}

const LoanBasicForm: React.FC<Props> = ({ loanData, onChange }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    onChange(name, value);
  };

  const handleNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    onChange(name, parseFloat(value) || 0);
  };

  const handleSelectChange = (event: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const name = event.target.name as string;
    const value = event.target.value;
    onChange(name, value);
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      onChange('startDate', date);
    }
  };

  const handleLoanTermChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const fieldName = name.split('.')[1]; // loanTerm.years or loanTerm.months
    onChange(`loanTerm.${fieldName}`, parseInt(value) || 0);
  };

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: { xs: 2, sm: 3 }, 
        borderRadius: 2, 
        mb: 3,
        backgroundColor: 'background.default'
      }}
    >
      <Box sx={{ mb: 3 }}>
        <Typography 
          variant="h6" 
          gutterBottom 
          sx={{ 
            color: 'primary.main',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          Podstawowe Parametry Kredytu
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Wprowadź dane swojego kredytu hipotecznego, aby rozpocząć kalkulację.
        </Typography>
      </Box>

      <Box 
        sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(12, 1fr)', 
          gap: 2.5,
          '& .MuiInputBase-root': {
            backgroundColor: 'background.paper'
          }
        }}
      >
        <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
          <TextField
            fullWidth
            label="Kwota kredytu"
            name="loanAmount"
            type="number"
            value={loanData.loanAmount}
            onChange={handleNumberChange}
            InputProps={{ 
              inputProps: { min: 0 },
              endAdornment: <InputAdornment position="end">PLN</InputAdornment>
            }}
            variant="outlined"
          />
        </Box>

        <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
          <TextField
            fullWidth
            label="Oprocentowanie nominalne"
            name="interestRate"
            type="number"
            value={loanData.interestRate}
            onChange={handleNumberChange}
            InputProps={{ 
              inputProps: { min: 0, max: 100, step: 0.01 },
              endAdornment: (
                <InputAdornment position="end">
                  <Typography variant="body2" sx={{ mr: 0.5 }}>
                    %
                  </Typography>
                  <Tooltip title="Oprocentowanie roczne podane w procentach">
                    <IconButton size="small" sx={{ color: 'primary.light' }}>
                      <HelpOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              )
            }}
            variant="outlined"
          />
        </Box>

        <Box sx={{ gridColumn: { xs: 'span 6', sm: 'span 3' } }}>
          <TextField
            fullWidth
            label="Okres kredytowania"
            name="loanTerm.years"
            type="number"
            value={loanData.loanTerm.years}
            onChange={handleLoanTermChange}
            InputProps={{ 
              inputProps: { min: 0, max: 35 },
              endAdornment: <InputAdornment position="end">lat</InputAdornment>
            }}
            variant="outlined"
          />
        </Box>

        <Box sx={{ gridColumn: { xs: 'span 6', sm: 'span 3' } }}>
          <TextField
            fullWidth
            label="Dodatkowe miesiące"
            name="loanTerm.months"
            type="number"
            value={loanData.loanTerm.months}
            onChange={handleLoanTermChange}
            InputProps={{ 
              inputProps: { min: 0, max: 11 },
              endAdornment: <InputAdornment position="end">mies.</InputAdornment>
            }}
            variant="outlined"
          />
        </Box>

        <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
          <FormControl fullWidth variant="outlined">
            <InputLabel id="installment-type-label">Typ rat</InputLabel>
            <Select
              labelId="installment-type-label"
              name="installmentType"
              value={loanData.installmentType}
              label="Typ rat"
              onChange={handleSelectChange as any}
            >
              <MenuItem value="equal">Równe (annuitetowe)</MenuItem>
              <MenuItem value="decreasing">Malejące</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
          <DatePicker
            label="Data rozpoczęcia kredytu"
            value={loanData.startDate instanceof Date ? loanData.startDate : new Date(loanData.startDate)}
            onChange={handleDateChange}
            slotProps={{ 
              textField: { 
                fullWidth: true,
                variant: "outlined" 
              } 
            }}
          />
        </Box>
      </Box>
    </Paper>
  );
};

export default LoanBasicForm; 