import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, showDetails: false };

  static getDerivedStateFromError(error: Error): Pick<State, 'hasError' | 'error'> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, showDetails: false });
  };

  toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const { showDetails, error } = this.state;

      return (
        <div className="flex min-h-screen items-center justify-center bg-surface-50 dark:bg-surface-900 p-6">
          <div className="w-full max-w-sm text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/30">
              <AlertTriangle className="h-6 w-6 text-red-500 dark:text-red-400" />
            </div>
            <h2 className="mb-2 font-heading text-xl font-semibold text-surface-900 dark:text-surface-100">
              Something went wrong
            </h2>
            <p className="mb-4 text-sm text-surface-500 dark:text-surface-400">
              An unexpected error occurred. You can try again or reload the page.
            </p>

            {error && (
              <div className="mb-6 text-left">
                <button
                  onClick={this.toggleDetails}
                  className="flex w-full items-center justify-between rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-xs font-medium text-surface-500 transition-colors hover:bg-surface-100 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-400 dark:hover:bg-surface-700"
                >
                  <span>Show technical details</span>
                  {showDetails ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </button>
                {showDetails && (
                  <div className="mt-1 rounded-lg border border-surface-200 bg-surface-100 px-3 py-2 dark:border-surface-700 dark:bg-surface-800/60">
                    <p className="break-words font-mono text-xs text-red-600 dark:text-red-400">
                      {error.message || 'Unknown error'}
                    </p>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
