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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

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

// Health check endpoint for zero-downtime hosting pings (Render / Koyeb / Railway)
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    game: 'Domino PRO (Telefon 365)',
    activeRooms: rooms.size,
    timestamp: Date.now()
  });
});

// User Cloud Storage File Persistence
const USERS_FILE = path.resolve(process.cwd(), 'data/users.json');

const loadUserDatabase = (): Record<string, any> => {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load user database:', e);
  }
  return {};
};

const saveUserDatabase = (db: Record<string, any>): void => {
  try {
    const dir = path.dirname(USERS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(USERS_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save user database:', e);
  }
};

let userDatabase = loadUserDatabase();

// Sync user stats endpoint
app.post('/api/user-stats', (req, res) => {
  const { googleId, email, name, picture, stats, isInitialLogin } = req.body || {};
  if (!googleId) {
    return res.status(400).json({ error: 'googleId is required' });
  }

  const existing = userDatabase[googleId] || {};
  const existingStats = existing.stats || {};

  // Handle coins: on initial sign-in, preserve whichever balance is higher (cloud vs local)
  // so a player never loses their cloud coins when switching to a new device or re-logging in.
  // During normal gameplay, sync the current balance directly.
  let finalCoins: number;
  if (typeof stats?.coins === 'number') {
    if (isInitialLogin) {
      finalCoins = Math.max(existingStats.coins || 0, stats.coins);
    } else {
      finalCoins = stats.coins;
    }
  } else {
    finalCoins = existingStats.coins ?? 20;
  }

  // Cosmetics merging with default-fallback protection:
  // If local client has default 'ivory_classic' (e.g. fresh install or not selected), prefer existing cloud equipped skin!
  const resolvedEquippedSkin =
    (stats?.equippedSkin && stats.equippedSkin !== 'ivory_classic')
      ? stats.equippedSkin
      : (existingStats.equippedSkin || stats?.equippedSkin || 'ivory_classic');

  const resolvedEquippedAvatar =
    (stats?.equippedAvatar && stats.equippedAvatar !== 'avatar_baku_classic')
      ? stats.equippedAvatar
      : (existingStats.equippedAvatar || stats?.equippedAvatar || 'avatar_baku_classic');

  const resolvedEquippedFrame =
    (stats?.equippedFrame && stats.equippedFrame !== 'frame_none')
      ? stats.equippedFrame
      : (existingStats.equippedFrame || stats?.equippedFrame || 'frame_none');

  const resolvedEquippedTitle =
    (stats?.equippedTitle && stats.equippedTitle !== 'title_tea_elder')
      ? stats.equippedTitle
      : (existingStats.equippedTitle || stats?.equippedTitle || 'title_tea_elder');

  const resolvedEquippedTable =
    (stats?.equippedTableTheme && stats.equippedTableTheme !== 'table_emerald_classic')
      ? stats.equippedTableTheme
      : (existingStats.equippedTableTheme || stats?.equippedTableTheme || 'table_emerald_classic');

  const mergedUnlockedSkins = Array.from(
    new Set([
      'ivory_classic',
      ...(existingStats.unlockedSkins || []),
      ...(stats?.unlockedSkins || [])
    ])
  );

  const mergedUnlockedAvatars = Array.from(
    new Set([
      ...(existingStats.unlockedAvatars || []),
      ...(stats?.unlockedAvatars || [])
    ])
  );

  const mergedUnlockedFrames = Array.from(
    new Set([
      'frame_none',
      ...(existingStats.unlockedFrames || []),
      ...(stats?.unlockedFrames || [])
    ])
  );

  const mergedUnlockedTitles = Array.from(
    new Set([
      'title_tea_elder',
      ...(existingStats.unlockedTitles || []),
      ...(stats?.unlockedTitles || [])
    ])
  );

  // Merge stats intelligently (union of unlocked cosmetics, max streak, etc.)
  const mergedStats = {
    coins: finalCoins,
    equippedSkin: mergedUnlockedSkins.includes(resolvedEquippedSkin) ? resolvedEquippedSkin : 'ivory_classic',
    unlockedSkins: mergedUnlockedSkins,
    equippedAvatar: resolvedEquippedAvatar,
    unlockedAvatars: mergedUnlockedAvatars,
    equippedFrame: resolvedEquippedFrame,
    unlockedFrames: mergedUnlockedFrames,
    equippedTitle: resolvedEquippedTitle,
    unlockedTitles: mergedUnlockedTitles,
    equippedTableTheme: resolvedEquippedTable,
    dailyStreak: Math.max(existingStats.dailyStreak || 0, stats?.dailyStreak || 0),
    matchesPlayed: Math.max(existingStats.matchesPlayed || 0, stats?.matchesPlayed || 0),
    matchesWon: Math.max(existingStats.matchesWon || 0, stats?.matchesWon || 0),
    lastDailyClaim: stats?.lastDailyClaim || existingStats.lastDailyClaim
  };

  userDatabase[googleId] = {
    profile: {
      googleId,
      email: email || existing.profile?.email || '',
      name: name || existing.profile?.name || '',
      picture: picture || existing.profile?.picture || ''
    },
    stats: mergedStats,
    claimedGrants: existing.claimedGrants || [],
    updatedAt: Date.now()
  };

  saveUserDatabase(userDatabase);

  res.json({
    success: true,
    profile: userDatabase[googleId].profile,
    stats: mergedStats
  });
});

// Admin endpoint to inspect registered users
app.get('/api/admin/users', (req, res) => {
  const adminKey = (req.query.adminKey as string) || (req.headers['x-admin-key'] as string);
  const secret = process.env.ADMIN_SECRET || 'domino-az-secret-admin-2026';
  if (adminKey !== secret) {
    return res.status(403).json({ error: 'Unauthorized. Provide valid adminKey.' });
  }

  const users = Object.entries(userDatabase).map(([id, rec]: [string, any]) => ({
    googleId: id,
    email: rec.profile?.email || '',
    name: rec.profile?.name || '',
    picture: rec.profile?.picture || '',
    coins: rec.stats?.coins ?? 0,
    equippedSkin: rec.stats?.equippedSkin || 'ivory_classic',
    unlockedSkins: rec.stats?.unlockedSkins || [],
    matchesPlayed: rec.stats?.matchesPlayed ?? 0,
    matchesWon: rec.stats?.matchesWon ?? 0,
    updatedAt: rec.updatedAt ? new Date(rec.updatedAt).toISOString() : null
  }));

  res.json({
    totalUsers: users.length,
    users
  });
});

// Temporary store for Mobile APK Google Auth Handshake Sessions (expires after 5 minutes)
const apkAuthSessions = new Map<string, { user: any; createdAt: number }>();

app.post('/api/apk-auth/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const { user } = req.body || {};
  if (!sessionId || !user || !user.googleId) {
    return res.status(400).json({ error: 'Invalid session or user payload' });
  }
  apkAuthSessions.set(sessionId, { user, createdAt: Date.now() });
  // Cleanup expired sessions older than 5 minutes
  const now = Date.now();
  for (const [k, v] of apkAuthSessions.entries()) {
    if (now - v.createdAt > 5 * 60 * 1000) {
      apkAuthSessions.delete(k);
    }
  }
  res.json({ success: true });
});

app.get('/api/apk-auth/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const record = apkAuthSessions.get(sessionId);
  if (!record) {
    return res.json({ authenticated: false });
  }
  // Keep record available for polling (do not delete on first read so repeated polls or retry deep-links succeed)
  res.json({ authenticated: true, user: record.user });
});

