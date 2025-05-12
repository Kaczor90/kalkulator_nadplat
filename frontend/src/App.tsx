import React from 'react';
import { ThemeProvider, createTheme, CssBaseline, Container } from '@mui/material';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import Header from './components/common/Header';
import Calculator from './components/calculator/Calculator';
// @ts-ignore
import RefinanceCalculator from './components/refinance/RefinanceCalculator';
import Home from './components/home/Home';
import Results from './components/results/Results';
import RefinanceResults from './components/refinance/results/RefinanceResults';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { pl } from 'date-fns/locale';

// Create a theme
const theme = createTheme({
  palette: {
    primary: {
      main: process.env.REACT_APP_THEME_PRIMARY_COLOR || '#2563EB', // Bright blue for primary elements
      light: '#DBEAFE',
      dark: '#1E40AF',
    },
    secondary: {
      main: process.env.REACT_APP_THEME_SECONDARY_COLOR || '#10B981', // Emerald green for accent elements
      light: '#D1FAE5',
      dark: '#047857',
    },
    background: {
      default: '#F9FAFB',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1F2937',
      secondary: '#6B7280',
    },
    error: {
      main: '#EF4444',
    },
    warning: {
      main: '#F59E0B',
    },
    info: {
      main: '#3B82F6',
    },
    success: {
      main: '#10B981',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      fontSize: '1.75rem',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
    },
    button: {
      fontWeight: 500,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
});

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={pl}>
          <CssBaseline />
          <Router>
            <div className="App">
              <Header />
              <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 4 }, py: 4 }}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/calculator" element={<Calculator />} />
                  <Route path="/refinance" element={<RefinanceCalculator />} />
                  <Route path="/results/:calculationId" element={<Results />} />
                  <Route path="/refinance-results/:calculationId" element={<RefinanceResults />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Container>
            </div>
          </Router>
        </LocalizationProvider>
      </ThemeProvider>
    </Provider>
  );
};

export default App;
