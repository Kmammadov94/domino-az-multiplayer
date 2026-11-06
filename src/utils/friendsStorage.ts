export interface FriendItem {
  id: string; // unique record identifier in friends list
  playerId: string; // permanent unique player ID (e.g. "DOM-839214")
  playerTag: string; // 4-digit unique tag (e.g. "8392")
  name: string; // display name (e.g. "Murad")
  handle: string; // full handle (e.g. "Murad#8392")
  avatarId?: string;
  frameId?: string;
  title?: string;
  note?: string; // optional personal note (e.g. "Qonşu", "İş yoldaşı")
  matchesWon?: number;
  addedAt: string;
  isOnline?: boolean;
  isRealPlayer?: boolean;
}

export interface RecentPlayerItem {
  playerId?: string;
  playerTag?: string;
  name: string;
  handle?: string;
  avatarId?: string;
  frameId?: string;
  title?: string;
  date: string;
  isRealPlayer?: boolean;
}

const FRIENDS_KEY = 'domino_friends';
const RECENT_KEY = 'domino_recent_players';

const BOT_KEYWORDS = [
  'süni intellekt',
  'intellekt',
  'partnyor',
  'партнёр',
  'искусственный',
  'партнер',
  '(ai)',
  ' ai',
  'ai ',
  '(bot',
  'bot',
  'robot',
  'rəqib ai',
  'соперник ии',
  'opponent ai'
];

const BOT_EXACT_PERSONAS = new Set([
  'məhəmməd', 'mahammad', 'магомед',
  'pənah', 'panah', 'панах',
  'şöhrət', 'shohrat', 'шохрат',
  'eldar', 'эльдар',
  'rəşad', 'rashad', 'рашад',
  'tofiq', 'тофик',
  'bot', 'ai'
]);

/**
 * Checks whether a given player name corresponds to an AI bot / computer opponent
 */
export const isBotName = (name: string): boolean => {
  if (!name || typeof name !== 'string') return true;
  const lower = name.trim().toLowerCase();
  if (!lower) return true;

  for (const kw of BOT_KEYWORDS) {
    if (lower.includes(kw)) return true;
  }

  if (BOT_EXACT_PERSONAS.has(lower)) return true;

  return false;
};

/**
 * Helper to generate a deterministic 4-digit tag for legacy friends without tags
 */
const synthesizeTag = (seed: string): string => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return ((Math.abs(hash) % 9000) + 1000).toString();
};

export const loadFriends = (): FriendItem[] => {
  try {
    const raw = localStorage.getItem(FRIENDS_KEY);
    if (!raw) return [];
    const parsed: FriendItem[] = JSON.parse(raw);
    
    // Purge any bot that was mistakenly saved & migrate legacy items missing tags
    let changed = false;
    const filtered: FriendItem[] = [];

    for (const f of parsed) {
      if (!f || !f.name || isBotName(f.name)) {
        changed = true;
        continue;
      }

      // Migration for older friend records missing tags / IDs
      const tag = f.playerTag || synthesizeTag(f.id || f.name);
      const pid = f.playerId || `DOM-${tag}`;
      const handle = f.handle || `${f.name}#${tag}`;

      if (f.playerTag !== tag || f.playerId !== pid || f.handle !== handle) {
        changed = true;
      }

      filtered.push({
        ...f,
        playerId: pid,
        playerTag: tag,
        handle,
        isRealPlayer: true
      });
    }

    if (changed) {
      localStorage.setItem(FRIENDS_KEY, JSON.stringify(filtered));
    }
    return filtered;
  } catch {
    return [];
  }
};

export const saveFriends = (friends: FriendItem[]): void => {
  try {
    const cleaned = friends.filter((f) => f && f.name && !isBotName(f.name));
    localStorage.setItem(FRIENDS_KEY, JSON.stringify(cleaned));
  } catch (e) {
    console.error('Failed to save friends:', e);
  }
};

export interface AddFriendPayload {
  name: string;
  playerId?: string;
  playerTag?: string;
  avatarId?: string;
  frameId?: string;
  title?: string;
  matchesWon?: number;
  note?: string;
}

/**
 * Adds a new friend. Allows multiple friends with the same nickname ("Murad")
 * as long as their unique playerId or playerTag is different.
 */
