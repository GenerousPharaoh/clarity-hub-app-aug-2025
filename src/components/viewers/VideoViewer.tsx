import { useRef, useState, useCallback, useEffect } from 'react';
import {
  Play, Pause, Volume2, VolumeX, VideoOff,
  Maximize, Minimize, Download, PictureInPicture2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoViewerProps {
  url: string;
  fileName: string;
}

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function VideoViewer({ url, fileName }: VideoViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onDurationChange = () => setDuration(video.duration);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);
    const onError = () => setHasError(true);

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDurationChange);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEnded);
    video.addEventListener('error', onError);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('durationchange', onDurationChange);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('error', onError);
    };
  }, []);

  // Track fullscreen changes
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Auto-hide controls during playback
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setShowControls(false);
    }, 3000);
  }, []);

  useEffect(() => {
    return () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); };
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) video.pause();
    else video.play();
    resetHideTimer();
  }, [isPlaying, resetHideTimer]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const seek = useCallback((delta: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + delta));
  }, []);

  const handleSeek = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const video = videoRef.current;
      if (!video) return;
      const time = (parseFloat(e.target.value) / 100) * duration;
      video.currentTime = time;
      setCurrentTime(time);
    },
    [duration]
  );

  const handleVolume = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const vol = parseFloat(e.target.value) / 100;
    video.volume = vol;
    setVolume(vol);
    if (vol === 0) { setIsMuted(true); video.muted = true; }
    else if (video.muted) { setIsMuted(false); video.muted = false; }
  }, []);

  const cyclePlaybackRate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const idx = PLAYBACK_RATES.indexOf(playbackRate);
    const newRate = PLAYBACK_RATES[(idx + 1) % PLAYBACK_RATES.length];
    video.playbackRate = newRate;
    setPlaybackRate(newRate);
  }, [playbackRate]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else containerRef.current.requestFullscreen();
  }, []);

  const togglePiP = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await video.requestPictureInPicture();
    } catch { /* PiP not supported */ }
  }, []);

  const handleDownload = useCallback(() => {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
  }, [url, fileName]);

  // Keyboard shortcuts
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!container.contains(document.activeElement) && document.activeElement !== container) return;

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seek(-5);
          break;
        case 'ArrowRight':
          e.preventDefault();
          seek(5);
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (videoRef.current) {
            const v = Math.min(1, videoRef.current.volume + 0.1);
            videoRef.current.volume = v;
            setVolume(v);
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (videoRef.current) {
            const v = Math.max(0, videoRef.current.volume - 0.1);
            videoRef.current.volume = v;
            setVolume(v);
          }
          break;
        case 'm':
          toggleMute();
          break;
        case 'f':
          toggleFullscreen();
          break;
      }
      resetHideTimer();
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, toggleMute, toggleFullscreen, seek, resetHideTimer]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (hasError) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20">
          <VideoOff className="h-7 w-7 text-red-400" />
        </div>
        <h3 className="mt-4 font-heading text-sm font-semibold text-surface-700 dark:text-surface-200">
          Failed to Load Video
        </h3>
        <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-surface-400 dark:text-surface-500">
          The video could not be loaded or the format is not supported.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className="group relative flex h-full flex-col outline-none"
      onMouseMove={resetHideTimer}
    >
      {/* Toolbar */}
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-surface-200 px-2 dark:border-surface-700">
        <span className="truncate text-xs font-medium text-surface-600 dark:text-surface-300" title={fileName}>
          {fileName}
        </span>
        <button
          onClick={handleDownload}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-md',
            'text-surface-400 transition-colors',
            'hover:bg-surface-100 hover:text-surface-600',
            'dark:hover:bg-surface-700 dark:hover:text-surface-300'
          )}
          title="Download"
        >
          <Download className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Video + overlay controls */}
      <div
        className="relative flex-1 bg-black"
        onClick={togglePlay}
      >
        <video
          ref={videoRef}
          src={url}
          className="h-full w-full"
          preload="metadata"
          playsInline
        />

        {/* Overlay controls — fade in/out */}
        <div
          className={cn(
            'absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-3 pt-10 transition-opacity duration-300',
            showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Progress bar */}
          <div className="mb-2 flex items-center gap-2">
            <span className="w-12 text-right font-mono text-[10px] text-white/70">
              {formatTime(currentTime)}
            </span>
            <div className="relative flex-1">
              <div className="h-1 w-full rounded-full bg-white/20">
                <div
                  className="h-1 rounded-full bg-primary-400 transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={handleSeek}
                className="absolute inset-0 h-1 w-full cursor-pointer opacity-0"
                aria-label="Seek"
              />
            </div>
            <span className="w-12 font-mono text-[10px] text-white/70">
              {formatTime(duration)}
            </span>
          </div>

          {/* Controls row */}
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="flex h-8 w-8 items-center justify-center rounded-md text-white transition-colors hover:bg-white/10"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
            </button>

            {/* Volume */}
            <button
              onClick={toggleMute}
              className="flex h-8 w-8 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
            >
              {isMuted || volume === 0 ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume * 100}
              onChange={handleVolume}
              aria-label="Volume"
              className={cn(
                'h-1 w-16 cursor-pointer appearance-none rounded-full bg-white/20',
                '[&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white',
                '[&::-moz-range-thumb]:h-2.5 [&::-moz-range-thumb]:w-2.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white'
              )}
            />

            <div className="flex-1" />

            {/* Playback rate */}
            <button
              onClick={cyclePlaybackRate}
              className={cn(
                'flex h-7 items-center justify-center rounded-md px-1.5 text-[10px] font-bold tabular-nums transition-colors',
                playbackRate !== 1
                  ? 'bg-white/20 text-white'
                  : 'text-white/60 hover:bg-white/10 hover:text-white'
              )}
              title="Playback speed"
            >
              {playbackRate}x
            </button>

            {/* PiP */}
            {'pictureInPictureEnabled' in document && (
              <button
                onClick={togglePiP}
                className="flex h-8 w-8 items-center justify-center rounded-md text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                title="Picture-in-Picture"
              >
                <PictureInPicture2 className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="flex h-8 w-8 items-center justify-center rounded-md text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              title={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}
            >
              {isFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
