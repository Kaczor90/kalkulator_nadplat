import React from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  CircularProgress, 
  Button, 
  Paper, 
  useTheme,
  useMediaQuery,
  Divider,
  Fade,
  Breadcrumbs,
  Link as MuiLink,
  Card,
  CardContent,
  Alert
} from '@mui/material';
import { useGetMortgageCalculationQuery } from '../../store/api';
import ResultSummary from './ResultSummary';
import ResultCharts from './ResultCharts';
import InstallmentTable from './InstallmentTable';
import SavingsInfo from './SavingsInfo';
import { useNavigate, useParams, Link } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalculateIcon from '@mui/icons-material/Calculate';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { loadRobotoFonts } from '../../fonts'; // Import font loader
import { RefinanceResult } from '../../interfaces/refinance';
import { MortgageCalculation } from '../../interfaces/mortgage';

// Funkcja pomocnicza do sprawdzania typu wyniku
const isMortgageCalculation = (result: any): result is MortgageCalculation => {
  return result && result.params && result.result;
};

const isRefinanceResult = (result: any): result is RefinanceResult => {
  return result && result.variantA && result.variantB && result.variantC;
};

const Results: React.FC = () => {
  const { calculationId } = useParams<{ calculationId: string }>();
  const { data, isLoading, error } = useGetMortgageCalculationQuery(calculationId || '');
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Sprawdzenie typu otrzymanych danych
  const isRefinance = data ? isRefinanceResult(data) : false;
  
  // Dodanie logowania, aby sprawdzić dane otrzymane z API
  console.log('Results - data:', data);
  
  if (data && isMortgageCalculation(data)) {
    console.log('Results - params:', data.params);
    console.log('Results - mortgageInput:', data.params.mortgageInput);
  }

  const handleNewCalculation = () => {
    navigate('/');
  };

  const handleExportPDF = async () => {
    if (!data) return;
    
    // Dla kalkulatora refinansowania przekieruj do odpowiedniej strony wyników
    if (isRefinance) {
      navigate(`/refinance-results/${calculationId}`);
      return;
    }

    try {
      alert('Generowanie PDF. To może potrwać chwilę...');
      console.log('Starting PDF generation...');

      // Upewnij się, że mamy poprawny typ danych dla kalkulatora kredytu
      if (!isMortgageCalculation(data)) {
        throw new Error('Nieprawidłowy typ danych dla generowania PDF.');
      }

      // Create PDF document with increased precision
      const pdf = new jsPDF({
        unit: 'mm',
        format: 'a4',
        precision: 4
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Set up error handling for font loading
      console.log('Setting up font configuration...');
      let fontConfig = {
        useFont: 'helvetica',
        fontStyle: 'normal',
        fontLoadError: false
      };

      try {
        console.log('Attempting to load fonts...');
        const fontsLoaded = await loadRobotoFonts(pdf);
        if (fontsLoaded) {
          console.log('Roboto fonts loaded successfully.');
          fontConfig.useFont = 'Roboto';
        } else {
          console.warn('Roboto fonts failed to load, using Helvetica.');
          fontConfig.useFont = 'helvetica';
          fontConfig.fontLoadError = true;
        }
      } catch (fontError) {
        console.error('Error loading fonts:', fontError);
        fontConfig.useFont = 'helvetica';
        fontConfig.fontLoadError = true;
      }

      const margin = { top: 10, right: 10, bottom: 15, left: 10 };
      const contentWidth = pdfWidth - margin.left - margin.right;

      // Page 1: Summary, Savings, Charts
      console.log('Rendering Page 1: Generation Date');
      try {
        pdf.setFont(fontConfig.useFont, fontConfig.fontStyle);
        pdf.setFontSize(9);
        const today = new Date();
        pdf.text(
          `Wygenerowano: ${format(today, 'd MMMM yyyy, HH:mm', { locale: pl })}`,
          pdfWidth - margin.right,
          margin.top,
          { align: 'right' }
        );
      } catch (headerError) {
        console.error('Error rendering header:', headerError);
        throw new Error('Błąd podczas generowania nagłówka raportu');
      }

      let yPosition = margin.top + 5;

      // Render each section with error handling
      const sections = [
        { id: 'summary-section', name: 'Summary' },
        { id: 'savings-section', name: 'Savings' },
        { id: 'charts-section', name: 'Charts' }
      ];

      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element) {
          try {
            console.log(`Rendering ${section.name} Section...`);
            const canvas = await html2canvas(element, { 
              scale: 2,
              useCORS: true,
              logging: true,
              allowTaint: true
            });
            
            const imgData = canvas.toDataURL('image/png');
            const imgHeight = (canvas.height * contentWidth) / canvas.width;
            
            if (yPosition + imgHeight > pdfHeight - margin.bottom) {
              pdf.addPage();
              yPosition = margin.top;
            }
            
            pdf.addImage(imgData, 'PNG', margin.left, yPosition, contentWidth, imgHeight);
            yPosition += imgHeight + (section.id === 'charts-section' ? 0 : 3);
            
          } catch (sectionError) {
            console.error(`Error rendering ${section.name} section:`, sectionError);
            throw new Error(`Błąd podczas generowania sekcji ${section.name}`);
          }
        }
      }

      // Installment Table Pages with error handling
      console.log('Starting Installment Table Pages generation...');
      try {
        const installments = data.result.overpaymentScenario.installments;
        const installmentsPerPage = 28;
        const totalInstallmentPages = Math.ceil(installments.length / installmentsPerPage);

        const tableColumnStyles: Array<{
          header: string;
          dataKey: string;
          width: number;
          align: 'left' | 'center' | 'right';
        }> = [
          { header: 'Nr', dataKey: 'installmentNumber', width: 15, align: 'center' },
          { header: 'Data płatności', dataKey: 'date', width: 25, align: 'center' },
          { header: 'Rata (PLN)', dataKey: 'totalAmount', width: 28, align: 'right' },
          { header: 'Kapitał (PLN)', dataKey: 'principalAmount', width: 28, align: 'right' },
          { header: 'Odsetki (PLN)', dataKey: 'interestAmount', width: 28, align: 'right' },
          { header: 'Nadpłata (PLN)', dataKey: 'overpaymentAmount', width: 28, align: 'right' },
          { header: 'Pozostały dług (PLN)', dataKey: 'remainingDebt', width: 38, align: 'right' },
        ];
        
        // Calculate actual table width based on column definitions
        const actualTableWidth = tableColumnStyles.reduce((sum, col) => sum + col.width, 0);
        // Adjust left margin to center the table if it's narrower than contentWidth
        const tableLeftMargin = margin.left + (contentWidth - actualTableWidth) / 2;

        const formatAmount = (amount: number | undefined): string => {
          if (typeof amount !== 'number') return '0.00';
          return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        };

        const formatInstallmentNumber = (number: number): string => {
          return Math.round(number).toString();
        };

        const formatDate = (date: Date | string): string => {
          return format(new Date(date), 'dd.MM.yyyy');
        };
        
        const tableStartY = margin.top + 15;
        const rowHeight = 7;
        const headerHeight = 8;
        const fontSize = 10;
        const headerFontSize = 9;

        for (let i = 0; i < totalInstallmentPages; i++) {
          console.log(`Generating Installment Table Page ${i + 1} of ${totalInstallmentPages}`);
          pdf.addPage();
          const pageStartY = margin.top;
          
          if (fontConfig.useFont === 'Roboto') {
            pdf.setFont('Roboto-Bold');
          } else {
            pdf.setFont(fontConfig.useFont, 'bold');
          }
          pdf.setFontSize(14);
          pdf.text('Harmonogram Nadpłat', pdfWidth / 2, pageStartY, { align: 'center' });

          if (fontConfig.useFont === 'Roboto') {
            pdf.setFont('Roboto');
          } else {
            pdf.setFont(fontConfig.useFont, 'normal');
          }
          pdf.setFontSize(10);
          pdf.text(`Strona ${i + 1} z ${totalInstallmentPages}`, pdfWidth / 2, pageStartY + 7, { align: 'center' });

          let currentY = tableStartY;

          if (fontConfig.useFont === 'Roboto') {
            pdf.setFont('Roboto-Bold');
          } else {
            pdf.setFont(fontConfig.useFont, 'bold');
          }
          pdf.setFontSize(headerFontSize);
          pdf.setFillColor(240, 240, 240);
          pdf.rect(tableLeftMargin, currentY, actualTableWidth, headerHeight, 'F');
          
          let currentX = tableLeftMargin;
          tableColumnStyles.forEach(col => {
            pdf.text(col.header, currentX + (col.align === 'center' ? col.width / 2 : (col.align === 'right' ? col.width -2 : 2) ), currentY + headerHeight - 3, { align: col.align });
            currentX += col.width;
          });
          currentY += headerHeight;
          pdf.setDrawColor(200, 200, 200);
          pdf.line(tableLeftMargin, currentY, tableLeftMargin + actualTableWidth, currentY);

          if (fontConfig.useFont === 'Roboto') {
            pdf.setFont('Roboto');
          } else {
            pdf.setFont(fontConfig.useFont, 'normal');
          }
          pdf.setFontSize(fontSize);
          const pageInstallments = installments.slice(i * installmentsPerPage, (i + 1) * installmentsPerPage);

          pageInstallments.forEach((installment, rowIndex) => {
            if (rowIndex % 2 !== 0) { // Zebra striping
              pdf.setFillColor(248, 248, 248);
              pdf.rect(tableLeftMargin, currentY, actualTableWidth, rowHeight, 'F');
            }

            currentX = tableLeftMargin;
            tableColumnStyles.forEach(col => {
              let cellData = '';
              const rawValue = installment[col.dataKey as keyof typeof installment];

              if (col.dataKey === 'date') {
                cellData = formatDate(rawValue as string | Date);
              } else if (col.dataKey === 'installmentNumber') {
                cellData = formatInstallmentNumber(rawValue as number);
              } else if (typeof rawValue === 'number') {
                cellData = formatAmount(rawValue);
              } else if (rawValue === undefined && col.dataKey === 'overpaymentAmount') {
                  cellData = formatAmount(0);
              } else {
                cellData = String(rawValue);
              }
              
              const isOverpaymentColumn = col.dataKey === 'overpaymentAmount';
              const hasOverpayment = typeof installment.overpaymentAmount === 'number' && installment.overpaymentAmount > 0;

              if (isOverpaymentColumn && hasOverpayment) {
                if (fontConfig.useFont === 'Roboto') {
                  pdf.setFont('Roboto-Bold');
                } else {
                  pdf.setFont(fontConfig.useFont, 'bold');
                }
                pdf.setTextColor(0, 80, 180);
              }

              pdf.text(cellData, currentX + (col.align === 'center' ? col.width / 2 : (col.align === 'right' ? col.width -2 : 2) ), currentY + rowHeight - 2.5, { align: col.align, maxWidth: col.width - 4});
              
              if (isOverpaymentColumn && hasOverpayment) {
                if (fontConfig.useFont === 'Roboto') {
                  pdf.setFont('Roboto');
                } else {
                  pdf.setFont(fontConfig.useFont, 'normal');
                }
                pdf.setTextColor(0, 0, 0);
              }
              currentX += col.width;
            });
            currentY += rowHeight;
            if (rowIndex < pageInstallments.length -1) {
              pdf.line(tableLeftMargin, currentY, tableLeftMargin + actualTableWidth, currentY);
            }
          });
          pdf.setDrawColor(180,180,180);
          pdf.rect(tableLeftMargin, tableStartY, actualTableWidth, currentY - tableStartY); // Outer border for the current page table content

          // Page Footer (Numbering)
          const startInstallment = i * installmentsPerPage + 1;
          const endInstallment = Math.min((i + 1) * installmentsPerPage, installments.length);
          pdf.setFontSize(8);
          pdf.text(
            `Strona ${i + 1} z ${totalInstallmentPages} - Raty od ${startInstallment} do ${endInstallment}`,
            pdfWidth / 2,
            pdfHeight - margin.bottom + 10,
            { align: 'center' }
          );
        }
        
        if (pdf.getNumberOfPages() > 1) {
          const firstPageContent = document.getElementById('summary-section');
          if (!firstPageContent) {
            console.log('Deleting initial blank page.');
            pdf.deletePage(1);
          }
        }

        console.log('PDF generation complete. Saving file...');
        pdf.save(`Raport_Nadplat_Kredytu_${calculationId}.pdf`);
      } catch (installmentError) {
        console.error('Error generating installment table:', installmentError);
        throw new Error('Błąd podczas generowania tabeli rat');
      }
    } catch (generalError) {
      console.error('General error:', generalError);
      alert('Wystąpił błąd podczas generowania PDF.');
    }
  };

  if (isLoading) {
    return (
      <Container sx={{ py: 8, textAlign: 'center' }}>
        <Fade in={true} timeout={800}>
          <Box>
            <CircularProgress size={60} sx={{ color: 'primary.main' }} />
            <Typography variant="h6" sx={{ mt: 3, color: 'text.secondary' }}>
              Pobieranie wyników kalkulacji...
            </Typography>
          </Box>
        </Fade>
      </Container>
    );
  }

  if (error || !data) {
    return (
      <Container sx={{ py: 8 }}>
        <Fade in={true} timeout={600}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h5" color="error.main" gutterBottom fontWeight={600}>
                Wystąpił błąd podczas pobierania wyników
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: 600, mx: 'auto', mb: 4 }}>
                Nie mogliśmy pobrać danych dla tej kalkulacji. Spróbuj ponownie lub wykonaj nową kalkulację.
              </Typography>
              <Button 
                variant="contained" 
                onClick={handleNewCalculation}
                startIcon={<CalculateIcon />}
                size="large"
              >
                Nowa Kalkulacja
              </Button>
            </CardContent>
          </Card>
        </Fade>
      </Container>
    );
  }

  // Dla kalkulatora refinansowania przekieruj do odpowiedniej strony wyników
  if (isRefinance) {
    navigate(`/refinance-results/${calculationId}`);
    return null;
  }

  // Upewnij się, że mamy poprawny typ danych dla kalkulatora kredytu
  if (!isMortgageCalculation(data)) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          Nieodpowiedni typ danych dla tej strony wyników.
        </Alert>
        <Button 
          variant="contained" 
          startIcon={<ArrowBackIcon />} 
          onClick={handleNewCalculation}
        >
          Wróć do kalkulatora
        </Button>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Fade in={true} timeout={600}>
        <Box>
          <Box sx={{ mb: 3 }}>
            <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
              <MuiLink 
                component={Link} 
                to="/" 
                underline="hover" 
                color="text.secondary"
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                <CalculateIcon sx={{ mr: 0.5, fontSize: 18 }} />
                Kalkulator
              </MuiLink>
              <Typography color="text.primary" sx={{ fontWeight: 500 }}>
                Wyniki kalkulacji
              </Typography>
            </Breadcrumbs>
            
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2
            }}>
              <Typography 
                variant="h4" 
                component="h1" 
                sx={{ 
                  fontWeight: 700,
                  color: 'text.primary'
                }}
              >
                Wyniki symulacji kredytu
              </Typography>
              
              <Button
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={handleExportPDF}
                sx={{ 
                  height: 42,
                  borderColor: theme.palette.primary.main,
                }}
              >
                Pobierz raport
              </Button>
            </Box>
          </Box>

          <Divider sx={{ mb: 4 }} />

          <div id="results-content">
            <Box 
              id="summary-section"
              component={Paper}
              elevation={0}
              sx={{ 
                p: { xs: 2, sm: 3 }, 
                mb: 4, 
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 3
              }}
            >
              <ResultSummary 
                result={data.result} 
                overpaymentEffect={data.params.overpaymentEffect} 
                mortgageInput={data.params.mortgageInput}
              />
            </Box>
            
            <Box 
              id="savings-section"
              sx={{ mb: 4 }}
            >
              <SavingsInfo
                result={data.result}
                overpaymentEffect={data.params.overpaymentEffect}
              />
            </Box>
            
            <Box 
              id="charts-section"
              component={Paper}
              elevation={0}
              sx={{ 
                p: { xs: 2, sm: 3 }, 
                mb: 4, 
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 3
              }}
            >
              <ResultCharts result={data.result} />
            </Box>
            
            <Box 
              id="installment-table-section"
              component={Paper}
              elevation={0}
              sx={{ 
                p: { xs: 2, sm: 3 }, 
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 3
              }}
            >
              <InstallmentTable 
                result={data.result} 
                onExportPdf={handleExportPDF} 
                overpaymentEffect={data.params.overpaymentEffect}
              />
            </Box>
          </div>
          
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              startIcon={<ArrowBackIcon />}
              onClick={handleNewCalculation}
              size="large"
              sx={{ px: 4 }}
            >
              Nowa kalkulacja
            </Button>
          </Box>
        </Box>
      </Fade>
    </Container>
  );
};

export default Results; 