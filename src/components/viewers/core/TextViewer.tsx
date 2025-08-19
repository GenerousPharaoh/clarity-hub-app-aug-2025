import React, { useState, useEffect } from 'react';
import { Box, CircularProgress, Typography, Alert, Paper } from '@mui/material';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Map of file extensions to language syntax for highlighting
const FILE_EXTENSION_TO_LANGUAGE: Record<string, string> = {
  // Text formats
  txt: 'text',
  md: 'markdown',
  // Code formats
  js: 'javascript',
  jsx: 'jsx',
  ts: 'typescript',
  tsx: 'tsx',
  html: 'html',
  css: 'css',
  json: 'json',
  xml: 'xml',
  yaml: 'yaml',
  yml: 'yaml',
  py: 'python',
  rb: 'ruby',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  cs: 'csharp',
  go: 'go',
  rs: 'rust',
  php: 'php',
  swift: 'swift',
  sh: 'bash',
  sql: 'sql',
  // Config files
  gitignore: 'text',
  env: 'text',
};

interface TextViewerProps {
  url: string;
  fileName?: string;
  metadata?: Record<string, any>;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

const TextViewer: React.FC<TextViewerProps> = ({ 
  url, 
  fileName,
  metadata,
  onLoad,
  onError 
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState<string>('');
  
  // Determine language for syntax highlighting
  const determineLanguage = () => {
    if (!fileName) return 'text';
    
    // Check if the file extension is known
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (extension && extension in FILE_EXTENSION_TO_LANGUAGE) {
      return FILE_EXTENSION_TO_LANGUAGE[extension];
    }
    
    // Try to determine from content-type
    if (metadata?.contentType) {
      if (metadata.contentType.includes('javascript')) return 'javascript';
      if (metadata.contentType.includes('typescript')) return 'typescript';
      if (metadata.contentType.includes('json')) return 'json';
      if (metadata.contentType.includes('html')) return 'html';
      if (metadata.contentType.includes('css')) return 'css';
      if (metadata.contentType.includes('xml')) return 'xml';
      if (metadata.contentType.includes('markdown')) return 'markdown';
    }
    
    // Default to plain text
    return 'text';
  };
  
  const language = determineLanguage();
  
  // Fetch text content
  useEffect(() => {
    if (!url) {
      setError('No URL provided');
      setLoading(false);
      if (onError) onError(new Error('No URL provided'));
      return;
    }
    
    setLoading(true);
    setError(null);
    
    const fetchText = async () => {
      try {
        // Try with credentials first
        let response: Response;
        try {
          response = await fetch(url, { credentials: 'include' });
        } catch (err) {
          console.warn('Failed to fetch with credentials, trying without');
          response = await fetch(url);
        }
        
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }
        
        const content = await response.text();
        setText(content);
        setLoading(false);
        if (onLoad) onLoad();
      } catch (err: any) {
        console.error('Error loading text content:', err);
        setError(`Failed to load text content: ${err.message}`);
        setLoading(false);
        if (onError) onError(err instanceof Error ? err : new Error(String(err)));
      }
    };
    
    fetchText();
  }, [url, onLoad, onError]);
  
  // Loading state
  if (loading) {
    return (
      <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={40} thickness={4} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Loading text content...
        </Typography>
      </Box>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }
  
  // Empty content
  if (!text || text.trim() === '') {
    return (
      <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Alert severity="info" sx={{ width: '100%', mb: 2 }}>
          This file is empty or contains no text content.
        </Alert>
      </Box>
    );
  }
  
  return (
    <Box sx={{ 
      height: '100%', 
      overflow: 'auto', 
      p: 2,
      bgcolor: 'background.paper' 
    }}>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          fontFamily: 'monospace',
          bgcolor: 'background.default',
          borderRadius: 1,
          overflow: 'auto',
          fontSize: '14px',
          maxWidth: '100%'
        }}
      >
        {language !== 'text' ? (
          <SyntaxHighlighter
            language={language}
            style={materialLight}
            customStyle={{ margin: 0, padding: 0, background: 'transparent' }}
            lineNumberStyle={{ minWidth: '3em', paddingRight: '1em', opacity: 0.5 }}
            showLineNumbers
            wrapLongLines
          >
            {text}
          </SyntaxHighlighter>
        ) : (
          <Box component="pre" sx={{ m: 0, p: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {text}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default TextViewer; 