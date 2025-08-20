import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useCollaboration, UserPresence } from '../../../contexts/CollaborationContext';

interface CursorPosition {
  x: number;
  y: number;
  user: UserPresence;
}

interface CursorTrackerProps {
  documentId?: string;
  containerRef?: React.RefObject<HTMLElement>;
  trackSelection?: boolean;
  showCursorNames?: boolean;
}

interface RemoteCursorProps {
  position: CursorPosition;
  showName?: boolean;
}

const RemoteCursor: React.FC<RemoteCursorProps> = ({ position, showName = true }) => {
  const getUserColor = (userId: string) => {
    const colors = [
      '#ff4757', '#5352ed', '#00d2d3', '#ff6348', '#7bed9f',
      '#70a1ff', '#ff9ff3', '#ffb8b8', '#c44569', '#f8b500'
    ];
    const index = userId.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getUserName = (user: UserPresence) => {
    const firstName = user.profile?.first_name || '';
    const lastName = user.profile?.last_name || '';
    return `${firstName} ${lastName}`.trim() || 'Anonymous';
  };

  const color = getUserColor(position.user.user_id);

  return (
    <Box
      sx={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        pointerEvents: 'none',
        zIndex: 1000,
        transition: 'all 0.1s ease-out',
      }}
    >
      {/* Cursor arrow */}
      <Box
        sx={{
          width: 0,
          height: 0,
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: `12px solid ${color}`,
          position: 'relative',
        }}
      />
      
      {/* Cursor line */}
      <Box
        sx={{
          width: '2px',
          height: '20px',
          backgroundColor: color,
          position: 'absolute',
          left: '6px',
          top: '-2px',
        }}
      />

      {/* User name label */}
      {showName && (
        <Chip
          label={getUserName(position.user)}
          size="small"
          sx={{
            position: 'absolute',
            left: '16px',
            top: '-8px',
            backgroundColor: color,
            color: 'white',
            fontSize: '0.7rem',
            height: '20px',
            '& .MuiChip-label': {
              px: 1,
            },
            animation: 'fadeInOut 3s ease-in-out',
            '@keyframes fadeInOut': {
              '0%': { opacity: 0, transform: 'translateX(-10px)' },
              '10%': { opacity: 1, transform: 'translateX(0)' },
              '90%': { opacity: 1, transform: 'translateX(0)' },
              '100%': { opacity: 0, transform: 'translateX(10px)' },
            },
          }}
        />
      )}
    </Box>
  );
};

interface SelectionHighlightProps {
  user: UserPresence;
  selection: { start: number; end: number };
  containerRef: React.RefObject<HTMLElement>;
}

