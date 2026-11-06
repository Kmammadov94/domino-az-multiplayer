import React from 'react';
import { PLAYER_AVATARS, DEFAULT_AVATAR_ID, PlayerAvatar } from '../data/avatars';

interface AvatarViewProps {
  avatarId?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  showBorder?: boolean;
  showGlow?: boolean;
  className?: string;
  onClick?: () => void;
}

export const AvatarView: React.FC<AvatarViewProps> = ({
  avatarId = DEFAULT_AVATAR_ID,
  size = 'md',
  showBorder = true,
  showGlow = false,
  className = '',
  onClick
}) => {
  const avatar: PlayerAvatar =
    PLAYER_AVATARS.find((a) => a.id === avatarId) || PLAYER_AVATARS[0];

  // Resolve pixel dimensions
  let pxSize = 48;
  if (typeof size === 'number') {
    pxSize = size;
  } else {
    switch (size) {
      case 'xs':
        pxSize = 26;
        break;
      case 'sm':
        pxSize = 36;
        break;
      case 'md':
        pxSize = 48;
        break;
      case 'lg':
        pxSize = 64;
        break;
      case 'xl':
        pxSize = 96;
        break;
    }
  }

  const { theme } = avatar;

  return (
    <div
      onClick={onClick}
      style={{
        width: `${pxSize}px`,
        height: `${pxSize}px`,
        boxShadow: showGlow ? `0 0 16px ${avatar.glowColor}` : undefined
      }}
      className={`relative rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden transition-transform duration-200 ${
        showBorder ? `border-2 ${avatar.borderColor}` : ''
      } ${onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''} ${className}`}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full select-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id={`bg-${avatar.id}`} cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor={theme.bgAccent} />
            <stop offset="100%" stopColor={theme.bgColor} />
          </radialGradient>
          <linearGradient id={`gold-${avatar.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#854d0e" />
          </linearGradient>
          <linearGradient id={`tea-${avatar.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#9a3412" />
          </linearGradient>
        </defs>

        {/* 1. Background Halo */}
        <circle cx="50" cy="50" r="50" fill={`url(#bg-${avatar.id})`} />

        {/* Background Decorative Rings/Sunburst */}
        <circle cx="50" cy="50" r="46" fill="none" stroke="white" strokeWidth="0.8" opacity="0.15" />
        <circle cx="50" cy="50" r="38" fill="none" stroke="white" strokeWidth="0.5" opacity="0.1" />

        {/* 2. Clothing / Shoulders */}
        <path
          d="M 12 100 C 12 76, 32 70, 50 70 C 68 70, 88 76, 88 100 Z"
          fill={theme.clothingColor}
        />
        {/* Collar / Lapel */}
        <path
          d="M 38 70 L 50 84 L 62 70 Z"
          fill={theme.skinTone}
          opacity="0.9"
        />
        <path
          d="M 46 84 L 50 100 L 54 84 Z"
          fill="#cbd5e1"
          opacity="0.3"
        />

        {/* 3. Neck */}
        <rect x="42" y="58" width="16" height="16" rx="4" fill={theme.skinTone} />

        {/* 4. Head / Face */}
        <ellipse cx="50" cy="46" rx="20" ry="23" fill={theme.skinTone} />

        {/* Ears */}
        <circle cx="30" cy="47" r="4.5" fill={theme.skinTone} />
        <circle cx="70" cy="47" r="4.5" fill={theme.skinTone} />

        {/* 5. Hair (Base) */}
        {theme.hairStyle === 'curly' && (
          <g fill={theme.hairColor}>
            <circle cx="33" cy="30" r="8" />
            <circle cx="43" cy="25" r="9" />
            <circle cx="57" cy="25" r="9" />
            <circle cx="67" cy="30" r="8" />
            <circle cx="30" cy="38" r="6" />
            <circle cx="70" cy="38" r="6" />
          </g>
        )}

        {theme.hairStyle === 'classic' && (
          <path
            d="M 30 42 C 28 26, 42 22, 50 22 C 58 22, 72 26, 70 42 C 65 32, 56 30, 50 30 C 44 30, 35 32, 30 42 Z"
            fill={theme.hairColor}
          />
        )}

        {theme.hairStyle === 'short' && (
          <path
            d="M 31 38 C 30 26, 44 24, 50 24 C 56 24, 70 26, 69 38 C 65 30, 50 29, 31 38 Z"
            fill={theme.hairColor}
          />
        )}

        {/* 6. Eyes & Eyebrows */}
        {!theme.glasses || theme.glasses === 'monocle' ? (
          <g>
            {/* Eyebrows */}
            <path
              d="M 36 39 Q 41 36 46 38"
              stroke={theme.hairColor}
              strokeWidth="2.4"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 64 39 Q 59 36 54 38"
              stroke={theme.hairColor}
              strokeWidth="2.4"
              strokeLinecap="round"
              fill="none"
            />
            {/* Eyes */}
            <circle cx="41" cy="43" r="2.8" fill="#0f172a" />
            <circle cx="42" cy="42" r="1" fill="#ffffff" />
            <circle cx="59" cy="43" r="2.8" fill="#0f172a" />
            <circle cx="60" cy="42" r="1" fill="#ffffff" />
          </g>
        ) : null}

        {/* Glasses: Sunglasses */}
        {theme.glasses === 'sunglasses' && (
          <g>
            <rect x="33" y="38" width="14" height="10" rx="3" fill="#09090b" stroke="#d4af37" strokeWidth="1" />
            <rect x="53" y="38" width="14" height="10" rx="3" fill="#09090b" stroke="#d4af37" strokeWidth="1" />
            <path d="M 47 42 L 53 42" stroke="#d4af37" strokeWidth="1.5" />
            <path d="M 35 40 L 45 46" stroke="#ffffff" strokeWidth="0.8" opacity="0.6" strokeLinecap="round" />
            <path d="M 55 40 L 65 46" stroke="#ffffff" strokeWidth="0.8" opacity="0.6" strokeLinecap="round" />
          </g>
        )}

        {/* Glasses: Reading */}
        {theme.glasses === 'reading' && (
          <g>
            <circle cx="40" cy="43" r="6" fill="rgba(255,255,255,0.2)" stroke="#94a3b8" strokeWidth="1.2" />
            <circle cx="60" cy="43" r="6" fill="rgba(255,255,255,0.2)" stroke="#94a3b8" strokeWidth="1.2" />
            <path d="M 46 43 L 54 43" stroke="#94a3b8" strokeWidth="1.2" />
            <circle cx="40" cy="43" r="2.2" fill="#0f172a" />
            <circle cx="60" cy="43" r="2.2" fill="#0f172a" />
          </g>
        )}

        {/* Glasses: Monocle */}
        {theme.glasses === 'monocle' && (
          <g>
            <circle cx="41" cy="43" r="6" fill="rgba(254,240,138,0.2)" stroke="#eab308" strokeWidth="1.5" />
            <path d="M 41 49 Q 38 60 48 68" stroke="#ca8a04" strokeWidth="1" fill="none" strokeDasharray="1,1" />
          </g>
        )}

        {/* Glasses: Cyber Visor */}
        {theme.glasses === 'visor' && (
          <g>
            <path
              d="M 28 39 L 72 39 L 68 48 L 32 48 Z"
              fill="#06b6d4"
              opacity="0.85"
            />
            <path d="M 30 43 L 70 43" stroke="#ffffff" strokeWidth="1" />
            <line x1="45" y1="39" x2="45" y2="48" stroke="#22d3ee" strokeWidth="0.8" />
            <line x1="55" y1="39" x2="55" y2="48" stroke="#22d3ee" strokeWidth="0.8" />
          </g>
        )}

        {/* Nose */}
        <path d="M 50 44 L 48 51 L 52 51" stroke="#b45309" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.6" />

        {/* 7. Facial Hair */}
        {/* Full Beard (Sages & Tea Master) */}
        {theme.facialHair === 'full_beard' && (
          <path
            d="M 32 48 C 30 68, 38 78, 50 82 C 62 78, 70 68, 68 48 C 62 55, 58 56, 50 56 C 42 56, 38 55, 32 48 Z"
            fill={theme.hairColor}
          />
        )}

        {/* Mustache (Classic Baku Aerodrom / Gentleman) */}
        {theme.facialHair === 'mustache' && (
          <path
            d="M 38 54 Q 46 51 50 54 Q 54 51 62 54 Q 56 60 50 56 Q 44 60 38 54 Z"
            fill={theme.hairColor}
          />
        )}

        {/* Goatee */}
        {theme.facialHair === 'goatee' && (
          <g fill={theme.hairColor}>
            <ellipse cx="50" cy="58" rx="3.5" ry="5" />
            <path d="M 44 54 Q 50 52 56 54 Q 50 56 44 54 Z" />
          </g>
        )}

        {/* Stubble */}
        {theme.facialHair === 'stubble' && (
          <path
            d="M 38 54 Q 50 60 62 54 Q 56 64 50 64 Q 44 64 38 54 Z"
            fill={theme.hairColor}
            opacity="0.25"
          />
        )}

        {/* Mouth (if no full beard covering) */}
        {theme.facialHair !== 'full_beard' && (
          <path d="M 45 57 Q 50 60 55 57" stroke="#991b1b" strokeWidth="1.4" strokeLinecap="round" fill="none" />
        )}

        {/* 8. Headgear (Hats, Caps, Helmets, Crowns) */}
        {/* Baku Aerodrom Flat Cap (Kepka) */}
        {theme.hatType === 'kepka' && (
          <g>
            {/* Broad flat cap crown */}
            <path
              d="M 22 28 C 22 18, 78 18, 78 28 C 82 32, 18 32, 22 28 Z"
              fill="#1e293b"
            />
            {/* Distinctive Baku Aerodrom Visor Peak */}
            <path
              d="M 26 31 C 28 37, 72 37, 74 31 C 66 34, 34 34, 26 31 Z"
              fill="#0f172a"
            />
            <circle cx="50" cy="22" r="2.5" fill="#475569" />
          </g>
        )}

        {/* Sheki / Karabakh Papakh (Fleece Hat) */}
        {theme.hatType === 'papakh' && (
          <g>
            <path
              d="M 26 35 C 24 16, 76 16, 74 35 C 70 38, 30 38, 26 35 Z"
              fill="#334155"
            />
            {/* Fleece texture loops */}
            <ellipse cx="32" cy="22" rx="4" ry="3" fill="#475569" />
            <ellipse cx="44" cy="18" rx="5" ry="3" fill="#475569" />
            <ellipse cx="56" cy="18" rx="5" ry="3" fill="#475569" />
            <ellipse cx="68" cy="22" rx="4" ry="3" fill="#475569" />
            <ellipse cx="38" cy="28" rx="5" ry="3" fill="#475569" />
            <ellipse cx="50" cy="26" rx="6" ry="3" fill="#475569" />
            <ellipse cx="62" cy="28" rx="5" ry="3" fill="#475569" />
          </g>
        )}

        {/* Imperial Crown (Shirvanshah / Golden Grandmaster) */}
        {theme.hatType === 'crown' && (
          <g>
            <path
              d="M 30 30 L 33 16 L 42 24 L 50 12 L 58 24 L 67 16 L 70 30 Z"
              fill={`url(#gold-${avatar.id})`}
              stroke="#78350f"
              strokeWidth="0.8"
            />
            {/* Crown Jewels */}
            <circle cx="50" cy="16" r="2" fill="#ef4444" />
            <circle cx="34" cy="20" r="1.5" fill="#3b82f6" />
            <circle cx="66" cy="20" r="1.5" fill="#10b981" />
            <circle cx="50" cy="28" r="2.2" fill="#3b82f6" />
            <circle cx="40" cy="28" r="1.8" fill="#ef4444" />
            <circle cx="60" cy="28" r="1.8" fill="#10b981" />
          </g>
        )}

        {/* Oil Worker Safety Helmet */}
        {theme.hatType === 'helmet' && (
          <g>
            <path
              d="M 28 32 C 28 16, 72 16, 72 32 C 76 34, 24 34, 28 32 Z"
              fill="#f59e0b"
            />
            <path d="M 22 32 L 78 32 L 75 35 L 25 35 Z" fill="#d97706" />
            <rect x="46" y="24" width="8" height="6" rx="1.5" fill="#ffffff" stroke="#78350f" strokeWidth="0.8" />
          </g>
        )}

        {/* Naval Captain Peak Cap */}
        {theme.hatType === 'cap' && (
          <g>
            <path
              d="M 28 30 C 28 20, 72 20, 72 30 Z"
              fill="#f8fafc"
            />
            <rect x="27" y="30" width="46" height="5" fill="#1e293b" />
            <path d="M 30 35 C 34 38, 66 38, 70 35 Z" fill="#0f172a" />
            <circle cx="50" cy="32.5" r="2.2" fill="#eab308" />
          </g>
        )}

        {/* 9. Specialized Accessory Badges (Armudu Tea Glass, Domino, Flame, Anchor) */}
        {/* Armudu Tea Glass */}
        {theme.accessory === 'armudu' && (
          <g transform="translate(68, 62) scale(0.65)">
            {/* Saucer */}
            <ellipse cx="20" cy="34" rx="18" ry="4" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
            {/* Armudu Glass contour */}
            <path
              d="M 12 12 Q 10 20 15 24 Q 20 28 20 32 L 20 32 Q 20 28 25 24 Q 30 20 28 12 Z"
              fill={`url(#tea-${avatar.id})`}
              stroke="#ffffff"
              strokeWidth="1.2"
            />
            {/* Glass Rim */}
            <ellipse cx="20" cy="12" rx="8" ry="2" fill="none" stroke="#ffffff" strokeWidth="1.2" />
            {/* Steam vapor */}
            <path d="M 18 8 Q 16 4 19 1" stroke="#ffffff" strokeWidth="1" fill="none" opacity="0.6" strokeLinecap="round" />
            <path d="M 22 7 Q 24 3 21 0" stroke="#ffffff" strokeWidth="1" fill="none" opacity="0.6" strokeLinecap="round" />
          </g>
        )}

        {/* Mini [6:6] Double Domino Tile Badge */}
        {theme.accessory === 'domino' && (
          <g transform="translate(66, 60) scale(0.65)">
            <rect x="5" y="5" width="26" height="34" rx="3" fill="#ffffff" stroke="#0f172a" strokeWidth="1.6" />
            <line x1="8" y1="22" x2="28" y2="22" stroke="#475569" strokeWidth="1" />
            {/* Top pips */}
            <circle cx="11" cy="10" r="1.5" fill="#0f172a" />
            <circle cx="11" cy="16" r="1.5" fill="#0f172a" />
            <circle cx="18" cy="10" r="1.5" fill="#0f172a" />
            <circle cx="18" cy="16" r="1.5" fill="#0f172a" />
            <circle cx="25" cy="10" r="1.5" fill="#0f172a" />
            <circle cx="25" cy="16" r="1.5" fill="#0f172a" />
            {/* Bottom pips */}
            <circle cx="11" cy="27" r="1.5" fill="#0f172a" />
            <circle cx="11" cy="33" r="1.5" fill="#0f172a" />
            <circle cx="18" cy="27" r="1.5" fill="#0f172a" />
            <circle cx="18" cy="33" r="1.5" fill="#0f172a" />
            <circle cx="25" cy="27" r="1.5" fill="#0f172a" />
            <circle cx="25" cy="33" r="1.5" fill="#0f172a" />
          </g>
        )}

        {/* Baku Eternal Flame Badge */}
        {theme.accessory === 'flame' && (
          <g transform="translate(70, 64) scale(0.65)">
            <path
              d="M 18 32 C 8 28 8 16 18 2 C 22 10 28 14 28 22 C 28 28 24 32 18 32 Z"
              fill="#f97316"
            />
            <path
              d="M 18 30 C 12 26 12 18 18 8 C 20 14 24 16 24 22 C 24 26 22 30 18 30 Z"
              fill="#facc15"
            />
          </g>
        )}

        {/* Caspian Golden Anchor */}
        {theme.accessory === 'anchor' && (
          <g transform="translate(70, 66) scale(0.65)">
            <circle cx="16" cy="6" r="3" fill="none" stroke="#eab308" strokeWidth="1.5" />
            <line x1="16" y1="9" x2="16" y2="28" stroke="#eab308" strokeWidth="2" />
            <line x1="10" y1="14" x2="22" y2="14" stroke="#eab308" strokeWidth="2" />
            <path d="M 8 20 C 8 30 24 30 24 20" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" />
          </g>
        )}

        {/* 8-Pointed Star Badge */}
        {theme.accessory === 'star' && (
          <g transform="translate(72, 66) scale(0.55)">
            <polygon
              points="16,2 20,11 29,7 25,16 34,20 25,24 29,33 20,29 16,38 12,29 3,33 7,24 -2,20 7,16 3,7 12,11"
              fill="#fbbf24"
              stroke="#b45309"
              strokeWidth="1"
            />
            <circle cx="16" cy="20" r="3" fill="#ffffff" />
          </g>
        )}
      </svg>
    </div>
  );
};
