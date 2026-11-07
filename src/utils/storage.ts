import { PlayerStats } from '../types/domino';
import { DEFAULT_AVATAR_ID, FREE_AVATAR_IDS } from '../data/avatars';
import { DOMINO_SKINS } from '../data/skins';

const STORAGE_KEY = 'az_domino_telefon365_v1';
const GOOGLE_USER_KEY = 'az_domino_google_user_v1';
const GUEST_DISMISS_KEY = 'az_domino_guest_banner_dismissed';

export const PRODUCTION_SERVER_URL = 'https://domino-az-multiplayer.onrender.com';

export const isNativeMobileApp = (): boolean => {
  if (typeof window === 'undefined') return false;
  const cap = (window as any).Capacitor;
  if (cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform()) {
    return true;
  }
  const { protocol, hostname, port } = window.location;
  if (protocol === 'capacitor:' || protocol === 'file:') return true;
  // Capacitor Android with androidScheme: 'https' runs on https://localhost with no port
  if (!port && hostname === 'localhost' && protocol === 'https:') return true;
  return false;
};

export const getBackendServerUrl = (): string => {
  if (typeof window === 'undefined') return PRODUCTION_SERVER_URL;
  const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env;
  if (metaEnv?.VITE_SERVER_URL) {
    return metaEnv.VITE_SERVER_URL;
  }
  if (isNativeMobileApp()) {
    return PRODUCTION_SERVER_URL;
  }
  const { port, hostname, origin } = window.location;
  if (port === '3000') {
    return `http://${hostname || 'localhost'}:3001`;
  }
  if (port === '3001') {
    return origin;
  }
  return origin;
};

export interface GoogleUserProfile {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
  signedInAt: number;
}

export const DEFAULT_STATS: PlayerStats = {
  coins: 20, // Starting gift: 20 gold coins
  equippedSkin: 'ivory_classic',
  unlockedSkins: ['ivory_classic'],
  equippedAvatar: DEFAULT_AVATAR_ID,
  unlockedAvatars: [...FREE_AVATAR_IDS],
  dailyStreak: 0,
  matchesPlayed: 0,
  matchesWon: 0
};

export const loadPlayerStats = (): PlayerStats => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATS;
    const parsed = JSON.parse(raw);
    const loaded = { ...DEFAULT_STATS, ...parsed };
    if (!loaded.equippedAvatar) {
      loaded.equippedAvatar = DEFAULT_STATS.equippedAvatar;
    }
    if (!loaded.unlockedAvatars || loaded.unlockedAvatars.length === 0) {
      loaded.unlockedAvatars = [...DEFAULT_STATS.unlockedAvatars!];
    } else {
      // Ensure all 5 free starter avatars are always in unlocked list
      FREE_AVATAR_IDS.forEach((faId) => {
        if (!loaded.unlockedAvatars!.includes(faId)) {
          loaded.unlockedAvatars!.push(faId);
        }
      });
    }

    // Ensure all default skins are always unlocked
    if (!loaded.unlockedSkins) {
      loaded.unlockedSkins = ['ivory_classic'];
    }
    DOMINO_SKINS.filter((s) => s.unlockedByDefault).forEach((s) => {
      if (!loaded.unlockedSkins.includes(s.id)) {
        loaded.unlockedSkins.push(s.id);
      }
    });

    return loaded;
  } catch {
    return DEFAULT_STATS;
  }
};

export const savePlayerStats = (stats: PlayerStats): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (err) {
    console.error('Failed to save player stats', err);
  }
};

export const loadGoogleUser = (): GoogleUserProfile | null => {
  try {
    const raw = localStorage.getItem(GOOGLE_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveGoogleUser = (user: GoogleUserProfile | null): void => {
  try {
    if (user) {
      localStorage.setItem(GOOGLE_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(GOOGLE_USER_KEY);
    }
  } catch (err) {
    console.error('Failed to save google user', err);
  }
};

export const isGuestNoticeDismissed = (): boolean => {
  try {
    return sessionStorage.getItem(GUEST_DISMISS_KEY) === 'true';
  } catch {
    return false;
  }
};

export const setGuestNoticeDismissed = (dismissed: boolean): void => {
  try {
    if (dismissed) {
      sessionStorage.setItem(GUEST_DISMISS_KEY, 'true');
    } else {
      sessionStorage.removeItem(GUEST_DISMISS_KEY);
    }
  } catch {}
};

// Sync stats with cloud server
export const syncWithCloud = async (
  profile: GoogleUserProfile,
  currentStats: PlayerStats,
  isInitialLogin: boolean = false
): Promise<PlayerStats> => {
  try {
    const baseUrl = getBackendServerUrl();
    const res = await fetch(`${baseUrl}/api/user-stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        googleId: profile.googleId,
        email: profile.email,
        name: profile.name,
        picture: profile.picture,
        stats: currentStats,
        isInitialLogin
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.stats) {
        savePlayerStats(data.stats);
        if (data.profile) {
          saveGoogleUser(data.profile);
        }
        return data.stats;
      }
    }
  } catch (e) {
    console.warn('Cloud sync offline or server unreachable, using local stats:', e);
  }
  return currentStats;
};

export interface DailyClaimCheck {
  canClaim: boolean;
  streak: number;
  rewardCoins: number;
  isDay7Bonus: boolean;
}

export const checkDailyClaim = (stats: PlayerStats): DailyClaimCheck => {
  const today = new Date().toISOString().split('T')[0];
  const lastClaim = stats.lastDailyClaim;

  if (lastClaim === today) {
    return { canClaim: false, streak: stats.dailyStreak, rewardCoins: 0, isDay7Bonus: false };
  }

  let nextStreak = 1;
  if (lastClaim) {
    const lastDate = new Date(lastClaim);
    const currentDate = new Date(today);
    const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      nextStreak = (stats.dailyStreak % 7) + 1;
    } else {
      nextStreak = 1;
    }
  }

  const isDay7Bonus = nextStreak === 7;
  const rewardCoins = isDay7Bonus ? 30 : 5; // 5 standard + 25 bonus on 7th day

  return { canClaim: true, streak: nextStreak, rewardCoins, isDay7Bonus };
};
