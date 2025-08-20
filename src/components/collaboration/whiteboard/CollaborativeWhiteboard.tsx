import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Toolbar,
  IconButton,
  Button,
  ButtonGroup,
  Divider,
  Menu,
  MenuItem,
  Slider,
  Paper,
  Chip,
  Stack,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Create as PenIcon,
  Rectangle as RectangleIcon,
  Circle as CircleIcon,
  Timeline as LineIcon,
  TextFields as TextIcon,
  StickyNote2 as StickyNoteIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  Clear as ClearIcon,
  Save as SaveIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Palette as PaletteIcon,
  FormatSize as SizeIcon,
  People as CollaboratorsIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
} from '@mui/icons-material';

interface WhiteboardElement {
  id: string;
  type: 'pen' | 'rectangle' | 'circle' | 'line' | 'text' | 'sticky_note';
  x: number;
  y: number;
  width?: number;
  height?: number;
  points?: { x: number; y: number }[];
  text?: string;
  color: string;
  strokeWidth: number;
  author: string;
  timestamp: number;
}

interface WhiteboardState {
  elements: WhiteboardElement[];
  viewBox: { x: number; y: number; scale: number };
  selectedTool: string;
  selectedColor: string;
  strokeWidth: number;
}

interface CollaborativeWhiteboardProps {
  projectId: string;
  whiteboardId?: string;
  maxHeight?: number;
  readOnly?: boolean;
}

const COLORS = [
  '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', 
  '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#008000'
];

const STROKE_WIDTHS = [1, 2, 4, 6, 8, 12];

const TOOLS = [
  { id: 'pen', icon: PenIcon, label: 'Pen' },
  { id: 'rectangle', icon: RectangleIcon, label: 'Rectangle' },
  { id: 'circle', icon: CircleIcon, label: 'Circle' },
  { id: 'line', icon: LineIcon, label: 'Line' },
  { id: 'text', icon: TextIcon, label: 'Text' },
  { id: 'sticky_note', icon: StickyNoteIcon, label: 'Sticky Note' },
];

