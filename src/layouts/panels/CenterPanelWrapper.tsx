import * as React from 'react';
import { Box } from '@mui/material';
import ProfessionalRichEditor from '../../components/editor/ProfessionalRichEditor';

interface CenterPanelWrapperProps {
  children?: React.ReactNode;
}

const CenterPanelWrapper: React.FC<CenterPanelWrapperProps> = ({ children }) => {
  const handleSave = async (content: string) => {
    console.log('Saving document:', content.substring(0, 100) + '...');
    // Simulate save delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return Promise.resolve();
  };

  const handleChange = (content: string) => {
    // Auto-save or other change handling
  };

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        color: '#1a1a1a',
      }}
      data-test="center-panel"
    >
      {children || (
        <ProfessionalRichEditor
          initialContent="<h1>Welcome to Clarity Hub</h1><p>Start creating your professional legal documents here. Use the AI Assistant tab on the right to get personalized help with your case analysis.</p>"
          onSave={handleSave}
          onChange={handleChange}
          autoSave={true}
          autoSaveInterval={30000}
          height="100%"
        />
      )}
    </Box>
  );
};

export default CenterPanelWrapper; 