// Fetch user stats endpoint
app.get('/api/user-stats/:googleId', (req, res) => {
  const { googleId } = req.params;
  const user = userDatabase[googleId];
  if (!user) {
    return res.status(404).json({ error: 'User not found in cloud' });
  }
  res.json({
    success: true,
    profile: user.profile,
    stats: user.stats
  });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
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
  let code = '';
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

      // Check online players in active rooms
      for (const room of rooms.values()) {
        for (const p of room.players) {
          if (p.isAI) continue;
          const matchTag = p.playerTag && (q === p.playerTag || q === `#${p.playerTag}` || q.toUpperCase() === `DOM-${p.playerTag}`);
          const matchId = p.playerId && q.toLowerCase() === p.playerId.toLowerCase();
          const matchHandle = p.name && p.playerTag && `${p.name}#${p.playerTag}`.toLowerCase() === q.toLowerCase();

          if (matchTag || matchId || matchHandle) {
            safeAck(callback, {
              success: true,
              player: {
                name: p.name,
                playerId: p.playerId || `DOM-${p.playerTag || '0000'}`,
                playerTag: p.playerTag || '0000',
                handle: `${p.name}#${p.playerTag || '0000'}`,
                avatarId: p.avatarId || 'avatar_baku_classic',
                frameId: p.frameId,
                title: p.title || 'Çayxana Dominocusu',
                isOnline: true
              }
            });
            return;
          }
        }
      }

      // Check user database
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
        const handle = `${uProfile.name}#${tag}`;

        const matchTag = q === tag || q === `#${tag}` || q.toUpperCase() === `DOM-${tag}`;
        const matchId = q.toLowerCase() === pid.toLowerCase();
        const matchHandle = q.toLowerCase() === handle.toLowerCase();

        if (matchTag || matchId || matchHandle) {
          safeAck(callback, {
            success: true,
            player: {
              name: uProfile.name || 'Dominocu',
              playerId: pid,
              playerTag: tag,
              handle,
              avatarId: uStats.equippedAvatar || 'avatar_baku_classic',
              frameId: uStats.equippedFrame,
              title: uStats.equippedTitle || 'Çayxana Qonağı',
              matchesWon: uStats.matchesWon || 0,
              isOnline: false
            }
          });
          return;
        }
      }

      safeAck(callback, { success: false, error: 'Bu kod və ya taqa uyğun oyunçu tapılmadı.' });
    } catch (e: any) {
      safeAck(callback, { success: false, error: e.message });
    }
  });

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
server.listen(PORT, () => {
  console.log(`Domino PRO Realtime Server running on port ${PORT}`);
});
