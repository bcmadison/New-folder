import React, { Component, ReactNode } from 'react';


// Poe-style loading spinner
const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-8">
    <div className="loading-spinner border-4 border-primary-200 border-t-primary-500 rounded-full w-8 h-8 animate-spin mr-3" />
    <span className="text-gray-600 font-medium">Loading...</span>
  </div>
);

// Poe-style toast for errors
const Toast = ({ message, onClose }: { message: string; onClose: () => void }) => (
  <div className="fixed top-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-2xl text-white bg-red-500 animate-slide-up font-medium flex items-center">
    <span>{message}</span>
    <button className="ml-4 text-white text-xl font-bold" onClick={onClose}>&times;</button>
  </div>
);

// Empty state for null/undefined arrays
export const EmptyState = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
    <span className="text-4xl mb-2">🪹</span>
    <span className="font-medium">{message}</span>
  </div>
);

// Retry logic for API calls (3 attempts, exponential backoff)
export async function fetchWithRetry(url: string, options?: RequestInit, maxAttempts = 3): Promise<Response> {
  let attempt = 0;
  let delay = 500;
  while (attempt < maxAttempts) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (err) {
      attempt++;
      if (attempt >= maxAttempts) throw err;
      await new Promise(res => setTimeout(res, delay));
      delay *= 2;
    }
  }
  throw new Error('Max retry attempts reached');
}

// ErrorBoundary class component
interface ErrorBoundaryProps {
  children: ReactNode;
}
interface ErrorBoundaryState {
  error: Error | null;
  showToast: boolean;
  loading: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    error: null,
    showToast: false,
    loading: false,
  };

  // Log error to backend
  async logError(error: Error, info?: any) {
    try {
      await fetch('/api/errors/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          info,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch {}
  }

  static getDerivedStateFromError(error: Error) {
    return { error, showToast: true };
  }

  componentDidCatch(error: Error, info: any) {
    this.logError(error, info);
  }

  handleToastClose = () => {
    this.setState({ showToast: false });
  };

  // Optionally, provide a retry method for children
  retry = () => {
    this.setState({ error: null, showToast: false });
    // Optionally, could trigger a reload or re-fetch here
  };

  render() {
    const { error, showToast } = this.state;
    if (error) {
      return (
        <>
          {showToast && (
            <Toast
              message={
                error.message.includes('Network')
                  ? 'Network error. Please check your connection and try again.'
                  : 'Something went wrong. Please try again.'
              }
              onClose={this.handleToastClose}
            />
          )}
          <div className="flex flex-col items-center justify-center py-16">
            <span className="text-6xl mb-4">😢</span>
            <div className="text-lg font-bold mb-2">Oops! An error occurred.</div>
            <div className="text-gray-500 mb-4">{error.message}</div>
            <button
              className="modern-button bg-primary-500 text-white px-8 py-3 rounded-xl font-bold text-lg mt-2"
              onClick={this.retry}
            >
              Retry
            </button>
          </div>
        </>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary; 