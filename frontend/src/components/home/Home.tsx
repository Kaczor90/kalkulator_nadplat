import React from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Grid as MuiGrid, 
  Button, 
  Card, 
  CardContent, 
  CardMedia, 
  CardActions, 
  useTheme 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PaymentsIcon from '@mui/icons-material/Payments';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';

// Utworzenie komponentu pomocniczego do obsługi właściwości Grid
const Grid = (props: any) => <MuiGrid {...props} />;

const Home: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 4, 
          mb: 4, 
          borderRadius: 2, 
          textAlign: 'center',
          border: `1px solid ${theme.palette.divider}` 
        }}
      >
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom 
          sx={{ 
            fontWeight: 700,
            mb: 2 
          }}
        >
          Kalkulator Kredytu Hipotecznego
        </Typography>
        <Typography 
          variant="subtitle1" 
          sx={{ 
            maxWidth: 800, 
            mx: 'auto', 
            mb: 4,
            color: 'text.secondary' 
          }}
        >
          Wybierz kalkulator, którego potrzebujesz do planowania swojego kredytu hipotecznego. 
          Oferujemy dwa specjalistyczne narzędzia dopasowane do Twoich potrzeb.
        </Typography>

        <Box
          sx={{
            display: 'flex',
            flexDirection: {xs: 'column', sm: 'row'},
            gap: {xs: 3, sm: 4},
            justifyContent: 'center',
            width: '100%'
          }}
        >
          <Box sx={{ width: {xs: '100%', sm: '50%'}, maxWidth: {sm: '400px'} }}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                }
              }}
            >
              <Box 
                sx={{ 
                  bgcolor: 'primary.light', 
                  p: 4, 
                  display: 'flex', 
                  justifyContent: 'center',
                  alignItems: 'center' 
                }}
              >
                <PaymentsIcon 
                  sx={{ 
                    fontSize: 80, 
                    color: 'primary.main' 
                  }} 
                />
              </Box>
              <CardContent sx={{ flexGrow: 1, p: 3 }}>
                <Typography 
                  gutterBottom 
                  variant="h5" 
                  component="h2" 
                  sx={{ fontWeight: 600 }}
                >
                  Kalkulator Nadpłat Kredytu
                </Typography>
                <Typography>
                  Dowiedz się, jak nadpłaty wpłyną na Twój kredyt. Oblicz oszczędności na odsetkach, 
                  skrócenie okresu kredytowania lub zmniejszenie miesięcznej raty.
                </Typography>
              </CardContent>
              <CardActions sx={{ p: 3, pt: 0 }}>
                <Button 
                  size="large" 
                  variant="contained" 
                  fullWidth
                  onClick={() => navigate('/calculator')}
                  sx={{ py: 1.5 }}
                >
                  Wybierz
                </Button>
              </CardActions>
            </Card>
          </Box>

          <Box sx={{ width: {xs: '100%', sm: '50%'}, maxWidth: {sm: '400px'} }}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                }
              }}
            >
              <Box 
                sx={{ 
                  bgcolor: 'secondary.light', 
                  p: 4, 
                  display: 'flex', 
                  justifyContent: 'center',
                  alignItems: 'center' 
                }}
              >
                <CompareArrowsIcon 
                  sx={{ 
                    fontSize: 80, 
                    color: 'secondary.main' 
                  }} 
                />
              </Box>
              <CardContent sx={{ flexGrow: 1, p: 3 }}>
                <Typography 
                  gutterBottom 
                  variant="h5" 
                  component="h2" 
                  sx={{ fontWeight: 600 }}
                >
                  Kalkulator Refinansowania Kredytu
                </Typography>
                <Typography>
                  Sprawdź, czy refinansowanie Twojego kredytu będzie opłacalne. Porównaj warianty z niższą ratą lub 
                  krótszym okresem kredytowania i zobacz potencjalne oszczędności.
                </Typography>
              </CardContent>
              <CardActions sx={{ p: 3, pt: 0 }}>
                <Button 
                  size="large" 
                  variant="contained" 
                  color="secondary"
                  fullWidth
                  onClick={() => navigate('/refinance')}
                  sx={{ py: 1.5 }}
                >
                  Wybierz
                </Button>
              </CardActions>
            </Card>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Home; 