import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Tab,
  Tabs,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  TooltipProps,
} from 'recharts';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { CalculationResult, InstallmentDetails } from '../../interfaces/mortgage';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`chart-tabpanel-${index}`}
      aria-labelledby={`chart-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: { xs: 2, sm: 3 } }}>{children}</Box>}
    </div>
  );
}

interface Props {
  result: CalculationResult;
}

const ResultCharts: React.FC<Props> = ({ result }) => {
  const [tabValue, setTabValue] = React.useState(0);
  const { baseScenario, overpaymentScenario } = result;

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Prepare data for debt chart
  const prepareDebtChartData = () => {
    const baseInst = baseScenario.installments;
    const overInst = overpaymentScenario.installments;
    const maxLen = Math.max(baseInst.length, overInst.length);
    
    const data = [];
    
    for (let i = 0; i < maxLen; i += 6) { // Sample every 6 months to reduce data points
      const baseInstallment = i < baseInst.length ? baseInst[i] : null;
      const overInstallment = i < overInst.length ? overInst[i] : null;
      
      const date = baseInstallment 
        ? new Date(baseInstallment.date) 
        : new Date(overInstallment!.date);
      
      data.push({
        date: format(date, 'MM.yyyy', { locale: pl }),
        baseDebt: baseInstallment ? baseInstallment.remainingDebt : 0,
        overDebt: overInstallment ? overInstallment.remainingDebt : 0,
        installmentNumber: baseInstallment 
          ? baseInstallment.installmentNumber 
          : overInstallment!.installmentNumber,
      });
    }
    
    return data;
  };

  // Prepare data for structure chart
  const prepareStructureChartData = () => {
    return [
      {
        name: 'Bez nadpłat',
        capital: baseScenario.summary.totalPayment - baseScenario.summary.totalInterest,
        interest: baseScenario.summary.totalInterest,
      },
      {
        name: 'Z nadpłatami',
        capital: overpaymentScenario.summary.totalPayment - overpaymentScenario.summary.totalInterest,
        interest: overpaymentScenario.summary.totalInterest,
      },
    ];
  };

  // Custom tooltip for debt chart
  const DebtChartTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 2, border: '1px solid #ccc' }}>
          <Typography variant="body2">Rata: {payload[0]?.payload.installmentNumber}</Typography>
          <Typography variant="body2">Data: {label}</Typography>
          <Typography variant="body2" sx={{ color: '#0A2472', fontWeight: 'bold' }}>
            Bez nadpłat: {payload[0]?.value?.toLocaleString('pl-PL')} PLN
          </Typography>
          <Typography variant="body2" sx={{ color: '#FFC857', fontWeight: 'bold' }}>
            Z nadpłatami: {payload[1]?.value?.toLocaleString('pl-PL')} PLN
          </Typography>
        </Paper>
      );
    }
    
    return null;
  };

  // Custom tooltip for structure chart
  const StructureChartTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const isCapital = payload[0]?.dataKey === 'capital';
      
      return (
        <Paper sx={{ p: 2, border: '1px solid #ccc' }}>
          <Typography variant="body2">{label}</Typography>
          <Typography variant="body2" sx={{ color: isCapital ? '#0A2472' : '#FFC857', fontWeight: 'bold' }}>
            {isCapital ? 'Kapitał: ' : 'Odsetki: '}
            {payload[0]?.value?.toLocaleString('pl-PL')} PLN
          </Typography>
        </Paper>
      );
    }
    
    return null;
  };

  return (
    <Paper elevation={0} sx={{ 
      p: { xs: 3, sm: 4 }, 
      mb: 4, 
      borderRadius: 3,
      border: '1px solid rgba(0, 0, 0, 0.12)',
    }}>
      <Typography 
        variant="h5" 
        gutterBottom 
        align="center"
        sx={{ 
          fontWeight: 600, 
          mb: 3
        }}
      >
        Wykresy Porównawcze
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          textColor="primary"
          indicatorColor="primary"
          centered
        >
          <Tab label="Kapitał do spłaty w czasie" />
          <Tab label="Struktura kapitał/odsetki" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Typography variant="subtitle1" gutterBottom align="center" sx={{ mb: 2 }}>
          Porównanie pozostałego kapitału do spłaty w czasie
        </Typography>
        <Box sx={{ height: 400, mt: 3, px: { xs: 0, sm: 2 } }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={prepareDebtChartData()}
              margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis 
                tickFormatter={(value) => value.toLocaleString('pl-PL')}
              />
              <Tooltip content={<DebtChartTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="baseDebt"
                name="Kapitał bez nadpłat"
                stroke="#0A2472" // Dark blue for base scenario
                strokeWidth={2}
                dot={{ r: 0 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="overDebt"
                name="Kapitał z nadpłatami"
                stroke="#FFC857" // Gold for overpayment scenario
                strokeWidth={2}
                dot={{ r: 0 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Typography variant="subtitle1" gutterBottom align="center" sx={{ mb: 2 }}>
          Struktura spłaty - kapitał vs. odsetki
        </Typography>
        <Box sx={{ height: 400, mt: 3, px: { xs: 0, sm: 2 } }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={prepareStructureChartData()}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis 
                tickFormatter={(value) => value.toLocaleString('pl-PL')}
              />
              <Tooltip content={<StructureChartTooltip />} />
              <Legend />
              <Bar
                dataKey="capital"
                name="Kapitał"
                stackId="a"
                fill="#0A2472" // Dark blue for capital
              />
              <Bar
                dataKey="interest"
                name="Odsetki"
                stackId="a"
                fill="#FFC857" // Gold for interest
              />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </TabPanel>
    </Paper>
  );
};

export default ResultCharts; 