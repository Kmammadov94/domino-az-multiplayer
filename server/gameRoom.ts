import {
  GameMode,
  GameVariant,
  TileData,
  GameBoard,
  BranchId
} from '../src/types/domino';
import {
  MultiplayerPlayerSlot,
  MultiplayerClientGameState
} from '../src/types/multiplayer';
import {
  createDominoSet,
  dealHands,
  findFirstHandStarter,
  roundUpTo5,
  sumHandPips,
  checkHandReshuffle
} from '../src/utils/dominoLogic';
import {
  findFirstHandStarter101,
  sumHandPips101,
  getMinBoneyardReserve
} from '../src/utils/domino101Logic';
import {
  createInitialBoard,
  placeFirstTile,
  placeTileOnBranch,
  getPlayableBranches,
  isBoardGloballyBlocked,
  canAnyTileBePlayed
} from '../src/utils/boardEngine';
import { DoubleComboMove } from '../src/utils/comboEngine';
import { selectBestAIMove } from '../src/utils/aiPlayer';

export class GameRoom {
  public code: string;
  public mode: GameMode;
  public variant: GameVariant = '365';
  public status: 'waiting' | 'in_game' | 'finished' = 'waiting';
  public hostSocketId: string;
  public maxPlayers: number;

  public players: MultiplayerPlayerSlot[] = [];
  public secretHands: Map<number, TileData[]> = new Map();
  public secretBoneyard: TileData[] = [];
  public board: GameBoard = createInitialBoard();

  public roundNumber: number = 1;
  public currentTurn: number = 0;
  public turnDuration: number = 30;
  public turnTimeRemaining: number = 30;
  public consecutivePasses: number = 0;
  public forcedTile: TileData | null = null;
  public lastScoredPoints: { playerName: string; points: number } | null = null;
  public reshuffleNotice: string | null = null;

  public handRevealed: boolean = false;
  public revealPhase: 0 | 1 | 2 = 0;
  public handResults: MultiplayerClientGameState['handResults'] = null;

  public isMatchOver: boolean = false;
  public matchWinnerIndex: number = 0;
  public isInstant35: boolean = false;
  public isLocked: boolean = false;
  public lastTilePlacedPlayerIndex: number = 0;
  public nextHandStarterIndex: number = 0;

  private turnTimerInterval: NodeJS.Timeout | null = null;
  private onStateChangeCallback: () => void;

  constructor(
    code: string,
    mode: GameMode,
    hostSocketId: string,
    hostName: string,
    hostSkin: string,
    onStateChange: () => void,
    hostAvatar?: string,
    hostSessionToken?: string,
    isLocked: boolean = false,
    turnDuration: number = 30,
    hostPlayerId?: string,
    hostPlayerTag?: string,
    hostFrameId?: string,
    hostTitle?: string,
    variant: GameVariant = '365'
  ) {
    this.code = code;
    this.mode = mode;
    this.variant = variant || '365';
    this.isLocked = isLocked;
    this.turnDuration = turnDuration || 30;
    this.turnTimeRemaining = this.turnDuration;
    this.hostSocketId = hostSocketId;
    this.maxPlayers = mode === '2p_solo' ? 2 : mode === '3p_solo' ? 3 : 4;
    this.onStateChangeCallback = onStateChange;

    // Add host as player 0
    this.players.push({
      socketId: hostSocketId,
      id: 0,
      name: hostName || 'Oyunçu 1',
      playerId: hostPlayerId,
      playerTag: hostPlayerTag,
      frameId: hostFrameId,
      title: hostTitle,
      isAI: false,
      team: mode === '4p_duo' ? 1 : undefined,
      isHost: true,
      isReady: true,
      handCount: 0,
      score: 0,
      handRoundPoints: 0,
      equippedSkinId: hostSkin || 'ivory_classic',
      avatarId: hostAvatar || 'avatar_baku_classic',
      isConnected: true,
      sessionToken: hostSessionToken || `sess_${Date.now()}_0`
    });
  }

