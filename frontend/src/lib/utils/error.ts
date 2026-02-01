import type { AxiosError } from 'axios';
import type { ApiError } from '@/lib/types';

/**
 * Extract error message from API error response
 */
export function getApiErrorMessage(
  error: unknown,
  defaultMessage = 'Une erreur est survenue'
): string {
  if (isAxiosError(error)) {
    const apiError = error.response?.data as ApiError | undefined;
    return apiError?.error?.message || defaultMessage;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return defaultMessage;
}

/**
 * Type guard for Axios errors
 */
function isAxiosError(error: unknown): error is AxiosError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error &&
    (error as AxiosError).isAxiosError === true
  );
}
