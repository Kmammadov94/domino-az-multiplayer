import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import { Server, Socket } from 'socket.io';
import { GameMode, GameVariant } from '../src/types/domino';
import { DoubleComboMove } from '../src/utils/comboEngine';
import { GameRoom } from './gameRoom';
import { ChatMessage, MultiplayerRoomSummary } from '../src/types/multiplayer';
import { validatePlayerName, cleanProfanity } from '../src/utils/profanityFilter';
import {
  initStorage,
  persistSocialDatabase
} from './db';
import { createApiRouter } from './routes/api';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_ALLOWED_ORIGINS = [
  'https://domino-az-multiplayer.onrender.com',
  'https://localhost',
  'http://localhost',
  'capacitor://localhost',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:4173',
  'http://localhost:5173'
];

const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : DEFAULT_ALLOWED_ORIGINS)
);

const corsOriginCheck = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
  if (!origin || allowedOrigins.has(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) {
    callback(null, true);
  } else {
    callback(new Error(`Origin ${origin} not allowed by CORS`));
  }
};

const app = express();
app.use(cors({ origin: corsOriginCheck }));
app.use(express.json({ limit: '256kb' }));

// Serve production static assets from Vite build if available
const distPath = fs.existsSync(path.resolve(__dirname, '../dist'))
  ? path.resolve(__dirname, '../dist')
  : fs.existsSync(path.resolve(process.cwd(), 'dist'))
  ? path.resolve(process.cwd(), 'dist')
  : path.resolve(__dirname, 'dist');

app.use(express.static(distPath, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));

// User Cloud Storage (backed by Neon PostgreSQL when DATABASE_URL is set, or local JSON fallback)
let userDatabase: Record<string, any> = {};

// Persistent Two-Way Social Store (Friends & Pending Requests)
interface SocialProfile {
  playerId: string;
  playerTag: string;
  name: string;
  handle: string;
  avatarId?: string;
  frameId?: string;
  title?: string;
  matchesWon?: number;
}

interface FriendRequestRecord {
  id: string;
  from: SocialProfile;
  createdAt: number;
}

interface SocialDatabase {
  friendsByPlayerId: Record<string, SocialProfile[]>;
  requestsByTargetId: Record<string, FriendRequestRecord[]>;
}

let socialDb: SocialDatabase = { friendsByPlayerId: {}, requestsByTargetId: {} };

const saveSocialDatabase = (db: SocialDatabase): void => {
  persistSocialDatabase(db);
};

// Live Presence Tracking
const socketToPlayerId = new Map<string, string>();
const playerIdToSockets = new Map<string, Set<string>>();
const onlineProfiles = new Map<string, SocialProfile>();

const isPlayerOnline = (playerId?: string): boolean => {
  if (!playerId) return false;
  const set = playerIdToSockets.get(playerId);
  return !!set && set.size > 0;
};

const buildSocialStateForPlayer = (playerId: string) => {
  const friends = (socialDb.friendsByPlayerId[playerId] || []).map((f) => {
    const live = onlineProfiles.get(f.playerId);
    return {
      ...(live || f),
      isOnline: isPlayerOnline(f.playerId)
    };
  });
  const incomingRequests = socialDb.requestsByTargetId[playerId] || [];
  const outgoingRequestIds: string[] = [];
  for (const [targetId, reqs] of Object.entries(socialDb.requestsByTargetId)) {
    if (reqs.some((r) => r.from.playerId === playerId)) {
      outgoingRequestIds.push(targetId);
    }
  }
  return { friends, incomingRequests, outgoingRequestIds };
};

const emitToPlayer = (playerId: string, event: string, payload: any) => {
  const sockets = playerIdToSockets.get(playerId);
  if (!sockets) return;
  for (const sid of sockets) {
    io.to(sid).emit(event, payload);
  }
};

const emitSocialSync = (playerId: string) => {
  if (!isPlayerOnline(playerId)) return;
  emitToPlayer(playerId, 'social_sync', buildSocialStateForPlayer(playerId));
};

const upsertFriendRecord = (ownerId: string, friend: SocialProfile) => {
  if (!socialDb.friendsByPlayerId[ownerId]) {
    socialDb.friendsByPlayerId[ownerId] = [];
  }
  const list = socialDb.friendsByPlayerId[ownerId];
  const idx = list.findIndex(
    (f) => f.playerId === friend.playerId || (f.playerTag && friend.playerTag && f.playerTag === friend.playerTag)
  );
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...friend };
  } else {
    list.push(friend);
  }
};

