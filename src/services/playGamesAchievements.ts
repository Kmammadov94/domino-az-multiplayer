import { isNativeMobileApp } from '../utils/storage';

export type PlayAchievementKey =
  | 'cayxana_winner'
  | 'ejdaha_35'
  | 'sehra_aslani_dry'
  | 'high_roller_top5'
  | 'rank_gold_1150'
  | 'rank_platinum_1400'
  | 'rank_diamond_1650'
  | 'rank_master_1900'
  | 'rank_grandmaster_2200'
  | 'friends_1'
  | 'friends_5'
  | 'friends_10'
  | 'friends_25'
  | 'friends_50';

export interface PlayAchievementDefinition {
  key: PlayAchievementKey;
  /**
   * Replace each placeholder with the generated CgkI... ID from
   * Google Play Console -> Play Games Services -> Achievements.
   */
  googlePlayId: string;
  xmlResourceName: string;
  type: 'standard' | 'incremental';
  steps?: number;
  pointsXp: number;
  name: {
    az: string;
    en: string;
    ru: string;
  };
  description: {
    az: string;
    en: string;
    ru: string;
  };
}

export const PLAY_ACHIEVEMENTS: PlayAchievementDefinition[] = [
  {
    key: 'cayxana_winner',
    googlePlayId: 'CgkI0azQ6oUKEAIQCw',
    xmlResourceName: 'achievement_qalib',
    type: 'standard',
    pointsXp: 25,
    name: {
      az: 'Qalib',
      en: 'Winner',
      ru: 'Победитель'
    },
    description: {
      az: 'Çayxanada reytinqli oyunda (101 və ya Telefon 365) qalib gəl.',
      en: 'Win a ranked game in the Teahouse (101 or All Fives 365).',
      ru: 'Одержите победу в рейтинговой игре в Чайхане (101 или Телефон 365).'
    }
  },
  {
    key: 'ejdaha_35',
    googlePlayId: 'CgkI0azQ6oUKEAIQBw',
    xmlResourceName: 'achievement_jdaha',
    type: 'standard',
    pointsXp: 50,
    name: {
      az: 'Əjdaha',
      en: 'Dragon',
      ru: 'Дракон'
    },
    description: {
      az: 'Masada bir gedişdə 35 xal toplayaraq oyunu dərhal qazan.',
      en: 'Win a game instantly by scoring 35 points on the board in a single move.',
      ru: 'Мгновенно выиграйте матч за один ход с 35 очками на столе.'
    }
  },
  {
    key: 'sehra_aslani_dry',
    googlePlayId: 'CgkI0azQ6oUKEAIQAQ',
    xmlResourceName: 'achievement_shra_aslan',
    type: 'standard',
    pointsXp: 50,
    name: {
      az: 'Səhra Aslanı',
      en: 'Desert Lion',
      ru: 'Лев Пустыни'
    },
    description: {
      az: 'Rəqibi 0 xalda saxlayaraq quru hesabla oyunu qazan.',
      en: 'Win a dry game while keeping your opponent at 0 points.',
      ru: 'Выиграйте игру всухую с нулём очков у соперника.'
    }
  },
  {
    key: 'high_roller_top5',
    googlePlayId: 'CgkI0azQ6oUKEAIQCg',
    xmlResourceName: 'achievement_yksk_mrc',
    type: 'standard',
    pointsXp: 100,
    name: {
      az: 'Yüksək Mərc',
      en: 'High Roller',
      ru: 'Хайроллер'
    },
    description: {
      az: 'Çayxana liderlər cədvəlində İlk 5-liyə yüksəl.',
      en: 'Reach the Top 5 on the Teahouse leaderboard.',
      ru: 'Войдите в Топ-5 таблицы лидеров Чайханы.'
    }
  },
  {
    key: 'rank_gold_1150',
    googlePlayId: 'CgkI0azQ6oUKEAIQBQ',
    xmlResourceName: 'achievement_qzl_ustad',
    type: 'standard',
    pointsXp: 15,
    name: {
      az: 'Qızıl Ustad',
      en: 'Gold Contender',
      ru: 'Золотой Игрок'
    },
    description: {
      az: 'Çayxana reytinqində 1150 xala çat (Qızıl liqa).',
      en: 'Reach 1150 rating in the Teahouse (Gold league).',
      ru: 'Достигните рейтинга 1150 в Чайхане (Золотая лига).'
    }
  },
  {
    key: 'rank_platinum_1400',
    googlePlayId: 'CgkI0azQ6oUKEAIQDA',
    xmlResourceName: 'achievement_platin_sntkar',
    type: 'standard',
    pointsXp: 25,
    name: {
      az: 'Platin Sənətkar',
      en: 'Platinum Tactician',
      ru: 'Платиновый Тактик'
    },
    description: {
      az: 'Çayxana reytinqində 1400 xala çat (Platin liqa).',
      en: 'Reach 1400 rating in the Teahouse (Platinum league).',
      ru: 'Достигните рейтинга 1400 в Чайхане (Платиновая лига).'
    }
  },
  {
    key: 'rank_diamond_1650',
    googlePlayId: 'CgkI0azQ6oUKEAIQDg',
    xmlResourceName: 'achievement_almaz_zka',
    type: 'standard',
    pointsXp: 40,
    name: {
      az: 'Almaz Zəka',
      en: 'Diamond Mind',
      ru: 'Алмазный Ум'
    },
    description: {
      az: 'Çayxana reytinqində 1650 xala çat (Almaz liqa).',
      en: 'Reach 1650 rating in the Teahouse (Diamond league).',
      ru: 'Достигните рейтинга 1650 в Чайхане (Алмазная лига).'
    }
  },
  {
    key: 'rank_master_1900',
    googlePlayId: 'CgkI0azQ6oUKEAIQCA',
    xmlResourceName: 'achievement_byk_usta',
    type: 'standard',
    pointsXp: 60,
    name: {
      az: 'Böyük Usta',
      en: 'Grand Tactician',
      ru: 'Мастер Домино'
    },
    description: {
      az: 'Çayxana reytinqində 1900 xala çat (Usta liqası).',
      en: 'Reach 1900 rating in the Teahouse (Master league).',
      ru: 'Достигните рейтинга 1900 в Чайхане (Лига Мастеров).'
    }
  },
  {
    key: 'rank_grandmaster_2200',
    googlePlayId: 'CgkI0azQ6oUKEAIQBA',
    xmlResourceName: 'achievement_qrossmeyster',
    type: 'standard',
    pointsXp: 100,
    name: {
      az: 'Qrossmeyster',
      en: 'Grandmaster',
      ru: 'Гроссмейстер'
    },
    description: {
      az: 'Çayxana reytinqində 2200 xala çat (Qrossmeyster zirvəsi).',
      en: 'Reach 2200 rating in the Teahouse (Grandmaster tier).',
      ru: 'Достигните рейтинга 2200 в Чайхане (Ранг Гроссмейстера).'
    }
  },
  {
    key: 'friends_1',
    googlePlayId: 'CgkI0azQ6oUKEAIQAw',
    xmlResourceName: 'achievement_dostluun_gc_i',
    type: 'standard',
    pointsXp: 10,
    name: {
      az: 'Dostluğun Gücü I',
      en: 'Power of Friendship I',
      ru: 'Сила Дружбы I'
    },
    description: {
      az: 'İlk dostunu əlavə et.',
      en: 'Add your first friend.',
      ru: 'Добавьте своего первого друга.'
    }
  },
  {
    key: 'friends_5',
    googlePlayId: 'CgkI0azQ6oUKEAIQCQ',
    xmlResourceName: 'achievement_dostluun_gc_ii_5_dost',
    type: 'incremental',
    steps: 5,
    pointsXp: 15,
    name: {
      az: 'Dostluğun Gücü II (5 Dost)',
      en: 'Power of Friendship II (5 Friends)',
      ru: 'Сила Дружбы II (5 друзей)'
    },
    description: {
      az: '5 dost əlavə et.',
      en: 'Add 5 friends.',
      ru: 'Добавьте 5 друзей.'
    }
  },
  {
    key: 'friends_10',
    googlePlayId: 'CgkI0azQ6oUKEAIQDQ',
    xmlResourceName: 'achievement_dostluun_gc_iii_10_dost',
    type: 'incremental',
    steps: 10,
    pointsXp: 25,
    name: {
      az: 'Dostluğun Gücü III (10 Dost)',
      en: 'Power of Friendship III (10 Friends)',
      ru: 'Сила Дружбы III (10 друзей)'
    },
    description: {
      az: '10 dost əlavə et.',
      en: 'Add 10 friends.',
      ru: 'Добавьте 10 друзей.'
    }
  },
  {
    key: 'friends_25',
    googlePlayId: 'CgkI0azQ6oUKEAIQAg',
    xmlResourceName: 'achievement_dostluun_gc_iv_25_dost',
    type: 'incremental',
    steps: 25,
    pointsXp: 35,
    name: {
      az: 'Dostluğun Gücü IV (25 Dost)',
      en: 'Power of Friendship IV (25 Friends)',
      ru: 'Сила Дружбы IV (25 друзей)'
    },
    description: {
      az: '25 dost əlavə et.',
      en: 'Add 25 friends.',
      ru: 'Добавьте 25 друзей.'
    }
  },
  {
    key: 'friends_50',
    googlePlayId: 'CgkI0azQ6oUKEAIQBg',
    xmlResourceName: 'achievement_dostluun_gc_v_50_dost',
    type: 'incremental',
    steps: 50,
    pointsXp: 50,
    name: {
      az: 'Dostluğun Gücü V (50 Dost)',
      en: 'Power of Friendship V (50 Friends)',
      ru: 'Сила Дружбы V (50 друзей)'
    },
    description: {
      az: '50 dost əlavə et.',
      en: 'Add 50 friends.',
      ru: 'Добавьте 50 друзей.'
    }
  }
];

