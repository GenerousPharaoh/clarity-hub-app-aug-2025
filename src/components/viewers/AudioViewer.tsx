import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  IconButton, 
  Typography, 
  CircularProgress, 
  Alert,
  Slider,
  Stack,
  Paper,
  Tooltip
} from '@mui/material';
import { 
  PlayArrow, 
  Pause, 
  VolumeUp, 
  VolumeOff, 
  Replay10,
  Forward10,
  Download
} from '@mui/icons-material';

interface AudioViewerProps {
  url: string;
  fileName: string;
  type?: string;
}

const AudioViewer: React.FC<AudioViewerProps> = ({ url, fileName, type }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [muted, setMuted] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Format time in mm:ss format
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Handle audio load
  const handleAudioLoad = () => {
    setLoading(false);
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      audioRef.current.volume = volume;
    }
  };
  
  // Handle audio error
  const handleAudioError = () => {
    setError('Error loading audio. Please try again later.');
    setLoading(false);
  };
  
  // Handle play/pause
  const togglePlay = () => {
    if (audioRef.current) {
      if (playing) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setPlaying(!playing);
    }
  };
  
  // Handle time update
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
    }
  };
  
  // Handle progress change
  const handleProgressChange = (event: Event, newValue: number | number[]) => {
    const newProgress = newValue as number;
    setProgress(newProgress);
    if (audioRef.current) {
      audioRef.current.currentTime = newProgress;
    }
  };
  
  // Handle volume change
  const handleVolumeChange = (event: Event, newValue: number | number[]) => {
    const newVolume = newValue as number;
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      setMuted(newVolume === 0);
    }
  };
  
  // Handle mute toggle
  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !muted;
      setMuted(!muted);
    }
  };
  
  // Skip backward 10 seconds
  const skipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0);
    }
  };
  
  // Skip forward 10 seconds
  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, duration);
    }
  };
  
  // Handle download
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Reset audio when URL changes
  useEffect(() => {
    setLoading(true);
    setError(null);
    setPlaying(false);
    setProgress(0);
  }, [url]);
  
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        p: 2
      }}
      data-test="audio-viewer"
    >
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={url}
        onLoadedData={handleAudioLoad}
        onTimeUpdate={handleTimeUpdate}
        onError={handleAudioError}
        onEnded={() => setPlaying(false)}
        style={{ display: 'none' }}
      />
      
      {/* Loading state */}
      {loading && (
        <Box sx={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <CircularProgress size={40} thickness={4} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading audio...
          </Typography>
        </Box>
      )}
      
      {/* Error state */}
      {error && (
        <Alert severity="error" sx={{ m: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* Audio player UI */}
      {!loading && !error && (
        <Paper 
          elevation={3} 
          sx={{ 
            width: '100%',
            maxWidth: 600,
            p: 3,
            borderRadius: 2,
            bgcolor: 'background.paper'
          }}
        >
          {/* File info */}
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Typography variant="h6" noWrap sx={{ maxWidth: '100%' }}>
              {fileName}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {formatTime(duration)} • Audio file
            </Typography>
          </Box>
          
          {/* Audio waveform placeholder */}
          <Box 
            sx={{ 
              width: '100%',
              height: 80,
              bgcolor: 'action.hover',
              borderRadius: 1,
              mb: 2,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Progress indicator */}
            <Box 
              sx={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: `${(progress / duration) * 100}%`,
                bgcolor: 'primary.main',
                opacity: 0.2,
                transition: 'width 0.1s linear'
              }}
            />
            
            {/* Play button overlay */}
            <IconButton
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
                width: 50,
                height: 50,
              }}
              onClick={togglePlay}
              data-test="audio-play-button"
            >
              {playing ? <Pause /> : <PlayArrow />}
            </IconButton>
          </Box>
          
          {/* Progress control */}
          <Box sx={{ mb: 2 }}>
            <Slider
              value={progress}
              min={0}
              max={duration || 100}
              onChange={handleProgressChange}
              sx={{ 
                color: 'primary.main',
                height: 4,
                mb: 1
              }}
            />
            
            {/* Time display */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">
                {formatTime(progress)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatTime(duration)}
              </Typography>
            </Box>
          </Box>
          
          {/* Controls */}
          <Stack 
            direction="row" 
            spacing={1} 
            alignItems="center" 
            justifyContent="space-between"
          >
            {/* Left controls */}
            <Stack direction="row" spacing={1}>
              <Tooltip title="Skip back 10 seconds">
                <IconButton onClick={skipBackward} size="small">
                  <Replay10 />
                </IconButton>
              </Tooltip>
              
              <IconButton 
                onClick={togglePlay} 
                size="large" 
                color="primary"
                sx={{ 
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  }
                }}
              >
                {playing ? <Pause /> : <PlayArrow />}
              </IconButton>
              
              <Tooltip title="Skip forward 10 seconds">
                <IconButton onClick={skipForward} size="small">
                  <Forward10 />
                </IconButton>
              </Tooltip>
            </Stack>
            
            {/* Right controls */}
            <Stack direction="row" spacing={1} alignItems="center">
              <IconButton
                onClick={toggleMute}
                size="small"
              >
                {muted || volume === 0 ? <VolumeOff /> : <VolumeUp />}
              </IconButton>
              
              <Slider
                value={muted ? 0 : volume}
                min={0}
                max={1}
                step={0.01}
                onChange={handleVolumeChange}
                sx={{ 
                  width: 80,
                  height: 4,
                  '& .MuiSlider-thumb': {
                    width: 8,
                    height: 8,
                  },
                }}
              />
              
              <Tooltip title="Download audio">
                <IconButton onClick={handleDownload} size="small">
                  <Download />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Paper>
      )}
    </Box>
  );
};

export default AudioViewer; 