import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Chip,
  Stack,
} from '@mui/material';
import {
  Description,
  CloudUpload,
  Share,
  Settings,
} from '@mui/icons-material';
import RichDocumentEditor from './RichDocumentEditor';

interface ProfessionalEditorDemoProps {
  // Optional props for customization
}

const ProfessionalEditorDemo: React.FC<ProfessionalEditorDemoProps> = () => {
  const [content, setContent] = useState(`
    <h1>Professional Document Editor</h1>
    <p>Welcome to the upgraded Clarity Hub document editor. This powerful editor includes:</p>
    
    <h2>Key Features</h2>
    <ul>
      <li><strong>Rich text formatting</strong> - Bold, italic, underline, strikethrough</li>
      <li><strong>Professional typography</strong> - Multiple heading levels with beautiful styling</li>
      <li><strong>Advanced lists</strong> - Bulleted, numbered, and checklist support</li>
      <li><strong>Tables and media</strong> - Insert and format tables, images, and videos</li>
      <li><strong>Code support</strong> - Inline code and code blocks with syntax highlighting</li>
      <li><strong>Citations</strong> - Legal citation management for exhibits and references</li>
    </ul>
    
    <h2>Professional Quality</h2>
    <p>This editor provides <em>Google Docs</em> and <em>Notion-level quality</em> with:</p>
    
    <blockquote>
      "A clean, modern interface designed specifically for legal professionals and document-heavy workflows."
    </blockquote>
    
    <h3>Auto-save & Collaboration</h3>
    <p>Your work is automatically saved as you type, and the editor supports:</p>
    
    <ol>
      <li>Real-time auto-save functionality</li>
      <li>Word and character counting</li>
      <li>Full-screen editing mode</li>
      <li>Professional export options (PDF, DOCX, HTML)</li>
      <li>Find and replace capabilities</li>
      <li>Keyboard shortcuts for power users</li>
    </ol>
    
    <hr>
    
    <p><strong>Try it out:</strong> Start editing this document to see the professional features in action!</p>
  `);

  const [savedVersions, setSavedVersions] = useState<string[]>([]);

  // Mock exhibits for citation demo
  const mockExhibits = [
    { id: '1', tag: 'Exhibit A', name: 'Contract Agreement.pdf' },
    { id: '2', tag: 'Exhibit B', name: 'Financial Statement.xlsx' },
    { id: '3', tag: 'Exhibit C', name: 'Email Correspondence.msg' },
  ];

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
  };

  const handleSave = async (content: string) => {
    // Simulate saving to backend
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setSavedVersions(prev => [
          `Version ${prev.length + 1} - ${new Date().toLocaleTimeString()}`,
          ...prev.slice(0, 4) // Keep last 5 versions
        ]);
        resolve();
      }, 800);
    });
  };

  const handleExport = (format: 'pdf' | 'docx' | 'html') => {
    // Mock export functionality
    console.log(`Exporting document as ${format.toUpperCase()}...`);
    
    // In real implementation, this would trigger actual export
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `document.${format}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, backgroundColor: 'primary.main', color: 'white' }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Description fontSize="large" />
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Professional Document Editor
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
              Upgraded with TinyMCE for professional document creation
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Features Overview */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom fontWeight={600}>
          🚀 New Features Included
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap={1}>
          <Chip label="Auto-save" color="success" variant="outlined" />
          <Chip label="Word Count" color="primary" variant="outlined" />
          <Chip label="Full-screen Mode" color="secondary" variant="outlined" />
          <Chip label="Export (PDF/DOCX/HTML)" color="info" variant="outlined" />
          <Chip label="Find & Replace" color="warning" variant="outlined" />
          <Chip label="Professional Styling" color="error" variant="outlined" />
          <Chip label="Citation Management" color="success" variant="outlined" />
          <Chip label="Keyboard Shortcuts" color="primary" variant="outlined" />
        </Stack>
      </Paper>

      {/* Document Editor */}
      <Paper elevation={2} sx={{ height: '700px', overflow: 'hidden' }}>
        <RichDocumentEditor
          initialContent={content}
          onChange={handleContentChange}
          onSave={handleSave}
          onExport={handleExport}
          exhibits={mockExhibits}
          autoSave={true}
          autoSaveInterval={10000} // 10 seconds for demo
          height={650}
          placeholder="Start creating your professional document..."
          documentTitle="Professional Demo Document"
        />
      </Paper>

      {/* Document History */}
      {savedVersions.length > 0 && (
        <Paper elevation={1} sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            📝 Recent Saves
          </Typography>
          <Stack spacing={1}>
            {savedVersions.map((version, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 1,
                  backgroundColor: index === 0 ? 'success.light' : 'action.hover',
                  borderRadius: 1,
                }}
              >
                <CloudUpload fontSize="small" />
                <Typography variant="body2">
                  {version} {index === 0 && '(Latest)'}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Paper>
      )}

      {/* Instructions */}
      <Paper elevation={0} sx={{ p: 3, mt: 3, backgroundColor: 'background.default' }}>
        <Typography variant="h6" gutterBottom fontWeight={600}>
          💡 How to Use
        </Typography>
        <Typography variant="body2" paragraph>
          <strong>Save:</strong> Press Ctrl+S or click the Save button
        </Typography>
        <Typography variant="body2" paragraph>
          <strong>Fullscreen:</strong> Press F11 or click the Fullscreen button
        </Typography>
        <Typography variant="body2" paragraph>
          <strong>Find & Replace:</strong> Press Ctrl+F or use the Find button
        </Typography>
        <Typography variant="body2" paragraph>
          <strong>Insert Citation:</strong> Click "Insert Citation" to add legal references
        </Typography>
        <Typography variant="body2" paragraph>
          <strong>Export:</strong> Use the Export button to download as PDF, DOCX, or HTML
        </Typography>
      </Paper>
    </Container>
  );
};

export default ProfessionalEditorDemo;