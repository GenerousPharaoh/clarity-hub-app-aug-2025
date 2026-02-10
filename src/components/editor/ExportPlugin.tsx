/**
 * ExportPlugin - Export functionality for the Lexical editor
 * 
 * Features:
 * - Export to PDF, DOCX, HTML, Markdown
 * - Preserve citation formatting
 * - Professional legal document formatting
 */
import React, { useState } from 'react';
import {
  Menu,
  MenuItem,
  IconButton,
  Tooltip,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  GetApp,
  PictureAsPdf,
  Description,
  Code,
  TextSnippet
} from '@mui/icons-material';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot } from 'lexical';
import { $generateHtmlFromNodes } from '@lexical/html';

const ExportPlugin: React.FC = () => {
  const [editor] = useLexicalComposerContext();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const exportToHtml = () => {
    editor.update(() => {
      const htmlString = $generateHtmlFromNodes(editor);
      const blob = new Blob([htmlString], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'legal-document.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
    handleClose();
  };

  const exportToMarkdown = () => {
    editor.update(() => {
      const root = $getRoot();
      const textContent = root.getTextContent();
      const blob = new Blob([textContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'legal-document.md';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
    handleClose();
  };

  const exportToText = () => {
    editor.update(() => {
      const root = $getRoot();
      const textContent = root.getTextContent();
      const blob = new Blob([textContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'legal-document.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
    handleClose();
  };

  const printDocument = () => {
    editor.update(() => {
      const htmlString = $generateHtmlFromNodes(editor);
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Legal Document</title>
            <style>
              body {
                font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                line-height: 1.6;
                margin: 1in;
                color: #1a1a1a;
              }
              h1, h2, h3 { color: #1a1a1a; font-weight: 600; }
              h1 { font-size: 2rem; margin: 24px 0 16px 0; }
              h2 { font-size: 1.5rem; margin: 20px 0 12px 0; }
              h3 { font-size: 1.25rem; margin: 16px 0 8px 0; }
              p { margin: 8px 0; }
              ul, ol { margin: 8px 0; padding-left: 24px; }
              li { margin: 4px 0; }
              .citation {
                background-color: #e3f2fd;
                border: 1px solid #2563eb;
                border-radius: 4px;
                color: #1565c0;
                font-weight: 600;
                padding: 2px 6px;
                font-family: monospace;
                font-size: 0.9em;
              }
              @media print {
                body { margin: 0.5in; }
                .citation { 
                  background-color: #f0f0f0 !important; 
                  border-color: #333 !important;
                  color: #333 !important;
                }
              }
            </style>
          </head>
          <body>
            ${htmlString}
          </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }
    });
    handleClose();
  };

  return (
    <>
      <Tooltip title="Export Document">
        <IconButton 
          size="small" 
          onClick={handleClick}
          sx={{
            color: '#2563eb',
            '&:hover': {
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
            }
          }}
        >
          <GetApp fontSize="small" />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'export-button',
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 180,
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            borderRadius: 2,
          }
        }}
      >
        <MenuItem onClick={printDocument}>
          <ListItemIcon>
            <PictureAsPdf fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Print / Save as PDF" />
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={exportToHtml}>
          <ListItemIcon>
            <Code fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Export as HTML" />
        </MenuItem>
        
        <MenuItem onClick={exportToMarkdown}>
          <ListItemIcon>
            <TextSnippet fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Export as Markdown" />
        </MenuItem>
        
        <MenuItem onClick={exportToText}>
          <ListItemIcon>
            <Description fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Export as Text" />
        </MenuItem>
      </Menu>
    </>
  );
};

export default ExportPlugin;