import React, { useState } from 'react';
import { useCms } from '../../context/CmsContext';

interface BrandLogoProps {
  className?: string;
  sizeClass?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  sizeClass = 'w-10 h-10'
}) => {
  const { settings } = useCms();
  const primary = settings.logoUrl || '/logo.peg';
  const fallback = settings.logoFallbackUrl || '/assets/spes_logo.jpeg';
  const [src, setSrc] = useState(primary);

  React.useEffect(() => {
    setSrc(primary);
  }, [primary]);

  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-white/15 bg-white/5 shrink-0 ${sizeClass} ${className}`}
    >
      <img
        src={src}
        alt={`${settings.companyName || 'SPES Swiftpace'} Official Emblem`}
        onError={() => {
          if (src !== fallback) {
            setSrc(fallback);
          }
        }}
        className="w-full h-full object-cover"
      />
    </div>
  );
};
