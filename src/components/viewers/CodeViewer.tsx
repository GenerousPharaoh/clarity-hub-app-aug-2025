import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Alert,
  Paper,
  Button,
  Stack,
  Tooltip,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { 
  Download, 
  Code,
  ContentCopy
} from '@mui/icons-material';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, prism } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeViewerProps {
  url: string;
  fileName: string;
}

const CodeViewer: React.FC<CodeViewerProps> = ({ url, fileName }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string>('');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  
  // Extract file extension for language detection
  const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
  
  // Map file extension to language for syntax highlighting
  const getLanguage = (ext: string): string => {
    const languageMap: Record<string, string> = {
      js: 'javascript',
      jsx: 'jsx',
      ts: 'typescript',
      tsx: 'tsx',
      html: 'html',
      css: 'css',
      scss: 'scss',
      less: 'less',
      json: 'json',
      md: 'markdown',
      py: 'python',
      rb: 'ruby',
      java: 'java',
      kt: 'kotlin',
      c: 'c',
      cpp: 'cpp',
      cs: 'csharp',
      go: 'go',
      rs: 'rust',
      php: 'php',
      sql: 'sql',
      sh: 'bash',
      bat: 'batch',
      ps1: 'powershell',
      xml: 'xml',
      yaml: 'yaml',
      yml: 'yaml',
      dart: 'dart',
      swift: 'swift',
      lua: 'lua',
      r: 'r',
      scala: 'scala',
      perl: 'perl',
      groovy: 'groovy',
      vb: 'vbnet',
      clj: 'clojure',
      txt: 'text',
    };
    
    return languageMap[ext] || 'text';
  };
  
  // Get language for syntax highlighting
  const language = getLanguage(fileExtension);
  
  // Get syntax highlighting theme
  const syntaxTheme = theme === 'dark' ? vscDarkPlus : prism;
  
  // Fetch code content
  useEffect(() => {
    const fetchCode = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch code: ${response.status} ${response.statusText}`);
        }
        
        const text = await response.text();
        setCode(text);
      } catch (error) {
        console.error('Error fetching code:', error);
        setError('Failed to load code content. You can still download the file.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCode();
  }, [url]);
  
  // Handle file download
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Handle copy code to clipboard
  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopiedToClipboard(true);
    setTimeout(() => setCopiedToClipboard(false), 2000);
  };
  
  // Handle theme change
  const handleThemeChange = (event: any) => {
    setTheme(event.target.value);
  };
  
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        width: '100%', 
        height: '100%',
        p: 2
      }}
      data-test="code-viewer"
    >
      {/* Loading state */}
      {loading && (
        <Box sx={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%'
        }}>
          <CircularProgress size={40} thickness={4} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading code...
          </Typography>
        </Box>
      )}
      
      {/* Error state */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Code content */}
      {!loading && !error && (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header */}
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 2 
            }}
          >
            <Box>
              <Typography variant="h6" noWrap sx={{ maxWidth: '100%' }}>
                {fileName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {language.toUpperCase()} • {code.split('\n').length} lines
              </Typography>
            </Box>
            
            <Stack direction="row" spacing={1}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel id="theme-select-label">Theme</InputLabel>
                <Select
                  labelId="theme-select-label"
                  value={theme}
                  label="Theme"
                  onChange={handleThemeChange}
                  size="small"
                >
                  <MenuItem value="light">Light</MenuItem>
                  <MenuItem value="dark">Dark</MenuItem>
                </Select>
              </FormControl>
              
              <Tooltip title={copiedToClipboard ? "Copied!" : "Copy code"}>
                <IconButton onClick={handleCopyCode}>
                  <ContentCopy />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Download code">
                <IconButton onClick={handleDownload}>
                  <Download />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
          
          {/* Code content */}
          <Box 
            sx={{ 
              flexGrow: 1, 
              overflow: 'auto',
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              bgcolor: theme === 'dark' ? '#1E1E1E' : '#F8F8F8',
              '& pre': {
                margin: 0,
                borderRadius: 1,
              },
              '& code': {
                fontSize: '0.9rem',
                fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
              }
            }}
          >
            <SyntaxHighlighter
              language={language}
              style={syntaxTheme}
              showLineNumbers
              wrapLines
              customStyle={{
                margin: 0,
                padding: '16px',
                overflow: 'auto',
                borderRadius: '4px',
                height: '100%',
              }}
            >
              {code}
            </SyntaxHighlighter>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default CodeViewer; 