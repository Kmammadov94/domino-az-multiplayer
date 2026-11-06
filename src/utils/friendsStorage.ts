export interface FriendItem {
  id: string;
  name: string;
  avatarId?: string;
  frameId?: string;
  title?: string;
  addedAt: string;
  isOnline?: boolean;
  isRealPlayer?: boolean;
}

export interface RecentPlayerItem {
  name: string;
  avatarId?: string;
  frameId?: string;
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

export const loadFriends = (): FriendItem[] => {
  try {
    const raw = localStorage.getItem(FRIENDS_KEY);
    if (!raw) return [];
    const parsed: FriendItem[] = JSON.parse(raw);
    // Purge any bot that was mistakenly saved
    const filtered = parsed.filter((f) => f && f.name && !isBotName(f.name));
    if (filtered.length !== parsed.length) {
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

export const addFriend = (friend: Omit<FriendItem, 'id' | 'addedAt'>): boolean => {
  if (!friend.name || isBotName(friend.name)) {
    return false; // Rejects bot players
  }

  const current = loadFriends();
  // Check if already added
  if (current.some((f) => f.name.toLowerCase() === friend.name.toLowerCase())) {
    return false; // already friend
  }

  const newFriend: FriendItem = {
    id: `friend_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name: friend.name.trim(),
    avatarId: friend.avatarId || 'avatar_tea_master',
    frameId: friend.frameId,
    title: friend.title || 'Çayxana Qonağı',
    addedAt: new Date().toLocaleDateString('az-AZ'),
    isOnline: true,
    isRealPlayer: true
  };

  saveFriends([newFriend, ...current]);
  return true;
};

export const removeFriend = (id: string): void => {
  const current = loadFriends();
  saveFriends(current.filter((f) => f.id !== id));
};

export const isFriend = (name: string): boolean => {
  if (!name || isBotName(name)) return false;
  const current = loadFriends();
  return current.some((f) => f.name.toLowerCase() === name.toLowerCase());
};

export const loadRecentPlayers = (): RecentPlayerItem[] => {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed: RecentPlayerItem[] = JSON.parse(raw);
    // Purge any bots from recent opponents
    const filtered = parsed.filter((p) => p && p.name && !isBotName(p.name));
    if (filtered.length !== parsed.length) {
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
    const filtered = current.filter((p) => p.name.toLowerCase() !== player.name.toLowerCase());
    const updated = [{ ...player, isRealPlayer: true }, ...filtered].slice(0, 15);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to record recent player:', e);
  }
};
