import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import { Server, Socket } from 'socket.io';
import { GameMode } from '../src/types/domino';
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

app.use(express.static(distPath));

// Health check endpoint for zero-downtime hosting pings (Render / Koyeb / Railway)
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    game: 'Domino PRO (Telefon 365)',
    activeRooms: rooms.size,
    timestamp: Date.now()
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
  status: room.status,
  hostName: room.players.find((p) => p.isHost)?.name || 'Host',
  playerCount: room.players.length,
  maxPlayers: room.maxPlayers,
  players: room.players
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
    (data: { mode: GameMode; playerName: string; skinId: string; avatarId?: string; sessionToken?: string }, callback) => {
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
          sessionToken
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
    (data: { roomCode: string; playerName: string; skinId: string; avatarId?: string; sessionToken?: string }, callback) => {
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

        const res = room.addPlayer(socket.id, nameValidation.sanitizedName, data.skinId, data.avatarId, sessionToken);
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
    (data: { mode: GameMode; playerName: string; skinId: string; avatarId?: string; sessionToken?: string }, callback) => {
      try {
        const nameValidation = validatePlayerName(data.playerName || 'Oyunçu');
        if (!nameValidation.isValid) {
          safeAck(callback, { success: false, error: nameValidation.error || 'Nalayiq ad seçilə bilməz!' });
          return;
        }

        const mode = data.mode || '2p_solo';
        const sessionToken = data.sessionToken || `sess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

        // Find existing open waiting room with same mode
        let targetRoom: GameRoom | null = null;
        for (const room of rooms.values()) {
          if (
            room.mode === mode &&
            room.status === 'waiting' &&
            room.players.length < room.maxPlayers
          ) {
            targetRoom = room;
            break;
          }
        }

        if (targetRoom) {
          socketToRoom.set(socket.id, targetRoom.code);
          socket.join(`room_${targetRoom.code}`);

          targetRoom.addPlayer(socket.id, nameValidation.sanitizedName, data.skinId, data.avatarId, sessionToken);
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
            sessionToken
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