const CollaborativeWhiteboard: React.FC<CollaborativeWhiteboardProps> = ({
  projectId,
  whiteboardId,
  maxHeight = 600,
  readOnly = false,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [whiteboardState, setWhiteboardState] = useState<WhiteboardState>({
    elements: [],
    viewBox: { x: 0, y: 0, scale: 1 },
    selectedTool: 'pen',
    selectedColor: '#000000',
    strokeWidth: 2,
  });

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentElement, setCurrentElement] = useState<Partial<WhiteboardElement> | null>(null);
  const [history, setHistory] = useState<WhiteboardElement[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [colorMenuAnchor, setColorMenuAnchor] = useState<null | HTMLElement>(null);
  const [sizeMenuAnchor, setSizeMenuAnchor] = useState<null | HTMLElement>(null);
  const [textDialog, setTextDialog] = useState<{ open: boolean; x: number; y: number }>({
    open: false,
    x: 0,
    y: 0,
  });
  const [textInput, setTextInput] = useState('');
  const [collaborators, setCollaborators] = useState<string[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Get SVG coordinates from mouse event
  const getSVGCoordinates = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return { x: 0, y: 0 };

    const rect = svgRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / whiteboardState.viewBox.scale - whiteboardState.viewBox.x;
    const y = (event.clientY - rect.top) / whiteboardState.viewBox.scale - whiteboardState.viewBox.y;
    
    return { x, y };
  }, [whiteboardState.viewBox]);

  // Generate unique ID for elements
  const generateId = () => `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Start drawing
  const handleMouseDown = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (readOnly) return;

    const { x, y } = getSVGCoordinates(event);
    
    if (whiteboardState.selectedTool === 'text' || whiteboardState.selectedTool === 'sticky_note') {
      setTextDialog({ open: true, x, y });
      return;
    }

    setIsDrawing(true);
    const newElement: Partial<WhiteboardElement> = {
      id: generateId(),
      type: whiteboardState.selectedTool as WhiteboardElement['type'],
      x,
      y,
      color: whiteboardState.selectedColor,
      strokeWidth: whiteboardState.strokeWidth,
      author: 'current_user', // This would be the actual user ID
      timestamp: Date.now(),
    };

    if (whiteboardState.selectedTool === 'pen') {
      newElement.points = [{ x, y }];
    }

    setCurrentElement(newElement);
  }, [readOnly, getSVGCoordinates, whiteboardState]);

  // Continue drawing
  const handleMouseMove = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawing || !currentElement || readOnly) return;

    const { x, y } = getSVGCoordinates(event);

    if (currentElement.type === 'pen') {
      setCurrentElement(prev => ({
        ...prev,
        points: [...(prev?.points || []), { x, y }],
      }));
    } else {
      setCurrentElement(prev => ({
        ...prev,
        width: x - (prev?.x || 0),
        height: y - (prev?.y || 0),
      }));
    }
  }, [isDrawing, currentElement, readOnly, getSVGCoordinates]);

  // Finish drawing
  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !currentElement) return;

    const newElements = [...whiteboardState.elements, currentElement as WhiteboardElement];
    setWhiteboardState(prev => ({
      ...prev,
      elements: newElements,
    }));

    // Add to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newElements);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    setIsDrawing(false);
    setCurrentElement(null);

    // Here you would sync with the server/other users
    // syncWhiteboardState(newElements);
  }, [isDrawing, currentElement, whiteboardState.elements, history, historyIndex]);

  // Handle text input
  const handleTextSubmit = () => {
    if (!textInput.trim()) return;

    const textElement: WhiteboardElement = {
      id: generateId(),
      type: textDialog.open ? 'text' : 'sticky_note',
      x: textDialog.x,
      y: textDialog.y,
      text: textInput,
      color: whiteboardState.selectedColor,
      strokeWidth: whiteboardState.strokeWidth,
      author: 'current_user',
      timestamp: Date.now(),
    };

    const newElements = [...whiteboardState.elements, textElement];
    setWhiteboardState(prev => ({
      ...prev,
      elements: newElements,
    }));

    // Add to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newElements);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    setTextDialog({ open: false, x: 0, y: 0 });
    setTextInput('');
  };

  // Undo/Redo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setWhiteboardState(prev => ({
        ...prev,
        elements: history[newIndex],
      }));
    }
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setWhiteboardState(prev => ({
        ...prev,
        elements: history[newIndex],
      }));
    }
  }, [historyIndex, history]);

  // Clear whiteboard
  const clearWhiteboard = useCallback(() => {
    setWhiteboardState(prev => ({
      ...prev,
      elements: [],
    }));
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // Zoom functions
  const zoomIn = useCallback(() => {
    setWhiteboardState(prev => ({
      ...prev,
      viewBox: {
        ...prev.viewBox,
        scale: Math.min(prev.viewBox.scale * 1.2, 3),
      },
    }));
  }, []);

  const zoomOut = useCallback(() => {
    setWhiteboardState(prev => ({
      ...prev,
      viewBox: {
        ...prev.viewBox,
        scale: Math.max(prev.viewBox.scale / 1.2, 0.1),
      },
    }));
  }, []);

  // Render SVG element
  const renderElement = (element: WhiteboardElement) => {
    const key = element.id;
    const commonProps = {
      stroke: element.color,
      strokeWidth: element.strokeWidth,
      fill: element.type === 'rectangle' || element.type === 'circle' ? 'transparent' : element.color,
    };

    switch (element.type) {
      case 'pen':
        if (!element.points || element.points.length < 2) return null;
        const pathData = element.points.reduce((path, point, index) => {
          return index === 0 ? `M ${point.x} ${point.y}` : `${path} L ${point.x} ${point.y}`;
        }, '');
        return <path key={key} d={pathData} {...commonProps} fill="none" />;

      case 'rectangle':
        return (
          <rect
            key={key}
            x={element.x}
            y={element.y}
            width={element.width}
            height={element.height}
            {...commonProps}
          />
        );

      case 'circle':
        const radius = Math.sqrt(
          Math.pow(element.width || 0, 2) + Math.pow(element.height || 0, 2)
        ) / 2;
        return (
          <circle
            key={key}
            cx={element.x + (element.width || 0) / 2}
            cy={element.y + (element.height || 0) / 2}
            r={radius}
            {...commonProps}
          />
        );

      case 'line':
        return (
          <line
            key={key}
            x1={element.x}
            y1={element.y}
            x2={element.x + (element.width || 0)}
            y2={element.y + (element.height || 0)}
            {...commonProps}
          />
        );

      case 'text':
        return (
          <text
            key={key}
            x={element.x}
            y={element.y}
            fill={element.color}
            fontSize={element.strokeWidth * 6}
            fontFamily="Arial, sans-serif"
          >
            {element.text}
          </text>
        );

      case 'sticky_note':
        return (
          <g key={key}>
            <rect
              x={element.x}
              y={element.y}
              width={120}
              height={80}
              fill="#ffeb3b"
              stroke="#fbc02d"
              strokeWidth={1}
              rx={4}
            />
            <text
              x={element.x + 8}
              y={element.y + 20}
              fill="#333"
              fontSize="12"
              fontFamily="Arial, sans-serif"
            >
              {element.text?.split('\n').map((line, index) => (
                <tspan key={index} x={element.x + 8} dy={index === 0 ? 0 : 14}>
                  {line.substring(0, 15)}
                </tspan>
              ))}
            </text>
          </g>
        );

      default:
        return null;
    }
  };

  return (
    <Card sx={{ height: maxHeight, display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6">
            Collaborative Whiteboard
          </Typography>
          
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              icon={<CollaboratorsIcon />}
              label={`${collaborators.length} online`}
              size="small"
              variant="outlined"
            />
            
            <IconButton
              size="small"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
          </Stack>
        </Box>

        <Toolbar sx={{ p: 0, minHeight: 'auto' }}>
          <ButtonGroup size="small" sx={{ mr: 2 }}>
            {TOOLS.map((tool) => (
              <Button
                key={tool.id}
                variant={whiteboardState.selectedTool === tool.id ? 'contained' : 'outlined'}
                onClick={() => setWhiteboardState(prev => ({ ...prev, selectedTool: tool.id }))}
                disabled={readOnly}
              >
                <tool.icon />
              </Button>
            ))}
          </ButtonGroup>

          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

          <Button
            size="small"
            variant="outlined"
            onClick={(e) => setColorMenuAnchor(e.currentTarget)}
            sx={{ 
              minWidth: 40, 
              backgroundColor: whiteboardState.selectedColor,
              borderColor: whiteboardState.selectedColor,
              mr: 1,
            }}
            disabled={readOnly}
          >
            <PaletteIcon sx={{ color: 'white' }} />
          </Button>

          <Button
            size="small"
            variant="outlined"
            onClick={(e) => setSizeMenuAnchor(e.currentTarget)}
            disabled={readOnly}
            sx={{ mr: 2 }}
          >
            <SizeIcon />
          </Button>

          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

          <ButtonGroup size="small" sx={{ mr: 2 }}>
            <IconButton onClick={undo} disabled={historyIndex <= 0 || readOnly}>
              <UndoIcon />
            </IconButton>
            <IconButton onClick={redo} disabled={historyIndex >= history.length - 1 || readOnly}>
              <RedoIcon />
            </IconButton>
          </ButtonGroup>

          <ButtonGroup size="small" sx={{ mr: 2 }}>
            <IconButton onClick={zoomOut}>
              <ZoomOutIcon />
            </IconButton>
            <IconButton onClick={zoomIn}>
              <ZoomInIcon />
            </IconButton>
          </ButtonGroup>

          <Button
            size="small"
            variant="outlined"
            onClick={clearWhiteboard}
            disabled={readOnly}
            sx={{ mr: 1 }}
          >
            <ClearIcon />
          </Button>

          <Button
            size="small"
            variant="contained"
            onClick={() => console.log('Save whiteboard')}
            sx={{ mr: 1 }}
          >
            <SaveIcon />
          </Button>
        </Toolbar>
      </CardContent>

      <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`${whiteboardState.viewBox.x} ${whiteboardState.viewBox.y} ${800 / whiteboardState.viewBox.scale} ${600 / whiteboardState.viewBox.scale}`}
          style={{ 
            cursor: whiteboardState.selectedTool === 'pen' ? 'crosshair' : 'default',
            backgroundColor: '#ffffff',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Grid pattern */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e0e0e0" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Render all elements */}
          {whiteboardState.elements.map(renderElement)}

          {/* Render current drawing element */}
          {currentElement && renderElement(currentElement as WhiteboardElement)}
        </svg>
      </Box>

      {/* Color picker menu */}
      <Menu
        anchorEl={colorMenuAnchor}
        open={Boolean(colorMenuAnchor)}
        onClose={() => setColorMenuAnchor(null)}
      >
        <Box sx={{ p: 1, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1 }}>
          {COLORS.map((color) => (
            <Box
              key={color}
              sx={{
                width: 24,
                height: 24,
                backgroundColor: color,
                cursor: 'pointer',
                border: whiteboardState.selectedColor === color ? '2px solid #000' : '1px solid #ccc',
              }}
              onClick={() => {
                setWhiteboardState(prev => ({ ...prev, selectedColor: color }));
                setColorMenuAnchor(null);
              }}
            />
          ))}
        </Box>
      </Menu>

      {/* Stroke width menu */}
      <Menu
        anchorEl={sizeMenuAnchor}
        open={Boolean(sizeMenuAnchor)}
        onClose={() => setSizeMenuAnchor(null)}
      >
        <Box sx={{ p: 2, width: 200 }}>
          <Typography variant="body2" gutterBottom>
            Stroke Width: {whiteboardState.strokeWidth}px
          </Typography>
          <Slider
            value={whiteboardState.strokeWidth}
            onChange={(_, value) => setWhiteboardState(prev => ({ 
              ...prev, 
              strokeWidth: value as number 
            }))}
            min={1}
            max={12}
            step={1}
            marks={STROKE_WIDTHS.map(width => ({ value: width, label: `${width}px` }))}
          />
        </Box>
      </Menu>

      {/* Text input dialog */}
      <Dialog
        open={textDialog.open}
        onClose={() => setTextDialog({ open: false, x: 0, y: 0 })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Add {whiteboardState.selectedTool === 'sticky_note' ? 'Sticky Note' : 'Text'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder={`Enter ${whiteboardState.selectedTool === 'sticky_note' ? 'note' : 'text'} content...`}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTextDialog({ open: false, x: 0, y: 0 })}>
            Cancel
          </Button>
          <Button onClick={handleTextSubmit} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default CollaborativeWhiteboard;