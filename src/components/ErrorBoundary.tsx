import React from 'react';
import { SystemError } from '../core/UnifiedError';
import { unifiedMonitor } from '../core/UnifiedMonitor';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: SystemError | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error: SystemError.fromError(error)
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    const systemError = new SystemError('INTERNAL_ERROR', error.message, error, {
      details: {
        componentStack: errorInfo.componentStack
      }
    });
    unifiedMonitor.reportError(systemError, {
      component: 'ErrorBoundary',
      action: 'componentDidCatch'
    });
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-screen bg-red-50">
          <div className="p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
            <p className="text-gray-700 mb-4">{this.state.error?.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
} 