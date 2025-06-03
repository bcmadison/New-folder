import { toast } from 'react-toastify';

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public status?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const ErrorCodes = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  API_ERROR: 'API_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export const handleError = (error: unknown): void => {
  console.error('Error occurred:', error);

  if (error instanceof AppError) {
    switch (error.code) {
      case ErrorCodes.NETWORK_ERROR:
        toast.error('Network connection error. Please check your internet connection.');
        break;
      case ErrorCodes.API_ERROR:
        toast.error(`API Error: ${error.message}`);
        break;
      case ErrorCodes.VALIDATION_ERROR:
        toast.error(`Validation Error: ${error.message}`);
        break;
      case ErrorCodes.AUTH_ERROR:
        toast.error('Authentication error. Please log in again.');
        break;
      default:
        toast.error(error.message || 'An unexpected error occurred');
    }
  } else if (error instanceof Error) {
    toast.error(error.message || 'An unexpected error occurred');
  } else {
    toast.error('An unexpected error occurred');
  }
};

export const isNetworkError = (error: unknown): boolean => {
  return error instanceof AppError && error.code === ErrorCodes.NETWORK_ERROR;
};

export const isAuthError = (error: unknown): boolean => {
  return error instanceof AppError && error.code === ErrorCodes.AUTH_ERROR;
};

export const createError = (
  message: string,
  code: keyof typeof ErrorCodes,
  status?: number,
  details?: any
): AppError => {
  return new AppError(message, ErrorCodes[code], status, details);
}; 