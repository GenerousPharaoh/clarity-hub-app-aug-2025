/**
 * Utility to safely render content as React children
 * Prevents "Objects are not valid as a React child" errors
 */
export function renderSafe(content: any): string {
  if (typeof content === 'string') {
    return content;
  }
  
  if (content instanceof Error) {
    return content.message;
  }
  
  if (typeof content === 'object' && content !== null) {
    // If it's an object with a message property, use that
    if (content.message && typeof content.message === 'string') {
      return content.message;
    }
    
    // If it's an object with toString method, use that
    if (typeof content.toString === 'function' && content.toString !== Object.prototype.toString) {
      return content.toString();
    }
    
    // Otherwise, convert to JSON string (last resort)
    try {
      return JSON.stringify(content);
    } catch {
      return '[Object]';
    }
  }
  
  // For primitives (number, boolean, etc.), convert to string
  return String(content);
}