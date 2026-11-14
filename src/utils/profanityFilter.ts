/**
 * Domino PRO (Telefon 365) - Profanity & Inappropriate Content Filter
 * Covers Azerbaijani offensive words, insults, and slang, along with English and Russian profanities.
 */

// Normalized bad word roots (in lower-case, transliterated to latin without accents)
const SEVERE_PROFANITIES = [
  // --- Azerbaijani Profanities ---
  'sik',
  'sikdir',
  'siktir',
  'sikis',
  'sikish',
  'siki',
  'sikim',
  'sikeyim',
  'siken',
  'sikmey',
  'sikme',
  'got',
  'gotu',
  'gotveren',
  'peyser',
  'peysər',
  'peyseri',
  'qehbe',
  'qəhbə',
  'qehbesi',
  'pox',
  'poxu',
  'poxye',
  'amciq',
  'amcıq',
  'amcig',
  'amcix',
  'amcuq',
  'gijdillaq',
  'gicdillaq',
  'gijdillax',
  'cindir',
  'cındır',
  'ogras',
  'oğraş',
  'dalbayob',
  'madyan',
  'xoruzdu',

  // --- English Profanities ---
  'dick',
  'dicks',
  'dickhead',
  'cock',
  'cocks',
  'cocksucker',
  'fuck',
  'fck',
  'fuk',
  'fucker',
  'fucking',
  'fucked',
  'fuckoff',
  'shit',
  'shits',
  'bullshit',
  'shitty',
  'bitch',
  'bitches',
  'pussy',
  'pussies',
  'asshole',
  'assholes',
  'dumbass',
  'cunt',
  'cunts',
  'bastard',
  'bastards',
  'whore',
  'whores',
  'slut',
  'sluts',
  'nigger',
  'nigga',
  'fag',
  'faggot',
  'penis',
  'vagina',
  'twat',
  'wanker',

  // --- Russian / Translit Profanities ---
  'xuy',
  'хуй',
  'pizda',
  'пизда',
  'blya',
  'бля',
  'blyad',
  'блядь',
  'suka',
  'сука',
  'gandon',
  'гандон',
  'mudak',
  'мудак',
  'pedik',
  'педик',
  'ebat',
  'ебать',
  'yebat',
  'zaebal'
];

// Exact word-only profanities (short words that could be part of innocent words if checked as substring)
const EXACT_MATCH_PROFANITIES = new Set([
  'ass',
  'got',
  'göt',
  'pox',
  'sik',
  'am',
  'fuk',
  'fck',
  's1k',
  'suk'
]);

/**
 * Normalizes text to lower-case latin characters, resolving Azerbaijani/Turkish diacritics
 * and common leetspeak substitutions.
 */
export function normalizeText(text: string): string {
  if (!text) return '';

  const normalized = text
    .toLowerCase()
    .trim()
    // Azerbaijani diacritic mapping
    .replace(/ə/g, 'e')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ğ/g, 'g')
    .replace(/ç/g, 'c')
    .replace(/ş/g, 's')
    // Cyrillic lookalikes
    .replace(/а/g, 'a')
    .replace(/в/g, 'b')
    .replace(/е/g, 'e')
    .replace(/к/g, 'k')
    .replace(/м/g, 'm')
    .replace(/н/g, 'h')
    .replace(/о/g, 'o')
    .replace(/р/g, 'p')
    .replace(/с/g, 'c')
    .replace(/т/g, 't')
    .replace(/у/g, 'y')
    .replace(/х/g, 'x')
    // Leetspeak substitutions
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/!/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/@/g, 'a')
    .replace(/5/g, 's')
    .replace(/\$/g, 's')
    .replace(/7/g, 't');

  return normalized;
}

/**
 * Strips non-alphanumeric separators (e.g. "s.i.k" -> "sik", "d-i-c-k" -> "dick")
 */
export function stripSeparators(text: string): string {
  return text.replace(/[\s\-_.,*+~`|/\\#%^&()[\]{}!?:;'"]+/g, '');
}

/**
 * Checks if the given text contains Azerbaijani, English, or Russian profanities.
 */
export function containsProfanity(text: string): boolean {
  if (!text) return false;

  const normalized = normalizeText(text);
  const stripped = stripSeparators(normalized);

  // 1. Check stripped text for multi-char severe profanities (e.g. "peyser", "sikdir", "dickhead")
  for (const bad of SEVERE_PROFANITIES) {
    if (bad.length >= 3 && stripped.includes(bad)) {
      return true;
    }
  }

  // 2. Tokenize by non-alphanumeric words for exact short word matches (e.g. "ass", "pox", "got")
  const tokens = normalized.split(/[\s\-_.,*+~`|/\\#%^&()[\]{}!?:;'"]+/).filter(Boolean);
  for (const token of tokens) {
    if (EXACT_MATCH_PROFANITIES.has(token)) {
      return true;
    }
    // Also check if token matches severe profanities
    for (const bad of SEVERE_PROFANITIES) {
      if (token === bad || (bad.length >= 3 && token.includes(bad))) {
        return true;
      }
    }
  }

  // 3. Check regex patterns for spaced or dot-separated bypasses (e.g. "s i k", "d i c k")
  const regexPatterns = [
    /s[\W_]*i[\W_]*k/i,
    /d[\W_]*i[\W_]*c[\W_]*k/i,
    /f[\W_]*u[\W_]*c[\W_]*k/i,
    /p[\W_]*e[\W_]*y[\W_]*s[\W_]*e[\W_]*r/i,
    /q[\W_]*e[\W_]*h[\W_]*b[\W_]*e/i,
    /g[\W_]*o[\W_]*t/i,
    /p[\W_]*o[\W_]*x/i,
    /b[\W_]*i[\W_]*t[\W_]*c[\W_]*h/i,
    /p[\W_]*u[\W_]*s[\W_]*s[\W_]*y/i,
    /c[\W_]*u[\W_]*n[\W_]*t/i
  ];

  for (const reg of regexPatterns) {
    if (reg.test(text)) {
      return true;
    }
  }

  return false;
}

/**
 * Sanitizes bad words in text by replacing them with asterisks (***)
 */
export function cleanProfanity(text: string, maskChar: string = '*'): string {
  if (!text) return '';
  let cleaned = text;

  for (const bad of SEVERE_PROFANITIES) {
    const reg = new RegExp(`\\b${bad}\\b`, 'gi');
    cleaned = cleaned.replace(reg, maskChar.repeat(bad.length));
  }

  return cleaned;
}

/**
 * Validates a player name for multiplayer or local profile.
 */
export function validatePlayerName(name: string): {
  isValid: boolean;
  error?: string;
  sanitizedName: string;
} {
  const trimmed = (name || '').trim();

  if (trimmed.length < 2) {
    return {
      isValid: false,
      error: 'Ad ən azı 2 hərfdən ibarət olmalıdır.',
      sanitizedName: 'Oyunçu'
    };
  }

  if (trimmed.length > 30) {
    return {
      isValid: true,
      sanitizedName: trimmed.slice(0, 30).trim()
    };
  }

  if (containsProfanity(trimmed)) {
    return {
      isValid: false,
      error: 'Bu adda nalayiq və ya qadağan olunmuş ifadə var. Zəhmət olmasa başqa ad seçin.',
      sanitizedName: 'Oyunçu'
    };
  }

  return {
    isValid: true,
    sanitizedName: trimmed
  };
}
