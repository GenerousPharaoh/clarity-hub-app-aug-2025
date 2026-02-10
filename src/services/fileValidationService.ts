/**
 * File Validation Security Service
 * 
 * Provides comprehensive security validation for file uploads including:
 * - Path traversal prevention
 * - File extension allowlist validation
 * - File type/MIME type validation
 * - File size limits
 * - File name sanitization
 */

// Allowed file extensions with their corresponding MIME types
const ALLOWED_FILE_TYPES = {
  // Document formats
  'pdf': ['application/pdf'],
  'doc': ['application/msword'],
  'docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  'txt': ['text/plain'],
  'rtf': ['application/rtf', 'text/rtf'],
  
  // Spreadsheet formats
  'xls': ['application/vnd.ms-excel'],
  'xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  'csv': ['text/csv'],
  
  // Image formats
  'jpg': ['image/jpeg'],
  'jpeg': ['image/jpeg'],
  'png': ['image/png'],
  'gif': ['image/gif'],
  'bmp': ['image/bmp'],
  'tiff': ['image/tiff'],
  'tif': ['image/tiff'],
  'webp': ['image/webp'],
  'svg': ['image/svg+xml'],
  
  // Audio formats
  'mp3': ['audio/mpeg', 'audio/mp3'],
  'wav': ['audio/wav', 'audio/wave'],
  'm4a': ['audio/mp4', 'audio/m4a'],
  'aac': ['audio/aac'],
  'ogg': ['audio/ogg'],
  'flac': ['audio/flac'],
  
  // Video formats
  'mp4': ['video/mp4'],
  'mov': ['video/quicktime'],
  'avi': ['video/x-msvideo'],
  'mkv': ['video/x-matroska'],
  'webm': ['video/webm'],
  'wmv': ['video/x-ms-wmv'],
  'flv': ['video/x-flv'],
  
  // Email formats
  'eml': ['message/rfc822'],
  'msg': ['application/vnd.ms-outlook'],
  
  // Presentation formats
  'ppt': ['application/vnd.ms-powerpoint'],
  'pptx': ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  
  // Archive formats (be cautious with these)
  'zip': ['application/zip'],
  'rar': ['application/vnd.rar'],
  '7z': ['application/x-7z-compressed'],
  
  // Text-based formats
  'html': ['text/html'],
  'xml': ['text/xml', 'application/xml'],
  'json': ['application/json'],
} as const;

// Maximum file size in bytes (50MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Dangerous file extensions that should never be allowed
const DANGEROUS_EXTENSIONS = [
  'exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs', 'vbe', 'js', 'jse', 'wsf', 'wsh',
  'msi', 'msp', 'hta', 'cpl', 'scf', 'lnk', 'inf', 'reg', 'dll', 'sys', 'drv',
  'ps1', 'psm1', 'psd1', 'ps1xml', 'psc1', 'ps2', 'ps2xml', 'psc2', 'msh', 'msh1',
  'msh2', 'mshxml', 'msh1xml', 'msh2xml', 'application', 'gadget', 'msc', 'jar',
  'deb', 'rpm', 'pkg', 'dmg', 'app', 'action', 'apk', 'bin', 'command', 'workflow'
];

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedFileName: string;
  detectedMimeType?: string;
  fileSize: number;
}

