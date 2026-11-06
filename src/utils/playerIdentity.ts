import { GoogleUserProfile } from './storage';
import { PlayerStats } from '../types/domino';
import { DEFAULT_AVATAR_ID } from '../data/avatars';

export interface PlayerIdentity {
  /** Unique permanent ID (e.g. "DOM-839214") */
  id: string;
  /** 4-digit unique tag (e.g. "8392") for disambiguation when names match */
  tag: string;
  /** Display name chosen by player (e.g. "Murad") */
  name: string;
  /** Full composite handle (e.g. "Murad#8392") */
  handle: string;
  /** Short friendly share code (e.g. "DOM-8392") */
  friendCode: string;
  /** Equipped avatar ID */
  avatarId: string;
  /** Equipped frame ID */
  frameId?: string;
  /** Equipped title */
  title?: string;
  /** Matches won */
  matchesWon: number;
  /** Matches played */
  matchesPlayed: number;
}

const PLAYER_ID_KEY = 'domino_player_unique_id';
const PLAYER_TAG_KEY = 'domino_player_tag';
const PLAYER_NAME_KEY = 'domino_player_name';

/**
 * Deterministically generates a 4-digit tag from a string (e.g. Google ID)
 */
const hashToTag = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const positive = Math.abs(hash);
  const tagNum = (positive % 9000) + 1000; // between 1000 and 9999
  return tagNum.toString();
};

/**
 * Generates a random 4-digit tag
 */
const generateRandomTag = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

/**
 * Retrieves or initializes the local player's identity
 */
export const getMyPlayerIdentity = (
  googleUser?: GoogleUserProfile | null,
  stats?: PlayerStats | null
): PlayerIdentity => {
  let tag: string;
  let id: string;

  if (googleUser && googleUser.googleId) {
    // Deterministic tag based on Google ID
    tag = hashToTag(googleUser.googleId);
    id = `DOM-${googleUser.googleId.slice(-6).toUpperCase()}`;
  } else {
    // Guest or anonymous
    let savedTag = '';
    let savedId = '';
    try {
      savedTag = localStorage.getItem(PLAYER_TAG_KEY) || '';
      savedId = localStorage.getItem(PLAYER_ID_KEY) || '';
    } catch {}

    if (!savedTag || savedTag.length !== 4) {
      savedTag = generateRandomTag();
      try {
        localStorage.setItem(PLAYER_TAG_KEY, savedTag);
      } catch {}
    }

    if (!savedId) {
      savedId = `DOM-${savedTag}${Math.floor(10 + Math.random() * 90)}`;
      try {
        localStorage.setItem(PLAYER_ID_KEY, savedId);
      } catch {}
    }

    tag = savedTag;
    id = savedId;
  }

  // Name resolution
  let name = '';
  try {
    name = localStorage.getItem(PLAYER_NAME_KEY) || '';
  } catch {}

  if (googleUser?.name) {
    name = googleUser.name;
  } else if (!name || name === 'Siz') {
    name = `Oyunçu`;
  }

  const handle = `${name}#${tag}`;
  const friendCode = `DOM-${tag}`;

  return {
    id,
    tag,
    name,
    handle,
    friendCode,
    avatarId: stats?.equippedAvatar || DEFAULT_AVATAR_ID,
    frameId: stats?.equippedFrame,
    title: stats?.equippedTitle || 'Çayxana Dominocusu',
    matchesWon: stats?.matchesWon || 0,
    matchesPlayed: stats?.matchesPlayed || 0
  };
};

/**
 * Parses user input when searching for a friend.
 * Supports:
 * - Full handle: "Murad#4829" or "Murad #4829"
 * - Tag only: "#4829" or "4829"
 * - Friend code: "DOM-4829" or "DOM-482910"
 * - Plain name: "Murad"
 */
export const parseFriendSearchQuery = (
  rawInput: string
): {
  cleanQuery: string;
  name?: string;
  tag?: string;
  friendCode?: string;
  isTagSearch: boolean;
} => {
  const input = rawInput.trim();
  if (!input) {
    return { cleanQuery: '', isTagSearch: false };
  }

  // Check if input is DOM-XXXX
  if (/^DOM-[\dA-Za-z]+$/i.test(input)) {
    const codePart = input.toUpperCase();
    const digits = codePart.replace(/\D/g, '').slice(0, 4);
    return {
      cleanQuery: codePart,
      friendCode: codePart,
      tag: digits.length === 4 ? digits : undefined,
      isTagSearch: true
    };
  }

  // Check if handle "Name#Tag"
  if (input.includes('#')) {
    const parts = input.split('#');
    const namePart = parts[0].trim();
    const tagPart = parts[1].trim().replace(/\D/g, '').slice(0, 4);
    return {
      cleanQuery: input,
      name: namePart || undefined,
      tag: tagPart || undefined,
      isTagSearch: Boolean(tagPart)
    };
  }

  // Check if purely numeric 4-6 digits tag
  if (/^\d{4,6}$/.test(input)) {
    return {
      cleanQuery: input,
      tag: input.slice(0, 4),
      isTagSearch: true
    };
  }

  // Otherwise plain name
  return {
    cleanQuery: input,
    name: input,
    isTagSearch: false
  };
};