  public addPlayer(
    socketId: string,
    name: string,
    skinId: string,
    avatarId?: string,
    sessionToken?: string,
    playerId?: string,
    playerTag?: string,
    frameId?: string,
    title?: string
  ): { success: boolean; error?: string } {
    if (this.status !== 'waiting') {
      return { success: false, error: 'Oyun artıq başlayıb!' };
    }
    if (this.players.length >= this.maxPlayers) {
      return { success: false, error: 'Otaq doludur!' };
    }

    const newIndex = this.players.length;
    const team =
      this.mode === '4p_duo' ? (newIndex % 2 === 0 ? 1 : 2) : undefined;

    this.players.push({
      socketId,
      id: newIndex,
      name: name || `Oyunçu ${newIndex + 1}`,
      playerId,
      playerTag,
      frameId,
      title,
      isAI: false,
      team,
      isHost: false,
      isReady: false,
      handCount: 0,
      score: 0,
      handRoundPoints: 0,
      equippedSkinId: skinId || 'ivory_classic',
      avatarId: avatarId || 'avatar_baku_classic',
      isConnected: true,
      sessionToken: sessionToken || `sess_${Date.now()}_${newIndex}`
    });

    this.notifyState();
    return { success: true };
  }

  public reconnectPlayer(
    socketId: string,
    sessionToken: string
  ): { success: boolean; playerIndex?: number; error?: string } {
    const p = this.players.find((x) => x.sessionToken === sessionToken);
    if (!p) {
      return { success: false, error: 'Oyunçu sessiyası tapılmadı!' };
    }

    p.socketId = socketId;
    p.isConnected = true;
    if (p.isHost) {
      this.hostSocketId = socketId;
    }

    this.notifyState();
    return { success: true, playerIndex: p.id };
  }

  public markPlayerDisconnected(socketId: string): void {
    const p = this.players.find((x) => x.socketId === socketId);
    if (p) {
      p.isConnected = false;
      this.notifyState();
    }
  }

  public addBot(): { success: boolean; error?: string } {
    if (this.status !== 'waiting') {
      return { success: false, error: 'Oyun artıq başlayıb!' };
    }
    if (this.players.length >= this.maxPlayers) {
      return { success: false, error: 'Otaq doludur!' };
    }

    const botNames = ['Rəşad', 'Tural', 'Elmir', 'Vüsal'];
    const botAvatars = [
      'avatar_tea_master',
      'avatar_sheki_guest',
      'avatar_icherisheher_sage',
      'avatar_kurdxani_pahlavan'
    ];
    const newIndex = this.players.length;
    const team =
      this.mode === '4p_duo' ? (newIndex % 2 === 0 ? 1 : 2) : undefined;

    this.players.push({
      socketId: `bot_${Date.now()}_${newIndex}`,
      id: newIndex,
      name: botNames[newIndex - 1] || `Bot ${newIndex}`,
      isAI: true,
      team,
      isHost: false,
      isReady: true,
      handCount: 0,
      score: 0,
      handRoundPoints: 0,
      equippedSkinId: 'vintage_tea',
      avatarId: botAvatars[newIndex - 1] || 'avatar_tea_master',
      isConnected: true
    });

    this.notifyState();
    return { success: true };
  }

  public setPlayerReady(socketId: string, isReady: boolean): void {
    const p = this.players.find((x) => x.socketId === socketId);
    if (p) {
      p.isReady = isReady;
      this.notifyState();
    }
  }

  public startMatch(requestSocketId: string, sessionToken?: string): { success: boolean; error?: string } {
    const isHostPlayer =
      this.hostSocketId === requestSocketId ||
      this.players[0]?.socketId === requestSocketId ||
      this.players.find((p) => p.socketId === requestSocketId)?.isHost ||
      (sessionToken && this.players.find((p) => p.sessionToken === sessionToken)?.isHost) ||
      (sessionToken && this.players[0]?.sessionToken === sessionToken);
    if (!isHostPlayer) {
      return { success: false, error: 'Yalnız otaq sahibi oyunu başlada bilər!' };
    }
    if (this.players.length < 2) {
      return { success: false, error: 'Oyuna başlamaq üçün ən azı 2 oyunçu lazımdır!' };
    }

    this.status = 'in_game';
    this.roundNumber = 1;
    this.isMatchOver = false;
    this.isInstant35 = false;

    this.players.forEach((p) => {
      p.score = 0;
      p.handRoundPoints = 0;
    });

    this.startHand(true, 0);
    return { success: true };
  }

