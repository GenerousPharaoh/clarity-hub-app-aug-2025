/**
 * CitationAutoCompletePlugin - Auto-completion for citation references
 * 
 * Features:
 * - Detects typing patterns like "[1A" or "[2B:" 
 * - Shows dropdown with available exhibits
 * - Supports page number completion for references like "[2B:15]"
 * - Keyboard navigation and selection
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  TextNode,
  $getNodeByKey,
  NodeKey,
  COMMAND_PRIORITY_LOW,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  KEY_TAB_COMMAND
} from 'lexical';
import {
  Box,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Typography,
  Chip,
  Portal,
} from '@mui/material';
import {
  Description as DocumentIcon,
  Image as ImageIcon,
  VideoFile as VideoIcon,
  AudioFile as AudioIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import useAppStore from '../../store';
import { Exhibit } from '../../types';
import { INSERT_CITATION_COMMAND } from './CitationNode';

interface CitationSuggestion {
  exhibit: Exhibit;
  relevance: number;
  citationRef: string;
  displayText: string;
}

const CitationAutoCompletePlugin: React.FC = () => {
  const [editor] = useLexicalComposerContext();
  const [suggestions, setSuggestions] = useState<CitationSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [triggerNode, setTriggerNode] = useState<TextNode | null>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [partialInput, setPartialInput] = useState('');

  // Get exhibits from store
  const exhibits = useAppStore(state => state.exhibits);
  const selectedProjectId = useAppStore(state => state.selectedProjectId);
  const projectExhibits = exhibits.filter(e => e.project_id === selectedProjectId);

  // Get icon for exhibit type
  const getExhibitIcon = (type: string) => {
    switch (type) {
      case 'photo': return <ImageIcon fontSize="small" />;
      case 'video': return <VideoIcon fontSize="small" />;
      case 'audio': return <AudioIcon fontSize="small" />;
      case 'document':
      default: return <DocumentIcon fontSize="small" />;
    }
  };

  // Generate suggestions based on partial input
  const generateSuggestions = useCallback((input: string): CitationSuggestion[] => {
    if (!input || input.length < 1) return [];
    
    const inputLower = input.toLowerCase();
    const suggestions: CitationSuggestion[] = [];
    
    // Filter exhibits that match the input
    projectExhibits.forEach(exhibit => {
      const exhibitId = exhibit.exhibit_id.toLowerCase();
      let relevance = 0;
      
      // Exact match gets highest relevance
      if (exhibitId === inputLower) {
        relevance = 100;
      }
      // Starts with input
      else if (exhibitId.startsWith(inputLower)) {
        relevance = 90;
      }
      // Contains input
      else if (exhibitId.includes(inputLower)) {
        relevance = 70;
      }
      // Title match
      else if (exhibit.title?.toLowerCase().includes(inputLower)) {
        relevance = 50;
      }
      
      if (relevance > 0) {
        suggestions.push({
          exhibit,
          relevance,
          citationRef: exhibit.exhibit_id,
          displayText: `${exhibit.exhibit_id} - ${exhibit.title}`,
        });
      }
    });
    
    // Sort by relevance, then by exhibit ID
    suggestions.sort((a, b) => {
      if (b.relevance !== a.relevance) {
        return b.relevance - a.relevance;
      }
      return a.exhibit.exhibit_id.localeCompare(b.exhibit.exhibit_id);
    });
    
    return suggestions.slice(0, 8); // Limit to 8 suggestions
  }, [projectExhibits]);

  // Check if we're in a citation context
  const checkCitationContext = useCallback(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
      return { inContext: false };
    }

    const anchor = selection.anchor;
    const node = anchor.getNode();
    
    if (!(node instanceof TextNode)) {
      return { inContext: false };
    }

    const textContent = node.getTextContent();
    const offset = anchor.offset;
    
    // Look for citation pattern: [ExhibitId or [ExhibitId:
    const beforeCursor = textContent.slice(0, offset);
    const citationMatch = beforeCursor.match(/\[([A-Z0-9]*:?\d*)$/i);
    
    if (citationMatch) {
      const partialCitation = citationMatch[1];
      const [exhibitPart, pagePart] = partialCitation.split(':');
      
      return {
        inContext: true,
        node,
        partialInput: exhibitPart || '',
        hasPageSeparator: partialCitation.includes(':'),
        pageInput: pagePart || '',
      };
    }
    
    return { inContext: false };
  }, []);

  // Handle text input changes
  useEffect(() => {
    const removeListener = editor.registerNodeTransform(TextNode, (node: TextNode) => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
        setIsOpen(false);
        return;
      }

      const context = checkCitationContext();
      
      if (!context.inContext) {
        setIsOpen(false);
        setSuggestions([]);
        setTriggerNode(null);
        return;
      }

      // Generate suggestions for the partial input
      const newSuggestions = generateSuggestions(context.partialInput);
      
      if (newSuggestions.length > 0 && !context.hasPageSeparator) {
        setSuggestions(newSuggestions);
        setPartialInput(context.partialInput);
        setTriggerNode(context.node);
        setSelectedIndex(0);
        setIsOpen(true);
        
        // Calculate position for dropdown
        const domRange = selection.anchor.getNode().createDOM().getBoundingClientRect();
        setPosition({
          top: domRange.bottom + 5,
          left: domRange.left,
        });
      } else {
        setIsOpen(false);
      }
    });

    return removeListener;
  }, [editor, checkCitationContext, generateSuggestions]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const removeArrowDownListener = editor.registerCommand(
      KEY_ARROW_DOWN_COMMAND,
      () => {
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
        return true;
      },
      COMMAND_PRIORITY_LOW
    );

    const removeArrowUpListener = editor.registerCommand(
      KEY_ARROW_UP_COMMAND,
      () => {
        setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        return true;
      },
      COMMAND_PRIORITY_LOW
    );

    const removeEnterListener = editor.registerCommand(
      KEY_ENTER_COMMAND,
      () => {
        if (suggestions[selectedIndex]) {
          handleSelectSuggestion(suggestions[selectedIndex]);
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_LOW
    );

    const removeTabListener = editor.registerCommand(
      KEY_TAB_COMMAND,
      () => {
        if (suggestions[selectedIndex]) {
          handleSelectSuggestion(suggestions[selectedIndex]);
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_LOW
    );

    const removeEscapeListener = editor.registerCommand(
      KEY_ESCAPE_COMMAND,
      () => {
        setIsOpen(false);
        return true;
      },
      COMMAND_PRIORITY_LOW
    );

    return () => {
      removeArrowDownListener();
      removeArrowUpListener();
      removeEnterListener();
      removeTabListener();
      removeEscapeListener();
    };
  }, [isOpen, suggestions, selectedIndex]);

  // Handle suggestion selection
  const handleSelectSuggestion = useCallback((suggestion: CitationSuggestion) => {
    if (!triggerNode) return;

    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      // Find and replace the partial citation text
      const textContent = triggerNode.getTextContent();
      const offset = selection.anchor.offset;
      const beforeCursor = textContent.slice(0, offset);
      const citationMatch = beforeCursor.match(/\[([A-Z0-9]*:?\d*)$/i);
      
      if (citationMatch) {
        const matchStart = offset - citationMatch[0].length;
        const matchEnd = offset;
        
        // Replace the partial text with complete citation
        const beforeMatch = textContent.slice(0, matchStart);
        const afterMatch = textContent.slice(matchEnd);
        const newText = beforeMatch + `[${suggestion.citationRef}]` + afterMatch;
        
        triggerNode.setTextContent(newText);
        
        // Position cursor after the citation
        const newOffset = matchStart + `[${suggestion.citationRef}]`.length;
        selection.anchor.set(triggerNode.getKey(), newOffset, 'text');
        selection.focus.set(triggerNode.getKey(), newOffset, 'text');
      }
    });

    setIsOpen(false);
    setSuggestions([]);
    setTriggerNode(null);
  }, [editor, triggerNode]);

  // Render suggestions dropdown
  if (!isOpen || suggestions.length === 0 || !position) {
    return null;
  }

  return (
    <Portal>
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          top: position.top,
          left: position.left,
          zIndex: 1300,
          maxWidth: 400,
          maxHeight: 300,
          overflow: 'auto',
          border: 1,
          borderColor: 'primary.main',
        }}
      >
        <Box sx={{ p: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ px: 2, py: 1 }}>
            Citation suggestions
          </Typography>
          <List dense>
            {suggestions.map((suggestion, index) => (
              <ListItem key={suggestion.exhibit.id} disablePadding>
                <ListItemButton
                  selected={index === selectedIndex}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  sx={{
                    borderRadius: 1,
                    mx: 0.5,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      }
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    {suggestion.exhibit.is_key_evidence ? (
                      <Box sx={{ position: 'relative' }}>
                        {getExhibitIcon(suggestion.exhibit.exhibit_type)}
                        <StarIcon 
                          sx={{ 
                            fontSize: 12,
                            position: 'absolute',
                            top: -4,
                            right: -4,
                            color: 'warning.main'
                          }} 
                        />
                      </Box>
                    ) : (
                      getExhibitIcon(suggestion.exhibit.exhibit_type)
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={suggestion.exhibit.exhibit_id}
                          size="small"
                          variant="outlined"
                          sx={{ 
                            fontFamily: 'monospace',
                            fontSize: '0.75rem',
                            height: 20,
                          }}
                        />
                        <Typography variant="body2" noWrap>
                          {suggestion.exhibit.title}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {suggestion.exhibit.description || `${suggestion.exhibit.files.length} file(s)`}
                      </Typography>
                    }
                    sx={{ m: 0 }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Typography variant="caption" color="text.secondary" sx={{ px: 2, py: 0.5, display: 'block' }}>
            Press ↑↓ to navigate, Enter/Tab to select, Esc to close
          </Typography>
        </Box>
      </Paper>
    </Portal>
  );
};

export default CitationAutoCompletePlugin;