const ACHIEVEMENTS_BY_KEY = new Map<PlayAchievementKey, PlayAchievementDefinition>(
  PLAY_ACHIEVEMENTS.map((def) => [def.key, def])
);

const GPGS_STATE_KEY = 'domino_gpgs_achievements_v1';

interface LocalGpgsState {
  unlocked: Record<string, boolean>;
  steps: Record<string, number>;
}

interface PlayGamesBridgePlugin {
  unlockAchievement?: (opts: { achievementId: string }) => Promise<unknown> | void;
  setAchievementSteps?: (opts: { achievementId: string; steps: number }) => Promise<unknown> | void;
  incrementAchievement?: (opts: { achievementId: string; steps: number }) => Promise<unknown> | void;
}

const loadLocalGpgsState = (): LocalGpgsState => {
  try {
    const raw = localStorage.getItem(GPGS_STATE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        unlocked: parsed?.unlocked && typeof parsed.unlocked === 'object' ? parsed.unlocked : {},
        steps: parsed?.steps && typeof parsed.steps === 'object' ? parsed.steps : {}
      };
    }
  } catch {
    // Ignore storage read errors
  }
  return { unlocked: {}, steps: {} };
};

const saveLocalGpgsState = (state: LocalGpgsState): void => {
  try {
    localStorage.setItem(GPGS_STATE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage write errors
  }
};

const getNativePlayGamesPlugin = (): PlayGamesBridgePlugin | null => {
  if (typeof window === 'undefined' || !isNativeMobileApp()) return null;
  const win = window as unknown as {
    Capacitor?: { Plugins?: { PlayGames?: PlayGamesBridgePlugin } };
    PlayGamesBridge?: PlayGamesBridgePlugin;
  };
  return win.Capacitor?.Plugins?.PlayGames || win.PlayGamesBridge || null;
};

/**
 * Silently unlocks a standard Google Play Games Services achievement.
 * Deduplicates calls locally so already-unlocked achievements are not spammed.
 */
export const unlockPlayAchievement = (key: PlayAchievementKey): void => {
  const def = ACHIEVEMENTS_BY_KEY.get(key);
  if (!def) return;

  const state = loadLocalGpgsState();
  if (state.unlocked[key]) return;

  state.unlocked[key] = true;
  saveLocalGpgsState(state);

  const plugin = getNativePlayGamesPlugin();
  if (!plugin?.unlockAchievement) return;

  try {
    const res = plugin.unlockAchievement({ achievementId: def.googlePlayId });
    if (res && typeof (res as Promise<unknown>).catch === 'function') {
      (res as Promise<unknown>).catch(() => {});
    }
  } catch {
    // Fail silently so gameplay is never interrupted
  }
};

/**
 * Updates step progress on an incremental Google Play achievement (monotonic).
 */
export const setPlayAchievementSteps = (key: PlayAchievementKey, currentSteps: number): void => {
  const def = ACHIEVEMENTS_BY_KEY.get(key);
  if (!def || def.type !== 'incremental' || !def.steps || currentSteps <= 0) return;

  const clampedSteps = Math.min(def.steps, Math.max(0, Math.floor(currentSteps)));
  const state = loadLocalGpgsState();
  const prevSteps = typeof state.steps[key] === 'number' ? state.steps[key] : 0;

  if (clampedSteps <= prevSteps) return;

  state.steps[key] = clampedSteps;
  if (clampedSteps >= def.steps) {
    state.unlocked[key] = true;
  }
  saveLocalGpgsState(state);

  const plugin = getNativePlayGamesPlugin();
  if (!plugin) return;

  try {
    if (plugin.setAchievementSteps) {
      const res = plugin.setAchievementSteps({
        achievementId: def.googlePlayId,
        steps: clampedSteps
      });
      if (res && typeof (res as Promise<unknown>).catch === 'function') {
        (res as Promise<unknown>).catch(() => {});
      }
    } else if (plugin.incrementAchievement) {
      const delta = clampedSteps - prevSteps;
      if (delta > 0) {
        const res = plugin.incrementAchievement({
          achievementId: def.googlePlayId,
          steps: delta
        });
        if (res && typeof (res as Promise<unknown>).catch === 'function') {
          (res as Promise<unknown>).catch(() => {});
        }
      }
    }
  } catch {
    // Fail silently so gameplay is never interrupted
  }
};

const RANK_ACHIEVEMENT_MILESTONES: ReadonlyArray<{ minMmr: number; key: PlayAchievementKey }> = [
  { minMmr: 1150, key: 'rank_gold_1150' },
  { minMmr: 1400, key: 'rank_platinum_1400' },
  { minMmr: 1650, key: 'rank_diamond_1650' },
  { minMmr: 1900, key: 'rank_master_1900' },
  { minMmr: 2200, key: 'rank_grandmaster_2200' }
];

/**
 * Unlocks any Teahouse rank milestone achievement reached at the given MMR rating.
 */
export const checkRankAchievements = (mmr: number): void => {
  if (typeof mmr !== 'number' || !Number.isFinite(mmr)) return;
  for (const milestone of RANK_ACHIEVEMENT_MILESTONES) {
    if (mmr >= milestone.minMmr) {
      unlockPlayAchievement(milestone.key);
    }
  }
};

/**
 * Syncs first-friend and incremental 5/10/25/50 friend achievements with Play Games.
 */
export const syncFriendAchievements = (friendsCount: number): void => {
  if (typeof friendsCount !== 'number' || !Number.isFinite(friendsCount) || friendsCount < 1) {
    return;
  }
  unlockPlayAchievement('friends_1');
  setPlayAchievementSteps('friends_5', friendsCount);
  setPlayAchievementSteps('friends_10', friendsCount);
  setPlayAchievementSteps('friends_25', friendsCount);
  setPlayAchievementSteps('friends_50', friendsCount);
};