export class FileValidationService {
  /**
   * Comprehensive file validation
   */
  static validateFile(file: File): FileValidationResult {
    const errors: string[] = [];
    let isValid = true;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      errors.push(`File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
      isValid = false;
    }

    if (file.size === 0) {
      errors.push('File is empty');
      isValid = false;
    }

    // Sanitize file name and validate extension
    const sanitizedFileName = this.sanitizeFileName(file.name);
    const extension = this.getFileExtension(sanitizedFileName).toLowerCase();
    
    // Check for dangerous extensions
    if (DANGEROUS_EXTENSIONS.includes(extension)) {
      errors.push(`File extension '${extension}' is not allowed for security reasons`);
      isValid = false;
    }

    // Check if extension is in allowlist
    if (!Object.keys(ALLOWED_FILE_TYPES).includes(extension)) {
      errors.push(`File extension '${extension}' is not supported. Allowed types: ${Object.keys(ALLOWED_FILE_TYPES).join(', ')}`);
      isValid = false;
    }

    // Validate MIME type against extension
    if (isValid && extension) {
      const allowedMimeTypes = ALLOWED_FILE_TYPES[extension as keyof typeof ALLOWED_FILE_TYPES];
      if (!allowedMimeTypes.includes(file.type as any)) {
        // Allow empty MIME type for some file types, but warn
        if (file.type === '') {
          // File has no MIME type, but extension is allowed - proceed
        } else {
          errors.push(`MIME type '${file.type}' does not match expected types for '${extension}' files: ${allowedMimeTypes.join(', ')}`);
          isValid = false;
        }
      }
    }

    return {
      isValid,
      errors,
      sanitizedFileName,
      detectedMimeType: file.type,
      fileSize: file.size
    };
  }

  /**
   * Sanitize file name to prevent path traversal and other security issues
   */
  static sanitizeFileName(fileName: string): string {
    if (!fileName || typeof fileName !== 'string') {
      return 'unnamed_file';
    }

    // Remove any path components (path traversal prevention)
    let sanitized = fileName.replace(/.*[/\\]/, '');
    
    // Remove or replace dangerous characters
    sanitized = sanitized
      .replace(/[<>:"|?*]/g, '_') // Replace invalid filename characters
      .replace(/\.\./g, '_') // Remove directory traversal attempts
      .replace(/^\.+/, '') // Remove leading dots
      .replace(/\.+$/, '') // Remove trailing dots
      .replace(/\s+/g, '_') // Replace whitespace with underscores
      .replace(/_+/g, '_') // Replace multiple underscores with single
      .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores

    // Ensure filename is not empty after sanitization
    if (!sanitized) {
      sanitized = 'unnamed_file';
    }

    // Limit filename length (keeping extension)
    const maxLength = 100;
    if (sanitized.length > maxLength) {
      const extension = this.getFileExtension(sanitized);
      const baseName = sanitized.substring(0, sanitized.lastIndexOf('.') || sanitized.length);
      const truncatedBase = baseName.substring(0, maxLength - extension.length - 1);
      sanitized = extension ? `${truncatedBase}.${extension}` : truncatedBase;
    }

    return sanitized;
  }

  /**
   * Generate safe storage path to prevent path traversal
   */
  static generateSafeStoragePath(userId: string, projectId: string, fileName: string): string {
    // Sanitize all components
    const safeUserId = this.sanitizePathComponent(userId);
    const safeProjectId = this.sanitizePathComponent(projectId);
    const safeFileName = this.sanitizeFileName(fileName);
    
    // Add timestamp to prevent filename collisions
    const timestamp = Date.now();
    const extension = this.getFileExtension(safeFileName);
    const baseName = safeFileName.substring(0, safeFileName.lastIndexOf('.') || safeFileName.length);
    const uniqueFileName = extension ? `${baseName}_${timestamp}.${extension}` : `${baseName}_${timestamp}`;
    
    return `${safeUserId}/${safeProjectId}/${uniqueFileName}`;
  }

  /**
   * Sanitize path components to prevent directory traversal
   */
  private static sanitizePathComponent(component: string): string {
    if (!component || typeof component !== 'string') {
      return 'unknown';
    }

    return component
      .replace(/[^a-zA-Z0-9_-]/g, '_') // Only allow alphanumeric, underscore, and dash
      .replace(/_+/g, '_') // Replace multiple underscores
      .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
      .substring(0, 50) || 'unknown'; // Limit length
  }

  /**
   * Get file extension from filename
   */
  private static getFileExtension(fileName: string): string {
    const lastDotIndex = fileName.lastIndexOf('.');
    return lastDotIndex !== -1 ? fileName.substring(lastDotIndex + 1) : '';
  }

  /**
   * Validate multiple files at once
   */
  static validateFiles(files: File[]): { validFiles: File[]; invalidFiles: { file: File; errors: string[] }[] } {
    const validFiles: File[] = [];
    const invalidFiles: { file: File; errors: string[] }[] = [];

    files.forEach(file => {
      const validation = this.validateFile(file);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        invalidFiles.push({ file, errors: validation.errors });
      }
    });

    return { validFiles, invalidFiles };
  }

  /**
   * Get allowed file types for dropzone configuration
   */
  static getDropzoneAcceptTypes(): { [key: string]: string[] } {
    const acceptTypes: { [key: string]: string[] } = {};
    
    Object.entries(ALLOWED_FILE_TYPES).forEach(([extension, mimeTypes]) => {
      mimeTypes.forEach(mimeType => {
        if (!acceptTypes[mimeType]) {
          acceptTypes[mimeType] = [];
        }
        acceptTypes[mimeType].push(`.${extension}`);
      });
    });

    return acceptTypes;
  }

  /**
   * Get maximum file size
   */
  static getMaxFileSize(): number {
    return MAX_FILE_SIZE;
  }

  /**
   * Get allowed extensions list
   */
  static getAllowedExtensions(): string[] {
    return Object.keys(ALLOWED_FILE_TYPES);
  }
}

export default FileValidationService;