import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
}

class SourcesErrorBoundary extends Component<Props, State> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Sources error:', error);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default simple error UI (using localized strings from Sources.tsx fallback)
      /* eslint-disable i18next/no-literal-string */
      return (
        <div
          className="border-border-medium bg-surface-secondary flex flex-col items-center justify-center rounded-lg border p-4 text-center"
          role="alert"
          aria-live="polite"
        >
          <div className="text-text-secondary mb-2 text-sm">Sources temporarily unavailable</div>
          <button
            onClick={() => window.location.reload()}
            className="hover:bg-surface-primary-hover bg-surface-primary text-text-primary focus:ring-ring rounded-md px-3 py-1 text-sm focus:ring-2 focus:outline-none"
            aria-label="Reload the page"
          >
            Refresh
          </button>
        </div>
      );
      /* eslint-enable i18next/no-literal-string */
    }

    return this.props.children;
  }
}

export default SourcesErrorBoundary;