const addMutualFriendship = (p1: SocialProfile, p2: SocialProfile) => {
  upsertFriendRecord(p1.playerId, p2);
  upsertFriendRecord(p2.playerId, p1);
  saveSocialDatabase(socialDb);
  emitSocialSync(p1.playerId);
  emitSocialSync(p2.playerId);
};

const findPlayerProfileByQuery = (qRaw: string): (SocialProfile & { isOnline: boolean }) | null => {
  const q = (qRaw || '').trim();
  if (!q) return null;

  // 1. Live online profiles (Home screen + Lobby + In-Game)
  for (const prof of onlineProfiles.values()) {
    const matchTag =
      prof.playerTag &&
      (q === prof.playerTag || q === `#${prof.playerTag}` || q.toUpperCase() === `DOM-${prof.playerTag}`);
    const matchId = prof.playerId && q.toLowerCase() === prof.playerId.toLowerCase();
    const matchHandle = prof.handle && prof.handle.toLowerCase() === q.toLowerCase();
    if (matchTag || matchId || matchHandle) {
      return { ...prof, isOnline: isPlayerOnline(prof.playerId) };
    }
  }

  // 2. Active rooms
  for (const room of rooms.values()) {
    for (const p of room.players) {
      if (p.isAI) continue;
      const matchTag =
        p.playerTag &&
        (q === p.playerTag || q === `#${p.playerTag}` || q.toUpperCase() === `DOM-${p.playerTag}`);
      const matchId = p.playerId && q.toLowerCase() === p.playerId.toLowerCase();
      const matchHandle = p.name && p.playerTag && `${p.name}#${p.playerTag}`.toLowerCase() === q.toLowerCase();
      if (matchTag || matchId || matchHandle) {
        const pid = p.playerId || `DOM-${p.playerTag || '0000'}`;
        return {
          name: p.name,
          playerId: pid,
          playerTag: p.playerTag || '0000',
          handle: `${p.name}#${p.playerTag || '0000'}`,
          avatarId: p.avatarId || 'avatar_baku_classic',
          frameId: p.frameId,
          title: p.title || 'Çayxana Dominocusu',
          isOnline: true
        };
      }
    }
  }

  // 3. Persistent Google user database
  for (const [googleId, userRecord] of Object.entries(userDatabase)) {
    const uProfile = (userRecord as any).profile || {};
    const uStats = (userRecord as any).stats || {};
    let hash = 0;
    for (let i = 0; i < googleId.length; i++) {
      hash = (hash << 5) - hash + googleId.charCodeAt(i);
      hash |= 0;
    }
    const tag = ((Math.abs(hash) % 9000) + 1000).toString();
    const pid = `DOM-${googleId.slice(-6).toUpperCase()}`;
    const name = uProfile.name || 'Dominocu';
    const handle = `${name}#${tag}`;

    const matchTag = q === tag || q === `#${tag}` || q.toUpperCase() === `DOM-${tag}`;
    const matchId = q.toLowerCase() === pid.toLowerCase();
    const matchHandle = q.toLowerCase() === handle.toLowerCase();
    if (matchTag || matchId || matchHandle) {
      return {
        name,
        playerId: pid,
        playerTag: tag,
        handle,
        avatarId: uStats.equippedAvatar || 'avatar_baku_classic',
        frameId: uStats.equippedFrame,
        title: uStats.equippedTitle || 'Çayxana Qonağı',
        matchesWon: uStats.matchesWon || 0,
        isOnline: isPlayerOnline(pid)
      };
    }
  }

  return null;
};

app.use(
  createApiRouter({
    getUserDatabase: () => userDatabase,
    getActiveRoomCount: () => rooms.size
  })
);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: corsOriginCheck,
    methods: ['GET', 'POST']
  },
  pingInterval: 10000,
  pingTimeout: 5000
});

const rooms: Map<string, GameRoom> = new Map();
const socketToRoom: Map<string, string> = new Map();

// 100% Random Alphanumeric Room Code Generator (e.g. 7K4X, M9P2)
const generateRoomCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code: string;
  do {
    code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } while (rooms.has(code));
  return code;
};

// Helper to get room summary
const getRoomSummary = (room: GameRoom): MultiplayerRoomSummary => ({
  code: room.code,
  mode: room.mode,
  variant: room.variant || '365',
  status: room.status,
  hostName: room.players.find((p) => p.isHost)?.name || 'Host',
  playerCount: room.players.length,
  maxPlayers: room.maxPlayers,
  players: room.players,
  isLocked: Boolean(room.isLocked),
  turnDuration: room.turnDuration || 30
});

