import * as React from 'react';
import { Box, Tabs, Tab, Paper } from '@mui/material';
import { Edit as EditIcon, CloudUpload as UploadIcon } from '@mui/icons-material';
import ProfessionalRichEditor from '../../components/editor/ProfessionalRichEditor';
import IntelligentUploadZone from '../../components/upload/IntelligentUploadZone';
import useAppStore from '../../store';

interface CenterPanelWrapperProps {
  children?: React.ReactNode;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`center-panel-tabpanel-${index}`}
      aria-labelledby={`center-panel-tab-${index}`}
      style={{ height: '100%' }}
      {...other}
    >
      {value === index && (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const CenterPanelWrapper: React.FC<CenterPanelWrapperProps> = ({ children }) => {
  // Check if we're in demo mode
  const user = useAppStore(state => state.user);
  const isDemoMode = user?.id === '00000000-0000-0000-0000-000000000000';
  const files = useAppStore(state => state.files);
  const selectedProjectId = useAppStore(state => state.selectedProjectId);
  
  // Tab state
  const [tabValue, setTabValue] = React.useState(0);
  
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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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
      {/* Tab Navigation */}
      <Paper elevation={1} sx={{ borderRadius: 0 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ minHeight: 48 }}
        >
          <Tab 
            icon={<EditIcon />} 
            label="Document Editor" 
            id="center-panel-tab-0"
            aria-controls="center-panel-tabpanel-0"
            sx={{ minHeight: 48 }}
          />
          <Tab 
            icon={<UploadIcon />} 
            label="Smart Upload" 
            id="center-panel-tab-1"
            aria-controls="center-panel-tabpanel-1"
            sx={{ minHeight: 48 }}
          />
        </Tabs>
      </Paper>

      {/* Document Editor Tab */}
      <TabPanel value={tabValue} index={0}>
        {isDemoMode ? (
          <ProfessionalRichEditor 
            initialContent="<h1>Welcome to Clarity Hub</h1><p>Start creating your professional legal documents here. Use the AI Assistant tab on the right to get personalized help with your case analysis.</p>"
            onSave={handleSave}
            onChange={handleChange}
            autoSave={true}
            autoSaveInterval={30000}
            height="100%"
          />
        ) : (
          children || (
            <ProfessionalRichEditor 
              initialContent="<h1>Welcome to Clarity Hub</h1><p>Start creating your professional legal documents here. Use the AI Assistant tab on the right to get personalized help with your case analysis.</p>"
              onSave={handleSave}
              onChange={handleChange}
              autoSave={true}
              autoSaveInterval={30000}
              height="100%"
            />
          )
        )}
      </TabPanel>

      {/* Smart Upload Tab */}
      <TabPanel value={tabValue} index={1}>
        <IntelligentUploadZone />
      </TabPanel>
    </Box>
  );
};

export default CenterPanelWrapper; 