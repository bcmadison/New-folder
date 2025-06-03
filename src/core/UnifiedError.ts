import { unifiedMonitor } from './UnifiedMonitor';

export type ErrorCode =
  | 'INITIALIZATION_FAILED'
  | 'CONFIG_INITIALIZATION_FAILED'
  | 'INVALID_CONFIG'
  | 'CONFIG_NOT_INITIALIZED'
  | 'API_ERROR'
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'RESOURCE_NOT_FOUND'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INTERNAL_ERROR'
  | 'UNKNOWN_ERROR'
  | 'STATE_INITIALIZATION_FAILED'
  | 'STATE_NOT_INITIALIZED';

export interface ErrorContext {
  code: ErrorCode;
  message: string;
  details?: Record<string, any>;
  originalError?: Error;
  timestamp: number;
  component?: string;
  action?: string;
}

export class SystemError extends Error {
  public readonly code: ErrorCode;
  public readonly details: Record<string, any>;
  public readonly timestamp: number;
  public readonly component?: string;
  public readonly action?: string;
  private readonly originalError?: Error;

  constructor(
    code: ErrorCode,
    message: string,
    originalError?: Error,
    context?: Partial<ErrorContext>
  ) {
    super(message);
    this.name = 'SystemError';
    this.code = code;
    this.details = context?.details || {};
    this.timestamp = Date.now();
    this.component = context?.component;
    this.action = context?.action;
    this.originalError = originalError;

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, SystemError.prototype);

    // Track error in monitoring system
    this.trackError();
  }

  private trackError(): void {
    const errorContext: ErrorContext = {
      code: this.code,
      message: this.message,
      details: this.details,
      originalError: this.originalError,
      timestamp: this.timestamp,
      component: this.component,
      action: this.action
    };

    unifiedMonitor.reportError(this, errorContext);
  }

  public toJSON(): ErrorContext {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
      component: this.component,
      action: this.action
    };
  }

  public static fromError(error: Error, code: ErrorCode = 'UNKNOWN_ERROR'): SystemError {
    if (error instanceof SystemError) {
      return error;
    }

    return new SystemError(
      code,
      error.message,
      error,
      {
        details: {
          originalError: {
            name: error.name,
            message: error.message,
            stack: error.stack
          }
        }
      }
    );
  }

  public static isSystemError(error: any): error is SystemError {
    return error instanceof SystemError;
  }
}

// Error factory functions for common error types
export const createApiError = (message: string, details?: Record<string, any>): SystemError => {
  return new SystemError('API_ERROR', message, undefined, { details });
};

export const createValidationError = (message: string, details?: Record<string, any>): SystemError => {
  return new SystemError('VALIDATION_ERROR', message, undefined, { details });
};

export const createAuthError = (message: string, details?: Record<string, any>): SystemError => {
  return new SystemError('AUTHENTICATION_ERROR', message, undefined, { details });
};

export const createNotFoundError = (message: string, details?: Record<string, any>): SystemError => {
  return new SystemError('RESOURCE_NOT_FOUND', message, undefined, { details });
}; 