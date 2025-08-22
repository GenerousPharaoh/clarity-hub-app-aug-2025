/**
 * ContentEditableWrapper - Wrapper component for Lexical ContentEditable
 * Ensures proper contentEditable setup and styling
 */
import React from 'react';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';

interface ContentEditableWrapperProps {
  className?: string;
  placeholder?: React.ReactNode;
}

const ContentEditableWrapper: React.FC<ContentEditableWrapperProps> = ({ 
  className = "lexical-content-editable",
  placeholder 
}) => {
  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <ContentEditable
        className={className}
        contentEditable={true}
        spellCheck={true}
        style={{
          height: '100%',
          width: '100%',
          padding: '24px 32px',
          outline: 'none',
          fontSize: '16px',
          lineHeight: '1.6',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          color: '#1a1a1a',
          overflow: 'auto',
          minHeight: '400px',
          backgroundColor: '#ffffff',
          cursor: 'text',
          caretColor: '#1a1a1a',
          position: 'relative',
          zIndex: 1,
        }}
      />
      {placeholder}
    </div>
  );
};

export default ContentEditableWrapper;