  public startHand(isFirstHand: boolean = false, prevWinnerIndex: number = 0): void {
    let fullDeck = createDominoSet();
    let dealt = dealHands(this.mode, fullDeck);
    let reshuffle = checkHandReshuffle(dealt.hands);

    // Baku Reshuffle Rule: 5 of a kind without double or 6/7 of a kind -> reshuffle!
    if (reshuffle) {
      const offending = this.players[reshuffle.playerIndex]?.name || 'Oyunçu';
      const detail =
        reshuffle.reason === '5_no_double'
          ? `qoşasız 5 ədəd "${reshuffle.pip}" daşı`
          : `${reshuffle.count} ədəd "${reshuffle.pip}" daşı`;

      this.reshuffleNotice = `🔄 Daşlar yenidən qarışdırılır: ${offending} əlində ${detail} var!`;

      let attempts = 0;
      while (reshuffle && attempts < 25) {
        fullDeck = createDominoSet();
        dealt = dealHands(this.mode, fullDeck);
        reshuffle = checkHandReshuffle(dealt.hands);
        attempts++;
      }

      setTimeout(() => {
        this.reshuffleNotice = null;
        this.notifyState();
      }, 3000);
    } else {
      this.reshuffleNotice = null;
    }

    const { hands, boneyard } = dealt;
    this.secretBoneyard = boneyard;
    this.secretHands.clear();

    this.players.forEach((p, idx) => {
      const pHand = hands[idx] || [];
      this.secretHands.set(p.id, pHand);
      p.handCount = pHand.length;
      p.handRoundPoints = 0;
    });

    this.board = createInitialBoard(this.variant === '101' ? false : true);
    this.consecutivePasses = 0;
    this.lastScoredPoints = null;
    this.handRevealed = false;
    this.revealPhase = 0;
    this.handResults = null;

    let starter = Math.max(0, Math.min(this.players.length - 1, prevWinnerIndex));
    let mustPlayTile: TileData | null = null;

    if (isFirstHand) {
      const { playerIndex, forcedTile: ft } =
        this.variant === '101'
          ? findFirstHandStarter101(hands)
          : findFirstHandStarter(hands);
      starter = playerIndex;
      mustPlayTile = ft;
    }

    this.forcedTile = mustPlayTile;
    this.currentTurn = starter;
    this.resetTurnTimer();
    this.notifyState();

    // If starter is bot, trigger bot turn
    this.checkBotTurn();
  }

