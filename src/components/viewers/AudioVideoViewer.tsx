import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Tooltip,
  Stack,
  Slider,
  ButtonGroup,
  Button,
  Divider,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  VolumeUp,
  VolumeMute,
  Fullscreen,
  ContentCopy,
  SkipNext,
  SkipPrevious,
  Speed,
} from '@mui/icons-material';
import { LinkActivation } from '../../types';

interface AudioVideoViewerProps {
  url: string;
  fileName: string;
  isVideo: boolean;
  onLinkUpdate?: (updates: Partial<LinkActivation>) => void;
}

const formatTime = (time: number): string => {
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = Math.floor(time % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const AudioVideoViewer = forwardRef<any, AudioVideoViewerProps>(
  ({ url, fileName, isVideo, onLinkUpdate }, ref) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [showVolumeSlider, setShowVolumeSlider] = useState(false);
    const [showCopySuccess, setShowCopySuccess] = useState(false);
    
    const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      play: () => {
        if (mediaRef.current) {
          mediaRef.current.play();
          setIsPlaying(true);
        }
      },
      pause: () => {
        if (mediaRef.current) {
          mediaRef.current.pause();
          setIsPlaying(false);
        }
      },
      getCurrentTime: () => currentTime,
      getDuration: () => duration,
      seekTo: (time: number) => {
        if (mediaRef.current) {
          mediaRef.current.currentTime = time;
        }
      },
    }));
    
    // Play/pause toggle
    const togglePlay = () => {
      if (mediaRef.current) {
        if (isPlaying) {
          mediaRef.current.pause();
        } else {
          mediaRef.current.play();
        }
        setIsPlaying(!isPlaying);
      }
    };
    
    // Skip forward/backward
    const skipForward = () => {
      if (mediaRef.current) {
        mediaRef.current.currentTime = Math.min(mediaRef.current.currentTime + 10, duration);
      }
    };
    
    const skipBackward = () => {
      if (mediaRef.current) {
        mediaRef.current.currentTime = Math.max(mediaRef.current.currentTime - 10, 0);
      }
    };
    
    // Volume control
    const toggleMute = () => {
      if (mediaRef.current) {
        mediaRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
      }
    };
    
    const handleVolumeChange = (_: Event, newValue: number | number[]) => {
      const vol = newValue as number;
      if (mediaRef.current) {
        mediaRef.current.volume = vol;
        setVolume(vol);
        setIsMuted(vol === 0);
      }
    };
    
    // Playback rate control
    const changePlaybackRate = (rate: number) => {
      if (mediaRef.current) {
        mediaRef.current.playbackRate = rate;
        setPlaybackRate(rate);
      }
    };
    
    // Time update handler
    const handleTimeUpdate = () => {
      if (mediaRef.current) {
        setCurrentTime(mediaRef.current.currentTime);
      }
    };
    
    // Duration change handler
    const handleDurationChange = () => {
      if (mediaRef.current) {
        setDuration(mediaRef.current.duration);
      }
    };
    
    // Seek handler
    const handleSeek = (_: Event, newValue: number | number[]) => {
      const seekTime = newValue as number;
      if (mediaRef.current) {
        mediaRef.current.currentTime = seekTime;
        setCurrentTime(seekTime);
      }
    };
    
    // Enter full screen (for video)
    const enterFullScreen = () => {
      if (isVideo && mediaRef.current) {
        if (mediaRef.current.requestFullscreen) {
          mediaRef.current.requestFullscreen()
            .catch(err => {
              console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        }
      } else if (containerRef.current && containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen()
          .catch(err => {
            console.error(`Error attempting to enable full-screen mode: ${err.message}`);
          });
      }
    };
    
    // Copy link with timestamp
    const copyTimestampLink = () => {
      // Notify parent about the link activation
      onLinkUpdate?.({ timestamp: currentTime });
      setShowCopySuccess(true);
    };
    
    // Media element props
    const mediaProps = {
      src: url,
      ref: mediaRef,
      onTimeUpdate: handleTimeUpdate,
      onDurationChange: handleDurationChange,
      onPlay: () => setIsPlaying(true),
      onPause: () => setIsPlaying(false),
      onEnded: () => setIsPlaying(false),
      volume,
      muted: isMuted,
      style: { width: '100%', height: '100%', maxHeight: isVideo ? '600px' : 'auto' },
    };
    
    return (
      <Box
        ref={containerRef}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: '100%',
          bgcolor: 'background.paper',
          position: 'relative',
        }}
      >
        {/* Media player */}
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: (theme) => theme.palette.mode === 'dark' ? '#1E1E1E' : '#f5f5f5',
            p: 2,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {isVideo ? (
            <video {...mediaProps} controls={false} />
          ) : (
            <audio {...mediaProps} controls={false} />
          )}
          
          {isVideo ? null : (
            <Box 
              sx={{ 
                p: 2, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
              }}
            >
              <Typography variant="h6" gutterBottom>
                {fileName}
              </Typography>
              <Box
                sx={{ 
                  width: 200, 
                  height: 200, 
                  bgcolor: 'primary.dark', 
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 3,
                }}
              >
                <IconButton
                  onClick={togglePlay}
                  sx={{ 
                    width: 80, 
                    height: 80, 
                    color: 'white',
                  }}
                >
                  {isPlaying ? <Pause fontSize="large" /> : <PlayArrow fontSize="large" />}
                </IconButton>
              </Box>
            </Box>
          )}
        </Box>
        
        {/* Controls */}
        <Paper
          elevation={0}
          sx={{
            p: 1,
            display: 'flex',
            flexDirection: 'column',
            borderTop: 1,
            borderColor: 'divider',
            borderRadius: 0,
          }}
        >
          {/* Progress slider */}
          <Box sx={{ display: 'flex', alignItems: 'center', px: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mr: 1, minWidth: 40 }}>
              {formatTime(currentTime)}
            </Typography>
            
            <Slider
              value={currentTime}
              max={duration || 100}
              onChange={handleSeek}
              aria-label="media progress"
              sx={{ mx: 1 }}
            />
            
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1, minWidth: 40 }}>
              {formatTime(duration)}
            </Typography>
          </Box>
          
          {/* Control buttons */}
          <Stack
            direction="row"
            spacing={1}
            divider={<Divider orientation="vertical" flexItem />}
            sx={{ width: '100%', alignItems: 'center', px: 1, py: 0.5 }}
          >
            {/* Playback controls */}
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Skip backward 10s">
                <IconButton onClick={skipBackward} size="small">
                  <SkipPrevious />
                </IconButton>
              </Tooltip>
              
              <IconButton onClick={togglePlay} size="small">
                {isPlaying ? <Pause /> : <PlayArrow />}
              </IconButton>
              
              <Tooltip title="Skip forward 10s">
                <IconButton onClick={skipForward} size="small">
                  <SkipNext />
                </IconButton>
              </Tooltip>
            </Stack>
            
            {/* Volume control */}
            <Box sx={{ position: 'relative' }}>
              <IconButton 
                onMouseEnter={() => setShowVolumeSlider(true)}
                onMouseLeave={() => setShowVolumeSlider(false)}
                onClick={toggleMute}
                size="small"
              >
                {isMuted ? <VolumeMute /> : <VolumeUp />}
              </IconButton>
              
              {showVolumeSlider && (
                <Paper
                  sx={{
                    position: 'absolute',
                    bottom: '100%',
                    left: 0,
                    p: 1,
                    width: 40,
                    height: 120,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    zIndex: 10,
                    mb: 0.5,
                  }}
                  onMouseEnter={() => setShowVolumeSlider(true)}
                  onMouseLeave={() => setShowVolumeSlider(false)}
                >
                  <Slider
                    value={volume}
                    onChange={handleVolumeChange}
                    aria-label="Volume"
                    orientation="vertical"
                    min={0}
                    max={1}
                    step={0.01}
                    sx={{ height: 100 }}
                  />
                </Paper>
              )}
            </Box>
            
            {/* Playback rate */}
            <ButtonGroup size="small" variant="text">
              <Button
                onClick={() => changePlaybackRate(1)}
                variant={playbackRate === 1 ? "contained" : "text"}
                size="small"
                startIcon={<Speed fontSize="small" />}
              >
                1x
              </Button>
              <Button
                onClick={() => changePlaybackRate(1.5)}
                variant={playbackRate === 1.5 ? "contained" : "text"}
                size="small"
              >
                1.5x
              </Button>
              <Button
                onClick={() => changePlaybackRate(2)}
                variant={playbackRate === 2 ? "contained" : "text"}
                size="small"
              >
                2x
              </Button>
            </ButtonGroup>
            
            {/* Actions */}
            <Box sx={{ flexGrow: 1 }} />
            
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Copy link to timestamp">
                <IconButton onClick={copyTimestampLink} size="small">
                  <ContentCopy />
                </IconButton>
              </Tooltip>
              
              {isVideo && (
                <Tooltip title="Fullscreen">
                  <IconButton onClick={enterFullScreen} size="small">
                    <Fullscreen />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          </Stack>
        </Paper>
        
        <Snackbar
          open={showCopySuccess}
          autoHideDuration={3000}
          onClose={() => setShowCopySuccess(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setShowCopySuccess(false)} severity="success" sx={{ width: '100%' }}>
            Link to timestamp copied!
          </Alert>
        </Snackbar>
      </Box>
    );
  }
);

export default AudioVideoViewer; 