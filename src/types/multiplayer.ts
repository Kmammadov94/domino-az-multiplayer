import { GameMode, GameVariant, TileData } from './domino';
import { Match101State } from '../utils/domino101Logic';
import { GameBoard } from '../utils/boardEngine';

export interface MultiplayerPlayerSlot {
  socketId: string;
  id: number; // 0, 1, 2, 3
  name: string;
  playerId?: string;
  playerTag?: string;
  frameId?: string;
  title?: string;
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
  mmr?: number;
}

export interface TeahouseTierCounts {
  waiting: number;
  active: number;
}

export interface MultiplayerRoomSummary {
  code: string;
  mode: GameMode;
  variant: GameVariant;
  status: 'waiting' | 'in_game' | 'finished';
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  players: MultiplayerPlayerSlot[];
  isLocked?: boolean;
  turnDuration?: number;
  teahouseTierId?: string;
  teahouseBuyIn?: number;
  teahousePrizePot?: number;
  isRanked?: boolean;
}

export interface PublicRoomInfo {
  code: string;
  mode: GameMode;
  variant: GameVariant;
  hostName: string;
  hostAvatar?: string;
  playerCount: number;
  maxPlayers: number;
  isLocked: boolean;
  turnDuration?: number;
}

export interface MultiplayerClientGameState {
  roomCode: string;
  mode: GameMode;
  variant: GameVariant;
  status: 'waiting' | 'in_game' | 'finished';
  roundNumber: number;
  currentTurn: number;
  turnTimeRemaining: number;
  turnDuration?: number;
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
    isSeka?: boolean;
    ayazCaught?: boolean;
    winnerIndex: number;
    winnerTeam?: 1 | 2;
    bonusPoints: number;
    rawPips: number;
    blockerIndex?: number;
    revealedHands?: { playerIndex: number; hand: TileData[] }[];
  } | null;
  isMatchOver: boolean;
  matchWinnerIndex: number;
  isInstant35: boolean;
  hadHumanOpponentLeave?: boolean;
  rematchState?: {
    requesterIndex: number;
    requesterName: string;
    acceptedPlayerIndices: number[];
    rejectedByName?: string;
  } | null;
  match101State?: Match101State;
  teahouseTierId?: string;
  teahouseBuyIn?: number;
  teahousePrizePot?: number;
  isRanked?: boolean;
}

export interface ChatMessage {
  id: string;
  senderName: string;
  senderIndex: number;
  text?: string;
  emoji?: string;
  timestamp: number;
}
