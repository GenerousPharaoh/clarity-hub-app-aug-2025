import { useRef, useState, useCallback, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Music } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioViewerProps {
  url: string;
  fileName: string;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function AudioViewer({ url, fileName }: AudioViewerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const handleSeek = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const audio = audioRef.current;
      if (!audio) return;
      const time = (parseFloat(e.target.value) / 100) * duration;
      audio.currentTime = time;
      setCurrentTime(time);
    },
    [duration]
  );

  const handleVolume = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const vol = parseFloat(e.target.value) / 100;
    audio.volume = vol;
    setVolume(vol);
    if (vol === 0) {
      setIsMuted(true);
      audio.muted = true;
    } else if (audio.muted) {
      setIsMuted(false);
      audio.muted = false;
    }
  }, []);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex h-full flex-col items-center justify-center px-6">
      <audio ref={audioRef} src={url} preload="metadata" />

      {/* Album art placeholder */}
      <div className="mb-6 flex h-28 w-28 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/40 dark:to-accent-900/40">
        <Music className="h-12 w-12 text-primary-500 dark:text-primary-400" />
      </div>

      {/* File name */}
      <h3 className="mb-6 max-w-full truncate text-center font-heading text-sm font-semibold text-surface-700 dark:text-surface-200">
        {fileName}
      </h3>

      {/* Player controls */}
      <div className="w-full max-w-sm">
        {/* Progress bar */}
        <div className="mb-2 flex items-center gap-2">
          <span className="w-10 text-right font-mono text-[10px] text-surface-400">
            {formatTime(currentTime)}
          </span>
          <div className="relative flex-1">
            <div className="h-1 w-full rounded-full bg-surface-200 dark:bg-surface-700">
              <div
                className="h-1 rounded-full bg-primary-500 transition-all duration-100"
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
            />
          </div>
          <span className="w-10 font-mono text-[10px] text-surface-400">
            {formatTime(duration)}
          </span>
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-center gap-4">
          {/* Volume */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleMute}
              className="flex h-7 w-7 items-center justify-center rounded-md text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-700 dark:hover:text-surface-300"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-3.5 w-3.5" />
              ) : (
                <Volume2 className="h-3.5 w-3.5" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume * 100}
              onChange={handleVolume}
              className={cn(
                'h-1 w-16 cursor-pointer appearance-none rounded-full bg-surface-200 dark:bg-surface-700',
                '[&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500'
              )}
            />
          </div>

          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-white transition-colors hover:bg-primary-700"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 ml-0.5" />
            )}
          </button>

          {/* Spacer for symmetry */}
          <div className="w-[88px]" />
        </div>
      </div>
    </div>
  );
}
