import React from 'react';
import { TableGiftDef } from '../data/tableGifts';

export const ShekiPaxlavaSvg: React.FC<{ size?: number; className?: string }> = ({ size = 32, className = '' }) => (
  <svg
    viewBox="0 0 64 64"
    width={size}
    height={size}
    className={`inline-block drop-shadow-md select-none ${className}`}
  >
    <defs>
      <linearGradient id="paxlavaCrust" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#fde047" />
        <stop offset="40%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#d97706" />
      </linearGradient>
      <linearGradient id="paxlavaSide" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#78350f" />
        <stop offset="100%" stopColor="#451a03" />
      </linearGradient>
      <linearGradient id="walnutGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#92400e" />
        <stop offset="100%" stopColor="#5c2605" />
      </linearGradient>
    </defs>
    {/* 3D Walnut Filling Base/Side Layer */}
    <path
      d="M8,28 L32,46 L56,28 L56,38 L32,56 L8,38 Z"
      fill="url(#paxlavaSide)"
    />
    <path
      d="M32,46 L56,28 L56,38 L32,56 Z"
      fill="#522006"
    />
    {/* Crushed walnut texture on side */}
    <ellipse cx="20" cy="41" rx="2" ry="1.5" fill="#a16207" />
    <ellipse cx="36" cy="48" rx="2.5" ry="1.8" fill="#a16207" />
    <ellipse cx="48" cy="40" rx="1.8" ry="1.4" fill="#a16207" />

    {/* Diamond Rhombus Golden Top Crust */}
    <polygon
      points="32,8 56,28 32,46 8,28"
      fill="url(#paxlavaCrust)"
      stroke="#b45309"
      strokeWidth="1.2"
    />

    {/* Sheki Saffron Rishta Lattice Net (Signature Red/Orange Threads) */}
    <g stroke="#b91c1c" strokeWidth="0.9" opacity="0.85" strokeLinecap="round">
      {/* Diagonals Left to Right */}
      <line x1="20" y1="18" x2="44" y2="38" />
      <line x1="14" y1="23" x2="38" y2="43" />
      <line x1="26" y1="13" x2="50" y2="33" />
      {/* Diagonals Right to Left */}
      <line x1="44" y1="18" x2="20" y2="38" />
      <line x1="50" y1="23" x2="26" y2="43" />
      <line x1="38" y1="13" x2="14" y2="33" />
    </g>

    {/* Honey Syrup Sheen Overlay */}
    <polygon
      points="32,9 53,27 32,44 11,27"
      fill="none"
      stroke="rgba(255,255,255,0.45)"
      strokeWidth="0.8"
    />

    {/* Whole Walnut Kernel in Center */}
    <ellipse
      cx="32"
      cy="27"
      rx="4.5"
      ry="6.5"
      transform="rotate(15 32 27)"
      fill="url(#walnutGrad)"
      stroke="#451a03"
      strokeWidth="0.6"
    />
    <path
      d="M31,22 Q33,27 31,32"
      stroke="#451a03"
      strokeWidth="0.8"
      fill="none"
    />
    <ellipse
      cx="32.5"
      cy="25"
      rx="1.5"
      ry="3"
      fill="rgba(255,255,255,0.35)"
    />
  </svg>
);

interface GiftIconProps {
  gift: TableGiftDef;
  size?: number;
  className?: string;
}

export const GiftIcon: React.FC<GiftIconProps> = ({ gift, size = 32, className = '' }) => {
  if (gift.id === 'paxlava') {
    return <ShekiPaxlavaSvg size={size} className={className} />;
  }

  return (
    <span style={{ fontSize: `${size}px`, lineHeight: 1 }} className={className}>
      {gift.icon}
    </span>
  );
};
