import { io, Socket } from 'socket.io-client';
import { GameMode } from '../types/domino';
import { DoubleComboMove } from '../utils/comboEngine';
import {
  MultiplayerClientGameState,
  MultiplayerRoomSummary,
  PublicRoomInfo,
  ChatMessage
} from '../types/multiplayer';

class MultiplayerSocketService {
  private socket: Socket | null = null;
  private serverUrl: string = '';

  constructor() {
    if (typeof window !== 'undefined') {
      const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env;
      if (metaEnv?.VITE_SERVER_URL) {
        this.serverUrl = metaEnv.VITE_SERVER_URL;
      } else {
        const port = window.location.port;
        const hostname = window.location.hostname || 'localhost';

        if (port === '3000') {
          // Vite dev or preview running on 3000 -> Multiplayer server is on 3001
          this.serverUrl = `http://${hostname}:3001`;
        } else if (port === '3001') {
          // Served directly by Node.js server
          this.serverUrl = window.location.origin;
        } else if (!port && (window.location.protocol === 'capacitor:' || window.location.protocol === 'file:')) {
          // Capacitor Android default fallback to local backend or host machine
          this.serverUrl = 'http://10.0.2.2:3001';
        } else {
          // Production custom domain or port
          this.serverUrl = window.location.origin;
        }
      }
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
    } else if (this.socket.disconnected) {
      this.socket.connect();
    }
    return this.socket;
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public isConnected(): boolean {
    return !!this.socket && this.socket.connected;
  }

  private emitWithTimeout<T>(event: string, data?: any, timeoutMs = 8000): Promise<T> {
    const s = this.connect();
    return new Promise((resolve, reject) => {
      let done = false;
      const timer = setTimeout(() => {
        if (!done) {
          done = true;
          reject(
            new Error(
              'Serverlə əlaqə qurulmadı (Port 3001). Zəhmət olmasa arxa plan serverinin işlədiyindən əmin olun.'
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
    isLocked?: boolean
  ): Promise<{
    success: boolean;
    roomCode?: string;
    sessionToken?: string;
    myPlayerIndex?: number;
    isHost?: boolean;
    summary?: MultiplayerRoomSummary;
    error?: string;
  }> {
    return this.emitWithTimeout('create_room', { mode, playerName, skinId, avatarId, sessionToken, isLocked });
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
    sessionToken?: string
  ): Promise<{
    success: boolean;
    roomCode?: string;
    sessionToken?: string;
    myPlayerIndex?: number;
    isHost?: boolean;
    summary?: MultiplayerRoomSummary;
    error?: string;
  }> {
    return this.emitWithTimeout('join_room', { roomCode, playerName, skinId, avatarId, sessionToken });
  }

  public quickMatch(
    mode: GameMode,
    playerName: string,
    skinId: string,
    avatarId?: string,
    sessionToken?: string
  ): Promise<{
    success: boolean;
    roomCode?: string;
    sessionToken?: string;
    myPlayerIndex?: number;
    isHost?: boolean;
    summary?: MultiplayerRoomSummary;
    error?: string;
  }> {
    return this.emitWithTimeout('quick_match', { mode, playerName, skinId, avatarId, sessionToken });
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
    const s = this.connect();
    s.on('room_summary', callback);
    return () => {
      s.off('room_summary', callback);
    };
  }

  public onRoomState(callback: (state: MultiplayerClientGameState) => void): () => void {
    const s = this.connect();
    s.on('room_state', callback);
    return () => {
      s.off('room_state', callback);
    };
  }

  public onChatMessage(callback: (msg: ChatMessage) => void): () => void {
    const s = this.connect();
    s.on('chat_message', callback);
    return () => {
      s.off('chat_message', callback);
    };
  }
}

export const multiplayerSocket = new MultiplayerSocketService();
