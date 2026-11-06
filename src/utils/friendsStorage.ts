export interface FriendItem {
  id: string;
  name: string;
  avatarId?: string;
  frameId?: string;
  title?: string;
  addedAt: string;
  isOnline?: boolean;
}

export interface RecentPlayerItem {
  name: string;
  avatarId?: string;
  frameId?: string;
  date: string;
}

const FRIENDS_KEY = 'domino_friends';
const RECENT_KEY = 'domino_recent_players';

export const loadFriends = (): FriendItem[] => {
  try {
    const raw = localStorage.getItem(FRIENDS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const saveFriends = (friends: FriendItem[]): void => {
  try {
    localStorage.setItem(FRIENDS_KEY, JSON.stringify(friends));
  } catch (e) {
    console.error('Failed to save friends:', e);
  }
};

export const addFriend = (friend: Omit<FriendItem, 'id' | 'addedAt'>): boolean => {
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
    isOnline: true
  };

  saveFriends([newFriend, ...current]);
  return true;
};

export const removeFriend = (id: string): void => {
  const current = loadFriends();
  saveFriends(current.filter((f) => f.id !== id));
};

export const isFriend = (name: string): boolean => {
  const current = loadFriends();
  return current.some((f) => f.name.toLowerCase() === name.toLowerCase());
};

export const loadRecentPlayers = (): RecentPlayerItem[] => {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const recordRecentPlayer = (player: RecentPlayerItem): void => {
  try {
    const current = loadRecentPlayers();
    const filtered = current.filter((p) => p.name.toLowerCase() !== player.name.toLowerCase());
    const updated = [player, ...filtered].slice(0, 15);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to record recent player:', e);
  }
};
