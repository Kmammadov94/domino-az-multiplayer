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

export const ArmuduTeaSvg: React.FC<{ size?: number; className?: string }> = ({ size = 32, className = '' }) => (
  <svg
    viewBox="0 0 64 64"
    width={size}
    height={size}
    className={`inline-block drop-shadow-md select-none ${className}`}
  >
    <defs>
      <linearGradient id="armuduTeaLiquid" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f59e0b" />
        <stop offset="40%" stopColor="#b91c1c" />
        <stop offset="100%" stopColor="#7f1d1d" />
      </linearGradient>
      <linearGradient id="armuduGlassHighlight" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
        <stop offset="35%" stopColor="rgba(255,255,255,0.08)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0.28)" />
      </linearGradient>
      <linearGradient id="armuduSaucer" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#cbd5e1" />
        <stop offset="50%" stopColor="#f8fafc" />
        <stop offset="100%" stopColor="#94a3b8" />
      </linearGradient>
    </defs>

    {/* Rising Steam Wisps */}
    <path
      d="M27,12 C25,8 29,6 27,2"
      stroke="rgba(255,255,255,0.65)"
      strokeWidth="1.6"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M33,11 C35,7 31,5 33,1.5"
      stroke="rgba(255,255,255,0.75)"
      strokeWidth="1.6"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M39,12 C37,8.5 41,6.5 39,3"
      stroke="rgba(255,255,255,0.55)"
      strokeWidth="1.5"
      strokeLinecap="round"
      fill="none"
    />

    {/* Traditional Saucer (Nəlbəki) */}
    <ellipse cx="32" cy="54" rx="22" ry="5.5" fill="url(#armuduSaucer)" stroke="#64748b" strokeWidth="1" />
    <ellipse cx="32" cy="53" rx="15" ry="3" fill="rgba(148,163,184,0.35)" />

    {/* Sugar Cube (Qənd) on Saucer */}
    <rect x="44" y="49" width="5.5" height="4.5" rx="0.8" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.7" />

    {/* Armudu Glass Outer Contour (Pear / Hourglass Silhouette) */}
    <path
      d="M21,16 C21,21 25,25 24,30 C22.5,36 18.5,41 21,49 C22.5,52.5 26,53.5 32,53.5 C38,53.5 41.5,52.5 43,49 C45.5,41 41.5,36 40,30 C39,25 43,21 43,16 Z"
      fill="rgba(226,232,240,0.22)"
      stroke="#e2e8f0"
      strokeWidth="1.4"
    />

    {/* Rich Amber-Red Pürrəngi Tea Inside */}
    <path
      d="M22.5,21 C23.5,24 26,26.5 25,30.5 C23.5,36 20,41 22.3,48 C23.5,50.8 26.8,51.8 32,51.8 C37.2,51.8 40.5,50.8 41.7,48 C44,41 40.5,36 39,30.5 C38,26.5 40.5,24 41.5,21 Z"
      fill="url(#armuduTeaLiquid)"
    />

    {/* Tea Surface Meniscus */}
    <ellipse cx="32" cy="21" rx="9.5" ry="2.2" fill="#fbbf24" opacity="0.85" />

    {/* Glass Rim & Specular Highlight */}
    <ellipse cx="32" cy="16" rx="11" ry="2.6" fill="none" stroke="#f8fafc" strokeWidth="1.3" />
    <path
      d="M25,21 C26,25 27.5,27.5 26.5,31 C25.2,36 23,41 24.5,47.5"
      stroke="url(#armuduGlassHighlight)"
      strokeWidth="2.2"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

interface GiftIconProps {
  gift: TableGiftDef;
  size?: number;
  className?: string;
}

export const GiftIcon: React.FC<GiftIconProps> = ({ gift, size = 32, className = '' }) => {
  if (gift.id === 'tea') {
    return <ArmuduTeaSvg size={size} className={className} />;
  }
  if (gift.id === 'paxlava') {
    return <ShekiPaxlavaSvg size={size} className={className} />;
  }

  return (
    <span style={{ fontSize: `${size}px`, lineHeight: 1 }} className={className}>
      {gift.icon}
    </span>
  );
};
