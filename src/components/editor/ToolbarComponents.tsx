/**
 * Toolbar Components for Lexical Editor
 * These components must be used within a LexicalComposer context
 */
import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
} from 'lexical';
import { $createHeadingNode } from '@lexical/rich-text';
import { 
  INSERT_ORDERED_LIST_COMMAND, 
  INSERT_UNORDERED_LIST_COMMAND 
} from '@lexical/list';

export const ToolbarButton: React.FC<{
  format: string;
  icon: React.ReactNode;
  tooltip: string;
  active?: boolean;
}> = ({ format, icon, tooltip, active }) => {
  const [editor] = useLexicalComposerContext();

  const handleClick = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format as any);
  };

  return (
    <Tooltip title={tooltip}>
      <IconButton 
        size="small" 
        onClick={handleClick}
        sx={{
          color: active ? '#2563eb' : 'inherit',
          backgroundColor: active ? 'rgba(30, 41, 59, 0.1)' : 'transparent',
        }}
      >
        {icon}
      </IconButton>
    </Tooltip>
  );
};

export const ListButton: React.FC<{
  listType: 'bullet' | 'number';
  icon: React.ReactNode;
  tooltip: string;
}> = ({ listType, icon, tooltip }) => {
  const [editor] = useLexicalComposerContext();

  const handleClick = () => {
    if (listType === 'bullet') {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    }
  };

  return (
    <Tooltip title={tooltip}>
      <IconButton size="small" onClick={handleClick}>
        {icon}
      </IconButton>
    </Tooltip>
  );
};

export const HeadingButton: React.FC<{
  level: 1 | 2 | 3;
  tooltip: string;
  icon?: React.ReactNode;
}> = ({ level, tooltip, icon }) => {
  const [editor] = useLexicalComposerContext();

  const handleClick = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const heading = $createHeadingNode(`h${level}`);
        selection.insertNodes([heading]);
      }
    });
  };

  return (
    <Tooltip title={tooltip}>
      <IconButton size="small" onClick={handleClick}>
        {icon || <span style={{ fontSize: level === 1 ? '18px' : '16px', fontWeight: 'bold' }}>H{level}</span>}
      </IconButton>
    </Tooltip>
  );
};

export const UndoRedoButton: React.FC<{
  type: 'undo' | 'redo';
  icon: React.ReactNode;
  tooltip: string;
  disabled?: boolean;
}> = ({ type, icon, tooltip, disabled }) => {
  const [editor] = useLexicalComposerContext();

  const handleClick = () => {
    if (type === 'undo') {
      editor.dispatchCommand(UNDO_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REDO_COMMAND, undefined);
    }
  };

  return (
    <Tooltip title={tooltip}>
      <IconButton size="small" onClick={handleClick} disabled={disabled}>
        {icon}
      </IconButton>
    </Tooltip>
  );
};