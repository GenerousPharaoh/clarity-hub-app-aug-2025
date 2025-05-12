import { ErrorInfo } from 'react';

// Define error types for better categorization and handling
export enum ErrorType {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  STORAGE = 'storage',
  DATABASE = 'database',
  API = 'api',
  RENDERING = 'rendering',
  UNKNOWN = 'unknown'
}

// Error severity levels
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// Custom error class with additional context
export class AppError extends Error {
  type: ErrorType;
  severity: ErrorSeverity;
  code: string;
  metadata: Record<string, any>;
  timestamp: Date;
  
  constructor(
    message: string, 
    type: ErrorType = ErrorType.UNKNOWN, 
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    code: string = 'ERR_UNKNOWN',
    metadata: Record<string, any> = {}
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.severity = severity;
    this.code = code;
    this.metadata = metadata;
    this.timestamp = new Date();
    
    // Maintain proper stack trace
    Object.setPrototypeOf(this, AppError.prototype);
  }
  
  // Format error for logging and display
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      severity: this.severity,
      code: this.code,
      metadata: this.metadata,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack
    };
  }
  
  // Create a user-friendly message
  getUserMessage(): string {
    switch (this.type) {
      case ErrorType.NETWORK:
        return 'Network connection issue. Please check your internet connection and try again.';
      
      case ErrorType.AUTHENTICATION:
        return 'Authentication error. Please log in again.';
      
      case ErrorType.AUTHORIZATION:
        return 'You don\'t have permission to perform this action.';
      
      case ErrorType.VALIDATION:
        return 'The input provided is invalid. Please check your data and try again.';
      
      case ErrorType.STORAGE:
        return 'Storage error. There was a problem saving or retrieving your data.';
      
      case ErrorType.DATABASE:
        return 'Database error. Please try again later.';
      
      case ErrorType.API:
        return 'Service communication error. Please try again later.';
      
      case ErrorType.RENDERING:
        return 'Display error. Please refresh the page.';
      
      default:
        return 'An unexpected error occurred. Please try again or contact support.';
    }
  }
}

// Factory functions for common error types
export const createNetworkError = (message: string, metadata: Record<string, any> = {}) => 
  new AppError(message, ErrorType.NETWORK, ErrorSeverity.ERROR, 'ERR_NETWORK', metadata);

export const createAuthError = (message: string, metadata: Record<string, any> = {}) => 
  new AppError(message, ErrorType.AUTHENTICATION, ErrorSeverity.ERROR, 'ERR_AUTH', metadata);

export const createPermissionError = (message: string, metadata: Record<string, any> = {}) => 
  new AppError(message, ErrorType.AUTHORIZATION, ErrorSeverity.WARNING, 'ERR_PERMISSION', metadata);

export const createStorageError = (message: string, metadata: Record<string, any> = {}) => 
  new AppError(message, ErrorType.STORAGE, ErrorSeverity.ERROR, 'ERR_STORAGE', metadata);

// Error history storage (for debugging and analytics)
const errorHistory: AppError[] = [];
const MAX_ERROR_HISTORY = 50;

// Error handling service class
class ErrorHandlingService {
  private isInitialized = false;
  private onErrorHandlers: Array<(error: Error) => void> = [];
  
  // Initialize global error handlers
  init() {
    if (this.isInitialized) return;
    
    // Global uncaught error handler
    window.addEventListener('error', this.handleGlobalError);
    
    // Promise rejection handler
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
    
    this.isInitialized = true;
    
    console.log('Error handling service initialized');
  }
  
  // Clean up handlers
  destroy() {
    window.removeEventListener('error', this.handleGlobalError);
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
    this.isInitialized = false;
  }
  
  // Handle global errors
  private handleGlobalError = (event: ErrorEvent) => {
    const { message, filename, lineno, colno, error } = event;
    
    this.captureError(
      error || new Error(message),
      {
        source: 'window.onerror',
        location: `${filename}:${lineno}:${colno}`
      }
    );
  };
  
  // Handle unhandled promise rejections
  private handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    const error = event.reason instanceof Error 
      ? event.reason 
      : new Error(String(event.reason));
    
