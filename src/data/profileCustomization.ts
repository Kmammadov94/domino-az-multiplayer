export interface AvatarFrame {
  id: string;
  name: {
    az: string;
    ru: string;
    en: string;
  };
  desc: {
    az: string;
    ru: string;
    en: string;
  };
  price: number;
  borderClass: string;
  badge?: string;
  glow?: string;
}

export interface PlayerTitle {
  id: string;
  title: {
    az: string;
    ru: string;
    en: string;
  };
  price: number;
  badgeColor: string;
  icon?: string;
}

export const AVATAR_FRAMES: AvatarFrame[] = [
  {
    id: 'frame_none',
    name: { az: 'Sadə Haşiyə', ru: 'Простая рамка', en: 'Simple Ring' },
    desc: { az: 'Klassik dairəvi profil haşiyəsi', ru: 'Обычная круглая рамка', en: 'Standard circular ring' },
    price: 0,
    borderClass: 'border-slate-500/60'
  },
  {
    id: 'frame_silver',
    name: { az: 'Gümüş Qalxan', ru: 'Серебряный щит', en: 'Silver Shield' },
    desc: { az: 'Cilalanmış parlaq gümüşü metal haşiyə', ru: 'Полированное серебро', en: 'Polished silver metallic ring' },
    price: 250,
    borderClass: 'border-slate-200 ring-2 ring-slate-400 shadow-[0_0_12px_rgba(226,232,240,0.6)]'
  },
  {
    id: 'frame_gold',
    name: { az: 'Qızıl Çələng', ru: 'Золотой венок', en: 'Golden Wreath' },
    desc: { az: '24K parlaq qızılı dəbdəbəli tac çərçivəsi', ru: 'Золотая корона 24K', en: '24K lustrous gold ring' },
    price: 600,
    borderClass: 'border-amber-400 ring-2 ring-amber-300 shadow-[0_0_16px_rgba(251,191,36,0.85)]',
    badge: '👑',
    glow: '#f59e0b'
  },
  {
    id: 'frame_buta',
    name: { az: 'Şirvan Butası', ru: 'Ширванская Бута', en: 'Shirvan Buta' },
    desc: { az: 'Milli zümrüd yaşılı buta naxışlı çərçivə', ru: 'Изумрудный узор Бута', en: 'Traditional emerald Buta pattern ring' },
    price: 900,
    borderClass: 'border-emerald-400 ring-2 ring-emerald-300 shadow-[0_0_16px_rgba(52,211,153,0.8)]',
    badge: '🌿',
    glow: '#10b981'
  },
  {
    id: 'frame_fire',
    name: { az: 'Odlar Yurdu Alovu', ru: 'Огонь Страны Огней', en: 'Land of Fire' },
    desc: { az: 'Azərbaycanın sönməz alovları və parlaq kəhrəba işığı', ru: 'Вечное пламя и янтарь', en: 'Blazing eternal amber flame ring' },
    price: 1500,
    borderClass: 'border-orange-500 ring-2 ring-amber-400 shadow-[0_0_20px_rgba(249,115,22,0.9)] animate-pulse',
    badge: '🔥',
    glow: '#f97316'
  }
];

export const PLAYER_TITLES: PlayerTitle[] = [
  {
    id: 'title_tea_elder',
    title: { az: 'Çayxana Ağsaqqalı', ru: 'Аксакал Чайханы', en: 'Teahouse Elder' },
    price: 0,
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    icon: '☕'
  },
  {
    id: 'title_telecom_master',
    title: { az: 'Telefon Ustası', ru: 'Мастер Телефона', en: 'Telefon Master' },
    price: 250,
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    icon: '📞'
  },
  {
    id: 'title_block_monster',
    title: { az: 'Blok Canavarı', ru: 'Монстр Блокировки', en: 'Block Monster' },
    price: 400,
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    icon: '🔒'
  },
  {
    id: 'title_hunter_35',
    title: { az: '35 Ovçusu', ru: 'Охотник за 35', en: '35 Hunter' },
    price: 600,
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    icon: '🎯'
  },
  {
    id: 'title_novkhani_guest',
    title: { az: 'Fəxri Qonaq', ru: 'Почетный Гость', en: 'Honored Guest' },
    price: 200,
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    icon: '☕'
  },
  {
    id: 'title_black_double',
    title: { az: 'Qara Qoşa', ru: 'Черный Дубль', en: 'Black Double' },
    price: 800,
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    icon: '🎲'
  },
  {
    id: 'title_baku_lion',
    title: { az: 'Masa Aslanı', ru: 'Лев Стола', en: 'Table Lion' },
    price: 1200,
    badgeColor: 'bg-amber-500/30 text-amber-200 border-amber-400 shadow-sm',
    icon: '🦁'
  }
];

export const DEFAULT_FRAME_ID = 'frame_none';
export const DEFAULT_TITLE_ID = 'title_tea_elder';
