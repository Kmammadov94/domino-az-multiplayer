import { io, Socket } from 'socket.io-client';
import { GameMode, GameVariant } from '../types/domino';
import { DoubleComboMove } from '../utils/comboEngine';
import { getBackendServerUrl } from '../utils/storage';
import {
  MultiplayerClientGameState,
  MultiplayerRoomSummary,
  PublicRoomInfo,
  ChatMessage
} from '../types/multiplayer';

class MultiplayerSocketService {
  private socket: Socket | null = null;
  private serverUrl: string = '';
  private roomSummaryListeners = new Set<(summary: MultiplayerRoomSummary) => void>();
  private roomStateListeners = new Set<(state: MultiplayerClientGameState) => void>();
  private chatListeners = new Set<(msg: ChatMessage) => void>();

  constructor() {
    if (typeof window !== 'undefined') {
      this.serverUrl = getBackendServerUrl();
    }
  }

  public connect(): Socket {
    if (!this.socket) {
      this.socket = io(this.serverUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 25,
        reconnectionDelay: 1000,
        timeout: 10000
      });
      this.roomSummaryListeners.forEach((cb) => this.socket?.on('room_summary', cb));
      this.roomStateListeners.forEach((cb) => this.socket?.on('room_state', cb));
      this.chatListeners.forEach((cb) => this.socket?.on('chat_message', cb));
    } else if (this.socket.disconnected) {
      this.socket.connect();
    }
    return this.socket;
  }

  public disconnectIfIdle(): void {
    if (this.socket && this.socket.connected) {
      this.socket.disconnect();
    }
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public isConnected(): boolean {
    return !!this.socket && this.socket.connected;
  }

  private emitWithTimeout<T>(event: string, data?: any, timeoutMs = 15000): Promise<T> {
    const s = this.connect();
    return new Promise((resolve, reject) => {
      let done = false;
      const timer = setTimeout(() => {
        if (!done) {
          done = true;
          reject(
            new Error(
              'Serverlə əlaqə qurulmadı. Zəhmət olmasa internet və ya server bağlantınızı yoxlayın.'
            )
          );
        }
      }, timeoutMs);

      const callback = (res: T) => {
        if (!done) {
          done = true;
          clearTimeout(timer);
          resolve(res);
        }
      };

      if (data !== undefined) {
        s.emit(event, data, callback);
      } else {
        s.emit(event, callback);
      }
    });
  }

  public createRoom(
    mode: GameMode,
    playerName: string,
    skinId: string,
    avatarId?: string,
    sessionToken?: string,
    isLocked?: boolean,
    turnDuration?: number,
    playerId?: string,
    playerTag?: string,
    frameId?: string,
    title?: string,
    variant: GameVariant = '365'
  ): Promise<{
    success: boolean;
    roomCode?: string;
    sessionToken?: string;
    myPlayerIndex?: number;
    isHost?: boolean;
    summary?: MultiplayerRoomSummary;
    error?: string;
  }> {
    return this.emitWithTimeout('create_room', {
      mode,
      variant,
      playerName,
      skinId,
      avatarId,
      sessionToken,
      isLocked,
      turnDuration,
      playerId,
      playerTag,
      frameId,
      title
    });
  }

  public getPublicRooms(): Promise<{
    success: boolean;
    rooms?: PublicRoomInfo[];
    error?: string;
  }> {
    return this.emitWithTimeout('get_public_rooms');
  }

  public toggleRoomLock(roomCode?: string): Promise<{
    success: boolean;
    isLocked?: boolean;
    error?: string;
  }> {
    return this.emitWithTimeout('toggle_room_lock', { roomCode });
  }

  public joinRoom(
    roomCode: string,
    playerName: string,
    skinId: string,
    avatarId?: string,
    sessionToken?: string,
    playerId?: string,
    playerTag?: string,
    frameId?: string,
    title?: string
  ): Promise<{
    success: boolean;
    roomCode?: string;
    sessionToken?: string;
    myPlayerIndex?: number;
    isHost?: boolean;
    summary?: MultiplayerRoomSummary;
    error?: string;
  }> {
    return this.emitWithTimeout('join_room', {
      roomCode,
      playerName,
      skinId,
      avatarId,
      sessionToken,
      playerId,
      playerTag,
      frameId,
      title
    });
  }

  public quickMatch(
    mode: GameMode,
    playerName: string,
    skinId: string,
    avatarId?: string,
    sessionToken?: string,
    playerId?: string,
    playerTag?: string,
    frameId?: string,
    title?: string,
    variant: GameVariant = '365'
  ): Promise<{
    success: boolean;
    roomCode?: string;
    sessionToken?: string;
    myPlayerIndex?: number;
    isHost?: boolean;
    summary?: MultiplayerRoomSummary;
    error?: string;
  }> {
    return this.emitWithTimeout('quick_match', {
      mode,
      variant,
      playerName,
      skinId,
      avatarId,
      sessionToken,
      playerId,
      playerTag,
      frameId,
      title
    });
  }

  public lookupPlayer(query: string): Promise<{
    success: boolean;
    player?: {
      name: string;
      playerId: string;
      playerTag: string;
      handle: string;
      avatarId: string;
      frameId?: string;
      title?: string;
      matchesWon?: number;
      isOnline: boolean;
    };
    error?: string;
  }> {
    return this.emitWithTimeout('lookup_player', query);
  }

  public reconnectRoom(
    roomCode: string,
    sessionToken: string
  ): Promise<{
    success: boolean;
    roomCode?: string;
    sessionToken?: string;
    myPlayerIndex?: number;
    isHost?: boolean;
    summary?: MultiplayerRoomSummary;
    gameState?: MultiplayerClientGameState | null;
    error?: string;
  }> {
    return this.emitWithTimeout('reconnect_room', { roomCode, sessionToken });
  }

  public setReady(isReady: boolean): void {
    this.connect().emit('set_ready', { isReady });
  }

  public addBot(): Promise<{ success: boolean; error?: string }> {
    return this.emitWithTimeout('add_bot');
  }

  public startGame(roomCode?: string, sessionToken?: string): Promise<{ success: boolean; error?: string }> {
    return this.emitWithTimeout('start_game', { roomCode, sessionToken });
  }

  public playTile(
    tileId: string,
    branchId: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.emitWithTimeout('play_tile', { tileId, branchId });
  }

  public playCombo(
    combo: DoubleComboMove
  ): Promise<{ success: boolean; error?: string }> {
    return this.emitWithTimeout('play_combo', { combo });
  }

  public drawBazaar(): Promise<{ success: boolean; error?: string }> {
    return this.emitWithTimeout('draw_bazaar');
  }

  public passTurn(): Promise<{ success: boolean; error?: string }> {
    return this.emitWithTimeout('pass_turn');
  }

  public nextHand(): Promise<{ success: boolean; error?: string }> {
    return this.emitWithTimeout('next_hand');
  }

  public sendChat(text?: string, emoji?: string): void {
    this.connect().emit('send_chat', { text, emoji });
  }

  public sendChatMessage(text?: string, emoji?: string): void {
    this.connect().emit('send_chat', { text, emoji });
  }

  public leaveRoom(): void {
    this.socket?.emit('leave_room');
  }

  public onRoomSummary(callback: (summary: MultiplayerRoomSummary) => void): () => void {
    this.roomSummaryListeners.add(callback);
    this.socket?.on('room_summary', callback);
    return () => {
      this.roomSummaryListeners.delete(callback);
      this.socket?.off('room_summary', callback);
    };
  }

  public onRoomState(callback: (state: MultiplayerClientGameState) => void): () => void {
    this.roomStateListeners.add(callback);
    this.socket?.on('room_state', callback);
    return () => {
      this.roomStateListeners.delete(callback);
      this.socket?.off('room_state', callback);
    };
  }

  public onChatMessage(callback: (msg: ChatMessage) => void): () => void {
    this.chatListeners.add(callback);
    this.socket?.on('chat_message', callback);
    return () => {
      this.chatListeners.delete(callback);
      this.socket?.off('chat_message', callback);
    };
  }
}

export const multiplayerSocket = new MultiplayerSocketService();