    this.captureError(error, { source: 'unhandledrejection' });
  };
  
  // React error boundary handler
  handleComponentError = (error: Error, errorInfo: ErrorInfo) => {
    this.captureError(error, { 
      source: 'react',
      componentStack: errorInfo.componentStack 
    });
  };
  
  // API error handler
  handleApiError = (error: Error, endpoint?: string) => {
    // Convert to appropriate AppError type
    const appError = this.classifyApiError(error, endpoint);
    this.captureError(appError);
    return appError;
  };
  
  // Classify API errors into our error types
  private classifyApiError(error: any, endpoint?: string): AppError {
    // Default values
    let message = error.message || 'Unknown API error';
    let type = ErrorType.API;
    let severity = ErrorSeverity.ERROR;
    let code = 'ERR_API';
    
    // Extract status code if available
    const status = error.status || error.statusCode || (error.response && error.response.status);
    
    if (status) {
      // Classify based on HTTP status code
      if (status === 401) {
        type = ErrorType.AUTHENTICATION;
        code = 'ERR_UNAUTHORIZED';
        message = 'Authentication required';
      } else if (status === 403) {
        type = ErrorType.AUTHORIZATION;
        code = 'ERR_FORBIDDEN';
        message = 'Access denied';
      } else if (status === 404) {
        type = ErrorType.API;
        code = 'ERR_NOT_FOUND';
        message = 'Resource not found';
      } else if (status === 400 || status === 422) {
        type = ErrorType.VALIDATION;
        code = 'ERR_VALIDATION';
      } else if (status >= 500) {
        type = ErrorType.API;
        severity = ErrorSeverity.CRITICAL;
        code = 'ERR_SERVER';
        message = 'Server error';
      }
    } else if (error.message && typeof error.message === 'string') {
      // Classify based on error message content
      const msg = error.message.toLowerCase();
      
      if (msg.includes('network') || msg.includes('connection') || msg.includes('offline')) {
        type = ErrorType.NETWORK;
        code = 'ERR_NETWORK';
      } else if (msg.includes('timeout')) {
        type = ErrorType.NETWORK;
        code = 'ERR_TIMEOUT';
      } else if (msg.includes('authentication') || msg.includes('login') || msg.includes('token')) {
        type = ErrorType.AUTHENTICATION;
        code = 'ERR_AUTH';
      } else if (msg.includes('permission') || msg.includes('forbidden') || msg.includes('access denied')) {
        type = ErrorType.AUTHORIZATION;
        code = 'ERR_PERMISSION';
      } else if (msg.includes('validation') || msg.includes('invalid')) {
        type = ErrorType.VALIDATION;
        code = 'ERR_VALIDATION';
      } else if (msg.includes('storage') || msg.includes('upload') || msg.includes('download')) {
        type = ErrorType.STORAGE;
        code = 'ERR_STORAGE';
      }
    }
    
    return new AppError(
      message,
      type,
      severity,
      code,
      {
        originalError: error,
        endpoint,
        status,
      }
    );
  }
  
  // Register callback for errors
  onError(handler: (error: Error) => void) {
    this.onErrorHandlers.push(handler);
    return () => {
      this.onErrorHandlers = this.onErrorHandlers.filter(h => h !== handler);
    };
  }
  
  // Main error capture method
  captureError(error: Error, context: Record<string, any> = {}) {
    // Convert to AppError if it's not already
    const appError = error instanceof AppError 
      ? error 
      : new AppError(
          error.message || 'Unknown error',
          ErrorType.UNKNOWN,
          ErrorSeverity.ERROR,
          'ERR_UNKNOWN',
          { originalError: error, ...context }
        );
    
    // Add to error history (maintaining max size)
    errorHistory.unshift(appError);
    if (errorHistory.length > MAX_ERROR_HISTORY) {
      errorHistory.pop();
    }
    
    // Log to console for development
    console.error('[ErrorService]', appError.toJSON());
    
    // In production, you would send to your error tracking service
    this.reportToErrorTracking(appError);
    
    // Notify listeners
    this.onErrorHandlers.forEach(handler => {
      try {
        handler(appError);
      } catch (handlerError) {
        console.error('Error in error handler:', handlerError);
      }
    });
    
    return appError;
  }
  
  // Get error history
  getErrorHistory() {
    return [...errorHistory];
  }
  
  // Clear error history
  clearErrorHistory() {
    errorHistory.length = 0;
  }
  
  // Report to error tracking service (like Sentry)
  private reportToErrorTracking(error: AppError) {
    // In production, you would implement actual error reporting
    if (process.env.NODE_ENV === 'production') {
      // Simulated error tracking service call
      console.log('[ErrorTracking] Would report to error service:', error.toJSON());
      
      // Implementation with a real service would go here
      // For example with Sentry:
      /*
      Sentry.captureException(error, {
        level: error.severity,
        tags: {
          type: error.type,
          code: error.code
        },
        extra: error.metadata
      });
      */
    }
  }
  
  // Helper to determine if an error should trigger a full page reload
  shouldTriggerReload(error: Error): boolean {
    if (!(error instanceof AppError)) return false;
    
    // Critical errors that affect the app's state might require reload
    return (
      error.severity === ErrorSeverity.CRITICAL ||
      error.type === ErrorType.RENDERING ||
      error.code === 'ERR_FATAL'
    );
  }
  
  // Helper to determine if user should be redirected to login
  shouldRedirectToLogin(error: Error): boolean {
    if (!(error instanceof AppError)) return false;
    
    return (
      error.type === ErrorType.AUTHENTICATION ||
      error.code === 'ERR_UNAUTHORIZED' ||
      error.code === 'ERR_SESSION_EXPIRED'
    );
  }
}

// Create and export a singleton instance
export const errorHandlingService = new ErrorHandlingService();

// Auto-initialize during import
errorHandlingService.init();

export default errorHandlingService; 