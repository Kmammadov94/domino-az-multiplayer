import { io, Socket } from 'socket.io-client';
import { GameMode, GameVariant } from '../types/domino';
import { DoubleComboMove } from '../utils/comboEngine';
import { getBackendServerUrl } from '../utils/storage';
import {
  MultiplayerClientGameState,
  MultiplayerRoomSummary,
  PublicRoomInfo,
  ChatMessage,
  TeahouseTierCounts
} from '../types/multiplayer';

export interface SocialProfilePayload {
  playerId: string;
  playerTag: string;
  name: string;
  handle: string;
  avatarId?: string;
  frameId?: string;
  title?: string;
  matchesWon?: number;
  isOnline?: boolean;
}

export interface FriendRequestPayload {
  id: string;
  from: SocialProfilePayload;
  createdAt: number;
}

export interface SocialSyncState {
  friends: SocialProfilePayload[];
  incomingRequests: FriendRequestPayload[];
  outgoingRequestIds: string[];
}

export interface RoomInvitePayload {
  inviteId: string;
  roomCode: string;
  mode: GameMode;
  variant: GameVariant;
  from: SocialProfilePayload;
  createdAt: number;
}

class MultiplayerSocketService {
  private socket: Socket | null = null;
  private serverUrl: string = '';
  private lastPresenceProfile: SocialProfilePayload | null = null;
  private roomSummaryListeners = new Set<(summary: MultiplayerRoomSummary) => void>();
  private roomStateListeners = new Set<(state: MultiplayerClientGameState) => void>();
  private chatListeners = new Set<(msg: ChatMessage) => void>();
  private socialSyncListeners = new Set<(state: SocialSyncState) => void>();
  private friendRequestListeners = new Set<(req: FriendRequestPayload) => void>();
  private friendAcceptedListeners = new Set<(data: { friend: SocialProfilePayload }) => void>();
  private roomInviteListeners = new Set<(invite: RoomInvitePayload) => void>();

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
      this.socialSyncListeners.forEach((cb) => this.socket?.on('social_sync', cb));
      this.friendRequestListeners.forEach((cb) => this.socket?.on('friend_request_received', cb));
      this.friendAcceptedListeners.forEach((cb) => this.socket?.on('friend_request_accepted', cb));
      this.roomInviteListeners.forEach((cb) => this.socket?.on('room_invite_received', cb));
      this.socket.on('connect', () => {
        if (this.lastPresenceProfile) {
          this.socket?.emit('register_presence', this.lastPresenceProfile);
        }
      });
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

  public getTeahouseStats(variant?: GameVariant): Promise<{
    success: boolean;
    counts?: Record<string, TeahouseTierCounts>;
    error?: string;
  }> {
    return this.emitWithTimeout('get_teahouse_stats', { variant });
  }

  public joinTeahouse(params: {
    tierId: string;
    variant: GameVariant;
    playerName: string;
    skinId: string;
    avatarId?: string;
    sessionToken?: string;
    playerId?: string;
    playerTag?: string;
    frameId?: string;
    title?: string;
    mmr?: number;
  }): Promise<{
    success: boolean;
    roomCode?: string;
    sessionToken?: string;
    myPlayerIndex?: number;
    isHost?: boolean;
    autoStarted?: boolean;
    summary?: MultiplayerRoomSummary;
    error?: string;
  }> {
    return this.emitWithTimeout('join_teahouse', params);
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

  public registerPresence(profile: SocialProfilePayload): void {
    this.lastPresenceProfile = profile;
    const s = this.connect();
    if (s.connected) {
      s.emit('register_presence', profile);
    }
  }

  public getSocialState(playerId: string): Promise<{ success: boolean } & SocialSyncState> {
    return this.emitWithTimeout('get_social_state', playerId);
  }

  public sendFriendRequest(data: {
    from: SocialProfilePayload;
    toPlayerId?: string;
    toPlayerTag?: string;
    toName?: string;
  }): Promise<{
    success: boolean;
    autoAccepted?: boolean;
    targetOnline?: boolean;
    message?: string;
    error?: string;
  }> {
    return this.emitWithTimeout('send_friend_request', data);
  }

  public respondFriendRequest(data: {
    playerId: string;
    myProfile: SocialProfilePayload;
    requestId: string;
    accept: boolean;
  }): Promise<{ success: boolean; accepted?: boolean; error?: string }> {
    return this.emitWithTimeout('respond_friend_request', data);
  }

  public removeFriendServer(
    playerId: string,
    friendPlayerId: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.emitWithTimeout('remove_friend', { playerId, friendPlayerId });
  }

  public inviteFriendToRoom(data: {
    from: SocialProfilePayload;
    targetPlayerId: string;
    targetPlayerTag?: string;
    targetName?: string;
    roomCode: string;
  }): Promise<{ success: boolean; error?: string }> {
    return this.emitWithTimeout('invite_friend_to_room', data);
  }

  public onSocialSync(callback: (state: SocialSyncState) => void): () => void {
    this.socialSyncListeners.add(callback);
    this.socket?.on('social_sync', callback);
    return () => {
      this.socialSyncListeners.delete(callback);
      this.socket?.off('social_sync', callback);
    };
  }

  public onFriendRequestReceived(callback: (req: FriendRequestPayload) => void): () => void {
    this.friendRequestListeners.add(callback);
    this.socket?.on('friend_request_received', callback);
    return () => {
      this.friendRequestListeners.delete(callback);
      this.socket?.off('friend_request_received', callback);
    };
  }

  public onFriendRequestAccepted(
    callback: (data: { friend: SocialProfilePayload }) => void
  ): () => void {
    this.friendAcceptedListeners.add(callback);
    this.socket?.on('friend_request_accepted', callback);
    return () => {
      this.friendAcceptedListeners.delete(callback);
      this.socket?.off('friend_request_accepted', callback);
    };
  }

  public onRoomInviteReceived(callback: (invite: RoomInvitePayload) => void): () => void {
    this.roomInviteListeners.add(callback);
    this.socket?.on('room_invite_received', callback);
    return () => {
      this.roomInviteListeners.delete(callback);
      this.socket?.off('room_invite_received', callback);
    };
  }
}

export const multiplayerSocket = new MultiplayerSocketService();
