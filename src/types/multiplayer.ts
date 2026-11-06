import { GameMode, TileData } from './domino';
import { GameBoard, BranchId } from '../utils/boardEngine';
import { DoubleComboMove } from '../utils/comboEngine';

export interface MultiplayerPlayerSlot {
  socketId: string;
  id: number; // 0, 1, 2, 3
  name: string;
  isAI: boolean;
  team?: 1 | 2;
  isHost: boolean;
  isReady: boolean;
  handCount: number;
  score: number;
  handRoundPoints: number;
  equippedSkinId: string;
  avatarId?: string;
  isConnected: boolean;
  sessionToken?: string;
}

export interface MultiplayerRoomSummary {
  code: string;
  mode: GameMode;
  status: 'waiting' | 'in_game' | 'finished';
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  players: MultiplayerPlayerSlot[];
  isLocked?: boolean;
}

export interface PublicRoomInfo {
  code: string;
  mode: GameMode;
  hostName: string;
  hostAvatar?: string;
  playerCount: number;
  maxPlayers: number;
  isLocked: boolean;
}

export interface MultiplayerClientGameState {
  roomCode: string;
  mode: GameMode;
  status: 'waiting' | 'in_game' | 'finished';
  roundNumber: number;
  currentTurn: number;
  turnTimeRemaining: number;
  myPlayerIndex: number;
  myHand: TileData[];
  forcedTile: TileData | null;
  players: MultiplayerPlayerSlot[];
  board: GameBoard;
  boneyardCount: number;
  consecutivePasses: number;
  lastScoredPoints: { playerName: string; points: number } | null;
  reshuffleNotice: string | null;
  handRevealed: boolean;
  revealPhase: 0 | 1 | 2;
  handResults: {
    isBaglandi: boolean;
    winnerIndex: number;
    winnerTeam?: 1 | 2;
    bonusPoints: number;
    rawPips: number;
    revealedHands?: { playerIndex: number; hand: TileData[] }[];
  } | null;
  isMatchOver: boolean;
  matchWinnerIndex: number;
  isInstant35: boolean;
}

export interface ChatMessage {
  id: string;
  senderName: string;
  senderIndex: number;
  text?: string;
  emoji?: string;
  timestamp: number;
}
