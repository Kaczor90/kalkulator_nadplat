import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Stack,
  Tooltip,
  SelectChangeEvent,
} from '@mui/material';
import { format } from 'date-fns';
import { CalculationResult, InstallmentDetails } from '../../interfaces/mortgage';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

interface Props {
  result: CalculationResult;
  onExportPdf: () => void;
  overpaymentEffect?: 'reduce_period' | 'reduce_installment' | 'progressive_overpayment';
}

const InstallmentTable: React.FC<Props> = ({ result, onExportPdf, overpaymentEffect }) => {
  const [scenario, setScenario] = useState<'base' | 'overpayment'>('overpayment');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const installments = scenario === 'base' 
    ? result.baseScenario.installments 
    : result.overpaymentScenario.installments;

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleScenarioChange = (event: SelectChangeEvent) => {
    setScenario(event.target.value as 'base' | 'overpayment');
    setPage(0);
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('pl-PL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (date: Date | string) => {
    return format(new Date(date), 'dd.MM.yyyy');
  };

  // Determine if we should split overpayment columns for progressive mode
  const showDetailedOverpayment = scenario === 'overpayment' && 
                                overpaymentEffect === 'progressive_overpayment';

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: { xs: 2, sm: 3 }, 
        mt: 4, 
        mb: 4,
        borderRadius: 3,
        border: '1px solid rgba(0, 0, 0, 0.12)',
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        mb: 3, 
        flexWrap: 'wrap', 
        gap: 2,
        px: { xs: 0.5, sm: 1 }
      }}>
        <Typography 
          variant="h6" 
          component="h2"
          sx={{ fontWeight: 600 }}
        >
          Harmonogram spłat
        </Typography>
        
        <Stack direction="row" spacing={2}>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Scenariusz</InputLabel>
            <Select
              value={scenario}
              onChange={handleScenarioChange}
              label="Scenariusz"
            >
              <MenuItem value="base">Bez nadpłat</MenuItem>
              <MenuItem value="overpayment">Z nadpłatami</MenuItem>
            </Select>
          </FormControl>
          
          <Button 
            variant="outlined" 
            startIcon={<FileDownloadIcon />}
            onClick={onExportPdf}
          >
            Pobierz raport
          </Button>
        </Stack>
      </Box>
      
      <TableContainer sx={{ px: { xs: 0.5, sm: 1 } }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'rgba(0, 0, 0, 0.04)' }}>
              <TableCell>Nr</TableCell>
              <TableCell>Data płatności</TableCell>
              <TableCell align="right">Rata całkowita (PLN)</TableCell>
              <TableCell align="right">Kapitał (PLN)</TableCell>
              <TableCell align="right">Odsetki (PLN)</TableCell>
              {scenario === 'overpayment' && !showDetailedOverpayment && (
                <TableCell align="right">Nadpłata (PLN)</TableCell>
              )}
              {showDetailedOverpayment && (
                <>
                  <TableCell align="right">Nadpłata jednorazowa (PLN)</TableCell>
                  <TableCell align="right">Nadpłata progresywna (PLN)</TableCell>
                  <TableCell align="right">Suma nadpłat (PLN)</TableCell>
                </>
              )}
              <TableCell align="right">Pozostały dług (PLN)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {installments
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((installment) => (
                <TableRow
                  key={installment.installmentNumber}
                  sx={{
                    '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' },
                    '&:last-child td, &:last-child th': { border: 0 },
                  }}
                >
                  <TableCell component="th" scope="row">
                    {installment.installmentNumber}
                  </TableCell>
                  <TableCell>{formatDate(installment.date)}</TableCell>
                  <TableCell align="right">{formatAmount(installment.totalAmount)}</TableCell>
                  <TableCell align="right">{formatAmount(installment.principalAmount)}</TableCell>
                  <TableCell align="right">{formatAmount(installment.interestAmount)}</TableCell>
                  
                  {/* Regular overpayment column */}
                  {scenario === 'overpayment' && !showDetailedOverpayment && (
                    <TableCell align="right">{formatAmount(installment.overpaymentAmount)}</TableCell>
                  )}
                  
                  {/* Detailed overpayment columns for progressive mode */}
                  {showDetailedOverpayment && (
                    <>
                      <TableCell align="right">
                        {formatAmount(installment.oneTimeOverpayment || 0)}
                      </TableCell>
                      <TableCell align="right">
                        {formatAmount(installment.progressiveOverpayment || 0)}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Suma nadpłat = nadpłata jednorazowa + nadpłata progresywna">
                          <span>{formatAmount(installment.overpaymentAmount)}</span>
                        </Tooltip>
                      </TableCell>
                    </>
                  )}
                  
                  <TableCell align="right">{formatAmount(installment.remainingDebt)}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      <Box sx={{ px: { xs: 0.5, sm: 1 }, mt: 2 }}>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50, 100]}
          component="div"
          count={installments.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Wierszy na stronę:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} z ${count}`
          }
        />
      </Box>
    </Paper>
  );
};

export default InstallmentTable; 