  public executeMove(
    socketId: string,
    tileId: string,
    branchId: BranchId
  ): { success: boolean; error?: string } {
    if (this.status !== 'in_game' || this.handRevealed) {
      return { success: false, error: 'Hazırda gediş etmək olmaz!' };
    }

    const player = this.players[this.currentTurn];
    if (!player || player.socketId !== socketId) {
      return { success: false, error: 'Sizin növbəniz deyil!' };
    }

    const hand = this.secretHands.get(player.id) || [];
    const tile = hand.find((t) => t.id === tileId);
    if (!tile) {
      return { success: false, error: 'Bu daş əlinizdə yoxdur!' };
    }

    if (this.forcedTile && tile.id !== this.forcedTile.id) {
      return { success: false, error: 'İlk gedişdə məcburi daş oynanmalıdır!' };
    }

    let nextBoard: GameBoard;
    let scored = 0;

    if (this.board.tiles.length === 0) {
      nextBoard = placeFirstTile(this.board, tile);
      const isDouble = tile.left === tile.right;
      // Baku Telefon 365 Rule: opening non-doubles (e.g. 3:2) do NOT score!
      // Also after 300 points, starting with double 5 does NOT give 10 points!
      const currentScore =
        this.mode === '4p_duo'
          ? this.players.find((p) => p.team === player.team)?.score || 0
          : player.score;

      if (isDouble && currentScore < 300) {
        const doubleSum = tile.left * 2;
        scored = doubleSum % 5 === 0 ? doubleSum : 0;
      } else {
        scored = 0;
      }
    } else {
      const res = placeTileOnBranch(this.board, tile, branchId);
      nextBoard = res.board;
      scored = res.scoredPoints;
    }

    if (this.variant === '101') {
      scored = 0; // 101 rejimində lövhədən xal qazanılmır, xallar əl bitəndə hesablanır
    }

    this.board = nextBoard;
    this.forcedTile = null;
    this.consecutivePasses = 0;

    if (scored > 0) {
      this.lastScoredPoints = {
        playerName: player.name,
        points: scored
      };
    } else {
      this.lastScoredPoints = null;
    }

    // Track player who placed this tile
    this.lastTilePlacedPlayerIndex = player.id;

    // Remove tile from secret hand
    const nextHand = hand.filter((t) => t.id !== tile.id);
    this.secretHands.set(player.id, nextHand);
    player.handCount = nextHand.length;
    player.score += scored;
    player.handRoundPoints += scored;

    // Check Instant 35 match win
    if (scored === 35) {
      this.isInstant35 = true;
      this.isMatchOver = true;
      this.matchWinnerIndex = player.id;
      this.clearTurnTimer();
      this.notifyState();
      return { success: true };
    }

    // Check Domino (Hand cleared)
    if (nextHand.length === 0) {
      this.finishHand(false, player.id);
      return { success: true };
    }

    // Check if board has become globally blocked ("Bağlandı")
    const minReserve = getMinBoneyardReserve(this.variant, this.mode);
    const drawableBoneyard = this.secretBoneyard.slice(0, Math.max(0, this.secretBoneyard.length - minReserve));
    const allSecretHands = Array.from(this.secretHands.values());
    const isGloballyBlocked = isBoardGloballyBlocked(this.board);
    const noMovePossible =
      !allSecretHands.some((h) => canAnyTileBePlayed(this.board, h)) &&
      !canAnyTileBePlayed(this.board, drawableBoneyard);

    if (isGloballyBlocked || noMovePossible) {
      let minPips = 999;
      let lowestPlayer = 0;
      this.players.forEach((p) => {
        const h = this.secretHands.get(p.id) || [];
        const pips = this.variant === '101' ? sumHandPips101(h) : sumHandPips(h);
        if (pips < minPips) {
          minPips = pips;
          lowestPlayer = p.id;
        }
      });
      // Player who placed this tile blocked the road!
      this.finishHand(true, lowestPlayer, player.id);
      return { success: true };
    }

    // Advance turn
    this.currentTurn = (this.currentTurn + 1) % this.players.length;
    this.resetTurnTimer();
    this.notifyState();
    this.checkBotTurn();

    return { success: true };
  }

  public executeCombo(
    socketId: string,
    combo: DoubleComboMove
  ): { success: boolean; error?: string } {
    if (this.status !== 'in_game' || this.handRevealed) {
      return { success: false, error: 'Hazırda gediş etmək olmaz!' };
    }

    if (this.variant === '101') {
      return { success: false, error: '101 rejimində qoşa kombosu qaydası yoxdur!' };
    }

    const player = this.players[this.currentTurn];
    if (!player || player.socketId !== socketId) {
      return { success: false, error: 'Sizin növbəniz deyil!' };
    }

    const hand = this.secretHands.get(player.id) || [];
    // Verify all combo tiles exist in hand
    const hasAll = combo.tiles.every((ct) => hand.some((h) => h.id === ct.tile.id));
    if (!hasAll) {
      return { success: false, error: 'Kombodakı bəzi daşlar əlinizdə yoxdur!' };
    }

    let tempBoard = this.board;
    for (const item of combo.tiles) {
      const res = placeTileOnBranch(tempBoard, item.tile, item.branchId);
      tempBoard = res.board;
    }

    this.board = tempBoard;
    this.forcedTile = null;
    this.consecutivePasses = 0;

    const scored = combo.expectedScore;
    if (scored > 0) {
      this.lastScoredPoints = {
        playerName: `${player.name} (${combo.tiles.length}-li Qoşa)`,
        points: scored
      };
    }

    // Remove combo tiles from secret hand
    const comboTileIds = new Set(combo.tiles.map((c) => c.tile.id));
    const nextHand = hand.filter((t) => !comboTileIds.has(t.id));
    this.secretHands.set(player.id, nextHand);
    player.handCount = nextHand.length;
    player.score += scored;
    player.handRoundPoints += scored;

    this.lastTilePlacedPlayerIndex = player.id;

    if (scored === 35) {
      this.isInstant35 = true;
      this.isMatchOver = true;
      this.matchWinnerIndex = player.id;
      this.clearTurnTimer();
      this.notifyState();
      return { success: true };
    }

    if (nextHand.length === 0) {
      this.finishHand(false, player.id);
      return { success: true };
    }

    // Check if board has become globally blocked ("Bağlandı")
    const minReserve = getMinBoneyardReserve(this.variant, this.mode);
    const drawableBoneyard = this.secretBoneyard.slice(0, Math.max(0, this.secretBoneyard.length - minReserve));
    const allSecretHands = Array.from(this.secretHands.values());
    const isGloballyBlocked = isBoardGloballyBlocked(this.board);
    const noMovePossible =
      !allSecretHands.some((h) => canAnyTileBePlayed(this.board, h)) &&
      !canAnyTileBePlayed(this.board, drawableBoneyard);

    if (isGloballyBlocked || noMovePossible) {
      let minPips = 999;
      let lowestPlayer = 0;
      this.players.forEach((p) => {
        const h = this.secretHands.get(p.id) || [];
        const pips = this.variant === '101' ? sumHandPips101(h) : sumHandPips(h);
        if (pips < minPips) {
          minPips = pips;
          lowestPlayer = p.id;
        }
      });
      this.finishHand(true, lowestPlayer, player.id);
      return { success: true };
    }

    this.currentTurn = (this.currentTurn + 1) % this.players.length;
    this.resetTurnTimer();
    this.notifyState();
    this.checkBotTurn();

    return { success: true };
  }

