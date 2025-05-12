import { Body, Controller, Get, HttpException, HttpStatus, Param, Post, UseInterceptors } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MortgageService } from './mortgage.service';
import { CalculationParamsDto, MortgageCalculationResponseDto } from './dto/mortgage-calculation.dto';
import { MortgageCalculation } from '../interfaces/mortgage.interface';
import { RefinanceDto } from './dto/refinance.dto';
import { RefinanceResponseDto } from './dto/refinance-response.dto';

// Dodaj interceptor do logowania żądań
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { body, method, url } = request;
    
    console.log(`----- Przychodzące żądanie: ${method} ${url} -----`);
    if (body && Object.keys(body).length > 0) {
      console.log('Body żądania:', JSON.stringify(body));
    }
    
    const now = Date.now();
    return next.handle().pipe(
      tap(() => {
        console.log(`----- Zakończono żądanie: ${method} ${url} - czas: ${Date.now() - now}ms -----`);
      }),
    );
  }
}

@ApiTags('mortgage')
@Controller('mortgage')
@UseInterceptors(LoggingInterceptor) // Dodaj interceptor tutaj
export class MortgageController {
  constructor(private readonly mortgageService: MortgageService) {}

  @Post('calculate')
  @ApiOperation({ summary: 'Calculate mortgage with overpayments' })
  @ApiResponse({
    status: 201,
    description: 'The mortgage calculation has been successfully created',
    type: MortgageCalculationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async calculateMortgage(@Body() params: CalculationParamsDto): Promise<MortgageCalculation> {
    try {
      console.log('Otrzymano żądanie kalkulacji z typem nadpłaty:', params.overpaymentEffect);
      console.log('Parametry cyklicznej nadpłaty:', params.cyclicOverpayment ? 'OBECNE' : 'BRAK');
      
      // Wykryj próbę użycia nadpłaty progresywnej
      if (params.overpaymentEffect === 'progressive_overpayment') {
        console.log('UWAGA! Wykryto żądanie kalkulacji z nadpłatą progresywną!');
        console.log('Szczegóły żądania:', JSON.stringify(params));
        
        if (!params.cyclicOverpayment) {
          console.log('BŁĄD: Brak ustawionej nadpłaty cyklicznej dla nadpłaty progresywnej');
          throw new Error('Nadpłata progresywna wymaga ustawienia nadpłaty cyklicznej');
        }
      }
      
      return await this.mortgageService.calculateMortgage(params);
    } catch (error) {
      console.error('Błąd podczas obliczania kredytu:', error.message);
      if (error.response) {
        console.error('Szczegóły błędu:', error.response);
      }
      
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Failed to calculate mortgage',
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a mortgage calculation by ID' })
  @ApiResponse({
    status: 200,
    description: 'The mortgage calculation has been found',
    type: MortgageCalculationResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Calculation not found' })
  async findById(@Param('id') id: string): Promise<MortgageCalculation> {
    const calculation = await this.mortgageService.findById(id);
    
    if (!calculation) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error: 'Calculation not found',
        },
        HttpStatus.NOT_FOUND,
      );
    }
    
    return calculation;
  }

  @Get()
  @ApiOperation({ summary: 'Get all mortgage calculations' })
  @ApiResponse({
    status: 200,
    description: 'List of all mortgage calculations',
    type: [MortgageCalculationResponseDto],
  })
  async findAll(): Promise<MortgageCalculation[]> {
    return await this.mortgageService.findAll();
  }
  
  @Post('test-progressive')
  @ApiOperation({ summary: 'Test progressive overpayment' })
  async testProgressive(): Promise<any> {
    try {
      // Utwórz przykładowe parametry z nadpłatą progresywną
      const testParams: CalculationParamsDto = {
        mortgageInput: {
          loanAmount: 300000,
          interestRate: 7.5,
          loanTerm: { years: 25, months: 0 },
          installmentType: 'equal',
          startDate: new Date(),
          interestRateChanges: [],
        },
        overpayments: [],
        cyclicOverpayment: {
          amount: 500,
          frequency: 'monthly',
        },
        overpaymentEffect: 'progressive_overpayment',
      };
      
      console.log('Testowanie nadpłaty progresywnej z parametrami:', JSON.stringify(testParams));
      return await this.mortgageService.calculateMortgage(testParams);
    } catch (error) {
      console.error('BŁĄD TESTU NADPŁATY PROGRESYWNEJ:', error);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Test failed',
          message: error.message,
          stack: error.stack,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('refinance')
  @ApiOperation({ summary: 'Calculate mortgage refinancing' })
  @ApiResponse({
    status: 201,
    description: 'Refinancing calculation completed successfully',
    type: RefinanceResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async calculateRefinance(@Body() refinanceDto: RefinanceDto): Promise<RefinanceResponseDto> {
    try {
      console.log('Otrzymano żądanie refinansowania kredytu z parametrami:', 
        JSON.stringify(refinanceDto, null, 2));
      
      const result = await this.mortgageService.calculateRefinance(refinanceDto);
      console.log('Refinansowanie kredytu zakończone sukcesem dla ID:', result.id);
      
      return result;
    } catch (error) {
      console.error('Błąd podczas obliczania refinansowania kredytu:', error.message);
      console.error('Stack błędu:', error.stack);
      
      if (error.response) {
        console.error('Szczegóły błędu:', error.response);
      }
      
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Failed to calculate refinancing',
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
} 