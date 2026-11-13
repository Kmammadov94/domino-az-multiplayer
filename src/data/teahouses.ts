import { Language } from '../types/domino';

export interface TeahouseTierConfig {
  id: string;
  name: { az: string; ru: string; en: string };
  location: { az: string; ru: string; en: string };
  desc: { az: string; ru: string; en: string };
  buyIn: number;
  prizePot: number; // 2 * buyIn with 10% house cut
  bgGradient: string;
  borderAccent: string;
  icon: string;
}

export const TEAHOUSE_TIERS: TeahouseTierConfig[] = [
  {
    id: 'heveskar',
    name: { az: 'Həvəskarlar Çayxanası', ru: 'Любительская Чайхана', en: 'Amateur Teahouse' },
    location: { az: 'Samovar Çayı & 1v1', ru: 'Чай у самовара • 1на1', en: 'Samovar Tea • 1v1' },
    desc: {
      az: 'Reytinq oyunlarına başlamaq üçün ən münasib 1v1 çayxana masası.',
      ru: 'Доступный рейтинговый стол 1на1 для старта в чайхане.',
      en: 'Entry-level ranked 1v1 table to start climbing the leaderboard.'
    },
    buyIn: 25,
    prizePot: 45,
    bgGradient: 'from-teal-950/80 via-slate-900 to-teal-900/60',
    borderAccent: 'border-teal-500/40',
    icon: '☕'
  },
  {
    id: 'ustalar',
    name: { az: 'Ustalar Masası', ru: 'Стол Мастеров', en: 'Masters Table' },
    location: { az: 'Taktiki Arena • 1v1', ru: 'Тактическая арена • 1на1', en: 'Tactical Arena • 1v1' },
    desc: {
      az: 'Təcrübəli oyunçular və daha yüksək mükafatlar üçün reytinq masası.',
      ru: 'Рейтинговый стол для опытных игроков с повышенным призом.',
      en: 'Ranked table for experienced players with higher stakes.'
    },
    buyIn: 100,
    prizePot: 180,
    bgGradient: 'from-amber-950/80 via-slate-900 to-amber-900/60',
    borderAccent: 'border-amber-500/40',
    icon: '🏆'
  },
  {
    id: 'qizil_zal',
    name: { az: 'Qızıl Reytinq Zalı', ru: 'Золотой Зал', en: 'Golden Ranked Hall' },
    location: { az: 'Orta-Yüksək Mərc • 1v1', ru: 'Крупные ставки • 1на1', en: 'Mid-High Stakes • 1v1' },
    desc: {
      az: 'Ciddi rəqabət və böyük mükafat fondu sevənlər üçün qızıl zal.',
      ru: 'Престижный зал для серьёзной борьбы и крупных наград.',
      en: 'Prestigious hall for serious competition and big coin pots.'
    },
    buyIn: 200,
    prizePot: 360,
    bgGradient: 'from-purple-950/80 via-slate-900 to-indigo-950/60',
    borderAccent: 'border-purple-500/40',
    icon: '⭐'
  },
  {
    id: 'elitar_cempionlar',
    name: { az: 'Çempionlar Klubu', ru: 'Клуб Чемпионов', en: 'Champions Club' },
    location: { az: 'Elit Arena • 1v1', ru: 'Элитная арена • 1на1', en: 'Elite Arena • 1v1' },
    desc: {
      az: 'Ən yüksək mərc və ən böyük mükafatlar üçün çempionlar masası.',
      ru: 'Самые высокие ставки и главный приз для чемпионов.',
      en: 'Top-stakes ranked table with the biggest prize pool.'
    },
    buyIn: 500,
    prizePot: 900,
    bgGradient: 'from-rose-950/80 via-slate-900 to-amber-950/70',
    borderAccent: 'border-rose-500/50',
    icon: '👑'
  }
];

export function getTeahouseTierById(tierId?: string): TeahouseTierConfig | undefined {
  if (!tierId) return undefined;
  return TEAHOUSE_TIERS.find((t) => t.id === tierId);
}

export const DEFAULT_RANKED_MMR = 1000;
export const MIN_RANKED_MMR = 100;

export interface RankTierInfo {
  id: string;
  minMmr: number;
  icon: string;
  colorClass: string;
  badgeBgClass: string;
  name: Record<Language, string>;
}

export const RANK_TIERS: RankTierInfo[] = [
  {
    id: 'grandmaster',
    minMmr: 2200,
    icon: '👑',
    colorClass: 'text-rose-300',
    badgeBgClass: 'bg-rose-500/20 border-rose-400/50 text-rose-200',
    name: { az: 'Qrossmeyster', ru: 'Гроссмейстер', en: 'Grandmaster' }
  },
  {
    id: 'master',
    minMmr: 1900,
    icon: '🔥',
    colorClass: 'text-amber-300',
    badgeBgClass: 'bg-amber-500/20 border-amber-400/50 text-amber-200',
    name: { az: 'Usta', ru: 'Мастер', en: 'Master' }
  },
  {
    id: 'diamond',
    minMmr: 1650,
    icon: '💎',
    colorClass: 'text-cyan-300',
    badgeBgClass: 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200',
    name: { az: 'Almaz', ru: 'Алмаз', en: 'Diamond' }
  },
  {
    id: 'platinum',
    minMmr: 1400,
    icon: '💠',
    colorClass: 'text-emerald-300',
    badgeBgClass: 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200',
    name: { az: 'Platin', ru: 'Платина', en: 'Platinum' }
  },
  {
    id: 'gold',
    minMmr: 1150,
    icon: '🥇',
    colorClass: 'text-yellow-300',
    badgeBgClass: 'bg-yellow-500/20 border-yellow-400/50 text-yellow-200',
    name: { az: 'Qızıl', ru: 'Золото', en: 'Gold' }
  },
  {
    id: 'silver',
    minMmr: 900,
    icon: '🥈',
    colorClass: 'text-slate-200',
    badgeBgClass: 'bg-slate-400/20 border-slate-300/40 text-slate-200',
    name: { az: 'Gümüş', ru: 'Серебро', en: 'Silver' }
  },
  {
    id: 'bronze',
    minMmr: 0,
    icon: '🥉',
    colorClass: 'text-orange-300',
    badgeBgClass: 'bg-orange-500/20 border-orange-400/40 text-orange-200',
    name: { az: 'Bürünc', ru: 'Бронза', en: 'Bronze' }
  }
];

export function getRankTierForMmr(mmr: number = DEFAULT_RANKED_MMR): RankTierInfo {
  const safeMmr = Number.isFinite(mmr) ? mmr : DEFAULT_RANKED_MMR;
  return RANK_TIERS.find((tier) => safeMmr >= tier.minMmr) || RANK_TIERS[RANK_TIERS.length - 1];
}

export function calculateEloUpdate(
  playerMmr: number,
  opponentMmr: number,
  won: boolean,
  rankedPlayed: number
): { nextMmr: number; delta: number } {
  const current = Number.isFinite(playerMmr) ? playerMmr : DEFAULT_RANKED_MMR;
  const opp = Number.isFinite(opponentMmr) ? opponentMmr : DEFAULT_RANKED_MMR;
  const k = rankedPlayed < 15 ? 32 : 24;
  const expected = 1 / (1 + Math.pow(10, (opp - current) / 400));
  const actual = won ? 1 : 0;
  const rawDelta = Math.round(k * (actual - expected));
  const nextMmr = Math.max(MIN_RANKED_MMR, current + rawDelta);
  return {
    nextMmr,
    delta: nextMmr - current
  };
}
