import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Disc3, Music2, Pause, Play, Repeat, SkipBack, SkipForward } from 'lucide-react';
import type { MusicConfig, ThemePalette } from '../types/store';
import { formatDuration, parseYouTubeUrl } from '../utils/storeHelpers';
import { SmartImage } from './SmartImage';

interface YouTubePlayerInstance {
  playVideo: () => void;
  pauseVideo: () => void;
  nextVideo: () => void;
  previousVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getVideoData?: () => { title?: string };
  destroy: () => void;
}

interface YTGlobal {
  Player: new (
    elementId: string | HTMLElement,
    options: {
      height?: string | number;
      width?: string | number;
      videoId?: string;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: (e: { target: YouTubePlayerInstance }) => void;
        onStateChange?: (e: { data: number; target: YouTubePlayerInstance }) => void;
        onError?: () => void;
      };
    },
  ) => YouTubePlayerInstance;
  PlayerState?: {
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
    BUFFERING: number;
  };
}

declare global {
  interface Window {
    YT?: YTGlobal;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let ytApiPromise: Promise<YTGlobal> | null = null;

function loadYouTubeIframeApi(): Promise<YTGlobal> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Window unavailable'));
  }
  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }
  if (ytApiPromise) {
    return ytApiPromise;
  }

  ytApiPromise = new Promise((resolve, reject) => {
    const prevCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prevCallback) prevCallback();
      if (window.YT?.Player) {
        resolve(window.YT);
      } else {
        reject(new Error('YouTube API failed to initialize'));
      }
    };

    const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    if (!existing) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      tag.onerror = () => reject(new Error('Failed to load YouTube IFrame API'));
      document.head.appendChild(tag);
    }

    setTimeout(() => {
      if (window.YT?.Player) {
        resolve(window.YT);
      }
    }, 3500);
  });

  return ytApiPromise;
}

interface YouTubeMiniPlayerProps {
  config: MusicConfig;
  palette: ThemePalette;
}

