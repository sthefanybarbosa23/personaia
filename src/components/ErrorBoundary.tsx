import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 text-white">
          <div className="bg-gray-900 border border-red-500/30 p-8 rounded-2xl max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Application Error
            </h2>
            <p className="text-gray-400 mb-6 text-sm">
              An unexpected error occurred. The application state might be corrupted.
            </p>
            {this.state.error && (
              <pre className="bg-gray-950 p-3 rounded-lg text-xs font-mono text-red-300 mb-6 overflow-x-auto border border-gray-800">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={() => {
                // @ts-ignore
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-medium py-2.5 px-4 rounded-xl transition-colors"
            >
              Restart Application
            </button>
          </div>
        </div>
      );
    }

    // @ts-ignore
    return this.props.children;
  }
}
