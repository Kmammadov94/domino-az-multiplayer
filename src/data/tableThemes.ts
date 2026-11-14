export interface TableTheme {
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
  feltClass: string;
  feltGradient: string;
  railBorderClass: string;
  patternType: 'felt' | 'carpet' | 'velvet' | 'wood';
  previewColor: string;
  accentColor: string;
  price: number;
  unlockedByDefault?: boolean;
}

export const TABLE_THEMES: TableTheme[] = [
  {
    id: 'classic_green',
    name: {
      az: 'Klassik Yaşıl Çuxa',
      ru: 'Классическое зеленое сукно',
      en: 'Classic Green Baize'
    },
    desc: {
      az: 'Rəsmi domino turniri və çayxana masası',
      ru: 'Официальный турнирный стол и чайхана',
      en: 'Official domino tournament felt'
    },
    feltClass: 'bg-gradient-to-br from-[#1e5832] via-[#154726] to-[#0a2313]',
    feltGradient: 'radial-gradient(circle at center, #246b3d 0%, #154726 55%, #091f11 100%)',
    railBorderClass: 'border-[#29170a]',
    patternType: 'felt',
    previewColor: '#246b3d',
    accentColor: '#4ade80',
    price: 0,
    unlockedByDefault: true
  },
  {
    id: 'shirvan_carpet',
    name: {
      az: 'Quba & Şirvan Xalçası',
      ru: 'Ковер Куба и Ширван',
      en: 'Shirvan Carpet'
    },
    desc: {
      az: 'Milli buta və qədim həndəsi naxışlı qırmızı xalça',
      ru: 'Азербайджанский красный ковровый узор с бута',
      en: 'Crimson Azerbaijani carpet with traditional motifs'
    },
    feltClass: 'bg-gradient-to-br from-[#8b1e1e] via-[#591111] to-[#2a0707]',
    feltGradient: 'radial-gradient(circle at center, #912121 0%, #591111 55%, #260606 100%)',
    railBorderClass: 'border-[#381105]',
    patternType: 'carpet',
    previewColor: '#912121',
    accentColor: '#f87171',
    price: 500
  },
  {
    id: 'midnight_gold',
    name: {
      az: 'Gecə Məxməri & Qızıl',
      ru: 'Полуночный бархат и золото',
      en: 'Midnight Velvet & Gold'
    },
    desc: {
      az: 'Dərin göy VIP gecə stolu və qızılı zolaqlar',
      ru: 'Элитный тёмно-синий VIP стол с золотом',
      en: 'Deep navy VIP velvet with gold borders'
    },
    feltClass: 'bg-gradient-to-br from-[#1a2a52] via-[#0f1933] to-[#050814]',
    feltGradient: 'radial-gradient(circle at center, #1e3263 0%, #101b38 55%, #050917 100%)',
    railBorderClass: 'border-amber-900/80',
    patternType: 'velvet',
    previewColor: '#1e3263',
    accentColor: '#fbbf24',
    price: 400
  },
  {
    id: 'antique_wood',
    name: {
      az: 'Qədim Qoz Ağacı (Nərd)',
      ru: 'Античный орех (Нарды)',
      en: 'Antique Walnut Wood'
    },
    desc: {
      az: 'Təbii cilalanmış qoz ağacı və nərd haşiyəsi',
      ru: 'Полированное ореховое дерево',
      en: 'Polished warm walnut wood table'
    },
    feltClass: 'bg-gradient-to-br from-[#5c381c] via-[#3d220e] to-[#1f1005]',
    feltGradient: 'radial-gradient(circle at center, #663f20 0%, #3d220e 55%, #1c0e04 100%)',
    railBorderClass: 'border-[#241306]',
    patternType: 'wood',
    previewColor: '#663f20',
    accentColor: '#fb923c',
    price: 250
  },
  {
    id: 'caspian_teal',
    name: {
      az: 'Xəzər Firuzəsi',
      ru: 'Каспийская бирюза',
      en: 'Caspian Teal'
    },
    desc: {
      az: 'Dəniz dalğası rəngli zərif firuzəyi çuxa',
      ru: 'Бирюзовое сукно цвета Каспийского моря',
      en: 'Rich Caspian Sea turquoise baize'
    },
    feltClass: 'bg-gradient-to-br from-[#0f646b] via-[#0a4348] to-[#042124]',
    feltGradient: 'radial-gradient(circle at center, #137880 0%, #0a464c 55%, #042024 100%)',
    railBorderClass: 'border-[#082f33]',
    patternType: 'felt',
    previewColor: '#137880',
    accentColor: '#2dd4bf',
    price: 150
  },
  {
    id: 'royal_purple',
    name: {
      az: 'Şah Bənövşəyi',
      ru: 'Королевский пурпур',
      en: 'Royal Amethyst'
    },
    desc: {
      az: 'Dərin bənövşəyi məxmər və gümüşü parıltı',
      ru: 'Глубокий королевский фиолетовый бархат',
      en: 'Deep royal purple velvet table'
    },
    feltClass: 'bg-gradient-to-br from-[#522273] via-[#36144d] to-[#190726]',
    feltGradient: 'radial-gradient(circle at center, #5c2782 0%, #36144d 55%, #180624 100%)',
    railBorderClass: 'border-[#2e1042]',
    patternType: 'velvet',
    previewColor: '#5c2782',
    accentColor: '#c084fc',
    price: 350
  },
  {
    id: 'baku_amber',
    name: {
      az: 'İçərişəhər Kəhrəbası',
      ru: 'Янтарь Ичери-Шехер',
      en: 'Old City Amber'
    },
    desc: {
      az: 'İsti qum və kəhrəba çalarlı klassik masa',
      ru: 'Тёплый янтарно-песчаный классический стол',
      en: 'Warm amber sandstone board surface'
    },
    feltClass: 'bg-gradient-to-br from-[#82581b] via-[#593a0e] to-[#2b1b05]',
    feltGradient: 'radial-gradient(circle at center, #8f621e 0%, #593a0e 55%, #291904 100%)',
    railBorderClass: 'border-[#3b2507]',
    patternType: 'wood',
    previewColor: '#8f621e',
    accentColor: '#facc15',
    price: 200
  },
  {
    id: 'emerald_oasis',
    name: {
      az: 'Zümrüd Bağçası',
      ru: 'Изумрудный сад',
      en: 'Emerald Oasis'
    },
    desc: {
      az: 'Canlı və parlaq zümrüd yaşılı oyun masası',
      ru: 'Яркое изумрудное сукно для комфортной игры',
      en: 'Vibrant emerald green tournament felt'
    },
    feltClass: 'bg-gradient-to-br from-[#0e754e] via-[#094f34] to-[#042619]',
    feltGradient: 'radial-gradient(circle at center, #11875a 0%, #095236 55%, #042619 100%)',
    railBorderClass: 'border-[#073825]',
    patternType: 'felt',
    previewColor: '#11875a',
    accentColor: '#34d399',
    price: 150
  },
  {
    id: 'burgundy_wine',
    name: {
      az: 'Şərab Məxməri',
      ru: 'Бордовый бархат',
      en: 'Burgundy Velvet'
    },
    desc: {
      az: 'Tünd zoğalı-şərab rəngli lüks məxmər örtük',
      ru: 'Роскошный стол оттенка бордо',
      en: 'Rich burgundy plum velvet surface'
    },
    feltClass: 'bg-gradient-to-br from-[#6e1a3c] via-[#4a0f27] to-[#240612]',
    feltGradient: 'radial-gradient(circle at center, #7a1d43 0%, #4a0f27 55%, #210511 100%)',
    railBorderClass: 'border-[#33091a]',
    patternType: 'velvet',
    previewColor: '#7a1d43',
    accentColor: '#fb7185',
    price: 250
  },
  {
    id: 'obsidian_slate',
    name: {
      az: 'Qara Mərmər',
      ru: 'Чёрный сланец',
      en: 'Obsidian Slate'
    },
    desc: {
      az: 'Minimalist tünd boz-qrafit müasir masa',
      ru: 'Современный минималистичный графитовый стол',
      en: 'Sleek charcoal slate board surface'
    },
    feltClass: 'bg-gradient-to-br from-[#303846] via-[#1f2530] to-[#0e1117]',
    feltGradient: 'radial-gradient(circle at center, #384252 0%, #1f2530 55%, #0d1016 100%)',
    railBorderClass: 'border-slate-700/90',
    patternType: 'velvet',
    previewColor: '#384252',
    accentColor: '#94a3b8',
    price: 300
  }
];

export const DEFAULT_TABLE_THEME_ID = 'classic_green';
