import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

const USERS_FILE = path.resolve(process.cwd(), 'data/users.json');
const SOCIAL_FILE = path.resolve(process.cwd(), 'data/social.json');

function loadEnvFileIfPresent(): void {
  if (process.env.DATABASE_URL) return;
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) return;
    const raw = fs.readFileSync(envPath, 'utf-8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx <= 0) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  } catch {
    // Ignore .env read errors
  }
}

loadEnvFileIfPresent();

const DATABASE_URL = process.env.DATABASE_URL || '';
const pool = DATABASE_URL
  ? new Pool({
      connectionString: DATABASE_URL,
      ssl: DATABASE_URL.includes('localhost') ? undefined : { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000
    })
  : null;

export const isPostgresEnabled = (): boolean => Boolean(pool);

export interface SocialDatabaseShape {
  friendsByPlayerId: Record<string, any[]>;
  requestsByTargetId: Record<string, any[]>;
}

function readJsonSafe<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
    }
  } catch (e) {
    console.error(`Failed to read ${path.basename(filePath)}:`, e);
  }
  return fallback;
}

function writeJsonAtomic(filePath: string, data: unknown): void {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const tmpPath = `${filePath}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmpPath, filePath);
  } catch (e) {
    console.error(`Failed to save ${path.basename(filePath)}:`, e);
  }
}

export async function initStorage(): Promise<{
  users: Record<string, any>;
  social: SocialDatabaseShape;
}> {
  const localUsers = readJsonSafe<Record<string, any>>(USERS_FILE, {});
  const localSocialRaw = readJsonSafe<Partial<SocialDatabaseShape>>(SOCIAL_FILE, {});
  const localSocial: SocialDatabaseShape = {
    friendsByPlayerId: localSocialRaw.friendsByPlayerId || {},
    requestsByTargetId: localSocialRaw.requestsByTargetId || {}
  };

  if (!pool) {
    console.log('[Storage] Using local JSON persistence (DATABASE_URL not set).');
    return { users: localUsers, social: localSocial };
  }

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS domino_users (
        google_id TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at BIGINT NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS domino_social (
        doc_key TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at BIGINT NOT NULL
      );
    `);

    const usersRes = await pool.query<{ google_id: string; data: any }>(
      'SELECT google_id, data FROM domino_users'
    );
    const pgUsers: Record<string, any> = {};
    for (const row of usersRes.rows) {
      pgUsers[row.google_id] = row.data;
    }

    // Seed from local JSON if Postgres is brand new
    if (usersRes.rows.length === 0 && Object.keys(localUsers).length > 0) {
      for (const [gid, rec] of Object.entries(localUsers)) {
        pgUsers[gid] = rec;
        await pool.query(
          `INSERT INTO domino_users (google_id, data, updated_at)
           VALUES ($1, $2::jsonb, $3)
           ON CONFLICT (google_id) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at`,
          [gid, JSON.stringify(rec), Date.now()]
        );
      }
    }

    const socialRes = await pool.query<{ doc_key: string; data: any }>(
      'SELECT doc_key, data FROM domino_social'
    );
    let pgSocial: SocialDatabaseShape = {
      friendsByPlayerId: {},
      requestsByTargetId: {}
    };
    for (const row of socialRes.rows) {
      if (row.doc_key === 'friendsByPlayerId') pgSocial.friendsByPlayerId = row.data || {};
      if (row.doc_key === 'requestsByTargetId') pgSocial.requestsByTargetId = row.data || {};
    }

    if (
      socialRes.rows.length === 0 &&
      (Object.keys(localSocial.friendsByPlayerId).length > 0 ||
        Object.keys(localSocial.requestsByTargetId).length > 0)
    ) {
      pgSocial = localSocial;
      await persistSocialToDb(pgSocial);
    }

    console.log(
      `[Storage] Connected to Neon PostgreSQL (${Object.keys(pgUsers).length} users loaded).`
    );
    return { users: pgUsers, social: pgSocial };
  } catch (err) {
    console.error('[Storage] PostgreSQL init failed, falling back to local JSON:', err);
    return { users: localUsers, social: localSocial };
  }
}

export function persistUserRecord(
  googleId: string,
  record: any,
  allUsersFallback: Record<string, any>
): void {
  if (!pool) {
    writeJsonAtomic(USERS_FILE, allUsersFallback);
    return;
  }
  pool
    .query(
      `INSERT INTO domino_users (google_id, data, updated_at)
       VALUES ($1, $2::jsonb, $3)
       ON CONFLICT (google_id) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at`,
      [googleId, JSON.stringify(record), Date.now()]
    )
    .catch((err) => {
      console.error('[Storage] Failed to persist user to PostgreSQL:', err);
    });
}

async function persistSocialToDb(social: SocialDatabaseShape): Promise<void> {
  if (!pool) return;
  const now = Date.now();
  await pool.query(
    `INSERT INTO domino_social (doc_key, data, updated_at)
     VALUES ('friendsByPlayerId', $1::jsonb, $2)
     ON CONFLICT (doc_key) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at`,
    [JSON.stringify(social.friendsByPlayerId), now]
  );
  await pool.query(
    `INSERT INTO domino_social (doc_key, data, updated_at)
     VALUES ('requestsByTargetId', $1::jsonb, $2)
     ON CONFLICT (doc_key) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at`,
    [JSON.stringify(social.requestsByTargetId), now]
  );
}

export function persistSocialDatabase(social: SocialDatabaseShape): void {
  if (!pool) {
    writeJsonAtomic(SOCIAL_FILE, social);
    return;
  }
  persistSocialToDb(social).catch((err) => {
    console.error('[Storage] Failed to persist social DB to PostgreSQL:', err);
  });
}
