import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  Container, 
  useTheme, 
  useMediaQuery, 
  Button,
  ButtonGroup
} from '@mui/material';
import CalculateIcon from '@mui/icons-material/Calculate';
import PaymentsIcon from '@mui/icons-material/Payments';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { Link, useLocation } from 'react-router-dom';

const Header: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const location = useLocation();

  // Determine which path is active
  const isHome = location.pathname === '/';
  const isCalculatorActive = location.pathname.startsWith('/calculator') || (!isHome && !location.pathname.startsWith('/refinance'));
  const isRefinanceActive = location.pathname.startsWith('/refinance');

  return (
    <AppBar 
      position="sticky" 
      color="inherit"
      elevation={0}
      sx={{ 
        borderBottom: `1px solid ${theme.palette.divider}`,
        backgroundColor: 'background.paper',
      }}
    >
      <Container maxWidth="lg">
        <Toolbar sx={{ py: 1, flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 2 : 0 }}>
          <Box 
            component={Link} 
            to="/"
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              textDecoration: 'none',
              color: 'text.primary',
              mr: isMobile ? 0 : 2
            }}
          >
            <CalculateIcon 
              sx={{ 
                color: 'primary.main', 
                mr: 1.5, 
                fontSize: isMobile ? 24 : 28 
              }} 
            />
            <Typography 
              variant={isMobile ? "h6" : "h5"} 
              component="div" 
              sx={{ 
                fontWeight: 600,
                background: 'linear-gradient(to right, #2563EB, #10B981)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Kalkulator Kredytu
            </Typography>
          </Box>

          {/* Navigation links */}
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
            <ButtonGroup variant="outlined" size={isMobile ? "small" : "medium"}>
              <Button
                component={Link}
                to="/calculator"
                startIcon={<PaymentsIcon />}
                sx={{ 
                  px: { xs: 1, sm: 2 },
                  backgroundColor: isCalculatorActive ? 'primary.light' : 'transparent',
                  borderColor: isCalculatorActive ? 'primary.main' : 'divider',
                  color: isCalculatorActive ? 'primary.main' : 'text.secondary',
                  '&:hover': {
                    backgroundColor: 'primary.light',
                  }
                }}
              >
                Nadpłaty
              </Button>
              <Button
                component={Link}
                to="/refinance"
                startIcon={<CompareArrowsIcon />}
                sx={{ 
                  px: { xs: 1, sm: 2 },
                  backgroundColor: isRefinanceActive ? 'secondary.light' : 'transparent',
                  borderColor: isRefinanceActive ? 'secondary.main' : 'divider',
                  color: isRefinanceActive ? 'secondary.main' : 'text.secondary',
                  '&:hover': {
                    backgroundColor: 'secondary.light',
                  }
                }}
              >
                Refinansowanie
              </Button>
            </ButtonGroup>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header; 