  public drawBazaar(socketId: string): { success: boolean; error?: string } {
    if (this.status !== 'in_game' || this.handRevealed) {
      return { success: false, error: 'Hazırda daş götürmək olmaz!' };
    }

    const player = this.players[this.currentTurn];
    if (!player || player.socketId !== socketId) {
      return { success: false, error: 'Sizin növbəniz deyil!' };
    }

    const minReserve = getMinBoneyardReserve(this.variant, this.mode);
    const available = Math.max(0, this.secretBoneyard.length - minReserve);
    if (available === 0) {
      return { success: false, error: 'Bazarda yalnız qapalı ehtiyat daşlar qalıb!' };
    }

    const drawableBoneyard = this.secretBoneyard.slice(0, available);
    if (isBoardGloballyBlocked(this.board) || !canAnyTileBePlayed(this.board, drawableBoneyard)) {
      return { success: false, error: 'Oyun bağlandı! Bazarda gedilə bilən daş yoxdur.' };
    }

    const drawCount = this.variant === '101' ? Math.min(2, available) : 1;
    const hand = this.secretHands.get(player.id) || [];
    for (let i = 0; i < drawCount; i++) {
      const drawn = this.secretBoneyard.shift();
      if (drawn) hand.push(drawn);
    }
    this.secretHands.set(player.id, hand);
    player.handCount = hand.length;

    this.notifyState();
    return { success: true };
  }

  public passTurn(socketId: string): { success: boolean; error?: string } {
    if (this.status !== 'in_game' || this.handRevealed) {
      return { success: false, error: 'Hazırda pas vermək olmaz!' };
    }

    const player = this.players[this.currentTurn];
    if (!player || player.socketId !== socketId) {
      return { success: false, error: 'Sizin növbəniz deyil!' };
    }

    this.consecutivePasses++;

    // Check Bağlandı (all players passed consecutively)
    if (this.consecutivePasses >= this.players.length) {
      let minPips = 999;
      let lowestPlayer = 0;

      this.players.forEach((p) => {
        const h = this.secretHands.get(p.id) || [];
        const pips = this.variant === '101' ? sumHandPips101(h) : sumHandPips(h);
        if (pips < minPips) {
          minPips = pips;
          lowestPlayer = p.id;
        }
      });

      this.finishHand(true, lowestPlayer, this.lastTilePlacedPlayerIndex);
      return { success: true };
    }

    this.currentTurn = (this.currentTurn + 1) % this.players.length;
    this.resetTurnTimer();
    this.notifyState();
    this.checkBotTurn();

    return { success: true };
  }

