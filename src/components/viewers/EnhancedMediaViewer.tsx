import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Toolbar,
  IconButton,
  Typography,
  Paper,
  Slider,
  Tooltip,
  ButtonGroup,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
  useTheme,
} from '@mui/material';
import {
  ZoomIn,
  ZoomOut,
  ZoomOutMap,
  RotateLeft,
  RotateRight,
  FitScreen,
  Fullscreen,
  FullscreenExit,
  PlayArrow,
  Pause,
  VolumeUp,
  VolumeOff,
  FastForward,
  FastRewind,
  Download,
  MoreVert,
  Brush,
  Save,
} from '@mui/icons-material';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import WaveSurfer from 'wavesurfer.js';
import useAppStore from '../../store';

interface EnhancedMediaViewerProps {
  url: string;
  fileType: 'image' | 'audio' | 'video';
  fileName?: string;
}

interface Annotation {
  id: string;
  type: 'rectangle' | 'circle' | 'text';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  text?: string;
  color: string;
  timestamp: number;
}

const EnhancedMediaViewer: React.FC<EnhancedMediaViewerProps> = ({
  url,
  fileType,
  fileName = 'media-file',
}) => {
  const theme = useTheme();

  // Common state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  // Image state
  const [rotation, setRotation] = useState(0);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [annotationType, setAnnotationType] = useState<'rectangle' | 'circle' | 'text'>('rectangle');

  // Audio/Video state
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Store integration
  const linkActivation = useAppStore((state) => state.linkActivation);
  const setLinkActivation = useAppStore((state) => state.setLinkActivation);

  // Handle link activation for timestamp jumps
  useEffect(() => {
    if (linkActivation?.type === 'citation' && linkActivation.timestamp !== undefined) {
      if (fileType === 'audio' && wavesurferRef.current) {
        const time = typeof linkActivation.timestamp === 'string' 
          ? parseTimeString(linkActivation.timestamp)
          : linkActivation.timestamp;
        wavesurferRef.current.seekTo(time / duration);
      } else if (fileType === 'video' && videoRef.current) {
        const time = typeof linkActivation.timestamp === 'string' 
          ? parseTimeString(linkActivation.timestamp)
          : linkActivation.timestamp;
        videoRef.current.currentTime = time;
      }
      setLinkActivation(null);
    }
  }, [linkActivation, setLinkActivation, duration, fileType]);

  // Initialize media based on type
  useEffect(() => {
    const initializeMedia = async () => {
      setLoading(true);
      setError(null);

      try {
        if (fileType === 'image') {
          // Image loads automatically
          setLoading(false);
        } else if (fileType === 'audio') {
          await initializeAudioWaveform();
        } else if (fileType === 'video') {
          initializeVideo();
        }
      } catch (err) {
        setError(`Failed to load ${fileType} file`);
        setLoading(false);
      }
    };

    initializeMedia();

    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
    };
  }, [url, fileType]);

  // Parse time string (MM:SS or HH:MM:SS) to seconds
  const parseTimeString = (timeString: string): number => {
    const parts = timeString.split(':').map(Number);
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
  };

  // Format seconds to MM:SS or HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Initialize audio waveform
  const initializeAudioWaveform = async () => {
    if (!containerRef.current) return;

    const waveformContainer = containerRef.current.querySelector('.waveform-container');
    if (!waveformContainer) return;

    wavesurferRef.current = WaveSurfer.create({
      container: waveformContainer as HTMLElement,
      waveColor: '#1e293b',
      progressColor: '#0f172a',
      barWidth: 2,
      barRadius: 1,
      responsive: true,
      height: 100,
      normalize: true,
      backend: 'WebAudio',
      mediaControls: false,
    });

    wavesurferRef.current.load(url);

    wavesurferRef.current.on('ready', () => {
      setDuration(wavesurferRef.current!.getDuration());
      setLoading(false);
    });

    wavesurferRef.current.on('audioprocess', () => {
      setCurrentTime(wavesurferRef.current!.getCurrentTime());
    });

    wavesurferRef.current.on('play', () => setIsPlaying(true));
    wavesurferRef.current.on('pause', () => setIsPlaying(false));
  };

  // Initialize video
  const initializeVideo = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    
    video.addEventListener('loadedmetadata', () => {
      setDuration(video.duration);
      setLoading(false);
    });

    video.addEventListener('timeupdate', () => {
      setCurrentTime(video.currentTime);
    });

    video.addEventListener('play', () => setIsPlaying(true));
    video.addEventListener('pause', () => setIsPlaying(false));
  };

  // Media control functions
  const togglePlayPause = () => {
    if (fileType === 'audio' && wavesurferRef.current) {
      wavesurferRef.current.playPause();
    } else if (fileType === 'video' && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const seekTo = (time: number) => {
    if (fileType === 'audio' && wavesurferRef.current) {
      wavesurferRef.current.seekTo(time / duration);
    } else if (fileType === 'video' && videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const changeVolume = (newVolume: number) => {
    setVolume(newVolume);
    if (fileType === 'audio' && wavesurferRef.current) {
      wavesurferRef.current.setVolume(newVolume);
    } else if (fileType === 'video' && videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (fileType === 'audio' && wavesurferRef.current) {
      wavesurferRef.current.setVolume(newMuted ? 0 : volume);
    } else if (fileType === 'video' && videoRef.current) {
      videoRef.current.muted = newMuted;
    }
  };

  // Image control functions
  const rotateImage = (direction: 'left' | 'right') => {
    const newRotation = direction === 'left' ? rotation - 90 : rotation + 90;
    setRotation(newRotation % 360);
  };

  // Annotation functions
  const addAnnotation = (type: 'rectangle' | 'circle' | 'text', x: number, y: number) => {
    const newAnnotation: Annotation = {
      id: Date.now().toString(),
      type,
      x,
      y,
      width: type === 'rectangle' ? 100 : undefined,
      height: type === 'rectangle' ? 60 : undefined,
      radius: type === 'circle' ? 30 : undefined,
      text: type === 'text' ? 'Annotation' : undefined,
      color: theme.palette.error.main,
      timestamp: Date.now(),
    };
    setAnnotations([...annotations, newAnnotation]);
  };

  const exportAnnotations = () => {
    const dataStr = JSON.stringify(annotations, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}-annotations.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download function
  const downloadFile = () => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        backgroundColor: 'background.default'
      }}>
        <CircularProgress size={48} thickness={4} sx={{ color: 'primary.main' }} />
        <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
          Loading {fileType} file...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Alert severity="error" sx={{ width: '100%', maxWidth: 400 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  // Render toolbar based on file type
  const renderToolbar = () => (
    <Paper elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Toolbar variant="dense" sx={{ minHeight: 56, px: 2 }}>
        {fileType === 'image' && (
          <>
            <ButtonGroup size="small" variant="outlined" sx={{ mr: 2 }}>
              <Tooltip title="Zoom in">
                <IconButton size="small">
                  <ZoomIn />
                </IconButton>
              </Tooltip>
              <Tooltip title="Zoom out">
                <IconButton size="small">
                  <ZoomOut />
                </IconButton>
              </Tooltip>
              <Tooltip title="Reset zoom">
                <IconButton size="small">
                  <ZoomOutMap />
                </IconButton>
              </Tooltip>
              <Tooltip title="Fit to screen">
                <IconButton size="small">
                  <FitScreen />
                </IconButton>
              </Tooltip>
            </ButtonGroup>

            <ButtonGroup size="small" variant="outlined" sx={{ mr: 2 }}>
              <Tooltip title="Rotate left">
                <IconButton onClick={() => rotateImage('left')} size="small">
                  <RotateLeft />
                </IconButton>
              </Tooltip>
              <Tooltip title="Rotate right">
                <IconButton onClick={() => rotateImage('right')} size="small">
                  <RotateRight />
                </IconButton>
              </Tooltip>
            </ButtonGroup>

            <Button
              size="small"
              variant={isAnnotating ? 'contained' : 'outlined'}
              startIcon={<Brush />}
              onClick={() => setIsAnnotating(!isAnnotating)}
              sx={{ mr: 2 }}
            >
              Annotate
            </Button>

            {annotations.length > 0 && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<Save />}
                onClick={exportAnnotations}
                sx={{ mr: 2 }}
              >
                Export Annotations
              </Button>
            )}
          </>
        )}

        {(fileType === 'audio' || fileType === 'video') && (
          <>
            <IconButton onClick={togglePlayPause} sx={{ mr: 2 }}>
              {isPlaying ? <Pause /> : <PlayArrow />}
            </IconButton>

            <Typography variant="body2" sx={{ mr: 2, minWidth: 80 }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </Typography>

            <Slider
              value={currentTime}
              max={duration}
              onChange={(_, value) => seekTo(value as number)}
              sx={{ mr: 2, flexGrow: 1, maxWidth: 300 }}
            />

            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
              <IconButton onClick={toggleMute} size="small">
                {isMuted ? <VolumeOff /> : <VolumeUp />}
              </IconButton>
              <Slider
                value={isMuted ? 0 : volume}
                onChange={(_, value) => changeVolume(value as number)}
                min={0}
                max={1}
                step={0.1}
                sx={{ width: 80, ml: 1 }}
              />
            </Box>
          </>
        )}

        <Box sx={{ flexGrow: 1 }} />

        <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)} size="small">
          <MoreVert />
        </IconButton>

        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
        >
          <MenuItem onClick={() => setIsFullscreen(!isFullscreen)}>
            <ListItemIcon>
              {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
            </ListItemIcon>
            <ListItemText>
              {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            </ListItemText>
          </MenuItem>
          <MenuItem onClick={downloadFile}>
            <ListItemIcon>
              <Download />
            </ListItemIcon>
            <ListItemText>Download</ListItemText>
          </MenuItem>
        </Menu>
      </Toolbar>
    </Paper>
  );

  // Render content based on file type
  const renderContent = () => {
    if (fileType === 'image') {
      return (
        <TransformWrapper
          initialScale={1}
          minScale={0.25}
          maxScale={4}
          centerOnInit
        >
          <TransformComponent
            wrapperStyle={{
              width: '100%',
              height: '100%',
            }}
            contentStyle={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              ref={imageRef}
              src={url}
              alt={fileName}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                transform: `rotate(${rotation}deg)`,
                transition: 'transform 0.3s ease',
              }}
              onLoad={() => setLoading(false)}
              onError={() => setError('Failed to load image')}
            />
            
            {/* Annotation overlay */}
            {annotations.map((annotation) => (
              <div
                key={annotation.id}
                style={{
                  position: 'absolute',
                  left: annotation.x,
                  top: annotation.y,
                  width: annotation.width,
                  height: annotation.height,
                  border: `2px solid ${annotation.color}`,
                  backgroundColor: 'rgba(255, 68, 68, 0.1)',
                  pointerEvents: 'none',
                }}
              />
            ))}
          </TransformComponent>
        </TransformWrapper>
      );
    } else if (fileType === 'audio') {
      return (
        <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Box
            className="waveform-container"
            sx={{ width: '100%', maxWidth: 800, mb: 4 }}
          />
          
          <Paper elevation={2} sx={{ p: 3, width: '100%', maxWidth: 400, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              {fileName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatTime(currentTime)} / {formatTime(duration)}
            </Typography>
          </Paper>
        </Box>
      );
    } else if (fileType === 'video') {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', p: 2 }}>
          <video
            ref={videoRef}
            src={url}
            controls={false}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              backgroundColor: 'black',
            }}
          />
        </Box>
      );
    }

    return null;
  };

  return (
    <Box
      ref={containerRef}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: fileType === 'image' ? 'background.default' : 'background.paper',
        overflow: 'hidden',
      }}
    >
      {renderToolbar()}
      
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {renderContent()}
      </Box>

      {/* Status Bar */}
      <Paper elevation={0} sx={{ borderTop: 1, borderColor: 'divider', py: 0.5, px: 2 }}>
        <Typography variant="caption" color="text.secondary">
          {fileName} • {fileType.charAt(0).toUpperCase() + fileType.slice(1)} 
          {(fileType === 'audio' || fileType === 'video') && ` • ${formatTime(duration)}`}
          {fileType === 'image' && rotation !== 0 && ` • Rotated ${rotation}°`}
        </Typography>
      </Paper>
    </Box>
  );
};

export default EnhancedMediaViewer;