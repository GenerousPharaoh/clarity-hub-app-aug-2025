import React, { useState, useEffect, useRef } from 'react';
import { Box, CircularProgress, Typography, Alert, IconButton, Slider, Tooltip } from '@mui/material';
import { 
  PlayArrow, 
  Pause, 
  VolumeUp, 
  VolumeOff, 
  Fullscreen, 
  FullscreenExit,
  SkipNext,
  SkipPrevious,
  ContentCopy
} from '@mui/icons-material';

interface MediaViewerProps {
  url: string;
  fileName?: string;
  metadata?: Record<string, any>;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

const MediaViewer: React.FC<MediaViewerProps> = ({ 
  url, 
  fileName,
  metadata,
  onLoad,
  onError 
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Determine media type based on URL or metadata
  const isVideo = metadata?.contentType?.startsWith('video/') || 
                 fileName?.match(/\.(mp4|webm|mkv|avi|mov)$/i) || 
                 url?.match(/\.(mp4|webm|mkv|avi|mov)$/i);
  
  // Format time in MM:SS format
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  // Load media information once the element is loaded
  const handleLoadedMetadata = () => {
    if (mediaRef.current) {
      setDuration(mediaRef.current.duration);
      setLoading(false);
      if (onLoad) onLoad();
    }
  };
  
  // Update current time during playback
  const handleTimeUpdate = () => {
    if (mediaRef.current) {
      setCurrentTime(mediaRef.current.currentTime);
    }
  };
  
  // Handle play/pause toggle
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
  
  // Handle mute toggle
  const toggleMute = () => {
    if (mediaRef.current) {
      mediaRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };
  
  // Handle slider change for seeking
  const handleSeek = (_: Event, newValue: number | number[]) => {
    const seekTime = Array.isArray(newValue) ? newValue[0] : newValue;
    if (mediaRef.current) {
      mediaRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };
  
  // Handle volume change
  const handleVolumeChange = (_: Event, newValue: number | number[]) => {
    const newVolume = Array.isArray(newValue) ? newValue[0] : newValue;
    if (mediaRef.current) {
      mediaRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };
  
  // Skip forward/backward
  const skip = (seconds: number) => {
    if (mediaRef.current) {
      const newTime = Math.max(0, Math.min(mediaRef.current.duration, mediaRef.current.currentTime + seconds));
      mediaRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };
  
  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setFullscreen(!fullscreen);
  };
  
  // Copy link with timestamp
  const copyLinkWithTimestamp = () => {
    if (mediaRef.current) {
      const timestamp = Math.floor(mediaRef.current.currentTime);
      const linkWithTimestamp = `${url}#t=${timestamp}`;
      
      navigator.clipboard.writeText(linkWithTimestamp)
        .then(() => {
          setLinkCopied(true);
          setTimeout(() => setLinkCopied(false), 2000);
        })
        .catch(err => {
          console.error('Failed to copy link:', err);
        });
    }
  };
  
  // Handle errors during media loading
  const handleError = () => {
    setError('Error loading media. The file may be corrupted or in an unsupported format.');
    setLoading(false);
    if (onError) onError(new Error('Media playback error'));
  };
  
  // Setup event listeners
  useEffect(() => {
    const media = mediaRef.current;
    
    if (media) {
      media.addEventListener('loadedmetadata', handleLoadedMetadata);
      media.addEventListener('timeupdate', handleTimeUpdate);
      media.addEventListener('error', handleError);
      
      // Set initial volume
      media.volume = volume;
      
      // Handle play state changes from the media element
      media.addEventListener('play', () => setIsPlaying(true));
      media.addEventListener('pause', () => setIsPlaying(false));
      media.addEventListener('ended', () => setIsPlaying(false));
    }
    
    return () => {
      if (media) {
        media.removeEventListener('loadedmetadata', handleLoadedMetadata);
        media.removeEventListener('timeupdate', handleTimeUpdate);
        media.removeEventListener('error', handleError);
        media.removeEventListener('play', () => setIsPlaying(true));
        media.removeEventListener('pause', () => setIsPlaying(false));
        media.removeEventListener('ended', () => setIsPlaying(false));
      }
    };
  }, [onError, volume]);
  
  // Loading state
  if (loading && !error) {
    return (
      <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={40} thickness={4} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Loading media...
        </Typography>
      </Box>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }
  
  return (
    <Box 
      ref={containerRef}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        position: 'relative',
        bgcolor: 'background.paper',
        ...(fullscreen && {
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 9999,
        }),
      }}
    >
      {/* Media element */}
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        bgcolor: isVideo ? 'black' : 'background.paper',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {isVideo ? (
          <video
            ref={mediaRef as React.RefObject<HTMLVideoElement>}
            src={url}
            controls={false}
            style={{ 
              maxWidth: '100%', 
              maxHeight: '100%', 
              objectFit: 'contain',
              outline: 'none'
            }}
            onError={handleError}
          />
        ) : (
          <>
            <audio
              ref={mediaRef as React.RefObject<HTMLAudioElement>}
              src={url}
              style={{ display: 'none' }}
              onError={handleError}
            />
            <Box sx={{ 
              width: '100%', 
              textAlign: 'center',
              p: 3 
            }}>
              <Box 
                sx={{ 
                  width: '180px', 
                  height: '180px', 
                  borderRadius: '50%', 
                  bgcolor: 'primary.light',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  mx: 'auto',
                  mb: 3,
                  backgroundSize: 'cover',
                  backgroundImage: metadata?.thumbnailUrl ? `url(${metadata.thumbnailUrl})` : 'none',
                }}
              >
                {!metadata?.thumbnailUrl && (
                  <Box component="span" sx={{ fontSize: '3rem', color: 'primary.contrastText' }}>
                    🎵
                  </Box>
                )}
              </Box>
              <Typography variant="h6" gutterBottom>
                {fileName || 'Audio File'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {metadata?.artist || 'Unknown Artist'}
              </Typography>
            </Box>
          </>
        )}
      </Box>
      
      {/* Controls */}
      <Box sx={{ 
        p: 1, 
        display: 'flex', 
        flexDirection: 'column',
        bgcolor: 'background.paper',
        borderTop: '1px solid',
        borderColor: 'divider',
      }}>
        {/* Seek slider */}
        <Box sx={{ px: 2, pb: 1 }}>
          <Slider
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            aria-label="Seek"
            size="small"
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: -1 }}>
            <Typography variant="caption" color="text.secondary">
              {formatTime(currentTime)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatTime(duration)}
            </Typography>
          </Box>
        </Box>
        
        {/* Control buttons */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={() => skip(-10)} size="small">
              <SkipPrevious />
            </IconButton>
            
            <IconButton onClick={togglePlay} sx={{ mx: 1 }}>
              {isPlaying ? <Pause /> : <PlayArrow />}
            </IconButton>
            
            <IconButton onClick={() => skip(10)} size="small">
              <SkipNext />
            </IconButton>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box 
              sx={{ 
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
              }}
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <IconButton onClick={toggleMute} size="small">
                {isMuted ? <VolumeOff /> : <VolumeUp />}
              </IconButton>
              
              {showVolumeSlider && (
                <Box sx={{ 
                  position: 'absolute',
                  bottom: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 100,
                  height: 120,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  pb: 1,
                  bgcolor: 'background.paper',
                  boxShadow: 3,
                  borderRadius: 1,
                  zIndex: 10,
                }}>
                  <Slider
                    orientation="vertical"
                    min={0}
                    max={1}
                    step={0.01}
                    value={volume}
                    onChange={handleVolumeChange}
                    aria-label="Volume"
                    size="small"
                    sx={{ mx: 'auto', height: 80 }}
                  />
                </Box>
              )}
            </Box>
            
            <Tooltip title={linkCopied ? "Copied!" : "Copy link with timestamp"}>
              <IconButton onClick={copyLinkWithTimestamp} size="small" sx={{ ml: 1 }}>
                <ContentCopy />
              </IconButton>
            </Tooltip>
            
            <IconButton onClick={toggleFullscreen} size="small" sx={{ ml: 1 }}>
              {fullscreen ? <FullscreenExit /> : <Fullscreen />}
            </IconButton>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default MediaViewer; 