  private finishHand(endedInBaglandi: boolean, winnerIndex: number, blockerIndex?: number): void {
    this.clearTurnTimer();
    this.handRevealed = true;
    this.revealPhase = 1;

    const blocker = blockerIndex !== undefined ? blockerIndex : this.lastTilePlacedPlayerIndex;
    // Azerbaijani rule: In 101 and 365, whoever blocked the road (placed last tile) starts next hand!
    this.nextHandStarterIndex = endedInBaglandi ? blocker : winnerIndex;

    const winnerP = this.players[winnerIndex] || this.players[0];
    const winningTeam = winnerP.team;

    // Calculate raw opponent leftover pips
    let rawOpponentPips = 0;
    this.players.forEach((p) => {
      const isOpponent =
        this.mode === '4p_duo' ? p.team !== winningTeam : p.id !== winnerIndex;
      if (isOpponent) {
        const h = this.secretHands.get(p.id) || [];
        rawOpponentPips += this.variant === '101' ? sumHandPips101(h) : sumHandPips(h);
      }
    });

    let bonus = 0;
    if (this.variant === '101') {
      bonus = rawOpponentPips; // 101 rejimində rəqibin əlində qalan xallar birbaşa qalibə yazılır
    } else {
      // 300 rule: no hand bonus after 300
      const winnerScore =
        this.mode === '4p_duo'
          ? this.players.find((p) => p.team === winningTeam)?.score || 0
          : winnerP.score;
      if (winnerScore < 300 && rawOpponentPips > 0) {
        bonus = roundUpTo5(rawOpponentPips);
      }
    }

    // Award bonus
    this.players.forEach((p) => {
      const isWinner =
        this.mode === '4p_duo' ? p.team === winningTeam : p.id === winnerIndex;
      if (isWinner) {
        p.score += bonus;
        p.handRoundPoints += bonus;
      }
    });

    // Construct revealed hands for all clients to inspect
    const revealedHands: { playerIndex: number; hand: TileData[] }[] = [];
    this.players.forEach((p) => {
      revealedHands.push({
        playerIndex: p.id,
        hand: [...(this.secretHands.get(p.id) || [])]
      });
    });

    this.handResults = {
      isBaglandi: endedInBaglandi,
      winnerIndex,
      winnerTeam: winningTeam,
      bonusPoints: bonus,
      rawPips: rawOpponentPips,
      blockerIndex: endedInBaglandi ? blocker : undefined,
      revealedHands
    };

    // Check Match Victory (Target 101 or 365)
    let highestScore = 0;
    this.players.forEach((p) => {
      if (p.score > highestScore) highestScore = p.score;
    });

    const targetScore = this.variant === '101' ? 101 : 365;
    if (highestScore >= targetScore) {
      if (this.variant === '365' && endedInBaglandi) {
        // Over 365 ended in baglandi: must play extra hand
        this.isMatchOver = false;
      } else {
        this.isMatchOver = true;
        if (this.mode === '4p_duo') {
          const t1 = this.players.find((p) => p.team === 1)?.score || 0;
          const t2 = this.players.find((p) => p.team === 2)?.score || 0;
          this.matchWinnerIndex = t1 > t2 ? 0 : 1;
        } else {
          const champ = this.players.find((p) => p.score === highestScore);
          this.matchWinnerIndex = champ?.id ?? 0;
        }
      }
    } else {
      this.isMatchOver = false;
    }

    this.notifyState();
  }

  public nextHand(requestSocketId: string): { success: boolean; error?: string } {
    const isHost = this.hostSocketId === requestSocketId;
    if (!isHost && this.players.length > 1) {
      return { success: false, error: 'Yalnız otaq sahibi növbəti ələ başlaya bilər!' };
    }

    if (this.isMatchOver) {
      // Restart full match
      return this.startMatch(requestSocketId);
    }

    this.roundNumber++;
    this.startHand(false, this.nextHandStarterIndex);
    return { success: true };
  }

  public removePlayer(socketId: string): void {
    const pIdx = this.players.findIndex((p) => p.socketId === socketId);
    if (pIdx < 0) return;

    if (this.status === 'waiting') {
      this.players.splice(pIdx, 1);
      // Re-assign IDs
      this.players.forEach((p, idx) => {
        p.id = idx;
        p.team = this.mode === '4p_duo' ? (idx % 2 === 0 ? 1 : 2) : undefined;
      });
      if (this.players.length > 0 && !this.players.some((p) => p.isHost)) {
        this.players[0].isHost = true;
        this.hostSocketId = this.players[0].socketId;
      }
      this.notifyState();
    } else {
      // In-game: mark as bot or disconnected so game doesn't stall
      const p = this.players[pIdx];
      p.isConnected = false;
      p.isAI = true; // Bot takes over gracefully
      p.name = `${p.name} (Bot)`;
      this.notifyState();
      this.checkBotTurn();
    }
  }

