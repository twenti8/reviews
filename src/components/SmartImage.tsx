import { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';
import type { ThemePalette } from '../types/store';

interface SmartImageProps {
  src: string;
  alt: string;
  className?: string;
  palette: ThemePalette;
  fallbackIcon?: React.ReactNode;
  fallbackLabel?: string;
}

export function SmartImage({
  src,
  alt,
  className = '',
  palette,
  fallbackIcon,
  fallbackLabel,
}: SmartImageProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center gap-1.5 select-none ${className}`}
        style={{
          backgroundColor: palette.cardSubtle,
          color: palette.textMuted,
        }}
      >
        {fallbackIcon || <ImageOff className="w-6 h-6 opacity-70" />}
        {fallbackLabel ? (
          <span className="text-[11px] font-medium px-2 text-center truncate max-w-full">
            {fallbackLabel}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
