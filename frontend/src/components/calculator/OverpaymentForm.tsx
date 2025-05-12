import React from 'react';
import {
  Box,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  FormControlLabel,
  RadioGroup,
  Radio,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { format } from 'date-fns';
import { CyclicOverpayment, Overpayment } from '../../interfaces/mortgage';

interface Props {
  oneTimeOverpayments: Overpayment[];
  cyclicOverpayment: CyclicOverpayment | null;
  overpaymentEffect: 'reduce_period' | 'reduce_installment' | 'progressive_overpayment';
  onAddOneTimeOverpayment: (overpayment: Overpayment) => void;
  onRemoveOneTimeOverpayment: (index: number) => void;
  onCyclicOverpaymentChange: (cyclicOverpayment: CyclicOverpayment | null) => void;
  onOverpaymentEffectChange: (effect: 'reduce_period' | 'reduce_installment' | 'progressive_overpayment') => void;
}

const OverpaymentForm: React.FC<Props> = ({
  oneTimeOverpayments,
  cyclicOverpayment,
  overpaymentEffect,
  onAddOneTimeOverpayment,
  onRemoveOneTimeOverpayment,
  onCyclicOverpaymentChange,
  onOverpaymentEffectChange,
}) => {
  const [newAmount, setNewAmount] = React.useState<number>(0);
  const [newDate, setNewDate] = React.useState<Date | null>(null);

  // Cyclic overpayment form state
  const [cyclicAmount, setCyclicAmount] = React.useState<number>(
    cyclicOverpayment?.amount || 0
  );
  const [cyclicFrequency, setCyclicFrequency] = React.useState<
    'monthly' | 'quarterly' | 'semiannually' | 'annually'
  >(cyclicOverpayment?.frequency || 'monthly');
  const [cyclicStartDate, setCyclicStartDate] = React.useState<Date | null>(
    cyclicOverpayment?.startDate ? new Date(cyclicOverpayment.startDate) : null
  );
  const [cyclicEndDate, setCyclicEndDate] = React.useState<Date | null>(
    cyclicOverpayment?.endDate ? new Date(cyclicOverpayment.endDate) : null
  );

  // Handle one-time overpayment add
  const handleAddOverpayment = () => {
    if (newDate && newAmount > 0) {
      onAddOneTimeOverpayment({
        date: newDate,
        amount: newAmount,
      });
      // Reset form
      setNewAmount(0);
      setNewDate(null);
    }
  };

  // Handle cyclic overpayment update
  const handleCyclicOverpaymentUpdate = () => {
    if (cyclicAmount > 0) {
      onCyclicOverpaymentChange({
        amount: cyclicAmount,
        frequency: cyclicFrequency,
        startDate: cyclicStartDate || undefined,
        endDate: cyclicEndDate || undefined,
      });
    } else {
      onCyclicOverpaymentChange(null);
    }
  };

  // Handle frequency change
  const handleFrequencyChange = (event: SelectChangeEvent<string>) => {
    setCyclicFrequency(event.target.value as 'monthly' | 'quarterly' | 'semiannually' | 'annually');
  };

  // Handle overpayment effect change
  const handleEffectChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onOverpaymentEffectChange(event.target.value as 'reduce_period' | 'reduce_installment' | 'progressive_overpayment');
  };

  React.useEffect(() => {
    // Update local state when props change
    if (cyclicOverpayment) {
      setCyclicAmount(cyclicOverpayment.amount);
      setCyclicFrequency(cyclicOverpayment.frequency);
      setCyclicStartDate(
        cyclicOverpayment.startDate ? new Date(cyclicOverpayment.startDate) : null
      );
      setCyclicEndDate(
        cyclicOverpayment.endDate ? new Date(cyclicOverpayment.endDate) : null
      );
    }
  }, [cyclicOverpayment]);

  return (
    <Box>
      {/* Overpayment Effect Selection */}
      <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Efekt Nadpłat
        </Typography>
        <FormControl component="fieldset">
          <RadioGroup
            value={overpaymentEffect}
            onChange={handleEffectChange}
            name="overpayment-effect"
          >
            <FormControlLabel
              value="reduce_period"
              control={<Radio />}
              label="Skrócenie okresu kredytowania (stała rata)"
            />
            <FormControlLabel
              value="reduce_installment"
              control={<Radio />}
              label="Obniżenie wysokości raty (stały okres)"
            />
            <FormControlLabel
              value="progressive_overpayment"
              control={<Radio />}
              label="Nadpłata progresywna (obniżanie raty + rosnące nadpłaty)"
            />
          </RadioGroup>
        </FormControl>
        {overpaymentEffect === 'progressive_overpayment' && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Nadpłata progresywna automatycznie obniża ratę i wykorzystuje zaoszczędzoną kwotę jako dodatkową nadpłatę. 
            Można ją łączyć z nadpłatami jednorazowymi - w takim przypadku kalkulator uwzględni najpierw 
            korzyści z nadpłat jednorazowych, a następnie zastosuje strategię nadpłaty progresywnej.
          </Typography>
        )}
      </Box>

      {/* One-time Overpayments */}
      <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Nadpłaty Jednorazowe
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2, mb: 2 }}>
          <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 5' } }}>
            <DatePicker
              label="Data nadpłaty"
              value={newDate}
              onChange={(date) => setNewDate(date)}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Box>
          <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 5' } }}>
            <TextField
              fullWidth
              label="Kwota nadpłaty (PLN)"
              type="number"
              value={newAmount}
              onChange={(e) => setNewAmount(parseFloat(e.target.value) || 0)}
              InputProps={{ inputProps: { min: 0 } }}
            />
          </Box>
          <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 2' }, display: 'flex', alignItems: 'center' }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddOverpayment}
              disabled={!newDate || newAmount <= 0}
              fullWidth
              sx={{ 
                backgroundColor: '#0A2472', 
                '&:hover': { backgroundColor: '#061440' }
              }}
            >
              Dodaj
            </Button>
          </Box>
        </Box>

        {oneTimeOverpayments.length > 0 ? (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell>Data nadpłaty</TableCell>
                  <TableCell>Kwota (PLN)</TableCell>
                  <TableCell align="right">Akcje</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {oneTimeOverpayments.map((overpayment, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {overpayment.date instanceof Date
                        ? format(overpayment.date, 'dd.MM.yyyy')
                        : format(new Date(overpayment.date), 'dd.MM.yyyy')}
                    </TableCell>
                    <TableCell>{overpayment.amount.toLocaleString('pl-PL')} PLN</TableCell>
                    <TableCell align="right">
                      <IconButton
                        aria-label="delete"
                        size="small"
                        onClick={() => onRemoveOneTimeOverpayment(index)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography variant="body2" color="text.secondary" align="center">
            Brak zdefiniowanych nadpłat jednorazowych
          </Typography>
        )}
      </Box>

      {/* Cyclic Overpayments */}
      <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Nadpłaty Cykliczne
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2 }}>
          <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
            <TextField
              fullWidth
              label="Kwota cyklicznej nadpłaty (PLN)"
              type="number"
              value={cyclicAmount}
              onChange={(e) => setCyclicAmount(parseFloat(e.target.value) || 0)}
              InputProps={{ inputProps: { min: 0 } }}
            />
          </Box>
          <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
            <FormControl fullWidth>
              <InputLabel id="frequency-label">Częstotliwość</InputLabel>
              <Select
                labelId="frequency-label"
                value={cyclicFrequency}
                label="Częstotliwość"
                onChange={handleFrequencyChange}
              >
                <MenuItem value="monthly">Co miesiąc</MenuItem>
                <MenuItem value="quarterly">Co kwartał</MenuItem>
                <MenuItem value="semiannually">Co pół roku</MenuItem>
                <MenuItem value="annually">Co rok</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
            <DatePicker
              label="Data rozpoczęcia (opcjonalnie)"
              value={cyclicStartDate}
              onChange={(date) => setCyclicStartDate(date)}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Box>
          <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
            <DatePicker
              label="Data zakończenia (opcjonalnie)"
              value={cyclicEndDate}
              onChange={(date) => setCyclicEndDate(date)}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Box>
          <Box sx={{ gridColumn: 'span 12' }}>
            <Button
              variant="contained"
              onClick={handleCyclicOverpaymentUpdate}
              fullWidth
              sx={{ 
                backgroundColor: '#0A2472', 
                '&:hover': { backgroundColor: '#061440' }
              }}
            >
              {cyclicOverpayment ? 'Aktualizuj' : 'Dodaj'} Cykliczne Nadpłaty
            </Button>
          </Box>
        </Box>

        {cyclicOverpayment && (
          <Box sx={{ mt: 2, p: 2, backgroundColor: '#f8f9fa', borderRadius: 1 }}>
            <Typography variant="body2">
              <strong>Aktywna nadpłata cykliczna:</strong> {cyclicOverpayment.amount.toLocaleString('pl-PL')} PLN{' '}
              {cyclicOverpayment.frequency === 'monthly' && 'co miesiąc'}
              {cyclicOverpayment.frequency === 'quarterly' && 'co kwartał'}
              {cyclicOverpayment.frequency === 'semiannually' && 'co pół roku'}
              {cyclicOverpayment.frequency === 'annually' && 'co rok'}
              {cyclicOverpayment.startDate && ` od ${format(new Date(cyclicOverpayment.startDate), 'dd.MM.yyyy')}`}
              {cyclicOverpayment.endDate && ` do ${format(new Date(cyclicOverpayment.endDate), 'dd.MM.yyyy')}`}
            </Typography>
          </Box>
        )}

        {cyclicOverpayment && overpaymentEffect === 'progressive_overpayment' && (
          <Box sx={{ mt: 2, p: 2, backgroundColor: '#e8f4ff', borderRadius: 1, border: '1px solid #c2e0ff' }}>
            <Typography variant="body2">
              <strong>Aktywna nadpłata progresywna:</strong> Początkowa kwota {cyclicOverpayment.amount.toLocaleString('pl-PL')} PLN{' '}
              {cyclicOverpayment.frequency === 'monthly' && 'co miesiąc'}
              {cyclicOverpayment.frequency === 'quarterly' && 'co kwartał'}
              {cyclicOverpayment.frequency === 'semiannually' && 'co pół roku'}
              {cyclicOverpayment.frequency === 'annually' && 'co rok'}{' '}
              + różnica obniżki raty (kwota będzie stopniowo wzrastać)
              {cyclicOverpayment.startDate && ` od ${format(new Date(cyclicOverpayment.startDate), 'dd.MM.yyyy')}`}
              {cyclicOverpayment.endDate && ` do ${format(new Date(cyclicOverpayment.endDate), 'dd.MM.yyyy')}`}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default OverpaymentForm; 