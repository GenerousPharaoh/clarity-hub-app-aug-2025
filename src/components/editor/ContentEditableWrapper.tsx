/**
 * ContentEditableWrapper - Premium wrapper component for Lexical ContentEditable
 * Ensures proper contentEditable setup with sophisticated styling
 */
import React, { useState, useCallback } from 'react';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import '../../styles/premium-editor.css';

interface ContentEditableWrapperProps {
  className?: string;
  placeholder?: React.ReactNode;
  focusMode?: boolean;
  onFocusChange?: (focused: boolean) => void;
}

const ContentEditableWrapper: React.FC<ContentEditableWrapperProps> = ({ 
  className = "premium-content-editable",
  placeholder,
  focusMode = false,
  onFocusChange
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    onFocusChange?.(true);
  }, [onFocusChange]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    setIsTyping(false);
    onFocusChange?.(false);
  }, [onFocusChange]);

  const handleKeyDown = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      // Reset typing state after 1 second of inactivity
      setTimeout(() => setIsTyping(false), 1000);
    }
  }, [isTyping]);

  const containerClasses = [
    'premium-document-paper',
    isFocused ? 'focused' : '',
    isTyping ? 'typing' : '',
    focusMode ? 'focus-mode' : ''
  ].filter(Boolean).join(' ');

  return (
    <div 
      className="premium-editor-container premium-animate-in"
      style={{ position: 'relative', height: '100%', width: '100%' }}
    >
      <div className={containerClasses}>
        <ContentEditable
          className={className}
          contentEditable={true}
          spellCheck={true}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          style={{
            // All styling now handled by CSS classes
            outline: 'none',
            cursor: 'text',
            position: 'relative',
            zIndex: 1,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
        
        {placeholder && (
          <div className="premium-placeholder">
            {placeholder}
          </div>
        )}
        
        {/* Subtle focus indicator */}
        {isFocused && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: 'linear-gradient(90deg, transparent, #4299e1, transparent)',
              opacity: 0.6,
              animation: 'premiumPulse 2s infinite',
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ContentEditableWrapper;