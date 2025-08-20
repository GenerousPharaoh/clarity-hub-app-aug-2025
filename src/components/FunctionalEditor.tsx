/**
 * FunctionalEditor - Enhanced with Professional Lexical Rich Text Editor
 * 
 * Features:
 * - Professional Lexical-based rich text editing
 * - Custom citation nodes for legal references [1A], [2B] style
 * - Click-to-jump functionality for citation tokens
 * - Professional "Google Docs for litigation" design
 * - Integration with right panel viewers
 * - Auto-save functionality with improved performance
 */
import React, { useCallback } from 'react';
import { Box } from '@mui/material';
import LegalRichTextEditor from './editor/LegalRichTextEditor';
import CitationBreadcrumbs from './legal/CitationBreadcrumbs';
import { CitationClickPayload } from './editor/CitationNode';
import useAppStore from '../store';

interface FunctionalEditorProps {
  className?: string;
}

const FunctionalEditor: React.FC<FunctionalEditorProps> = ({ className }) => {
  const setSelectedFile = useAppStore(state => state.setSelectedFile);
  const setLinkActivation = useAppStore(state => state.setLinkActivation);
  const files = useAppStore(state => state.files);

  // Handle citation clicks - jump to specific file and page in right panel
  const handleCitationClick = useCallback((payload: CitationClickPayload) => {
    const { exhibitId, pageNumber, fileId, citationReference } = payload;
    
    console.log(`Citation clicked: [${citationReference}] - processing...`);
    
    // Try to find target file by different methods
    let targetFileId = fileId;
    let targetFile = null;
    
    // Method 1: Direct fileId match
    if (fileId) {
      targetFile = files.find(f => f.id === fileId);
      if (targetFile) {
        console.log(`Found target file by fileId: ${targetFile.name}`);
      }
    }
    
    // Method 2: Search by exhibit_id if no direct match
    if (!targetFile) {
      targetFile = files.find(f => f.exhibit_id === exhibitId);
      if (targetFile) {
        targetFileId = targetFile.id;
        console.log(`Found target file by exhibit_id "${exhibitId}": ${targetFile.name}`);
      }
    }
    
    // Parse page number - already a number from the new interface
    const targetPage = pageNumber;
    
    // For media files, we might need to handle timestamps differently
    let timestamp: number | string | undefined;
    // For now, use page number as timestamp for media files if it's reasonable
    if (targetPage && targetFile?.file_type?.includes('audio') || targetFile?.file_type?.includes('video')) {
      if (targetPage < 3600) { // Less than 1 hour in seconds
        const mins = Math.floor(targetPage / 60);
        const secs = targetPage % 60;
        timestamp = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }
    }
    
    // Set up link activation for the right panel
    setLinkActivation({
      type: 'citation',
      fileId: targetFileId,
      targetPage: targetPage,
      timestamp: timestamp,
      exhibitReference: citationReference,
      selectionInfo: {
        text: `[${citationReference}]`,
        timestamp: Date.now()
      }
    });
    
    // Log the action
    if (targetFile) {
      console.log(`Citation resolved: [${citationReference}] -> ${targetFile.name}${targetPage ? ` page ${targetPage}` : ''}${timestamp ? ` at ${timestamp}` : ''}`);
    } else {
      console.warn(`Citation [${citationReference}] - no matching file found`);
    }
  }, [setSelectedFile, setLinkActivation, files]);

  return (
    <Box 
      className={className}
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Citation Breadcrumbs */}
      <CitationBreadcrumbs />
      
      {/* Legal Rich Text Editor */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <LegalRichTextEditor
          onCitationClick={handleCitationClick}
        />
      </Box>
    </Box>
  );
};

export default FunctionalEditor;