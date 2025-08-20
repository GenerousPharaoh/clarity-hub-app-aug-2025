/**
 * CitationBreadcrumbs - Navigation breadcrumbs showing citation history and current context
 * 
 * Features:
 * - Shows recent citation navigation history
 * - Current exhibit and page context
 * - Quick navigation to recent citations
 * - Professional breadcrumb styling
 */
import React from 'react';
import {
  Box,
  Breadcrumbs,
  Link,
  Typography,
  Chip,
  IconButton,
  Button,
  Menu,
  MenuItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  NavigateNext as NavigateNextIcon,
  History as HistoryIcon,
  BookmarkBorder as BookmarkIcon,
  Description as DocumentIcon,
  Image as ImageIcon,
  VideoFile as VideoIcon,
  AudioFile as AudioIcon,
  ArrowBack as BackIcon,
  ArrowForward as ForwardIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import useAppStore from '../../store';
import { CitationHistory, Exhibit } from '../../types';

interface CitationBreadcrumbsProps {
  className?: string;
}

const CitationBreadcrumbs: React.FC<CitationBreadcrumbsProps> = ({ className }) => {
  const [historyMenuAnchor, setHistoryMenuAnchor] = React.useState<null | HTMLElement>(null);
  
  // Store state
  const citationHistory = useAppStore(state => state.citationHistory);
  const exhibits = useAppStore(state => state.exhibits);
  const selectedProjectId = useAppStore(state => state.selectedProjectId);
  const selectedFileId = useAppStore(state => state.selectedFileId);
  const exhibitLinkActivation = useAppStore(state => state.exhibitLinkActivation);
  const files = useAppStore(state => state.files);
  const navigateToExhibit = useAppStore(state => state.navigateToExhibit);
  const setCitationHistory = useAppStore(state => state.setCitationHistory);
  
  // Get current context
  const currentFile = selectedFileId ? files.find(f => f.id === selectedFileId) : null;
  const currentExhibit = exhibitLinkActivation ? 
    exhibits.find(e => e.exhibit_id === exhibitLinkActivation.exhibitId) : null;
  
  // Get recent citation history (last 5)
  const recentHistory = citationHistory
    .slice()
    .sort((a, b) => new Date(b.last_accessed).getTime() - new Date(a.last_accessed).getTime())
    .slice(0, 5);

  // Get icon for exhibit type
  const getExhibitIcon = (exhibit: Exhibit) => {
    switch (exhibit.exhibit_type) {
      case 'photo': return <ImageIcon fontSize="small" />;
      case 'video': return <VideoIcon fontSize="small" />;
      case 'audio': return <AudioIcon fontSize="small" />;
      case 'document':
      default: return <DocumentIcon fontSize="small" />;
    }
  };

  // Handle navigation to citation
  const handleNavigateToCitation = (citationRef: string) => {
    navigateToExhibit(citationRef, 'breadcrumb');
    setHistoryMenuAnchor(null);
  };

  // Handle clear history
  const handleClearHistory = () => {
    setCitationHistory([]);
    setHistoryMenuAnchor(null);
  };

  // Generate breadcrumb items
  const getBreadcrumbItems = () => {
    const items = [];
    
    // Project root
    items.push(
      <Typography key="project" color="text.secondary" variant="body2">
        Project
      </Typography>
    );
    
    // Current exhibit context
    if (currentExhibit) {
      items.push(
        <Box key="exhibit" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getExhibitIcon(currentExhibit)}
          <Chip
            label={currentExhibit.exhibit_id}
            size="small"
            variant="outlined"
            sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
          />
          <Typography variant="body2" color="primary">
            {currentExhibit.title}
          </Typography>
        </Box>
      );
      
      // Page context if available
      if (exhibitLinkActivation?.targetPage) {
        items.push(
          <Chip
            key="page"
            label={`Page ${exhibitLinkActivation.targetPage}`}
            size="small"
            color="primary"
            variant="filled"
            sx={{ fontSize: '0.75rem' }}
          />
        );
      }
    } else if (currentFile) {
      // Show current file if no exhibit context
      items.push(
        <Typography key="file" variant="body2" color="primary">
          {currentFile.name}
        </Typography>
      );
    }
    
    return items;
  };

  return (
    <Box 
      className={className}
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        px: 2, 
        py: 1,
        borderBottom: 1,
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        minHeight: 48,
      }}
    >
      {/* Navigation Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Tooltip title="Previous citation">
          <IconButton size="small" disabled>
            <BackIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Next citation">
          <IconButton size="small" disabled>
            <ForwardIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Divider orientation="vertical" flexItem />

      {/* Breadcrumb Navigation */}
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        sx={{ flex: 1 }}
      >
        {getBreadcrumbItems()}
      </Breadcrumbs>

      <Box sx={{ flex: 1 }} />

      {/* Citation History */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {recentHistory.length > 0 && (
          <>
            <Tooltip title="Citation history">
              <Button
                size="small"
                startIcon={<HistoryIcon />}
                onClick={(e) => setHistoryMenuAnchor(e.currentTarget)}
                variant="text"
                sx={{ textTransform: 'none' }}
              >
                History ({citationHistory.length})
              </Button>
            </Tooltip>
            
            <Menu
              anchorEl={historyMenuAnchor}
              open={Boolean(historyMenuAnchor)}
              onClose={() => setHistoryMenuAnchor(null)}
              PaperProps={{
                sx: { minWidth: 300, maxHeight: 400 }
              }}
            >
              <MenuItem disabled>
                <Typography variant="subtitle2" color="text.secondary">
                  Recent Citations
                </Typography>
              </MenuItem>
              <Divider />
              
              {recentHistory.map((citation, index) => {
                const exhibit = exhibits.find(e => e.exhibit_id === citation.exhibit_id);
                if (!exhibit) return null;
                
                return (
                  <MenuItem
                    key={citation.id}
                    onClick={() => handleNavigateToCitation(citation.exhibit_reference)}
                    sx={{ py: 1 }}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      {getExhibitIcon(exhibit)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={citation.exhibit_reference}
                            size="small"
                            variant="outlined"
                            sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}
                          />
                          <Typography variant="body2">
                            {exhibit.title}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          Accessed {citation.access_count} time{citation.access_count !== 1 ? 's' : ''} • 
                          Last: {new Date(citation.last_accessed).toLocaleTimeString()}
                        </Typography>
                      }
                      sx={{ m: 0 }}
                    />
                  </MenuItem>
                );
              })}
              
              {recentHistory.length > 0 && (
                <>
                  <Divider />
                  <MenuItem onClick={handleClearHistory} sx={{ color: 'text.secondary' }}>
                    <ListItemIcon>
                      <ClearIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Clear History</ListItemText>
                  </MenuItem>
                </>
              )}
            </Menu>
          </>
        )}

        {/* Current Context Indicator */}
        {exhibitLinkActivation && (
          <Tooltip title={`Viewing ${exhibitLinkActivation.citationReference}`}>
            <Chip
              icon={<BookmarkIcon />}
              label={`Viewing ${exhibitLinkActivation.citationReference}`}
              size="small"
              color="primary"
              variant="filled"
              sx={{ fontSize: '0.75rem' }}
            />
          </Tooltip>
        )}
      </Box>
    </Box>
  );
};

export default CitationBreadcrumbs;