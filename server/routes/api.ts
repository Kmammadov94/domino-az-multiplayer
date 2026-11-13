import { Router } from 'express';
import {
  extractBearerToken,
  isValidSafeId,
  safeTimingEqual,
  signSessionToken,
  verifyGoogleIdToken,
  verifySessionToken
} from '../auth';
import { isPostgresEnabled, persistUserRecord } from '../db';

export interface RankedLeaderboardEntry {
  googleId: string;
  name: string;
  mmr: number;
  rankedPlayed: number;
  rankedWon: number;
  avatarId: string;
}

interface ApiRouterDeps {
  getUserDatabase: () => Record<string, any>;
  getActiveRoomCount: () => number;
  getGuestRankedEntries?: () => RankedLeaderboardEntry[];
}

const isAuthorizedAdmin = (providedKey: unknown): boolean => {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || typeof providedKey !== 'string' || !providedKey) return false;
  return safeTimingEqual(providedKey, secret);
};

export function createApiRouter({ getUserDatabase, getActiveRoomCount, getGuestRankedEntries }: ApiRouterDeps): Router {
  const router = Router();
  const apkAuthSessions = new Map<string, { user: any; createdAt: number; consumedAt?: number }>();

  // Health check endpoint for zero-downtime hosting pings
  router.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      game: 'Domino PRO (Telefon 365)',
      storage: isPostgresEnabled() ? 'postgresql' : 'local_json',
      activeRooms: getActiveRoomCount(),
      timestamp: Date.now()
    });
  });

  const ensureUserRecordFromProfile = (verified: {
    googleId: string;
    email: string;
    name: string;
    picture: string;
  }) => {
    const userDatabase = getUserDatabase();
    const existing = Object.prototype.hasOwnProperty.call(userDatabase, verified.googleId)
      ? userDatabase[verified.googleId]
      : {};
    userDatabase[verified.googleId] = {
      ...existing,
      profile: {
        googleId: verified.googleId,
        email: verified.email || existing.profile?.email || '',
        name: verified.name || existing.profile?.name || '',
        picture: verified.picture || existing.profile?.picture || ''
      },
      stats: existing.stats || {},
      pendingCoinGrant: existing.pendingCoinGrant || 0,
      claimedGrants: existing.claimedGrants || [],
      updatedAt: Date.now()
    };
    persistUserRecord(verified.googleId, userDatabase[verified.googleId], userDatabase);
  };

  // Verify Google ID Token and issue a signed server session token
  router.post('/api/auth/google', async (req, res) => {
    const { credential } = req.body || {};
    if (typeof credential !== 'string' || !credential) {
      return res.status(400).json({ error: 'Google ID token (credential) is required' });
    }
    const verified = await verifyGoogleIdToken(credential);
    if (!verified) {
      return res.status(401).json({ error: 'Invalid or expired Google token' });
    }
    ensureUserRecordFromProfile(verified);
    const authToken = signSessionToken(verified.googleId);
    res.json({
      success: true,
      profile: {
        ...verified,
        signedInAt: Date.now(),
        authToken
      }
    });
  });

  // Sync user stats endpoint (authenticated)
  router.post('/api/user-stats', (req, res) => {
    const { googleId, email, name, picture, stats, isInitialLogin } = req.body || {};
    if (!isValidSafeId(googleId)) {
      return res.status(400).json({ error: 'Valid googleId is required' });
    }

    const token = extractBearerToken(req.headers.authorization);
    const verifiedToken = verifySessionToken(token);
    if (!verifiedToken || verifiedToken.googleId !== googleId) {
      return res.status(401).json({ error: 'Authentication required. Please sign in again.' });
    }

    const userDatabase = getUserDatabase();
    const existing = Object.prototype.hasOwnProperty.call(userDatabase, googleId)
      ? userDatabase[googleId]
      : {};
    const existingStats = existing.stats || {};
    const pendingGrant = existing.pendingCoinGrant || 0;

    let finalCoins: number;
    if (typeof stats?.coins === 'number') {
      if (isInitialLogin) {
        finalCoins =
          (typeof existingStats.coins === 'number' ? existingStats.coins : stats.coins) +
          pendingGrant;
      } else {
        finalCoins = stats.coins + pendingGrant;
      }
    } else {
      finalCoins = (existingStats.coins ?? 20) + pendingGrant;
    }

    const resolvedEquippedSkin =
      stats?.equippedSkin && stats.equippedSkin !== 'ivory_classic'
        ? stats.equippedSkin
        : existingStats.equippedSkin || stats?.equippedSkin || 'ivory_classic';

    const resolvedEquippedAvatar =
      stats?.equippedAvatar && stats.equippedAvatar !== 'avatar_baku_classic'
        ? stats.equippedAvatar
        : existingStats.equippedAvatar || stats?.equippedAvatar || 'avatar_baku_classic';

    const resolvedEquippedFrame =
      stats?.equippedFrame && stats.equippedFrame !== 'frame_none'
        ? stats.equippedFrame
        : existingStats.equippedFrame || stats?.equippedFrame || 'frame_none';

    const resolvedEquippedTitle =
      stats?.equippedTitle && stats.equippedTitle !== 'title_tea_elder'
        ? stats.equippedTitle
        : existingStats.equippedTitle || stats?.equippedTitle || 'title_tea_elder';

    const resolvedEquippedTable =
      stats?.equippedTableTheme && stats.equippedTableTheme !== 'table_emerald_classic'
        ? stats.equippedTableTheme
        : existingStats.equippedTableTheme || stats?.equippedTableTheme || 'table_emerald_classic';

    const mergedUnlockedSkins = Array.from(
      new Set(['ivory_classic', ...(existingStats.unlockedSkins || []), ...(stats?.unlockedSkins || [])])
    );
    const mergedUnlockedAvatars = Array.from(
      new Set([...(existingStats.unlockedAvatars || []), ...(stats?.unlockedAvatars || [])])
    );
    const mergedUnlockedFrames = Array.from(
      new Set(['frame_none', ...(existingStats.unlockedFrames || []), ...(stats?.unlockedFrames || [])])
    );
    const mergedUnlockedTitles = Array.from(
      new Set(['title_tea_elder', ...(existingStats.unlockedTitles || []), ...(stats?.unlockedTitles || [])])
    );

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
      mmr:
        typeof existingStats.rankedPlayed === 'number' &&
        existingStats.rankedPlayed >= (typeof stats?.rankedPlayed === 'number' ? stats.rankedPlayed : 0) &&
        typeof existingStats.mmr === 'number'
          ? existingStats.mmr
          : Math.min(5000, Math.max(100, typeof stats?.mmr === 'number' ? Math.round(stats.mmr) : existingStats.mmr ?? 1000)),
      rankedPlayed: Math.max(existingStats.rankedPlayed || 0, typeof stats?.rankedPlayed === 'number' ? stats.rankedPlayed : 0),
      rankedWon: Math.max(existingStats.rankedWon || 0, typeof stats?.rankedWon === 'number' ? stats.rankedWon : 0),
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
      pendingCoinGrant: 0,
      claimedGrants:
        pendingGrant > 0
          ? [...(existing.claimedGrants || []), { amount: pendingGrant, claimedAt: Date.now() }]
          : existing.claimedGrants || [],
      updatedAt: Date.now()
    };

    persistUserRecord(googleId, userDatabase[googleId], userDatabase);

    res.json({
      success: true,
      profile: userDatabase[googleId].profile,
      stats: mergedStats
    });
  });

  // Fetch user stats endpoint (authenticated)
  router.get('/api/user-stats/:googleId', (req, res) => {
    const { googleId } = req.params;
    if (!isValidSafeId(googleId)) {
      return res.status(400).json({ error: 'Invalid googleId' });
    }
    const token = extractBearerToken(req.headers.authorization);
    const verifiedToken = verifySessionToken(token);
    if (!verifiedToken || verifiedToken.googleId !== googleId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const userDatabase = getUserDatabase();
    const user = Object.prototype.hasOwnProperty.call(userDatabase, googleId)
      ? userDatabase[googleId]
      : null;
    if (!user) {
      return res.status(404).json({ error: 'User not found in cloud' });
    }
    res.json({
      success: true,
      profile: user.profile,
      stats: user.stats
    });
  });

  // Admin endpoint to inspect registered users
  router.get('/api/admin/users', (req, res) => {
    if (!process.env.ADMIN_SECRET) {
      return res.status(503).json({ error: 'Admin endpoints are disabled (ADMIN_SECRET not configured).' });
    }
    const adminKey = (req.headers['x-admin-key'] as string) || (req.query.adminKey as string);
    if (!isAuthorizedAdmin(adminKey)) {
      return res.status(403).json({ error: 'Unauthorized. Provide valid adminKey.' });
    }

    const userDatabase = getUserDatabase();
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
      pendingCoinGrant: rec.pendingCoinGrant || 0,
      updatedAt: rec.updatedAt ? new Date(rec.updatedAt).toISOString() : null
    }));

    res.json({ totalUsers: users.length, users });
  });

  // Admin endpoint to add or subtract coins (POST only)
  router.post('/api/admin/grant-coins', (req, res) => {
    if (!process.env.ADMIN_SECRET) {
      return res.status(503).json({ error: 'Admin endpoints are disabled (ADMIN_SECRET not configured).' });
    }
    const adminKey = (req.headers['x-admin-key'] as string) || req.body?.adminKey;
    if (!isAuthorizedAdmin(adminKey)) {
      return res.status(403).json({ error: 'Unauthorized. Provide valid adminKey.' });
    }

    const googleId = req.body?.googleId;
    const email = req.body?.email;
    const delta = Number(req.body?.amount);
    if (isNaN(delta) || delta === 0) {
      return res.status(400).json({ error: 'Valid numerical amount is required (e.g. 5000)' });
    }

    const userDatabase = getUserDatabase();
    let targetId = googleId;
    if (!targetId && email) {
      for (const [id, rec] of Object.entries(userDatabase)) {
        if ((rec as any).profile?.email?.toLowerCase() === String(email).toLowerCase()) {
          targetId = id;
          break;
        }
      }
    }

    if (!isValidSafeId(targetId) || !Object.prototype.hasOwnProperty.call(userDatabase, targetId)) {
      return res.status(404).json({ error: 'User not found in cloud database' });
    }

    const user = userDatabase[targetId];
    if (!user.stats) user.stats = {};
    const prevCoins = user.stats.coins ?? 0;
    user.stats.coins = Math.max(0, prevCoins + delta);
    user.pendingCoinGrant = (user.pendingCoinGrant || 0) + delta;
    user.updatedAt = Date.now();
    persistUserRecord(targetId, userDatabase[targetId], userDatabase);

    res.json({
      success: true,
      user: {
        googleId: targetId,
        name: user.profile?.name,
        email: user.profile?.email,
        previousCoins: prevCoins,
        added: delta,
        currentServerCoins: user.stats.coins,
        pendingCoinGrant: user.pendingCoinGrant
      }
    });
  });

  // Mobile APK Google Auth Handshake Sessions
  router.post('/api/apk-auth/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    const { credential } = req.body || {};
    if (!isValidSafeId(sessionId) || typeof credential !== 'string' || !credential) {
      return res.status(400).json({ error: 'Valid sessionId and Google credential are required' });
    }

    const verified = await verifyGoogleIdToken(credential);
    if (!verified) {
      return res.status(401).json({ error: 'Invalid or expired Google credential' });
    }

    ensureUserRecordFromProfile(verified);
    const authToken = signSessionToken(verified.googleId);
    const authenticatedUser = {
      ...verified,
      signedInAt: Date.now(),
      authToken
    };

    apkAuthSessions.set(sessionId, { user: authenticatedUser, createdAt: Date.now() });
    const now = Date.now();
    for (const [k, v] of apkAuthSessions.entries()) {
      if (now - v.createdAt > 5 * 60 * 1000 || (v.consumedAt && now - v.consumedAt > 15_000)) {
        apkAuthSessions.delete(k);
      }
    }
    res.json({ success: true, user: authenticatedUser });
  });

  router.get('/api/apk-auth/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const record = apkAuthSessions.get(sessionId);
    if (!record || Date.now() - record.createdAt > 5 * 60 * 1000) {
      apkAuthSessions.delete(sessionId);
      return res.json({ authenticated: false });
    }
    if (!record.consumedAt) {
      record.consumedAt = Date.now();
    }
    res.json({ authenticated: true, user: record.user });
  });

  // Çayxana Ranked MMR Leaderboard (Google users + Guest players)
  router.get('/api/ranked/leaderboard', (_req, res) => {
    const db = getUserDatabase();
    const byId = new Map<string, RankedLeaderboardEntry>();

    for (const [googleId, rec] of Object.entries(db)) {
      const stats = rec?.stats || {};
      const mmr = typeof stats.mmr === 'number' && Number.isFinite(stats.mmr) ? stats.mmr : 1000;
      const rankedPlayed = typeof stats.rankedPlayed === 'number' ? stats.rankedPlayed : 0;
      const rankedWon = typeof stats.rankedWon === 'number' ? stats.rankedWon : 0;
      if (rankedPlayed <= 0) continue;
      byId.set(googleId, {
        googleId,
        name: rec?.profile?.name || rec?.name || 'Oyunçu',
        mmr,
        rankedPlayed,
        rankedWon,
        avatarId: stats.equippedAvatar || 'avatar_baku_classic'
      });
    }

    for (const guest of getGuestRankedEntries ? getGuestRankedEntries() : []) {
      if (guest.rankedPlayed <= 0 || byId.has(guest.googleId)) continue;
      byId.set(guest.googleId, guest);
    }

    const entries = Array.from(byId.values())
      .sort((a, b) => b.mmr - a.mmr || b.rankedWon - a.rankedWon)
      .slice(0, 30);

    res.json({ success: true, leaderboard: entries });
  });

  return router;
}
