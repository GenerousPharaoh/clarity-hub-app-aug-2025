import * as React from 'react';
import { Box } from '@mui/material';
import ProfessionalRichEditor from '../../components/editor/ProfessionalRichEditor';
import useAppStore from '../../store';

interface CenterPanelWrapperProps {
  children?: React.ReactNode;
}

const CenterPanelWrapper: React.FC<CenterPanelWrapperProps> = ({ children }) => {
  // Check if we're in demo mode
  const user = useAppStore(state => state.user);
  const isDemoMode = user?.id === '00000000-0000-0000-0000-000000000000';
  const files = useAppStore(state => state.files);
  const selectedProjectId = useAppStore(state => state.selectedProjectId);
  
  // Get exhibits from files for the selected project
  const exhibits = React.useMemo(() => {
    if (!selectedProjectId) return [];
    return files
      .filter(file => file.project_id === selectedProjectId && file.exhibit_id)
      .map(file => ({
        id: file.id,
        tag: file.exhibit_id || '',
        name: file.name
      }));
  }, [files, selectedProjectId]);

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
      {isDemoMode ? (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <ProfessionalRichEditor 
            initialContent="<h1>Welcome to Clarity Hub</h1><p>Start creating your professional legal documents here.</p>"
            onSave={handleSave}
            onChange={handleChange}
            autoSave={true}
            autoSaveInterval={30000}
            height="100%"
          />
        </Box>
      ) : (
        children || (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <ProfessionalRichEditor 
              initialContent="<h1>Welcome to Clarity Hub</h1><p>Start creating your professional legal documents here.</p>"
              onSave={handleSave}
              onChange={handleChange}
              autoSave={true}
              autoSaveInterval={30000}
              height="100%"
            />
          </Box>
        )
      )}
    </Box>
  );
};

export default CenterPanelWrapper; 