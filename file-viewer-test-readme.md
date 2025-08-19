# File Viewer Testing Guide

This guide explains how to test the file viewers in the Clarity Hub application.

## Testing Methods

There are multiple ways to test the file viewers:

### 1. Main Application Integrated Test

The best way to test is through the `/test-viewers` route in the application, which demonstrates how files are selected in the left panel and displayed in the right panel:

1. Start the development server with `npm run dev`
2. Navigate to http://localhost:5174/test-viewers
3. Click on any file card in the center panel
4. Observe the file being displayed in the right panel viewer
5. Test all file types: PDF, image, audio, video, and text

This approach confirms that:
- Files can be selected from the project file list
- The right panel properly renders the file
- All panels are visible simultaneously

### 2. Standalone Test Page

For more isolated testing, you can use the comprehensive test page:

1. Navigate to http://localhost:5174/comprehensive-file-test.html
2. Use the buttons in the left sidebar to load different file types
3. Test all file types and their rendering

## File Types Supported

The application supports the following file types:

- **PDF files** - Using PDFViewer component
- **Images** - Using ImageViewer component
- **Audio** - Using AudioViewer component
- **Video** - Using VideoViewer component
- **Text** - Using TextViewer component

## Common Issues

- **CORS issues**: Ensure the Supabase CORS settings are properly configured
- **Large file loading**: For large files, the viewer uses a blob URL approach to enable network-independent viewing after initial download
- **Lazy loading**: The viewers are lazy-loaded to improve performance

## Debugging Tips

- Check browser console for errors
- Inspect network requests to ensure files are loading
- Use the "Retry Loading" button for any file that fails to load initially

## Viewer Component Architecture

- `UniversalFileViewer.tsx` - Main container that handles file detection and delegates to appropriate viewer
- `FileViewer.tsx` - Core viewer used in the RightPanel of the application
- Individual specialized viewers (PDFViewer, ImageViewer, etc.) for each file type 