const SelectionHighlight: React.FC<SelectionHighlightProps> = ({ user, selection, containerRef }) => {
  const [highlightRects, setHighlightRects] = useState<DOMRect[]>([]);

  useEffect(() => {
    if (!containerRef.current || !selection) return;

    try {
      const container = containerRef.current;
      const textNodes: Text[] = [];
      
      // Get all text nodes in the container
      const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      let node;
      while (node = walker.nextNode()) {
        textNodes.push(node as Text);
      }

      // Calculate selection range
      let currentOffset = 0;
      const range = document.createRange();
      let startSet = false;

      for (const textNode of textNodes) {
        const nodeLength = textNode.textContent?.length || 0;
        
        if (!startSet && currentOffset + nodeLength > selection.start) {
          range.setStart(textNode, selection.start - currentOffset);
          startSet = true;
        }
        
        if (currentOffset + nodeLength >= selection.end) {
          range.setEnd(textNode, selection.end - currentOffset);
          break;
        }
        
        currentOffset += nodeLength;
      }

      // Get highlight rectangles
      const rects = Array.from(range.getClientRects());
      const containerRect = container.getBoundingClientRect();
      
      const relativeRects = rects.map(rect => ({
        ...rect,
        x: rect.x - containerRect.x,
        y: rect.y - containerRect.y,
      }));
      
      setHighlightRects(relativeRects);
    } catch (error) {
      console.error('Error calculating selection highlight:', error);
    }
  }, [selection, containerRef]);

  const getUserColor = (userId: string) => {
    const colors = [
      '#ff4757', '#5352ed', '#00d2d3', '#ff6348', '#7bed9f',
      '#70a1ff', '#ff9ff3', '#ffb8b8', '#c44569', '#f8b500'
    ];
    const index = userId.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const color = getUserColor(user.user_id);

  return (
    <>
      {highlightRects.map((rect, index) => (
        <Box
          key={index}
          sx={{
            position: 'absolute',
            left: rect.x,
            top: rect.y,
            width: rect.width,
            height: rect.height,
            backgroundColor: alpha(color, 0.2),
            border: `1px solid ${alpha(color, 0.4)}`,
            pointerEvents: 'none',
            zIndex: 999,
          }}
        />
      ))}
    </>
  );
};

const CursorTracker: React.FC<CursorTrackerProps> = ({
  documentId,
  containerRef,
  trackSelection = true,
  showCursorNames = true,
}) => {
  const { state, updatePresence } = useCollaboration();
  const [cursors, setCursors] = useState<CursorPosition[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const lastUpdateRef = useRef<number>(0);
  const throttleDelay = 100; // ms

  // Filter active users with cursor positions
  const activeUsersWithCursors = state.activeUsers.filter(
    user => 
      user.status === 'online' && 
      user.cursor_position && 
      (!documentId || user.document_id === documentId)
  );

  // Update local cursor positions
  useEffect(() => {
    const newCursors: CursorPosition[] = activeUsersWithCursors.map(user => ({
      x: user.cursor_position?.x || 0,
      y: user.cursor_position?.y || 0,
      user,
    }));
    setCursors(newCursors);
  }, [activeUsersWithCursors]);

  // Track own cursor movements
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isTracking || !containerRef?.current || !state.currentProject) return;

    const now = Date.now();
    if (now - lastUpdateRef.current < throttleDelay) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const x = event.clientX - containerRect.left;
    const y = event.clientY - containerRect.top;

    updatePresence(state.currentProject, documentId, {
      x,
      y,
      timestamp: now,
    });

    lastUpdateRef.current = now;
  }, [isTracking, containerRef, state.currentProject, documentId, updatePresence]);

  // Track text selection
  const handleSelectionChange = useCallback(() => {
    if (!trackSelection || !containerRef?.current || !state.currentProject) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const containerRect = containerRef.current.getBoundingClientRect();
    const rangeRect = range.getBoundingClientRect();

    if (rangeRect.width === 0 && rangeRect.height === 0) return;

    const selectionData = {
      start: range.startOffset,
      end: range.endOffset,
      x: rangeRect.x - containerRect.x,
      y: rangeRect.y - containerRect.y,
      timestamp: Date.now(),
    };

    updatePresence(state.currentProject, documentId, selectionData);
  }, [trackSelection, containerRef, state.currentProject, documentId, updatePresence]);

  // Start/stop tracking
  useEffect(() => {
    if (!containerRef?.current) return;

    const container = containerRef.current;

    const handleMouseEnter = () => setIsTracking(true);
    const handleMouseLeave = () => setIsTracking(false);

    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('mousemove', handleMouseMove);

    if (trackSelection) {
      document.addEventListener('selectionchange', handleSelectionChange);
    }

    return () => {
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('mousemove', handleMouseMove);
      
      if (trackSelection) {
        document.removeEventListener('selectionchange', handleSelectionChange);
      }
    };
  }, [handleMouseMove, handleSelectionChange, trackSelection, containerRef]);

  if (!containerRef?.current) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    >
      {/* Render remote cursors */}
      {cursors.map((cursor) => (
        <RemoteCursor
          key={cursor.user.user_id}
          position={cursor}
          showName={showCursorNames}
        />
      ))}

      {/* Render selection highlights */}
      {trackSelection && activeUsersWithCursors.map((user) => {
        if (!user.cursor_position?.selection) return null;
        
        return (
          <SelectionHighlight
            key={`selection-${user.user_id}`}
            user={user}
            selection={user.cursor_position.selection}
            containerRef={containerRef}
          />
        );
      })}
    </Box>
  );
};

export default CursorTracker;