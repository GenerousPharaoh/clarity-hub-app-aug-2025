/**
 * Error handling utilities for the application
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const handleError = (error: any, context?: string) => {
  console.error(`Error${context ? ` in ${context}` : ''}:`, error);
  
  // Return user-friendly message
  if (error.code === 'NETWORK_ERROR') {
    return 'Network connection issue. Please check your internet connection.';
  } else if (error.code === 'AUTH_ERROR') {
    return 'Authentication failed. Please log in again.';
  } else if (error.code === 'PERMISSION_DENIED') {
    return 'You do not have permission to perform this action.';
  } else if (error.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
};

export const showNotification = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
  // For now, use alert for errors
  if (type === 'error') {
    alert(message);
  }
};