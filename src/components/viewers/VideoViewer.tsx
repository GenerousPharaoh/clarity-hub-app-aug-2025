import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  IconButton, 
  Typography, 
  CircularProgress, 
  Alert,
  Tooltip,
  Slider,
  Stack
} from '@mui/material';
import { 
  PlayArrow, 
  Pause, 
  VolumeUp, 
  VolumeOff, 
  Fullscreen,
  FullscreenExit
} from '@mui/icons-material';

interface VideoViewerProps {
  url: string;
  fileName: string;
  type?: string;
}

const VideoViewer: React.FC<VideoViewerProps> = ({ url, fileName, type }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<number | null>(null);
  
  // Format time in mm:ss format
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Handle video load
  const handleVideoLoad = () => {
    setLoading(false);
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      videoRef.current.volume = volume;
    }
  };
  
  // Handle video error
  const handleVideoError = () => {
    setError('Error loading video. Please try again later.');
    setLoading(false);
  };
  
  // Handle play/pause
  const togglePlay = () => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setPlaying(!playing);
    }
  };
  
  // Handle time update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setProgress(videoRef.current.currentTime);
    }
  };
  
  // Handle progress change
  const handleProgressChange = (event: Event, newValue: number | number[]) => {
    const newProgress = newValue as number;
    setProgress(newProgress);
    if (videoRef.current) {
      videoRef.current.currentTime = newProgress;
    }
  };
  
  // Handle volume change
  const handleVolumeChange = (event: Event, newValue: number | number[]) => {
    const newVolume = newValue as number;
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setMuted(newVolume === 0);
    }
  };
  
  // Handle mute toggle
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !muted;
      setMuted(!muted);
    }
  };
  
  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (!fullscreen) {
        if (containerRef.current.requestFullscreen) {
          containerRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
      setFullscreen(!fullscreen);
    }
  };
  
  // Handle mouse movement to show/hide controls
  const handleMouseMove = () => {
    setShowControls(true);
    
    // Clear existing timeout
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    
    // Set a new timeout
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (playing) {
        setShowControls(false);
      }
    }, 3000);
  };
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        window.clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);
  
  // Listen for fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  // Reset video when URL changes
  useEffect(() => {
    setLoading(true);
    setError(null);
    setPlaying(false);
    setProgress(0);
  }, [url]);
  
  return (
    <Box 
      ref={containerRef}
      sx={{ 
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'black',
        cursor: showControls ? 'default' : 'none',
      }}
      onMouseMove={handleMouseMove}
      data-test="video-viewer"
    >
      {/* Loading indicator */}
      {loading && (
        <Box sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 2
        }}>
          <CircularProgress size={40} thickness={4} sx={{ color: 'white' }} />
          <Typography variant="body2" color="white" sx={{ mt: 2 }}>
            Loading video...
          </Typography>
        </Box>
      )}
      
      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ m: 2, zIndex: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* Video element */}
      <video
        ref={videoRef}
        src={url}
        width="100%"
        height="100%"
        style={{ 
          maxHeight: '100%',
          backgroundColor: 'black',
          objectFit: 'contain',
        }}
        onLoadedData={handleVideoLoad}
        onTimeUpdate={handleTimeUpdate}
        onError={handleVideoError}
        onClick={togglePlay}
        onEnded={() => setPlaying(false)}
      />
      
      {/* Play/pause overlay button */}
      {!loading && !error && !playing && (
        <IconButton
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            color: 'white',
            '&:hover': {
              bgcolor: 'rgba(0, 0, 0, 0.7)',
            },
            width: 60,
            height: 60,
          }}
          onClick={togglePlay}
        >
          <PlayArrow sx={{ fontSize: 40 }} />
        </IconButton>
      )}
      
      {/* Video controls */}
      <Box 
        sx={{ 
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          bgcolor: 'rgba(0, 0, 0, 0.7)',
          p: 1,
          transition: 'opacity 0.3s ease',
          opacity: showControls ? 1 : 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Progress bar */}
        <Slider
          value={progress}
          min={0}
          max={duration || 100}
          onChange={handleProgressChange}
          sx={{ 
            color: 'primary.main',
            height: 4,
            p: 0,
            '& .MuiSlider-thumb': {
              width: 8,
              height: 8,
              transition: '0.3s cubic-bezier(.47,1.64,.41,.8)',
              '&:before': {
                boxShadow: '0 2px 12px 0 rgba(0,0,0,0.4)',
              },
              '&:hover, &.Mui-focusVisible': {
                boxShadow: `0px 0px 0px 8px ${
                  'rgb(255 255 255 / 16%)'
                }`,
              },
              '&.Mui-active': {
                width: 12,
                height: 12,
              },
            },
            '& .MuiSlider-rail': {
              opacity: 0.28,
            },
          }}
        />
        
        {/* Controls row */}
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          {/* Play/pause button */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              onClick={togglePlay}
              size="small"
              sx={{ color: 'white' }}
            >
              {playing ? <Pause /> : <PlayArrow />}
            </IconButton>
            
            {/* Time display */}
            <Typography variant="caption" sx={{ color: 'white', mx: 1 }}>
              {formatTime(progress)} / {formatTime(duration)}
            </Typography>
          </Box>
          
          {/* Right-side controls */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* Volume control */}
            <Stack direction="row" spacing={1} alignItems="center" sx={{ width: 100 }}>
              <IconButton
                onClick={toggleMute}
                size="small"
                sx={{ color: 'white' }}
              >
                {muted || volume === 0 ? <VolumeOff fontSize="small" /> : <VolumeUp fontSize="small" />}
              </IconButton>
              
              <Slider
                value={muted ? 0 : volume}
                min={0}
                max={1}
                step={0.01}
                onChange={handleVolumeChange}
                sx={{ 
                  color: 'white',
                  width: 60,
                  height: 4,
                  '& .MuiSlider-thumb': {
                    width: 8,
                    height: 8,
                  },
                }}
              />
            </Stack>
            
            {/* Fullscreen button */}
            <IconButton
              onClick={toggleFullscreen}
              size="small"
              sx={{ color: 'white' }}
            >
              {fullscreen ? <FullscreenExit fontSize="small" /> : <Fullscreen fontSize="small" />}
            </IconButton>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
};

export default VideoViewer; 