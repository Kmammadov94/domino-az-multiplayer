import React, { useId } from 'react';

interface AzerbaijanLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  compact?: boolean;
  className?: string;
}

export const AzerbaijanLogo: React.FC<AzerbaijanLogoProps> = ({
  size = 'md',
  showSubtitle = false,
  compact = false,
  className = ''
}) => {
  const isSm = size === 'sm';
  const isLg = size === 'lg';
  const rawId = useId();
  const idPrefix = `domino_${rawId.replace(/:/g, '_')}_${size}`;

  // Authentic 2:1 horizontal domino tile dimensions
  const tileWidth = compact ? 42 : isSm ? 54 : isLg ? 108 : 76;
  const tileHeight = compact ? 21 : isSm ? 27 : isLg ? 54 : 38;

  return (
    <div className={`flex items-center ${compact ? 'gap-1.5' : 'gap-2.5 sm:gap-3.5'} select-none ${className}`}>
      {/* 3D Tactile Domino Tile Skinned with Azerbaijani Flag [3:2] */}
      <div
        style={{
          width: `${tileWidth}px`,
          height: `${tileHeight}px`,
          boxShadow:
            '0 6px 16px rgba(0,0,0,0.7), 0 2px 4px rgba(0,0,0,0.5), inset 0 1px 1.5px rgba(255,255,255,0.55), inset 0 -1.5px 2px rgba(0,0,0,0.6)'
        }}
        className="relative rounded-lg border-[1.5px] border-slate-950 overflow-hidden flex-shrink-0 transform transition-all duration-300 hover:scale-105 hover:-rotate-1 cursor-pointer bg-slate-900"
        title="Domino PRO — Azərbaycan Milli Daşı [3:2]"
      >
        <svg
          viewBox="0 0 108 54"
          className="w-full h-full block"
          style={{ overflow: 'hidden' }}
        >
          <defs>
            {/* Clip path for rounded domino face */}
            <clipPath id={`${idPrefix}_clip`}>
              <rect x="0" y="0" width="108" height="54" rx="6" ry="6" />
            </clipPath>

            {/* Specular enamel gloss sheen */}
            <linearGradient id={`${idPrefix}_gloss`} x1="0" y1="0" x2="0.6" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
              <stop offset="30%" stopColor="#ffffff" stopOpacity="0.12" />
              <stop offset="60%" stopColor="#000000" stopOpacity="0.0" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.35" />
            </linearGradient>

            {/* Gold Brass Rivet Gradient */}
            <radialGradient id={`${idPrefix}_brass`} cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="45%" stopColor="#eab308" />
              <stop offset="75%" stopColor="#b45309" />
              <stop offset="100%" stopColor="#451a03" />
            </radialGradient>
          </defs>

          {/* Clipped Domino Body */}
          <g clipPath={`url(#${idPrefix}_clip)`}>
            {/* 1. Flag Stripes: Azerbaijani Tricolor (Sky Blue / Red / Green) */}
            <rect x="0" y="0" width="108" height="18" fill="#0092bc" />
            <rect x="0" y="18" width="108" height="18" fill="#e4002b" />
            <rect x="0" y="36" width="108" height="18" fill="#009739" />

            {/* 2. White Azerbaijani Crescent & 8-Pointed Star placed cleanly in Red Stripe (Right half center: 81, 27) */}
            <g transform="translate(73.5, 20.5) scale(0.7)" opacity="0.95">
              {/* White Crescent */}
              <path
                d="M 9 2 A 7 7 0 1 0 17 16 A 8.5 8.5 0 1 1 9 2 Z"
                fill="#ffffff"
              />
              {/* White 8-Pointed Star */}
              <polygon
                points="17,5 18,7 20,7 18.5,8.5 19,10.5 17.5,9.2 16,10.5 16.5,8.5 15,7 17,7"
                fill="#ffffff"
              />
            </g>

            {/* 3. Authentic Domino Pips: [3:2] (Baku Opening Stone) */}
            {/* Left Half (3 Pips: 18,14 | 27,27 | 36,40) */}
            {/* Pip 1 (18, 14) */}
            <circle cx="18" cy="15.2" r="4.3" fill="rgba(0,0,0,0.5)" />
            <circle cx="18" cy="13.8" r="4" fill="#ffffff" />
            <circle cx="16.8" cy="12.6" r="1.4" fill="rgba(255,255,255,0.95)" />

            {/* Pip 2 (27, 27) */}
            <circle cx="27" cy="28.4" r="4.3" fill="rgba(0,0,0,0.5)" />
            <circle cx="27" cy="27" r="4" fill="#ffffff" />
            <circle cx="25.8" cy="25.8" r="1.4" fill="rgba(255,255,255,0.95)" />

            {/* Pip 3 (36, 40) */}
            <circle cx="36" cy="41.4" r="4.3" fill="rgba(0,0,0,0.5)" />
            <circle cx="36" cy="40" r="4" fill="#ffffff" />
            <circle cx="34.8" cy="38.8" r="1.4" fill="rgba(255,255,255,0.95)" />

            {/* Right Half (2 Pips: 68,14 | 94,40) */}
            {/* Pip 1 (68, 14) */}
            <circle cx="68" cy="15.2" r="4.3" fill="rgba(0,0,0,0.5)" />
            <circle cx="68" cy="13.8" r="4" fill="#ffffff" />
            <circle cx="66.8" cy="12.6" r="1.4" fill="rgba(255,255,255,0.95)" />

            {/* Pip 2 (94, 40) */}
            <circle cx="94" cy="41.4" r="4.3" fill="rgba(0,0,0,0.5)" />
            <circle cx="94" cy="40" r="4" fill="#ffffff" />
            <circle cx="92.8" cy="38.8" r="1.4" fill="rgba(255,255,255,0.95)" />

            {/* 4. Center Groove Divider */}
            <line
              x1="54"
              y1="0"
              x2="54"
              y2="54"
              stroke="#0f172a"
              strokeWidth="2.5"
            />
            <line
              x1="55.2"
              y1="0"
              x2="55.2"
              y2="54"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="0.8"
            />

            {/* 5. Center Brass Rivet Pin (Çıqqa / Şişək) */}
            <circle cx="54" cy="27.8" r="4.6" fill="rgba(0,0,0,0.6)" />
            <circle
              cx="54"
              cy="27"
              r="4.2"
              fill={`url(#${idPrefix}_brass)`}
              stroke="#451a03"
              strokeWidth="0.8"
            />
            <circle
              cx="52.6"
              cy="25.6"
              r="1.4"
              fill="rgba(255,255,255,0.9)"
            />

            {/* 6. Enamel Surface Gloss Sheen Overlay */}
            <rect
              x="0"
              y="0"
              width="108"
              height="54"
              fill={`url(#${idPrefix}_gloss)`}
              pointerEvents="none"
            />
          </g>

          {/* Outer Border Bevel */}
          <rect
            x="0.75"
            y="0.75"
            width="106.5"
            height="52.5"
            rx="5.5"
            ry="5.5"
            fill="none"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1.2"
            pointerEvents="none"
          />
        </svg>
      </div>

      {/* Brand Typography */}
      <div className={`flex flex-col justify-center ${compact ? 'hidden sm:flex' : 'flex'}`}>
        <div className="flex items-center gap-1.5 sm:gap-2 leading-none">
          <span
            className={`font-black tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${
              isSm ? 'text-base sm:text-lg tracking-normal' : isLg ? 'text-3xl sm:text-4xl' : 'text-xl sm:text-2xl'
            }`}
          >
            DOMINO
          </span>
          <span
            className={`font-black tracking-wider uppercase rounded-md shadow-md border flex items-center justify-center ${
              isSm
                ? 'text-[10px] px-1.5 py-0.5 bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 text-white border-amber-400/50 shadow-red-950/40'
                : isLg
                ? 'text-sm px-2.5 py-1 bg-gradient-to-r from-red-600 via-rose-500 to-amber-400 text-white border-amber-300 shadow-red-950/50'
                : 'text-xs px-2 py-0.5 bg-gradient-to-r from-red-600 to-amber-500 text-white border-amber-300 shadow-red-950/50'
            }`}
          >
            PRO
          </span>
        </div>

        {showSubtitle && (
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[11px] sm:text-xs font-semibold text-amber-300/90 tracking-wide drop-shadow-sm">
              Milli Azərbaycan Dominosu • 365
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
