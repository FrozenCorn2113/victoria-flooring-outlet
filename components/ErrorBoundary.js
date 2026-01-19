import React from 'react';
import Link from 'next/link';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console
    console.error('Error caught by boundary:', error, errorInfo);

    // Store error details in state
    this.state = {
      hasError: true,
      error,
      errorInfo,
    };

    // Here you could also log to an error reporting service
    // Example: logErrorToService(error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-vfo-sand px-4">
          <div className="max-w-md w-full">
            <div className="bg-white border border-vfo-border rounded-sm shadow-sm p-8">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>

                <h1 className="text-2xl font-medium text-vfo-charcoal mb-2">
                  Oops! Something went wrong
                </h1>

                <p className="text-vfo-grey mb-6">
                  We encountered an unexpected error. Please try reloading the page or return to the homepage.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={this.handleReload}
                    className="px-6 py-3 bg-vfo-charcoal hover:bg-vfo-slate text-white font-medium rounded-sm transition-colors"
                  >
                    Reload Page
                  </button>

                  <Link
                    href="/"
                    className="px-6 py-3 bg-white hover:bg-vfo-sand border border-vfo-border text-vfo-charcoal font-medium rounded-sm transition-colors text-center"
                  >
                    Go to Homepage
                  </Link>
                </div>

                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="mt-6 text-left">
                    <summary className="cursor-pointer text-sm text-vfo-grey hover:text-vfo-charcoal">
                      Error details (dev only)
                    </summary>
                    <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                      {this.state.error.toString()}
                      {'\n\n'}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            </div>

            <p className="text-center text-sm text-vfo-grey mt-4">
              If this problem persists, please contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
