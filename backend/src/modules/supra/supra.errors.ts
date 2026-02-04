import axios from 'axios';
import { ErrorResponse } from './interface/supra.interfaces';

interface HandleErrorOptions {
  notFoundOn500?: boolean;
}

/**
 * Centralized error handler for Supra API calls.
 * Transforms Axios errors into consisten aplication errors
 *
 * @param e - The caught error
 * @param options - Optinal configuration for special case
 * @throws Always trows - return type is `never`
 */
export function handleSupraError(e: unknown, options?: HandleErrorOptions): Error {
  if (axios.isAxiosError(e)) {
    // Special case for not found id
    if (options?.notFoundOn500 && e.response?.status === 500) {
      const error = new Error('Payment not found');
      error.name = 'NotFoundError';
      throw error;
    }

    if (e.response?.data) {
      const serverError = e.response.data as ErrorResponse;
      throw new Error(`Supra API Error: ${serverError.message || e.message}`);
    }

    // In case that axios error dont have data
    throw new Error(`Supra API Error: ${e.message}`);
  }

  //  Non axios error - Not expected
  throw e instanceof Error ? e : new Error(String(e));
}
