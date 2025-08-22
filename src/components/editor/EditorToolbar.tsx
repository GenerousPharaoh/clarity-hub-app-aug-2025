/**
 * Editor Toolbar Component
 * Must be used within LexicalComposer context
 */
import React from 'react';
import { 
  Box, 
  Paper, 
  ButtonGroup,
  Divider,
} from '@mui/material';
import {
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FormatListBulleted,
  FormatListNumbered,
  Undo,
  Redo,
  Title,
} from '@mui/icons-material';
import { 
  ToolbarButton, 
  ListButton, 
  HeadingButton, 
  UndoRedoButton 
} from './ToolbarComponents';
import CitationToolbarPlugin from './CitationToolbarPlugin';
import ExportPlugin from './ExportPlugin';

interface EditorToolbarProps {
  toolbarFormats: {[key: string]: boolean};
  canUndo: boolean;
  canRedo: boolean;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({
  toolbarFormats,
  canUndo,
  canRedo,
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        p: 1.5,
        gap: 1,
        borderBottom: 1,
        borderColor: 'divider',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
      }}
    >
      {/* Text Formatting */}
      <ButtonGroup size="small" variant="outlined">
        <ToolbarButton
          format="bold"
          icon={<FormatBold fontSize="small" />}
          tooltip="Bold (Ctrl+B)"
          active={toolbarFormats.bold}
        />
        <ToolbarButton
          format="italic"
          icon={<FormatItalic fontSize="small" />}
          tooltip="Italic (Ctrl+I)"
          active={toolbarFormats.italic}
        />
        <ToolbarButton
          format="underline"
          icon={<FormatUnderlined fontSize="small" />}
          tooltip="Underline (Ctrl+U)"
          active={toolbarFormats.underline}
        />
      </ButtonGroup>

      <Divider orientation="vertical" flexItem />

      {/* Lists and Structure */}
      <ButtonGroup size="small" variant="outlined">
        <ListButton
          listType="bullet"
          icon={<FormatListBulleted fontSize="small" />}
          tooltip="Bullet List"
        />
        <ListButton
          listType="number"
          icon={<FormatListNumbered fontSize="small" />}
          tooltip="Numbered List"
        />
      </ButtonGroup>

      <Divider orientation="vertical" flexItem />

      {/* Headings */}
      <ButtonGroup size="small" variant="outlined">
        <HeadingButton 
          level={1} 
          tooltip="Heading 1"
          icon={<Title fontSize="small" />}
        />
        <HeadingButton 
          level={2} 
          tooltip="Heading 2"
          icon={<Title fontSize="small" style={{ fontSize: '14px' }} />}
        />
      </ButtonGroup>

      <Divider orientation="vertical" flexItem />

      {/* Citation */}
      <CitationToolbarPlugin />

      <Divider orientation="vertical" flexItem />

      {/* Export */}
      <ExportPlugin />

      <Divider orientation="vertical" flexItem />

      {/* Undo/Redo */}
      <ButtonGroup size="small" variant="outlined">
        <UndoRedoButton
          type="undo"
          icon={<Undo fontSize="small" />}
          tooltip="Undo (Ctrl+Z)"
          disabled={!canUndo}
        />
        <UndoRedoButton
          type="redo"
          icon={<Redo fontSize="small" />}
          tooltip="Redo (Ctrl+Y)"
          disabled={!canRedo}
        />
      </ButtonGroup>

      <Box sx={{ flex: 1 }} />
    </Paper>
  );
};

export default EditorToolbar;