// Broadcast personalized state to each player in room
const broadcastRoom = (room: GameRoom) => {
  const summary = getRoomSummary(room);

  // Directly emit to each player's individual socket
  room.players.forEach((p) => {
    if (!p.isAI && p.isConnected && p.socketId) {
      const clientState = room.getClientState(p.socketId);
      io.to(p.socketId).emit('room_state', clientState);
      io.to(p.socketId).emit('room_summary', summary);
    }
  });

  // Also emit room summary to room channel
  io.to(`room_${room.code}`).emit('room_summary', summary);
};

// Grace period timers for page refresh (F5) / disconnects
const roomCleanupTimers = new Map<string, NodeJS.Timeout>();

function safeAck(cb: unknown, data: any) {
  if (typeof cb === 'function') {
    try {
      cb(data);
    } catch (e) {
      console.warn('safeAck error:', e);
    }
  }
}

function getCallback(...args: any[]): ((res: any) => void) | undefined {
  for (let i = args.length - 1; i >= 0; i--) {
    if (typeof args[i] === 'function') return args[i];
  }
  return undefined;
}

io.on('connection', (socket: Socket) => {
  // 1. Create Room
  socket.on(
    'create_room',
    (data: { mode: GameMode; variant?: GameVariant; playerName: string; skinId: string; avatarId?: string; sessionToken?: string; isLocked?: boolean; turnDuration?: number; playerId?: string; playerTag?: string; frameId?: string; title?: string }, callback) => {
      try {
        const nameValidation = validatePlayerName(data.playerName || 'Oyunçu 1');
        if (!nameValidation.isValid) {
          safeAck(callback, { success: false, error: nameValidation.error || 'Nalayiq ad seçilə bilməz!' });
          return;
        }

        const roomCode = generateRoomCode();
        const sessionToken = data.sessionToken || `sess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const room = new GameRoom(
          roomCode,
          data.mode || '2p_solo',
          socket.id,
          nameValidation.sanitizedName,
          data.skinId || 'ivory_classic',
          () => broadcastRoom(room),
          data.avatarId || 'avatar_baku_classic',
          sessionToken,
          Boolean(data.isLocked),
          data.turnDuration || 30,
          data.playerId,
          data.playerTag,
          data.frameId,
          data.title,
          data.variant || '365'
        );

        rooms.set(roomCode, room);
        socketToRoom.set(socket.id, roomCode);
        socket.join(`room_${roomCode}`);

        const summary = getRoomSummary(room);
        safeAck(callback, {
          success: true,
          roomCode,
          sessionToken,
          myPlayerIndex: 0,
          isHost: true,
          summary
        });
        broadcastRoom(room);
      } catch (err: unknown) {
        safeAck(callback, { success: false, error: err instanceof Error ? err.message : String(err) });
      }
    }
  );

  // 2. Join Room
  socket.on(
    'join_room',
    (data: { roomCode: string; playerName: string; skinId: string; avatarId?: string; sessionToken?: string; playerId?: string; playerTag?: string; frameId?: string; title?: string }, callback) => {
      try {
        const nameValidation = validatePlayerName(data.playerName || 'Oyunçu');
        if (!nameValidation.isValid) {
          safeAck(callback, { success: false, error: nameValidation.error || 'Nalayiq ad seçilə bilməz!' });
          return;
        }

        const code = (data.roomCode || '').trim().toUpperCase();
        const room = rooms.get(code);

        if (!room) {
          safeAck(callback, { success: false, error: 'Otaq tapılmadı! Kodu yoxlayın.' });
          return;
        }

        const sessionToken = data.sessionToken || `sess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

        socketToRoom.set(socket.id, code);
        socket.join(`room_${code}`);

        const res = room.addPlayer(socket.id, nameValidation.sanitizedName, data.skinId, data.avatarId, sessionToken, data.playerId, data.playerTag, data.frameId, data.title);
        if (!res.success) {
          safeAck(callback, { success: false, error: res.error });
          return;
        }

        const mySlot = room.players.find((p) => p.socketId === socket.id);
        const myPlayerIndex = mySlot ? mySlot.id : room.players.length - 1;
        const summary = getRoomSummary(room);

        safeAck(callback, {
          success: true,
          roomCode: code,
          sessionToken,
          myPlayerIndex,
          isHost: false,
          summary
        });
        broadcastRoom(room);
      } catch (err: unknown) {
        safeAck(callback, { success: false, error: err instanceof Error ? err.message : String(err) });
      }
    }
  );

  // 3. Quick Match (Matchmaking)
  socket.on(
    'quick_match',
    (data: { mode: GameMode; variant?: GameVariant; playerName: string; skinId: string; avatarId?: string; sessionToken?: string; playerId?: string; playerTag?: string; frameId?: string; title?: string }, callback) => {
      try {
        const nameValidation = validatePlayerName(data.playerName || 'Oyunçu');
        if (!nameValidation.isValid) {
          safeAck(callback, { success: false, error: nameValidation.error || 'Nalayiq ad seçilə bilməz!' });
          return;
        }

        const mode = data.mode || '2p_solo';
        const variant = data.variant || '365';
        const sessionToken = data.sessionToken || `sess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

        // Find existing open waiting room with same mode & variant (must be public / unlocked)
        let targetRoom: GameRoom | null = null;
        for (const room of rooms.values()) {
          if (
            room.mode === mode &&
            (room.variant || '365') === variant &&
            room.status === 'waiting' &&
            !room.isLocked &&
            room.players.length < room.maxPlayers
          ) {
            targetRoom = room;
            break;
          }
        }

        if (targetRoom) {
          socketToRoom.set(socket.id, targetRoom.code);
          socket.join(`room_${targetRoom.code}`);

          targetRoom.addPlayer(socket.id, nameValidation.sanitizedName, data.skinId, data.avatarId, sessionToken, data.playerId, data.playerTag, data.frameId, data.title);
          const mySlot = targetRoom.players.find((p) => p.socketId === socket.id);
          const myPlayerIndex = mySlot ? mySlot.id : targetRoom.players.length - 1;
          const summary = getRoomSummary(targetRoom);

          safeAck(callback, {
            success: true,
            roomCode: targetRoom.code,
            sessionToken,
            myPlayerIndex,
            isHost: false,
            summary
          });
          broadcastRoom(targetRoom);
        } else {
          // Create new public waiting room
          const roomCode = generateRoomCode();
          const room = new GameRoom(
            roomCode,
            mode,
            socket.id,
            nameValidation.sanitizedName,
            data.skinId || 'ivory_classic',
            () => broadcastRoom(room),
            data.avatarId || 'avatar_baku_classic',
            sessionToken,
            false,
            30,
            data.playerId,
            data.playerTag,
            data.frameId,
            data.title,
            variant
          );

          rooms.set(roomCode, room);
          socketToRoom.set(socket.id, roomCode);
          socket.join(`room_${roomCode}`);

          const summary = getRoomSummary(room);
          safeAck(callback, {
            success: true,
            roomCode,
            sessionToken,
            myPlayerIndex: 0,
            isHost: true,
            summary
          });
          broadcastRoom(room);
        }
      } catch (err: unknown) {
        safeAck(callback, { success: false, error: err instanceof Error ? err.message : String(err) });
      }
    }
  );

  // 3.1 Lookup Player by Tag, ID, or Handle
  socket.on('lookup_player', (query: string, callback) => {
    try {
      const q = (query || '').trim();
      if (!q) {
        safeAck(callback, { success: false, error: 'Axtarış üçün kod və ya taq daxil edin.' });
        return;
      }

      const found = findPlayerProfileByQuery(q);
      if (found) {
        safeAck(callback, { success: true, player: found });
        return;
      }

      safeAck(callback, { success: false, error: 'Bu kod və ya taqa uyğun oyunçu tapılmadı.' });
    } catch (e: any) {
      safeAck(callback, { success: false, error: e.message });
    }
  });

  // 3.2 Register Live Presence & Push Two-Way Social State
  socket.on('register_presence', (profile: SocialProfile) => {
    try {
      if (!profile?.playerId) return;
      const prevId = socketToPlayerId.get(socket.id);
      if (prevId && prevId !== profile.playerId) {
        playerIdToSockets.get(prevId)?.delete(socket.id);
      }

      socketToPlayerId.set(socket.id, profile.playerId);
      if (!playerIdToSockets.has(profile.playerId)) {
        playerIdToSockets.set(profile.playerId, new Set());
      }
      playerIdToSockets.get(profile.playerId)!.add(socket.id);

      const normalized: SocialProfile = {
        playerId: profile.playerId,
        playerTag: profile.playerTag || '0000',
        name: profile.name || 'Oyunçu',
        handle: profile.handle || `${profile.name || 'Oyunçu'}#${profile.playerTag || '0000'}`,
        avatarId: profile.avatarId,
        frameId: profile.frameId,
        title: profile.title,
        matchesWon: profile.matchesWon
      };
      onlineProfiles.set(profile.playerId, normalized);

      emitSocialSync(profile.playerId);

      // Update online status on friends' lists
      const myFriends = socialDb.friendsByPlayerId[profile.playerId] || [];
      for (const f of myFriends) {
        upsertFriendRecord(f.playerId, normalized);
        emitSocialSync(f.playerId);
      }
    } catch (e) {
      console.error('register_presence error:', e);
    }
  });

  // 3.3 Get Social State (Friends + Pending Requests)
  socket.on('get_social_state', (playerId: string, callback) => {
    if (!playerId) {
      safeAck(callback, { success: false, friends: [], incomingRequests: [], outgoingRequestIds: [] });
      return;
    }
    safeAck(callback, { success: true, ...buildSocialStateForPlayer(playerId) });
  });

  // 3.4 Send Two-Way Friend Request
  socket.on(
    'send_friend_request',
    (data: { from: SocialProfile; toPlayerId?: string; toPlayerTag?: string; toName?: string }, callback) => {
      try {
        const from = data?.from;
        if (!from?.playerId) {
          safeAck(callback, { success: false, error: 'Profil məlumatı tapılmadı.' });
          return;
        }

        // Resolve canonical target profile
        const resolved =
          (data.toPlayerId ? findPlayerProfileByQuery(data.toPlayerId) : null) ||
          (data.toPlayerTag ? findPlayerProfileByQuery(data.toPlayerTag) : null);

        const targetId = resolved?.playerId || data.toPlayerId || (data.toPlayerTag ? `DOM-${data.toPlayerTag}` : '');
        if (!targetId) {
          safeAck(callback, { success: false, error: 'Hədəf oyunçu tapılmadı.' });
          return;
        }
        if (targetId === from.playerId) {
          safeAck(callback, { success: false, error: 'Özünüzə dostluq sorğusu göndərə bilməzsiniz.' });
          return;
        }

        const existingFriends = socialDb.friendsByPlayerId[from.playerId] || [];
        if (existingFriends.some((f) => f.playerId === targetId)) {
          safeAck(callback, { success: false, error: 'Bu oyunçu artıq dost siyahınızdadır.' });
          return;
        }

        // If target already sent us a request, auto-accept both sides!
        const myIncoming = socialDb.requestsByTargetId[from.playerId] || [];
        const reverseIdx = myIncoming.findIndex((r) => r.from.playerId === targetId);
        if (reverseIdx >= 0) {
          const [reverseReq] = myIncoming.splice(reverseIdx, 1);
          socialDb.requestsByTargetId[from.playerId] = myIncoming;
          addMutualFriendship(from, reverseReq.from);
          emitToPlayer(targetId, 'friend_request_accepted', { friend: from });
          safeAck(callback, {
            success: true,
            autoAccepted: true,
            message: `${reverseReq.from.name} ilə qarşılıqlı dost oldunuz! 🎉`
          });
          return;
        }

        if (!socialDb.requestsByTargetId[targetId]) {
          socialDb.requestsByTargetId[targetId] = [];
        }
        const targetReqs = socialDb.requestsByTargetId[targetId];
        const existingIdx = targetReqs.findIndex((r) => r.from.playerId === from.playerId);
        const reqRecord: FriendRequestRecord = {
          id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          from,
          createdAt: Date.now()
        };
        if (existingIdx >= 0) {
          targetReqs[existingIdx] = reqRecord;
        } else {
          targetReqs.push(reqRecord);
        }

        saveSocialDatabase(socialDb);
        emitSocialSync(from.playerId);
        emitSocialSync(targetId);
        emitToPlayer(targetId, 'friend_request_received', reqRecord);

        const targetName = resolved?.name || data.toName || 'Oyunçu';
        safeAck(callback, {
          success: true,
          targetOnline: isPlayerOnline(targetId),
          message: `${targetName} adlı oyunçuya dostluq sorğusu göndərildi! 📩`
        });
      } catch (e: any) {
        safeAck(callback, { success: false, error: e?.message || 'Sorğu göndərilə bilmədi.' });
      }
    }
  );

  // 3.5 Respond to Incoming Friend Request (Accept / Decline)
  socket.on(
    'respond_friend_request',
    (data: { playerId: string; myProfile: SocialProfile; requestId: string; accept: boolean }, callback) => {
      try {
        const { playerId, myProfile, requestId, accept } = data || {};
        const reqs = socialDb.requestsByTargetId[playerId] || [];
        const idx = reqs.findIndex((r) => r.id === requestId);
        if (idx < 0) {
          safeAck(callback, { success: false, error: 'Sorğu artıq mövcud deyil.' });
          return;
        }
        const [req] = reqs.splice(idx, 1);
        socialDb.requestsByTargetId[playerId] = reqs;

        if (accept) {
          addMutualFriendship(myProfile, req.from);
          emitToPlayer(req.from.playerId, 'friend_request_accepted', { friend: myProfile });
        } else {
          saveSocialDatabase(socialDb);
          emitSocialSync(playerId);
          emitSocialSync(req.from.playerId);
        }

        safeAck(callback, { success: true, accepted: accept });
      } catch (e: any) {
        safeAck(callback, { success: false, error: e?.message });
      }
    }
  );

  // 3.6 Remove Friend (Two-Way)
  socket.on('remove_friend', (data: { playerId: string; friendPlayerId: string }, callback) => {
    try {
      const { playerId, friendPlayerId } = data || {};
      if (playerId && friendPlayerId) {
        if (socialDb.friendsByPlayerId[playerId]) {
          socialDb.friendsByPlayerId[playerId] = socialDb.friendsByPlayerId[playerId].filter(
            (f) => f.playerId !== friendPlayerId
          );
        }
        if (socialDb.friendsByPlayerId[friendPlayerId]) {
          socialDb.friendsByPlayerId[friendPlayerId] = socialDb.friendsByPlayerId[friendPlayerId].filter(
            (f) => f.playerId !== playerId
          );
        }
        saveSocialDatabase(socialDb);
        emitSocialSync(playerId);
        emitSocialSync(friendPlayerId);
      }
      safeAck(callback, { success: true });
    } catch (e: any) {
      safeAck(callback, { success: false, error: e?.message });
    }
  });

  // 3.7 Invite Friend to Active Waiting Room
  socket.on(
    'invite_friend_to_room',
    (
      data: { from: SocialProfile; targetPlayerId: string; targetPlayerTag?: string; roomCode: string },
      callback
    ) => {
      try {
        const room = rooms.get((data.roomCode || '').toUpperCase());
        if (!room) {
          safeAck(callback, { success: false, error: 'Otaq tapılmadı.' });
          return;
        }
        if (room.status !== 'waiting') {
          safeAck(callback, { success: false, error: 'Oyun artıq başlayıb.' });
          return;
        }

        let targetId = data.targetPlayerId;
        if (!isPlayerOnline(targetId) && data.targetPlayerTag) {
          const resolved = findPlayerProfileByQuery(data.targetPlayerTag);
          if (resolved && isPlayerOnline(resolved.playerId)) {
            targetId = resolved.playerId;
          }
        }

        if (!isPlayerOnline(targetId)) {
          safeAck(callback, {
            success: false,
            error: `Dostunuz hazırda onlayn deyil. Otaq kodunu paylaşa bilərsiniz: ${room.code}`
          });
          return;
        }

        emitToPlayer(targetId, 'room_invite_received', {
          inviteId: `inv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          roomCode: room.code,
          mode: room.mode,
          variant: room.variant,
          from: data.from,
          createdAt: Date.now()
        });

        safeAck(callback, { success: true });
      } catch (e: any) {
        safeAck(callback, { success: false, error: e?.message || 'Dəvət göndərilə bilmədi.' });
      }
    }
  );

  // 3.5 Reconnect to Room after F5 / Refresh
  socket.on(
    'reconnect_room',
    (data: { roomCode: string; sessionToken: string }, callback) => {
      try {
        const code = (data.roomCode || '').trim().toUpperCase();
        const room = rooms.get(code);
        if (!room) {
          safeAck(callback, { success: false, error: 'Otaq tapılmadı və ya bağlanıb.' });
          return;
        }

        const res = room.reconnectPlayer(socket.id, data.sessionToken);
        if (!res.success) {
          safeAck(callback, { success: false, error: res.error });
          return;
        }

        socketToRoom.set(socket.id, code);
        socket.join(`room_${code}`);

        // Cancel pending room destruction timer if running
        const cleanupTimer = roomCleanupTimers.get(code);
        if (cleanupTimer) {
          clearTimeout(cleanupTimer);
          roomCleanupTimers.delete(code);
        }

        const mySlot = room.players.find((p) => p.socketId === socket.id);
        const myPlayerIndex = res.playerIndex ?? (mySlot ? mySlot.id : 0);
        const isHost = mySlot?.isHost ?? false;
        const summary = getRoomSummary(room);
        const gameState = room.status === 'in_game' ? room.getClientState(socket.id) : null;

        safeAck(callback, {
          success: true,
          roomCode: code,
          sessionToken: data.sessionToken,
          myPlayerIndex,
          isHost,
          summary,
          gameState
        });

        broadcastRoom(room);
      } catch (err: unknown) {
        safeAck(callback, { success: false, error: err instanceof Error ? err.message : String(err) });
      }
    }
  );

  // 3.6 Get List of Waiting Public & Private Rooms (Durak Online style table browser)
  socket.on('get_public_rooms', (callback) => {
    try {
      const roomList = Array.from(rooms.values())
        .filter((r) => r.status === 'waiting' && r.players.length < r.maxPlayers)
        .map((r) => {
          const hostP = r.players.find((p) => p.isHost) || r.players[0];
          return {
            code: r.code,
            mode: r.mode,
            variant: r.variant || '365',
            hostName: hostP?.name || 'Oyunçu',
            hostAvatar: hostP?.avatarId || 'avatar_tea_master',
            playerCount: r.players.length,
            maxPlayers: r.maxPlayers,
            isLocked: Boolean(r.isLocked),
            turnDuration: r.turnDuration || 30
          };
        });

      safeAck(callback, { success: true, rooms: roomList });
    } catch (err: unknown) {
      safeAck(callback, { success: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  // 3.7 Toggle Room Lock (Public vs Private)
  socket.on('toggle_room_lock', (data: { roomCode?: string }, callback) => {
    try {
      const code = (data?.roomCode || socketToRoom.get(socket.id) || '').trim().toUpperCase();
      const room = rooms.get(code);
      if (!room) {
        safeAck(callback, { success: false, error: 'Otaq tapılmadı' });
        return;
      }
      const player = room.players.find((p) => p.socketId === socket.id);
      if (!player || !player.isHost) {
        safeAck(callback, { success: false, error: 'Yalnız otaq sahibi masanı kilidləyə bilər' });
        return;
      }
      room.isLocked = !room.isLocked;
      broadcastRoom(room);
      safeAck(callback, { success: true, isLocked: room.isLocked });
    } catch (err: unknown) {
      safeAck(callback, { success: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  // 4. Set Ready
  socket.on('set_ready', (data: { isReady: boolean }) => {
    const code = socketToRoom.get(socket.id);
    if (!code) return;
    const room = rooms.get(code);
    if (!room) return;
    room.setPlayerReady(socket.id, data.isReady);
  });

  // 5. Add Bot to Room
  socket.on('add_bot', (...args: any[]) => {
    const callback = getCallback(...args);
    const code = socketToRoom.get(socket.id);
    if (!code) return safeAck(callback, { success: false, error: 'Otaq tapılmadı' });
    const room = rooms.get(code);
    if (!room) return safeAck(callback, { success: false, error: 'Otaq tapılmadı' });
    const res = room.addBot();
    safeAck(callback, res);
  });

  // 6. Start Match
  socket.on('start_game', (...args: any[]) => {
    const callback = getCallback(...args);
    const data = args.find((a) => a && typeof a === 'object' && typeof a !== 'function') as
      | { roomCode?: string; sessionToken?: string }
      | undefined;

    let code = socketToRoom.get(socket.id);
    if (!code && data?.roomCode) {
      code = (data.roomCode || '').trim().toUpperCase();
    }
    if (!code) {
      for (const [rCode, r] of rooms.entries()) {
        if (
          r.players.some(
            (p) =>
              p.socketId === socket.id ||
              (data?.sessionToken && p.sessionToken === data.sessionToken)
          )
        ) {
          code = rCode;
          socketToRoom.set(socket.id, code);
          break;
        }
      }
    }

    if (!code) return safeAck(callback, { success: false, error: 'Otaq tapılmadı' });
    const room = rooms.get(code);
    if (!room) return safeAck(callback, { success: false, error: 'Otaq tapılmadı' });

    const res = room.startMatch(socket.id, data?.sessionToken);
    safeAck(callback, res);
    if (res.success) {
      broadcastRoom(room);
    }
  });

  // 7. Execute Tile Move
  socket.on('play_tile', (data: { tileId: string; branchId: string }, callback) => {
    const code = socketToRoom.get(socket.id);
    if (!code) return;
    const room = rooms.get(code);
    if (!room) return;
    const res = room.executeMove(socket.id, data.tileId, data.branchId as any);
    safeAck(callback, res);
  });

  // 8. Execute Double Combo Move
  socket.on('play_combo', (data: { combo: DoubleComboMove }, callback) => {
    const code = socketToRoom.get(socket.id);
    if (!code) return;
    const room = rooms.get(code);
    if (!room) return;
    const res = room.executeCombo(socket.id, data.combo);
    safeAck(callback, res);
  });

  // 9. Draw from Bazaar
  socket.on('draw_bazaar', (...args: any[]) => {
    const callback = getCallback(...args);
    const code = socketToRoom.get(socket.id);
    if (!code) return safeAck(callback, { success: false, error: 'Otaq tapılmadı' });
    const room = rooms.get(code);
    if (!room) return safeAck(callback, { success: false, error: 'Otaq tapılmadı' });
    const res = room.drawBazaar(socket.id);
    safeAck(callback, res);
  });

  // 10. Pass Turn
  socket.on('pass_turn', (...args: any[]) => {
    const callback = getCallback(...args);
    const code = socketToRoom.get(socket.id);
    if (!code) return safeAck(callback, { success: false, error: 'Otaq tapılmadı' });
    const room = rooms.get(code);
    if (!room) return safeAck(callback, { success: false, error: 'Otaq tapılmadı' });
    const res = room.passTurn(socket.id);
    safeAck(callback, res);
  });

  // 11. Next Hand / Restart Match
  socket.on('next_hand', (...args: any[]) => {
    const callback = getCallback(...args);
    const code = socketToRoom.get(socket.id);
    if (!code) return safeAck(callback, { success: false, error: 'Otaq tapılmadı' });
    const room = rooms.get(code);
    if (!room) return safeAck(callback, { success: false, error: 'Otaq tapılmadı' });
    const res = room.nextHand(socket.id);
    safeAck(callback, res);
  });

  // 12. Send Chat / Teahouse Phrase
  socket.on('send_chat', (data: { text?: string; emoji?: string }) => {
    const code = socketToRoom.get(socket.id);
    if (!code) return;
    const room = rooms.get(code);
    if (!room) return;

    const player = room.players.find((p) => p.socketId === socket.id);
    const sanitizedText = data.text ? cleanProfanity(data.text) : undefined;
    const msg: ChatMessage = {
      id: `chat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      senderName: player?.name || 'Oyunçu',
      senderIndex: player?.id ?? 0,
      text: sanitizedText,
      emoji: data.emoji,
      timestamp: Date.now()
    };

    io.to(`room_${code}`).emit('chat_message', msg);
  });

  // 13. Explicit Leave Room
  socket.on('leave_room', () => {
    const code = socketToRoom.get(socket.id);
    if (!code) return;
    socketToRoom.delete(socket.id);
    socket.leave(`room_${code}`);

    const room = rooms.get(code);
    if (!room) return;

    room.removePlayer(socket.id);
    broadcastRoom(room);

    const realPlayers = room.players.filter((p) => !p.isAI && p.isConnected);
    if (realPlayers.length === 0) {
      room.destroy();
      rooms.delete(code);
      const timer = roomCleanupTimers.get(code);
      if (timer) {
        clearTimeout(timer);
        roomCleanupTimers.delete(code);
      }
    }
  });

  // 14. Disconnect / F5 Page Reload with 45s Grace Period
  socket.on('disconnect', () => {
    // Clean up social live presence
    const pId = socketToPlayerId.get(socket.id);
    if (pId) {
      socketToPlayerId.delete(socket.id);
      const set = playerIdToSockets.get(pId);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) {
          playerIdToSockets.delete(pId);
          const friends = socialDb.friendsByPlayerId[pId] || [];
          for (const f of friends) {
            emitSocialSync(f.playerId);
          }
        }
      }
    }

    const code = socketToRoom.get(socket.id);
    if (!code) return;
    socketToRoom.delete(socket.id);

    const room = rooms.get(code);
    if (!room) return;

    // Gracefully mark as disconnected without immediately destroying room
    room.markPlayerDisconnected(socket.id);
    broadcastRoom(room);

    // If NO real players are currently connected, start 45-second room cleanup timer
    const anyConnected = room.players.some((p) => !p.isAI && p.isConnected);
    if (!anyConnected) {
      if (roomCleanupTimers.has(code)) {
        clearTimeout(roomCleanupTimers.get(code)!);
      }

      const timer = setTimeout(() => {
        const activeRoom = rooms.get(code);
        if (activeRoom) {
          const stillHasReal = activeRoom.players.some((p) => !p.isAI && p.isConnected);
          if (!stillHasReal) {
            activeRoom.destroy();
            rooms.delete(code);
          }
        }
        roomCleanupTimers.delete(code);
      }, 45000);

      roomCleanupTimers.set(code, timer);
    }
  });
});

// Single SPA fallback for all other routes
app.use((_req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('Domino PRO API & Realtime Server Running');
    }
  });
});

const PORT = process.env.PORT || 3001;
initStorage()
  .then(({ users, social }) => {
    userDatabase = users;
    socialDb = social;
    server.listen(PORT, () => {
      console.log(`Domino PRO Realtime Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize storage:', err);
    server.listen(PORT, () => {
      console.log(`Domino PRO Realtime Server running on port ${PORT} (fallback mode)`);
    });
  });
