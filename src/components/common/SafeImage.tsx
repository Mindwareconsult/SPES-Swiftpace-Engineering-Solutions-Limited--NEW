import React, { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  fallbackLabel?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt = '',
  fallbackSrc,
  fallbackLabel,
  className = '',
  onError,
  decoding = 'async',
  referrerPolicy = 'no-referrer',
  ...rest
}) => {
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(src);
  const [failed, setFailed] = useState(!src);

  useEffect(() => {
    setCurrentSrc(src);
    setFailed(!src);
  }, [src]);

  if (failed || !currentSrc) {
    return (
      <div
        role="img"
        aria-label={alt || fallbackLabel || 'SPES Swiftpace Engineering visual'}
        className={`flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#0B1E3D] to-[#06142B] text-slate-400 p-4 text-center select-none ${className}`}
      >
        <Building2 className="w-6 h-6 text-[#12BCEB]/70 shrink-0" />
        {(fallbackLabel || alt) && (
          <span className="text-[11px] leading-snug line-clamp-2 max-w-[220px] text-slate-400">
            {fallbackLabel || alt}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      {...rest}
      src={currentSrc}
      alt={alt}
      decoding={decoding}
      referrerPolicy={referrerPolicy}
      onError={(e) => {
        if (fallbackSrc && currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        } else {
          setFailed(true);
        }
        onError?.(e);
      }}
      className={className}
    />
  );
};
