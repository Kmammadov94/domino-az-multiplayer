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
  railBorderClass: string;
  patternType: 'felt' | 'carpet' | 'velvet' | 'wood';
  previewColor: string;
  accentColor: string;
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
    feltClass: 'bg-radial from-[#1e5832] via-[#154726] to-[#0a2313]',
    railBorderClass: 'border-[#29170a]',
    patternType: 'felt',
    previewColor: '#1e5832',
    accentColor: '#4ade80'
  },
  {
    id: 'shirvan_carpet',
    name: {
      az: 'Quba & Şirvan Xalçası',
      ru: 'Ковер Куба и Ширван',
      en: 'Shirvan Carpet'
    },
    desc: {
      az: 'Milli buta və qədim həndəsi naxışlı zərif xalça',
      ru: 'Азербайджанский ковровый узор с бута',
      en: 'Azerbaijani carpet with traditional buta motifs'
    },
    feltClass: 'bg-radial from-[#801b1b] via-[#521010] to-[#250606]',
    railBorderClass: 'border-[#381105]',
    patternType: 'carpet',
    previewColor: '#801b1b',
    accentColor: '#f87171'
  },
  {
    id: 'midnight_gold',
    name: {
      az: 'Gecə Məxməri & Qızıl',
      ru: 'Полуночный бархат и золото',
      en: 'Midnight Velvet & Gold'
    },
    desc: {
      az: 'Elit VIP gecə stolu və qızılı zolaqlar',
      ru: 'Элитный ночной VIP стол с золотом',
      en: 'Luxury midnight velvet with gold borders'
    },
    feltClass: 'bg-radial from-[#141d33] via-[#0c1221] to-[#04060c]',
    railBorderClass: 'border-amber-900/80',
    patternType: 'velvet',
    previewColor: '#141d33',
    accentColor: '#fbbf24'
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
      en: 'Polished walnut wood table'
    },
    feltClass: 'bg-radial from-[#4a2e18] via-[#331c0a] to-[#1a0e05]',
    railBorderClass: 'border-[#241306]',
    patternType: 'wood',
    previewColor: '#4a2e18',
    accentColor: '#fb923c'
  }
];

export const DEFAULT_TABLE_THEME_ID = 'classic_green';