  private resetTurnTimer(): void {
    this.clearTurnTimer();
    this.turnTimeRemaining = this.turnDuration || 30;

    this.turnTimerInterval = setInterval(() => {
      this.turnTimeRemaining--;
      if (this.turnTimeRemaining <= 0) {
        this.clearTurnTimer();
        this.handleTurnTimeout();
      } else {
        this.notifyState();
      }
    }, 1000);
  }

  private clearTurnTimer(): void {
    if (this.turnTimerInterval) {
      clearInterval(this.turnTimerInterval);
      this.turnTimerInterval = null;
    }
  }

  private handleTurnTimeout(): void {
    if (this.status !== 'in_game' || this.handRevealed) return;
    const activePlayer = this.players[this.currentTurn];
    if (!activePlayer) return;

    const hand = this.secretHands.get(activePlayer.id) || [];
    if (this.board.tiles.length === 0 && this.forcedTile) {
      this.executeMove(activePlayer.socketId, this.forcedTile.id, 'main_left');
      return;
    }

    const botScore =
      this.mode === '4p_duo'
        ? this.players.find((p) => p.team === activePlayer.team)?.score || 0
        : activePlayer.score;

    let bestMove = selectBestAIMove(hand, this.board, botScore);

    const minReserve = getMinBoneyardReserve(this.variant, this.mode);
    const isGloballyBlocked = isBoardGloballyBlocked(this.board);

    // If player has no playable move and bazaar can actually help (respecting min reserve), draw from bazaar
    while (
      !bestMove &&
      this.secretBoneyard.length > minReserve &&
      !isGloballyBlocked
    ) {
      const drawable = this.secretBoneyard.slice(0, this.secretBoneyard.length - minReserve);
      if (!canAnyTileBePlayed(this.board, drawable)) break;

      const drawCount = this.variant === '101' ? Math.min(2, this.secretBoneyard.length - minReserve) : 1;
      for (let i = 0; i < drawCount; i++) {
        const drawn = this.secretBoneyard.shift()!;
        hand.push(drawn);
      }
      this.secretHands.set(activePlayer.id, hand);
      activePlayer.handCount = hand.length;
      bestMove = selectBestAIMove(hand, this.board, botScore);
    }

    if (bestMove) {
      this.executeMove(activePlayer.socketId, bestMove.tile.id, bestMove.branchId);
    } else {
      this.passTurn(activePlayer.socketId);
    }
  }

  private checkBotTurn(): void {
    if (this.status !== 'in_game' || this.handRevealed) return;
    const activePlayer = this.players[this.currentTurn];
    if (!activePlayer || !activePlayer.isAI) return;

    setTimeout(() => {
      if (this.status !== 'in_game' || this.handRevealed) return;
      this.handleTurnTimeout();
    }, 1600);
  }

  public getClientState(socketId: string): MultiplayerClientGameState {
    const callerSlot = this.players.find((p) => p.socketId === socketId);
    const myPlayerIndex = callerSlot ? callerSlot.id : 0;
    const myHand = this.secretHands.get(myPlayerIndex) || [];

    // Clone and sanitize players: do NOT reveal opponent hands!
    const sanitizedPlayers = this.players.map((p) => ({
      ...p,
      handCount: this.secretHands.get(p.id)?.length || 0
    }));

    return {
      roomCode: this.code,
      mode: this.mode,
      variant: this.variant,
      status: this.status,
      roundNumber: this.roundNumber,
      currentTurn: this.currentTurn,
      turnTimeRemaining: this.turnTimeRemaining,
      turnDuration: this.turnDuration,
      myPlayerIndex,
      myHand,
      forcedTile: this.forcedTile,
      players: sanitizedPlayers,
      board: this.board,
      boneyardCount: this.secretBoneyard.length,
      consecutivePasses: this.consecutivePasses,
      lastScoredPoints: this.lastScoredPoints,
      reshuffleNotice: this.reshuffleNotice,
      handRevealed: this.handRevealed,
      revealPhase: this.revealPhase,
      handResults: this.handResults,
      isMatchOver: this.isMatchOver,
      matchWinnerIndex: this.matchWinnerIndex,
      isInstant35: this.isInstant35
    };
  }

  private notifyState(): void {
    this.onStateChangeCallback();
  }

  public destroy(): void {
    this.clearTurnTimer();
  }
}
