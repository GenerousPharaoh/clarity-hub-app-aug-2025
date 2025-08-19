# Troubleshooting and Fixes

## Issues Identified and Fixed

### 1. Port Configuration Issues
The application was experiencing port conflicts with the Vite development server. WebSocket server errors were occurring because ports 5174 and 5175 were already in use.

**Fix:**
- Updated `vite.config.ts` to use more flexible port handling
- Removed the fixed HMR port configuration
- Added `strictPort: false` to allow Vite to automatically find available ports

### 2. PDF Viewer Issues
The PDFViewer component had potential issues with the PDF.js worker configuration.

**Fix:**
- Enhanced PDF.js worker configuration with a fallback to CDN if local worker file is not found
- Added error handler for missing worker script
- Improved the onLoad and onError handlers to properly propagate events
- Fixed TypeScript type errors for better type safety

### 3. TinyMCE Integration Issues
The TinyMCE editor files might not be properly copied or accessed.

**Fix:**
- Improved the `copy-tinymce.js` script to be more robust
- Added better error handling around file copy operations
- Added a check for the main TinyMCE JS file in addition to the directories
- Added proper try-catch blocks to prevent script failures

### 4. Environment Verification
Added a comprehensive environment check script to detect and prevent common configuration issues.

**Features:**
- Verification of required files presence
- Checking of port configuration in Vite
- Verification of PDF.js worker file
- Auto-fixing for missing TinyMCE files
- Clear reporting of environment status

## How to Use

1. **Environment Check**:
   ```
   npm run check-env
   ```

2. **Port Configuration Check**:
   ```
   npm run check-ports
   ```

3. **TinyMCE Copy**:
   ```
   npm run copy-tinymce
   ```

## Common Issues and Solutions

### App won't start due to port conflicts
Run with automatic port selection:
```
npm run dev
```

### PDF files not displaying
Ensure the PDF.js worker is available:
```
npm run check-env
```

### TinyMCE editor not loading
Try running the TinyMCE copy script:
```
npm run copy-tinymce
``` 