/**
 * Premium Editor Toolbar Component
 * Must be used within LexicalComposer context
 */
import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  ButtonGroup,
  Divider,
  Tooltip,
  IconButton,
  Fade,
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
  Fullscreen,
  FullscreenExit,
  Palette,
} from '@mui/icons-material';
import { 
  ToolbarButton, 
  ListButton, 
  HeadingButton, 
  UndoRedoButton 
} from './ToolbarComponents';
import CitationToolbarPlugin from './CitationToolbarPlugin';
import ExportPlugin from './ExportPlugin';
import '../../styles/premium-editor.css';

interface EditorToolbarProps {
  toolbarFormats: {[key: string]: boolean};
  canUndo: boolean;
  canRedo: boolean;
  onFocusModeToggle?: () => void;
  focusMode?: boolean;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({
  toolbarFormats,
  canUndo,
  canRedo,
  onFocusModeToggle,
  focusMode = false,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const PremiumToolbarButton: React.FC<{
    icon: React.ReactNode;
    tooltip: string;
    active?: boolean;
    disabled?: boolean;
    onClick?: () => void;
  }> = ({ icon, tooltip, active, disabled, onClick }) => (
    <Tooltip title={tooltip} arrow placement="top">
      <span>
        <IconButton
          className={`premium-toolbar-button ${active ? 'active' : ''}`}
          size="small"
          disabled={disabled}
          onClick={onClick}
        >
          {icon}
        </IconButton>
      </span>
    </Tooltip>
  );

  const PremiumDivider = () => (
    <div className="premium-toolbar-divider" />
  );

  return (
    <div className="premium-toolbar">
      {/* Text Formatting Group */}
      <div className="premium-toolbar-group">
        <ToolbarButton
          format="bold"
          icon={<FormatBold fontSize="small" />}
          tooltip="Bold (⌘+B)"
          active={toolbarFormats.bold}
        />
        <ToolbarButton
          format="italic"
          icon={<FormatItalic fontSize="small" />}
          tooltip="Italic (⌘+I)"
          active={toolbarFormats.italic}
        />
        <ToolbarButton
          format="underline"
          icon={<FormatUnderlined fontSize="small" />}
          tooltip="Underline (⌘+U)"
          active={toolbarFormats.underline}
        />
      </div>

      <PremiumDivider />

      {/* Lists and Structure */}
      <div className="premium-toolbar-group">
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
      </div>

      <PremiumDivider />

      {/* Headings */}
      <div className="premium-toolbar-group">
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
      </div>

      <PremiumDivider />

      {/* Citation */}
      <div className="premium-toolbar-group">
        <CitationToolbarPlugin />
      </div>

      <PremiumDivider />

      {/* Advanced Tools */}
      <Fade in={showAdvanced}>
        <div className="premium-toolbar-group">
          <ExportPlugin />
        </div>
      </Fade>

      {!showAdvanced && (
        <PremiumToolbarButton
          icon={<Palette fontSize="small" />}
          tooltip="More tools"
          onClick={() => setShowAdvanced(true)}
        />
      )}

      <PremiumDivider />

      {/* Undo/Redo */}
      <div className="premium-toolbar-group">
        <UndoRedoButton
          type="undo"
          icon={<Undo fontSize="small" />}
          tooltip="Undo (⌘+Z)"
          disabled={!canUndo}
        />
        <UndoRedoButton
          type="redo"
          icon={<Redo fontSize="small" />}
          tooltip="Redo (⌘+⇧+Z)"
          disabled={!canRedo}
        />
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Focus Mode Toggle */}
      <PremiumToolbarButton
        icon={focusMode ? <FullscreenExit fontSize="small" /> : <Fullscreen fontSize="small" />}
        tooltip={focusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
        active={focusMode}
        onClick={onFocusModeToggle}
      />
    </div>
  );
};

export default EditorToolbar;