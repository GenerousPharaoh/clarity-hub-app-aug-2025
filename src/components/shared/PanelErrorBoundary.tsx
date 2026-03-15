import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  label?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * A lightweight inline error boundary designed for panels.
 * Shows a compact error message + "Try again" button that fits
 * inside a panel without taking over the full page.
 */
export class PanelErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      `[PanelErrorBoundary${this.props.label ? ` — ${this.props.label}` : ''}] Uncaught error:`,
      error
    );
    console.error('[PanelErrorBoundary] Component stack:', errorInfo.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full items-center justify-center p-6">
          <div className="flex max-w-xs flex-col items-center text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20">
              <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400" />
            </div>
            <p className="mt-3 text-sm font-medium text-surface-700 dark:text-surface-200">
              {this.props.label
                ? `${this.props.label} encountered an error`
                : 'Something went wrong'}
            </p>
            <p className="mt-1 text-xs text-surface-400 dark:text-surface-500">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={this.handleReset}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-primary-700"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