export function YouTubeMiniPlayer({ config, palette }: YouTubeMiniPlayerProps) {
  const hostId = useId().replace(/:/g, '');
  const playerRef = useRef<YouTubePlayerInstance | null>(null);
  const isSeekingRef = useRef(false);
  const repeatRef = useRef(false);

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [dynamicTitle, setDynamicTitle] = useState('');

  repeatRef.current = isRepeat;

  const parsed = useMemo(() => parseYouTubeUrl(config.youtubeUrl), [config.youtubeUrl]);
  const displayTitle = config.title.trim() || dynamicTitle || 'Pastel Store BGM ♡';
  const shouldMarquee = displayTitle.length > 26;

  useEffect(() => {
    setIsReady(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setDynamicTitle('');

    if (parsed.type === 'invalid') {
      return;
    }

    let cancelled = false;

    loadYouTubeIframeApi()
      .then((YT) => {
        if (cancelled) return;
        const container = document.getElementById(`yt-audio-${hostId}`);
        if (!container) return;

        if (playerRef.current) {
          try {
            playerRef.current.destroy();
          } catch {
            // ignore
          }
          playerRef.current = null;
        }

        const playerVars: Record<string, string | number> = {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
        };

        if (parsed.type === 'playlist' && parsed.playlistId) {
          playerVars.listType = 'playlist';
          playerVars.list = parsed.playlistId;
        }

        const instance = new YT.Player(`yt-audio-${hostId}`, {
          width: 200,
          height: 200,
          videoId: parsed.videoId,
          playerVars,
          events: {
            onReady: (e) => {
              if (cancelled) return;
              setIsReady(true);
              const d = e.target.getDuration?.() || 0;
              if (d > 0) setDuration(d);
              const meta = e.target.getVideoData?.();
              if (meta?.title) setDynamicTitle(meta.title);
            },
            onStateChange: (e) => {
              if (cancelled) return;
              const endedCode = YT.PlayerState?.ENDED ?? 0;
              const playingCode = YT.PlayerState?.PLAYING ?? 1;
              const pausedCode = YT.PlayerState?.PAUSED ?? 2;

              if (e.data === playingCode) {
                setIsPlaying(true);
                const d = e.target.getDuration?.() || 0;
                if (d > 0) setDuration(d);
                const meta = e.target.getVideoData?.();
                if (meta?.title) setDynamicTitle(meta.title);
              } else if (e.data === pausedCode) {
                setIsPlaying(false);
              } else if (e.data === endedCode) {
                if (repeatRef.current) {
                  e.target.seekTo(0, true);
                  e.target.playVideo();
                } else {
                  setIsPlaying(false);
                }
              }
            },
            onError: () => {
              if (!cancelled) {
                setIsPlaying(false);
              }
            },
          },
        });

        playerRef.current = instance;
      })
      .catch(() => {
        if (!cancelled) {
          setIsPlaying(false);
        }
      });

    return () => {
      cancelled = true;
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // ignore
        }
        playerRef.current = null;
      }
    };
  }, [hostId, parsed.type, parsed.videoId, parsed.playlistId]);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      if (isSeekingRef.current || !playerRef.current) return;
      try {
        const cur = playerRef.current.getCurrentTime?.() ?? 0;
        const dur = playerRef.current.getDuration?.() ?? 0;
        setCurrentTime(cur);
        if (dur > 0) setDuration(dur);
      } catch {
        // ignore transient player read errors
      }
    }, 500);
    return () => window.clearInterval(timer);
  }, [isPlaying]);

  const handleTogglePlay = useCallback(() => {
    if (!playerRef.current || !isReady) {
      setIsPlaying((prev) => !prev);
      return;
    }
    try {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    } catch {
      setIsPlaying((prev) => !prev);
    }
  }, [isPlaying, isReady]);

  const handlePrev = useCallback(() => {
    if (playerRef.current && isReady) {
      try {
        if (parsed.type === 'playlist') {
          playerRef.current.previousVideo();
        } else {
          playerRef.current.seekTo(0, true);
        }
      } catch {
        // ignore
      }
    }
    setCurrentTime(0);
  }, [isReady, parsed.type]);

  const handleNext = useCallback(() => {
    if (playerRef.current && isReady) {
      try {
        if (parsed.type === 'playlist') {
          playerRef.current.nextVideo();
        } else {
          playerRef.current.seekTo(0, true);
          playerRef.current.playVideo();
        }
      } catch {
        // ignore
      }
    }
    setCurrentTime(0);
  }, [isReady, parsed.type]);

  const handleSeekChange = (value: number) => {
    isSeekingRef.current = true;
    setCurrentTime(value);
  };

  const handleSeekCommit = (value: number) => {
    isSeekingRef.current = false;
    if (playerRef.current && isReady) {
      try {
        playerRef.current.seekTo(value, true);
      } catch {
        // ignore
      }
    }
  };

  const maxTime = duration > 0 ? duration : 180;
  const progressPct = Math.min(100, Math.max(0, (currentTime / maxTime) * 100));

  return (
    <section
      aria-label="เครื่องเล่นเพลงร้าน"
      className="relative rounded-3xl p-4 transition-colors duration-200"
      style={{
        backgroundColor: palette.card,
        border: `1px solid ${palette.border}`,
        boxShadow: `0 14px 34px -10px ${palette.shadowColor}`,
      }}
    >
      {/* Hidden off-screen YouTube IFrame container so no black video box ever renders */}
      <div
        aria-hidden="true"
        className="fixed -left-[9999px] -top-[9999px] w-[200px] h-[200px] opacity-0 pointer-events-none overflow-hidden"
      >
        <div id={`yt-audio-${hostId}`} />
      </div>

      <div className="flex items-center gap-4">
        {/* Left: Square Rounded Album Cover */}
        <div
          className="relative w-20 h-20 sm:w-22 sm:h-22 shrink-0 rounded-2xl overflow-hidden"
          style={{
            backgroundColor: palette.cardSubtle,
            border: `1px solid ${palette.border}`,
          }}
        >
          <SmartImage
            src={config.coverUrl}
            alt={`ปกเพลง ${displayTitle}`}
            palette={palette}
            className="w-full h-full object-cover"
            fallbackIcon={<Disc3 className={`w-7 h-7 ${isPlaying ? 'animate-spin' : ''}`} />}
          />
          {isPlaying && (
            <span
              aria-hidden="true"
              className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center shadow-sm"
              style={{
                backgroundColor: palette.accent,
                color: palette.accentText,
              }}
            >
              <Music2 className="w-3 h-3" />
            </span>
          )}
        </div>

        {/* Right: Title + Controls + Progress Slider */}
        <div className="flex-1 min-w-0 flex flex-col gap-2.5">
          {/* Top: Track Title with smooth auto-scroll marquee if long */}
          <div className="overflow-hidden">
            <p
              className={`text-sm font-semibold leading-tight ${
                shouldMarquee ? 'animate-marquee' : 'truncate'
              }`}
              style={{ color: palette.text }}
              title={displayTitle}
            >
              {displayTitle}
            </p>
          </div>

          {/* Middle: Transport Controls */}
          <div className="flex items-center justify-between sm:justify-start sm:gap-3">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="เพลงก่อนหน้า"
              className="min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center transition-transform active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{
                color: palette.textMuted,
                backgroundColor: palette.cardSubtle,
              }}
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleTogglePlay}
              aria-label={isPlaying ? 'หยุดเพลงชั่วคราว' : 'เล่นเพลง'}
              aria-pressed={isPlaying}
              className="w-11 h-11 rounded-full flex items-center justify-center shadow-sm transition-transform active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{
                backgroundColor: palette.accent,
                color: palette.accentText,
                boxShadow: `0 6px 16px -4px ${palette.shadowColor}`,
              }}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 translate-x-[1px]" />}
            </button>

            <button
              type="button"
              onClick={handleNext}
              aria-label="เพลงถัดไป"
              className="min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center transition-transform active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{
                color: palette.textMuted,
                backgroundColor: palette.cardSubtle,
              }}
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsRepeat((prev) => !prev)}
              aria-label={isRepeat ? 'ปิดเล่นซ้ำ' : 'เปิดเล่นซ้ำ'}
              aria-pressed={isRepeat}
              className="min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{
                color: isRepeat ? palette.accent : palette.textMuted,
                backgroundColor: isRepeat ? palette.accentSoft : palette.cardSubtle,
              }}
            >
              <Repeat className="w-4 h-4" />
            </button>
          </div>

          {/* Bottom: Current time · Progress Slider · Total Duration */}
          <div className="flex items-center gap-2.5">
            <span
              className="text-[11px] tabular-nums w-9 shrink-0"
              style={{ color: palette.textMuted }}
            >
              {formatDuration(currentTime)}
            </span>

            <input
              type="range"
              aria-label="แถบเลื่อนเวลาเพลง"
              min={0}
              max={maxTime}
              step={1}
              value={Math.min(currentTime, maxTime)}
              onChange={(e) => handleSeekChange(Number(e.target.value))}
              onMouseUp={(e) => handleSeekCommit(Number((e.target as HTMLInputElement).value))}
              onTouchEnd={(e) => handleSeekCommit(Number((e.target as HTMLInputElement).value))}
              className="pastel-slider flex-1 min-w-0"
              style={{
                color: palette.accent,
                background: `linear-gradient(to right, ${palette.accent} ${progressPct}%, ${palette.accentSoft} ${progressPct}%)`,
              }}
            />

            <span
              className="text-[11px] tabular-nums w-9 text-right shrink-0"
              style={{ color: palette.textMuted }}
            >
              {duration > 0 ? formatDuration(duration) : '--:--'}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
