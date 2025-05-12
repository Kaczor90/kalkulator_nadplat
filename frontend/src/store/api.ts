import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { CalculationParams, MortgageCalculation } from '../interfaces/mortgage';
import { RefinanceParams, RefinanceResult } from '../interfaces/refinance';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ 
    baseUrl: process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3010/api'
      : process.env.REACT_APP_API_URL || '/api',
  }),
  tagTypes: ['MortgageCalculation', 'RefinanceCalculation'],
  endpoints: (builder) => ({
    calculateMortgage: builder.mutation<MortgageCalculation, CalculationParams>({
      query: (params) => {
        console.log('Wysyłanie żądania obliczenia kredytu z parametrami:', JSON.stringify(params));
        
        return {
          url: '/mortgage/calculate',
          method: 'POST',
          body: params,
        };
      },
      invalidatesTags: ['MortgageCalculation'],
    }),
    getMortgageCalculation: builder.query<MortgageCalculation | RefinanceResult, string>({
      query: (id) => `/mortgage/${id}`,
      providesTags: (result, error, id) => [
        { type: 'MortgageCalculation', id },
        { type: 'RefinanceCalculation', id }
      ],
    }),
    getAllMortgageCalculations: builder.query<MortgageCalculation[], void>({
      query: () => '/mortgage',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'MortgageCalculation' as const, id })),
              { type: 'MortgageCalculation', id: 'LIST' },
            ]
          : [{ type: 'MortgageCalculation', id: 'LIST' }],
    }),
    calculateRefinance: builder.mutation<RefinanceResult, RefinanceParams>({
      query: (refinanceParams) => ({
        url: '/mortgage/refinance',
        method: 'POST',
        body: refinanceParams,
      }),
      invalidatesTags: ['RefinanceCalculation'],
    }),
  }),
});

export const {
  useCalculateMortgageMutation,
  useGetMortgageCalculationQuery,
  useGetAllMortgageCalculationsQuery,
  useCalculateRefinanceMutation,
} = apiSlice; 