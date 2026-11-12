import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID ||
  '345163175505-a7dv01uno2tof42k31omil6p5c9do20g.apps.googleusercontent.com';

const SECRET_FILE = path.resolve(process.cwd(), 'data/.auth_secret');

function resolveAuthSecret(): string {
  if (process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 16) {
    return process.env.AUTH_SECRET;
  }
  try {
    if (fs.existsSync(SECRET_FILE)) {
      const existing = fs.readFileSync(SECRET_FILE, 'utf-8').trim();
      if (existing.length >= 32) return existing;
    }
    const generated = crypto.randomBytes(32).toString('hex');
    const dir = path.dirname(SECRET_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SECRET_FILE, generated, { mode: 0o600 });
    return generated;
  } catch {
    return crypto.randomBytes(32).toString('hex');
  }
}

const AUTH_SECRET = resolveAuthSecret();
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface VerifiedGoogleProfile {
  googleId: string;
  email: string;
  name: string;
  picture: string;
}

export function isValidSafeId(id: unknown): id is string {
  return (
    typeof id === 'string' &&
    /^[a-zA-Z0-9_.:-]{3,128}$/.test(id) &&
    id !== '__proto__' &&
    id !== 'constructor' &&
    id !== 'prototype'
  );
}

export function safeTimingEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function signSessionToken(googleId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ sub: googleId, exp: Date.now() + TOKEN_TTL_MS })
  ).toString('base64url');
  const sig = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(payload)
    .digest('base64url');
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: unknown): { googleId: string } | null {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(payload)
    .digest('base64url');
  if (!safeTimingEqual(sig, expectedSig)) return null;
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    if (!isValidSafeId(decoded?.sub)) return null;
    if (typeof decoded?.exp !== 'number' || decoded.exp < Date.now()) return null;
    return { googleId: decoded.sub };
  } catch {
    return null;
  }
}

export function extractBearerToken(authHeader: unknown): string | null {
  if (typeof authHeader !== 'string') return null;
  if (!authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice(7).trim() || null;
}

export async function verifyGoogleIdToken(
  idToken: string
): Promise<VerifiedGoogleProfile | null> {
  if (!idToken || typeof idToken !== 'string') return null;
  try {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
    );
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, any>;
    if (data.aud !== GOOGLE_CLIENT_ID) return null;
    if (!isValidSafeId(data.sub)) return null;
    if (data.exp && Number(data.exp) * 1000 < Date.now()) return null;
    return {
      googleId: String(data.sub),
      email: typeof data.email === 'string' ? data.email : '',
      name:
        (typeof data.name === 'string' && data.name) ||
        (typeof data.given_name === 'string' && data.given_name) ||
        'Google Oyunçusu',
      picture: typeof data.picture === 'string' ? data.picture : ''
    };
  } catch {
    return null;
  }
}
