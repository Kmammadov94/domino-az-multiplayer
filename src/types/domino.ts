export type PipValue = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface TileData {
  id: string; // e.g. "6-6", "3-2"
  left: PipValue;
  right: PipValue;
}

export type GameMode = '2p_solo' | '3p_solo' | '4p_solo' | '4p_duo';
export type GameVariant = '365' | '101';

export type Language = 'az' | 'ru' | 'en';

export interface Player {
  id: number;
  name: string;
  isAI: boolean;
  hand: TileData[];
  score: number; // match total score (towards 365)
  handRoundPoints: number; // points won in the current hand
  team: 1 | 2; // For 4p_duo: 0 & 2 are Team 1, 1 & 3 are Team 2. For solo: player id
  avatarId?: string;
}

export interface PlacedTile {
  tile: TileData;
  x: number; // logical grid position or offset
  y: number;
  orientation: 'horizontal' | 'vertical';
  // which value is on which side after placement
  ends: {
    top?: PipValue;
    bottom?: PipValue;
    left?: PipValue;
    right?: PipValue;
  };
  isSpinner?: boolean;
  branch?: 'left' | 'right' | 'top' | 'bottom';
  order: number;
}

export interface OpenEnd {
  id: string;
  tileId: string;
  value: PipValue;
  x: number;
  y: number;
  direction: 'left' | 'right' | 'top' | 'bottom';
  isDouble: boolean; // if double at the end, full tile value is counted
}

export interface DominoSkin {
  id: string;
  name: {
    az: string;
    ru: string;
    en: string;
  };
  desc: {
    az: string;
    ru: string;
    en: string;
  };
  price: number;
  unlockedByDefault?: boolean;
  bgGradient: string;
  tileFace: string;
  tileBorder: string;
  pipColor: string;
  accentPipColor?: string; // Colorful accent dot (e.g. center dot for 4 vs 5 distinction & accessibility)
  spinnerColor: string;
  glowEffect?: string;
  isFlagSkin?: boolean;
  flagType?: 'azerbaijan' | 'ukraine';
  stripes?: string[];
  category: 'classic' | 'luxury' | 'baku' | 'modern' | 'public_domain';
}

export interface PlayerStats {
  coins: number;
  equippedSkin: string;
  unlockedSkins: string[];
  equippedAvatar?: string;
  unlockedAvatars?: string[];
  equippedFrame?: string;
  unlockedFrames?: string[];
  equippedTitle?: string;
  unlockedTitles?: string[];
  equippedTableTheme?: string;
  unlockedTableThemes?: string[];
  lastDailyClaim?: string; // YYYY-MM-DD
  dailyStreak: number;
  matchesPlayed: number;
  matchesWon: number;
  mmr?: number;
  rankedPlayed?: number;
  rankedWon?: number;
}
