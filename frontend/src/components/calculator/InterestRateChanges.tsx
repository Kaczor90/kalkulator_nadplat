import React from 'react';
import {
  Box,
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { InterestRateChange } from '../../interfaces/mortgage';
import { format } from 'date-fns';

interface Props {
  interestRateChanges: InterestRateChange[];
  onAddChange: (change: InterestRateChange) => void;
  onRemoveChange: (index: number) => void;
}

const InterestRateChanges: React.FC<Props> = ({
  interestRateChanges,
  onAddChange,
  onRemoveChange,
}) => {
  const [newRate, setNewRate] = React.useState<number>(0);
  const [newDate, setNewDate] = React.useState<Date | null>(null);
  const [showSection, setShowSection] = React.useState<boolean>(true);

  const handleAddChange = () => {
    if (newDate && newRate > 0) {
      onAddChange({
        date: newDate,
        newRate,
      });
      // Reset form
      setNewRate(0);
      setNewDate(null);
    }
  };

  const handleToggleSection = () => {
    setShowSection(!showSection);
  };

  return (
    <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Zmiany Oprocentowania
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={showSection}
              onChange={handleToggleSection}
              sx={{ 
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: '#0A2472',
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: '#0A2472',
                },
              }}
            />
          }
          label={showSection ? "Ukryj" : "Pokaż"}
        />
      </Box>

      {showSection && (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2, mb: 2 }}>
            <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 5' } }}>
              <DatePicker
                label="Data zmiany oprocentowania"
                value={newDate}
                onChange={(date) => setNewDate(date)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Box>
            <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 5' } }}>
              <TextField
                fullWidth
                label="Nowe oprocentowanie (%)"
                type="number"
                value={newRate}
                onChange={(e) => setNewRate(parseFloat(e.target.value) || 0)}
                InputProps={{ inputProps: { min: 0, max: 100, step: 0.01 } }}
              />
            </Box>
            <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 2' }, display: 'flex', alignItems: 'center' }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddChange}
                disabled={!newDate || newRate <= 0}
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

          {interestRateChanges.length > 0 ? (
            <TableContainer component={Paper} sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell>Data zmiany</TableCell>
                    <TableCell>Nowe oprocentowanie (%)</TableCell>
                    <TableCell align="right">Akcje</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {interestRateChanges.map((change, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {change.date instanceof Date
                          ? format(change.date, 'dd.MM.yyyy')
                          : format(new Date(change.date), 'dd.MM.yyyy')}
                      </TableCell>
                      <TableCell>{change.newRate.toFixed(2)}%</TableCell>
                      <TableCell align="right">
                        <IconButton
                          aria-label="delete"
                          size="small"
                          onClick={() => onRemoveChange(index)}
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
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
              Brak zdefiniowanych zmian oprocentowania
            </Typography>
          )}
        </>
      )}
    </Box>
  );
};

export default InterestRateChanges; 