export const addFriend = (payload: AddFriendPayload): boolean => {
  if (!payload.name || isBotName(payload.name)) {
    return false; // Rejects bot players
  }

  const current = loadFriends();
  const trimmedName = payload.name.trim();
  const tag = payload.playerTag || synthesizeTag(payload.playerId || `${trimmedName}_${Date.now()}`);
  const pid = payload.playerId || `DOM-${tag}`;
  const handle = `${trimmedName}#${tag}`;

  // Check if this exact player is already a friend by playerId or handle
  const alreadyFriend = current.some((f) => {
    if (f.playerId && pid && f.playerId === pid) return true;
    if (f.handle && handle && f.handle.toLowerCase() === handle.toLowerCase()) return true;
    // If neither has distinct ID/tag, fallback to name equality
    if (!f.playerTag && !payload.playerTag) {
      return f.name.toLowerCase() === trimmedName.toLowerCase();
    }
    return false;
  });

  if (alreadyFriend) {
    return false; // already friend
  }

  const newFriend: FriendItem = {
    id: `friend_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    playerId: pid,
    playerTag: tag,
    name: trimmedName,
    handle,
    avatarId: payload.avatarId || 'avatar_tea_master',
    frameId: payload.frameId,
    title: payload.title || 'Çayxana Dominocusu',
    note: payload.note,
    matchesWon: payload.matchesWon,
    addedAt: new Date().toLocaleDateString('az-AZ'),
    isOnline: true,
    isRealPlayer: true
  };

  saveFriends([newFriend, ...current]);
  return true;
};

export const updateFriendNote = (friendId: string, note: string): void => {
  const current = loadFriends();
  const updated = current.map((f) => (f.id === friendId ? { ...f, note: note.trim() } : f));
  saveFriends(updated);
};

export const removeFriend = (id: string): void => {
  const current = loadFriends();
  saveFriends(current.filter((f) => f.id !== id));
};

export const isFriend = (
  query: string | { playerId?: string; playerTag?: string; name?: string }
): boolean => {
  const current = loadFriends();

  if (typeof query === 'string') {
    if (!query || isBotName(query)) return false;
    const qLower = query.toLowerCase().trim();

    return current.some(
      (f) =>
        f.id === query ||
        f.playerId?.toLowerCase() === qLower ||
        f.playerTag === query ||
        f.handle?.toLowerCase() === qLower ||
        f.name.toLowerCase() === qLower
    );
  }

  if (query.playerId) {
    return current.some((f) => f.playerId === query.playerId);
  }

  if (query.playerTag && query.name) {
    return current.some(
      (f) => f.playerTag === query.playerTag && f.name.toLowerCase() === query.name?.toLowerCase()
    );
  }

  if (query.name) {
    return current.some((f) => f.name.toLowerCase() === query.name?.toLowerCase());
  }

  return false;
};

export const searchFriends = (query: string): FriendItem[] => {
  const friends = loadFriends();
  const q = query.trim().toLowerCase();
  if (!q) return friends;

  return friends.filter((f) => {
    return (
      f.name.toLowerCase().includes(q) ||
      f.playerTag.includes(q) ||
      f.playerId.toLowerCase().includes(q) ||
      (f.handle && f.handle.toLowerCase().includes(q)) ||
      (f.note && f.note.toLowerCase().includes(q)) ||
      (f.title && f.title.toLowerCase().includes(q))
    );
  });
};

export const loadRecentPlayers = (): RecentPlayerItem[] => {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed: RecentPlayerItem[] = JSON.parse(raw);
    
    // Purge any bots from recent opponents & synthesize tags
    let changed = false;
    const filtered: RecentPlayerItem[] = [];

    for (const p of parsed) {
      if (!p || !p.name || isBotName(p.name)) {
        changed = true;
        continue;
      }

      const tag = p.playerTag || synthesizeTag(p.playerId || p.name);
      const pid = p.playerId || `DOM-${tag}`;
      const handle = p.handle || `${p.name}#${tag}`;

      filtered.push({
        ...p,
        playerId: pid,
        playerTag: tag,
        handle,
        isRealPlayer: true
      });
    }

    if (changed || filtered.length !== parsed.length) {
      localStorage.setItem(RECENT_KEY, JSON.stringify(filtered));
    }
    return filtered;
  } catch {
    return [];
  }
};

export const recordRecentPlayer = (player: RecentPlayerItem): void => {
  if (!player.name || isBotName(player.name)) return;
  try {
    const current = loadRecentPlayers();
    const tag = player.playerTag || synthesizeTag(player.playerId || player.name);
    const pid = player.playerId || `DOM-${tag}`;
    const handle = player.handle || `${player.name}#${tag}`;

    const filtered = current.filter((p) => {
      if (p.playerId && pid && p.playerId === pid) return false;
      if (p.handle && handle && p.handle.toLowerCase() === handle.toLowerCase()) return false;
      return p.name.toLowerCase() !== player.name.toLowerCase();
    });

    const updated = [
      {
        ...player,
        playerId: pid,
        playerTag: tag,
        handle,
        isRealPlayer: true
      },
      ...filtered
    ].slice(0, 15);

    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to record recent player:', e);
  }
};
