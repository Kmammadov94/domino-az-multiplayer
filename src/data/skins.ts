import { DominoSkin } from '../types/domino';

export const DOMINO_SKINS: DominoSkin[] = [
  // 1. Classic Ivory (Default)
  {
    id: 'ivory_classic',
    name: {
      az: 'Klassik Sümük',
      ru: 'Классическая кость',
      en: 'Classic Ivory'
    },
    desc: {
      az: 'Ənənəvi çayxana üslubunda fil sümüyü rəngli daşlar.',
      ru: 'Традиционные кости цвета слоновой кости в стиле классических чайхан.',
      en: 'Traditional ivory-colored dominoes styled for classic teahouses.'
    },
    price: 0,
    unlockedByDefault: true,
    category: 'classic',
    bgGradient: 'from-amber-50 to-stone-200',
    tileFace: '#fcf8eb',
    tileBorder: '#27201b',
    pipColor: '#171412',
    accentPipColor: '#dc2626',
    spinnerColor: '#c59b27'
  },
  // 2. Ebony Dark
  {
    id: 'ebony_dark',
    name: {
      az: 'Qara Abanos',
      ru: 'Чёрный Эбонит',
      en: 'Dark Ebony'
    },
    desc: {
      az: 'Dərin cilalanmış qara ağac və parlaq gümüşü gözlər.',
      ru: 'Глубокое полированное чёрное дерево со сверкающими серебряными точками.',
      en: 'Deep polished black wood with brilliant silver pips.'
    },
    price: 20,
    category: 'classic',
    bgGradient: 'from-zinc-800 to-zinc-950',
    tileFace: '#1c1c1f',
    tileBorder: '#4a4a52',
    pipColor: '#f1f5f9',
    accentPipColor: '#38bdf8',
    spinnerColor: '#e2e8f0'
  },
  // 3. Vintage Teahouse Wood
  {
    id: 'vintage_tea',
    name: {
      az: 'Çayxana Əntiq',
      ru: 'Чайхана Винтаж',
      en: 'Teahouse Antique'
    },
    desc: {
      az: 'Köhnə çayxanaların nostalji ab-havasını verən taxta daşlar.',
      ru: 'Аутентичные деревянные кости с атмосферой старинной чайханы.',
      en: 'Weathered vintage wood dominoes reminiscent of historic teahouses.'
    },
    price: 20,
    category: 'baku',
    bgGradient: 'from-amber-900 to-yellow-950',
    tileFace: '#4a2810',
    tileBorder: '#231206',
    pipColor: '#fde047',
    accentPipColor: '#38bdf8',
    spinnerColor: '#d97706'
  },
  // 4. Walnut Wood
  {
    id: 'baku_walnut',
    name: {
      az: 'Nəcib Qoz Ağacı',
      ru: 'Ореховое Дерево',
      en: 'Noble Walnut'
    },
    desc: {
      az: 'Qoz ağacından oyulmuş qədim usta sənəti.',
      ru: 'Вырезанный из орехового дерева антикварный набор мастеров.',
      en: 'Masterfully carved walnut wood with aged brass accents.'
    },
    price: 20,
    category: 'baku',
    bgGradient: 'from-yellow-900 to-stone-900',
    tileFace: '#5c3a21',
    tileBorder: '#382010',
    pipColor: '#fef3c7',
    accentPipColor: '#e11d48',
    spinnerColor: '#fbbf24'
  },
  // 5. Royal Gold
  {
    id: 'royal_gold',
    name: {
      az: 'Şah Qızılı',
      ru: 'Королевское Золото',
      en: 'Royal Gold'
    },
    desc: {
      az: '24 əyarlı parıldayan qızıl zərli şahənə dəst.',
      ru: 'Роскошный позолоченный набор высшей пробы.',
      en: 'Opulent shimmering 24-karat gold with ruby-tinted pips.'
    },
    price: 20,
    category: 'luxury',
    bgGradient: 'from-amber-400 to-yellow-600',
    tileFace: '#eab308',
    tileBorder: '#854d0e',
    pipColor: '#451a03',
    accentPipColor: '#dc2626',
    spinnerColor: '#b91c1c',
    glowEffect: '0 0 15px rgba(234, 179, 8, 0.6)'
  },
  // 6. Emerald Velvet
  {
    id: 'emerald_velvet',
    name: {
      az: 'Zümrüd Yaşılı',
      ru: 'Изумрудный Бархат',
      en: 'Emerald Velvet'
    },
    desc: {
      az: 'Dəbdəbəli zümrüd yaşılı daşlar və mirvari nöqtələr.',
      ru: 'Изумрудно-зеленые камни с жемчужными точками.',
      en: 'Lush emerald green stone with luminous pearl pips.'
    },
    price: 20,
    category: 'luxury',
    bgGradient: 'from-emerald-700 to-emerald-950',
    tileFace: '#064e3b',
    tileBorder: '#022c22',
    pipColor: '#f0fdf4',
    accentPipColor: '#38bdf8',
    spinnerColor: '#fbbf24',
    glowEffect: '0 0 12px rgba(16, 185, 129, 0.4)'
  },
  // 7. Azerbaijan National Flag Skin (Milli Bayraq)
  {
    id: 'azerbaijan_flag',
    name: {
      az: 'Azərbaycan Bayrağı',
      ru: 'Флаг Азербайджана',
      en: 'Azerbaijan Flag'
    },
    desc: {
      az: 'Milli üçrəngli bayrağımız, ay-ulduz və qızılı zərli mərkəz.',
      ru: 'Национальный триколор с полумесяцем, звездой и золотым центром.',
      en: 'National tricolor with crescent, star, and polished gold pin.'
    },
    price: 0,
    unlockedByDefault: true,
    category: 'baku',
    bgGradient: 'from-sky-500 via-rose-600 to-emerald-600',
    tileFace: '#0092bc',
    tileBorder: '#0f172a',
    pipColor: '#ffffff',
    accentPipColor: '#fbbf24',
    spinnerColor: '#f59e0b',
    glowEffect: '0 0 14px rgba(228, 0, 43, 0.45)',
    isFlagSkin: true,
    flagType: 'azerbaijan'
  },
  // 8. Blue & Yellow Duotone Skin (Mavi & Sarı)
  {
    id: 'ukraine_flag',
    name: {
      az: 'Mavi & Sarı',
      ru: 'Синий и Жёлтый',
      en: 'Blue & Yellow'
    },
    desc: {
      az: 'Göy səma və parlaq sarı rənglərin ahəngi olan xüsusi dəst.',
      ru: 'Гармония ярко-синего и золотисто-жёлтого цветов.',
      en: 'Harmony of deep sky blue and golden yellow colors.'
    },
    price: 0,
    unlockedByDefault: true,
    category: 'modern',
    bgGradient: 'from-blue-600 via-sky-500 to-yellow-400',
    tileFace: '#0057b7',
    tileBorder: '#0f172a',
    pipColor: '#ffffff',
    accentPipColor: '#dc2626',
    spinnerColor: '#ffd700',
    glowEffect: '0 0 14px rgba(0, 87, 183, 0.55)',
    isFlagSkin: true,
    flagType: 'ukraine'
  },
  // 8. Ruby Flame (Odlar Yurdu)
  {
    id: 'ruby_flame',
    name: {
      az: 'Odlar Yurdu Yaqutu',
      ru: 'Рубин Страны Огней',
      en: 'Land of Fire Ruby'
    },
    desc: {
      az: 'Azərbaycanın sönməz alovlarından ilhamlanmış yaqut dəsti.',
      ru: 'Рубиновый комплект, вдохновленный вечными огнями Азербайджана.',
      en: 'Fiery crimson ruby inspired by the eternal fires of Azerbaijan.'
    },
    price: 20,
    category: 'baku',
    bgGradient: 'from-red-700 to-red-950',
    tileFace: '#7f1d1d',
    tileBorder: '#450a0a',
    pipColor: '#fef08a',
    accentPipColor: '#38bdf8',
    spinnerColor: '#f59e0b',
    glowEffect: '0 0 14px rgba(239, 68, 68, 0.5)'
  },
  // 8. Caspian Sapphire
  {
    id: 'caspian_sapphire',
    name: {
      az: 'Xəzər Yaqutu (Səfir)',
      ru: 'Каспийский Сапфир',
      en: 'Caspian Sapphire'
    },
    desc: {
      az: 'Xəzər dənizinin mavi dərinliklərini əks etdirən kristal.',
      ru: 'Глубокий синий сапфир глубин Каспийского моря.',
      en: 'Deep maritime blue evoking the depths of the Caspian Sea.'
    },
    price: 20,
    category: 'luxury',
    bgGradient: 'from-blue-700 to-blue-950',
    tileFace: '#172554',
    tileBorder: '#0f172a',
    pipColor: '#e0f2fe',
    accentPipColor: '#fbbf24',
    spinnerColor: '#38bdf8',
    glowEffect: '0 0 12px rgba(59, 130, 246, 0.4)'
  },
  // 9. Royal Amethyst
  {
    id: 'royal_amethyst',
    name: {
      az: 'Şahzadə Ametisti',
      ru: 'Королевский Аметист',
      en: 'Royal Amethyst'
    },
    desc: {
      az: 'Əsrarəngiz bənövşəyi ametist kristalları və qızıl uclar.',
      ru: 'Загадочный фиолетовый аметист с золотистыми деталями.',
      en: 'Mystical purple amethyst crystal with polished gold center.'
    },
    price: 20,
    category: 'luxury',
    bgGradient: 'from-purple-800 to-purple-950',
    tileFace: '#3b0764',
    tileBorder: '#2e1065',
    pipColor: '#fae8ff',
    accentPipColor: '#facc15',
    spinnerColor: '#facc15'
  },
  // 10. Diamond Platinum
  {
    id: 'diamond_platinum',
    name: {
      az: 'Almaz Platin',
      ru: 'Алмазная Платина',
      en: 'Diamond Platinum'
    },
    desc: {
      az: 'Buz kimi bərq vuran platin və kəskin firuzəyi parıltı.',
      ru: 'Ледяной платиновый блеск с лазурным сиянием.',
      en: 'Ice-cool mirror platinum with bright cyan insets.'
    },
    price: 20,
    category: 'luxury',
    bgGradient: 'from-slate-300 to-slate-500',
    tileFace: '#cbd5e1',
    tileBorder: '#475569',
    pipColor: '#0284c7',
    accentPipColor: '#dc2626',
    spinnerColor: '#0ea5e9',
    glowEffect: '0 0 15px rgba(14, 165, 233, 0.5)'
  },
  // 11. Karabakh Silk
  {
    id: 'karabakh_silk',
    name: {
      az: 'Qarabağ İpəyi',
      ru: 'Карабахский Шёлк',
      en: 'Karabakh Silk'
    },
    desc: {
      az: 'Qarabağ xalçaçılıq və ipəkçilik ənənələrinin zərif naxışları.',
      ru: 'Узоры и мотивы вековых карабахских ковров и шелка.',
      en: 'Rich terracotta hues and ornamental motifs of Karabakh heritage.'
    },
    price: 20,
    category: 'baku',
    bgGradient: 'from-amber-700 to-orange-950',
    tileFace: '#7c2d12',
    tileBorder: '#431407',
    pipColor: '#ffedd5',
    accentPipColor: '#38bdf8',
    spinnerColor: '#f97316'
  },
  // 12. Sheki Shabaka
  {
    id: 'sheki_shabaka',
    name: {
      az: 'Şəki Şəbəkəsi',
      ru: 'Шекинское Шебеке',
      en: 'Sheki Stained Glass'
    },
    desc: {
      az: 'Şəki Xan Sarayının mismarsız vitraj sənətinin rəngarəngliyi.',
      ru: 'Витражное мастерство шебеке Ханского дворца в Шеки.',
      en: 'Vibrant geometric stained-glass palette inspired by Sheki Palace.'
    },
    price: 20,
    category: 'baku',
    bgGradient: 'from-cyan-800 to-amber-900',
    tileFace: '#0f3a40',
    tileBorder: '#082327',
    pipColor: '#fef08a',
    accentPipColor: '#e11d48',
    spinnerColor: '#ef4444'
  },
  // 13. Gobustan Stone
  {
    id: 'gobustan_stone',
    name: {
      az: 'Qobustan Qayası',
      ru: 'Скалы Гобустана',
      en: 'Gobustan Petroglyph'
    },
    desc: {
      az: 'Minillik qayaüstü təsvirlər və daş dövrünün ruhu.',
      ru: 'Каменная текстура наскальных рисунков Гобустана.',
      en: 'Ancient petroglyph stone texture etched with historic marks.'
    },
    price: 20,
    category: 'baku',
    bgGradient: 'from-stone-600 to-stone-900',
    tileFace: '#57534e',
    tileBorder: '#292524',
    pipColor: '#e7e5e4',
    accentPipColor: '#f97316',
    spinnerColor: '#a8a29e'
  },
  // 14. Absheron Buta
  {
    id: 'absheron_buta',
    name: {
      az: 'Abşeron Firuzəsi',
      ru: 'Апшеронская Бирюза',
      en: 'Absheron Turquoise'
    },
    desc: {
      az: 'Xəzər mehi və qədim Şərq buta motivi ilə bəzədilmiş firuzəyi rəng.',
      ru: 'Бирюзовые тона каспийского бриза и восточных узоров бута.',
      en: 'Vivid turquoise and deep azure inspired by Absheron traditions.'
    },
    price: 20,
    category: 'baku',
    bgGradient: 'from-teal-600 to-teal-950',
    tileFace: '#0d9488',
    tileBorder: '#115e59',
    pipColor: '#f0fdfa',
    accentPipColor: '#f59e0b',
    spinnerColor: '#facc15'
  },
  // 15. Black Gold
  {
    id: 'baku_black_gold',
    name: {
      az: 'Qara Qızıl',
      ru: 'Черное Золото',
      en: 'Black Gold'
    },
    desc: {
      az: 'Parlaq qara cilalanmış gövdə və xalis qızıl haşiyə.',
      ru: 'Глянцевый черный блеск с отделкой из чистого золота.',
      en: 'Deep high-gloss polished black finished with pure gold borders.'
    },
    price: 20,
    category: 'baku',
    bgGradient: 'from-neutral-900 to-black',
    tileFace: '#0a0a0a',
    tileBorder: '#d97706',
    pipColor: '#fbbf24',
    accentPipColor: '#ef4444',
    spinnerColor: '#f59e0b',
    glowEffect: '0 0 10px rgba(245, 158, 11, 0.4)'
  },
  // 16. Cyber Neon
  {
    id: 'cyber_neon',
    name: {
      az: 'Kiber Neon',
      ru: 'Кибер Неон',
      en: 'Cyber Neon'
    },
    desc: {
      az: 'Gələcəyin Neon Şəhəri: qaranlıqda parıldayan firuzəyi və bənövşəyi xətlər.',
      ru: 'Футуристический стиль: светящиеся в темноте неоновые линии.',
      en: 'Futuristic cyberpunk aesthetics with luminous neon pips.'
    },
    price: 20,
    category: 'modern',
    bgGradient: 'from-slate-900 to-purple-950',
    tileFace: '#0f172a',
    tileBorder: '#06b6d4',
    pipColor: '#22d3ee',
    accentPipColor: '#f43f5e',
    spinnerColor: '#ec4899',
    glowEffect: '0 0 16px rgba(34, 211, 238, 0.7)'
  },
  // 17. Carrara White Marble
  {
    id: 'marble_carrara',
    name: {
      az: 'Karrara Mərməri',
      ru: 'Белый Каррарский Мрамор',
      en: 'Carrara Marble'
    },
    desc: {
      az: 'Zərif boz damarlı ağ mərmər və tunc detallar.',
      ru: 'Благородный белый мрамор с серыми прожилками и бронзой.',
      en: 'Polished white marble veins accompanied by antique bronze.'
    },
    price: 20,
    category: 'modern',
    bgGradient: 'from-slate-100 to-slate-300',
    tileFace: '#f8fafc',
    tileBorder: '#94a3b8',
    pipColor: '#334155',
    accentPipColor: '#dc2626',
    spinnerColor: '#b45309'
  },
  // 18. Carbon Stealth
  {
    id: 'carbon_stealth',
    name: {
      az: 'Karbon Stels',
      ru: 'Карбоновый Стелс',
      en: 'Carbon Stealth'
    },
    desc: {
      az: 'Hörülmüş ultra-yüngül karbon lifi və parlaq al qırmızı gözlər.',
      ru: 'Плетеный углепластик с ярко-алыми точками.',
      en: 'Woven lightweight carbon fiber weave with high-contrast crimson pips.'
    },
    price: 20,
    category: 'modern',
    bgGradient: 'from-neutral-800 to-neutral-950',
    tileFace: '#1f2023',
    tileBorder: '#ef4444',
    pipColor: '#ef4444',
    accentPipColor: '#22c55e',
    spinnerColor: '#ffffff',
    glowEffect: '0 0 10px rgba(239, 68, 68, 0.4)'
  },
  // 19. Caspian Sunset
  {
    id: 'caspian_sunset',
    name: {
      az: 'Xəzər Qürubu',
      ru: 'Каспийский Закат',
      en: 'Caspian Sunset'
    },
    desc: {
      az: 'Xəzər sahilindən görünən narıncı-çəhrayı axşam qürub rəngləri.',
      ru: 'Нежные теплые краски вечернего заката над Каспийским побережьем.',
      en: 'Warm sunset gradient over the Caspian shore with pearl dots.'
    },
    price: 20,
    category: 'modern',
    bgGradient: 'from-rose-600 to-amber-700',
    tileFace: '#9f1239',
    tileBorder: '#4c0519',
    pipColor: '#fef08a',
    accentPipColor: '#38bdf8',
    spinnerColor: '#fb923c'
  },
  // 20. Rose Gold Luxe
  {
    id: 'rose_gold_luxe',
    name: {
      az: 'Çəhrayı Qızıl',
      ru: 'Розовое Золото',
      en: 'Rose Gold Luxe'
    },
    desc: {
      az: 'Modern zərgərlik sənətinin şah əsəri — çəhrayı qızıl və şokolad tonları.',
      ru: 'Шедевр современного ювелирного дизайна: розовое золото.',
      en: 'Jeweler-grade rose gold alloy with deep metallic accents.'
    },
    price: 20,
    category: 'luxury',
    bgGradient: 'from-rose-400 to-amber-600',
    tileFace: '#fb7185',
    tileBorder: '#9f1239',
    pipColor: '#4c0519',
    accentPipColor: '#0284c7',
    spinnerColor: '#ffe4e6',
    glowEffect: '0 0 12px rgba(251, 113, 133, 0.5)'
  },
  // --- Public Domain Legends (Elite Collector Skins) ---
  // 21. Steamboat Willie 1928 (Mickey Mouse 1928 Public Domain)
  {
    id: 'steamboat_1928',
    name: {
      az: 'Buxar Gəmisi 1928',
      ru: 'Пароходик Вилли 1928',
      en: 'Steamboat Willie 1928'
    },
    desc: {
      az: '1928-ci il klassik qara-ağ animasiya dövrü və ilk siçan kapitanı üslubu (ictimai mülkiyyət).',
      ru: 'Винтажная черно-белая анимация 1928 года первого мышонка-капитана (public domain).',
      en: 'Vintage 1928 monochrome animation aesthetic inspired by the early public domain captain.'
    },
    price: 50,
    category: 'public_domain',
    bgGradient: 'from-stone-300 to-stone-500',
    tileFace: '#e8e2d2',
    tileBorder: '#1c1b18',
    pipColor: '#181715',
    accentPipColor: '#dc2626',
    spinnerColor: '#78716c',
    glowEffect: '0 0 12px rgba(120, 113, 108, 0.4)'
  },
  // 22. Baker Street Detective (Sherlock Holmes 1887)
  {
    id: 'sherlock_baker',
    name: {
      az: 'Beyker Strit 1887',
      ru: 'Бейкер-стрит 1887',
      en: 'Baker Street 1887'
    },
    desc: {
      az: 'Artur Konan Doylun əfsanəvi London xəfiyyəsi: qədim tütün, palıd ağacı və tunc detallar.',
      ru: 'Легендарный лондонский сыщик: винтажный дуб, темный табак и антикварная бронза.',
      en: 'Arthur Conan Doyle’s legendary detective: aged tobacco, dark tweed, and antique brass.'
    },
    price: 50,
    category: 'public_domain',
    bgGradient: 'from-amber-950 to-stone-900',
    tileFace: '#382012',
    tileBorder: '#1c0f08',
    pipColor: '#fbbf24',
    accentPipColor: '#38bdf8',
    spinnerColor: '#d97706'
  },
  // 23. Transylvania Count (Dracula 1897)
  {
    id: 'dracula_1897',
    name: {
      az: 'Transilvaniya Qrafı',
      ru: 'Граф Трансильвании',
      en: 'Transylvania Count'
    },
    desc: {
      az: 'Brem Stokerin 1897-ci il qotik qəsri: qara qranit üzərində qan-qırmızı yaqut gözlər.',
      ru: 'Готический роман 1897 года: черный гранит и кроваво-алые рубиновые точки.',
      en: 'Bram Stoker’s 1897 gothic legend: midnight obsidian with blood-ruby crimson pips.'
    },
    price: 60,
    category: 'public_domain',
    bgGradient: 'from-red-950 via-black to-stone-950',
    tileFace: '#0a0a0a',
    tileBorder: '#991b1b',
    pipColor: '#dc2626',
    accentPipColor: '#f1f5f9',
    spinnerColor: '#f1f5f9',
    glowEffect: '0 0 16px rgba(220, 38, 38, 0.65)'
  },
  // 24. Wonderland 1865 (Alice in Wonderland)
  {
    id: 'wonderland_1865',
    name: {
      az: 'Möcüzələr Diyarı 1865',
      ru: 'Страна Чудес 1865',
      en: 'Wonderland 1865'
    },
    desc: {
      az: 'Luis Kerrollun nağıl dünyası: çayxana çini qabları və kraliça tünd bənövşəyi naxışları.',
      ru: 'Сказочный мир Кэрролла: фарфор безумного чаепития и королевский фиолетовый.',
      en: 'Lewis Carroll’s 1865 whimsical tale: tea party porcelain with royal violet pips.'
    },
    price: 50,
    category: 'public_domain',
    bgGradient: 'from-purple-900 to-indigo-950',
    tileFace: '#fbf7ff',
    tileBorder: '#6b21a8',
    pipColor: '#581c87',
    accentPipColor: '#e11d48',
    spinnerColor: '#eab308',
    glowEffect: '0 0 12px rgba(147, 51, 234, 0.4)'
  },
  // 25. Modern Prometheus 1818 (Frankenstein)
  {
    id: 'frankenstein_1818',
    name: {
      az: 'Müasir Prometey 1818',
      ru: 'Франкенштейн 1818',
      en: 'Modern Prometheus 1818'
    },
    desc: {
      az: 'Meri Şellinin 1818-ci il elmi-fantastik şah əsəri: qığılcımlı elektrik yaşılı və qara dəmir.',
      ru: 'Шедевр Мэри Шелли 1818 года: искрящийся электрический зеленый и темный металл.',
      en: 'Mary Shelley’s 1818 masterwork: galvanic electric lime with dark forged iron.'
    },
    price: 50,
    category: 'public_domain',
    bgGradient: 'from-lime-950 to-zinc-950',
    tileFace: '#18181b',
    tileBorder: '#65a30d',
    pipColor: '#a3e635',
    accentPipColor: '#38bdf8',
    spinnerColor: '#f97316',
    glowEffect: '0 0 15px rgba(163, 230, 53, 0.55)'
  },
  // 26. The Great Gatsby 1925
  {
    id: 'great_gatsby_1925',
    name: {
      az: 'Böyük Qetsbi 1925',
      ru: 'Великий Гэтсби 1925',
      en: 'The Great Gatsby 1925'
    },
    desc: {
      az: 'F. Skott Fitsjeraldın 1925-ci il Art Deko dəbdəbəsi: qara məxmər və zümrüd çıraq parıltısı.',
      ru: 'Блеск ар-деко 1925 года: темный бархат, шампанское золото и зеленый луч надежды.',
      en: 'F. Scott Fitzgerald’s 1925 Art Deco jazz age: dark velvet and emerald beacon light.'
    },
    price: 60,
    category: 'public_domain',
    bgGradient: 'from-emerald-950 via-slate-950 to-black',
    tileFace: '#022c22',
    tileBorder: '#eab308',
    pipColor: '#10b981',
    accentPipColor: '#facc15',
    spinnerColor: '#fef08a',
    glowEffect: '0 0 16px rgba(16, 185, 129, 0.6)'
  },
  // ==========================================
  // ARENA & DUAL-COLOR STRIKER SKINS
  // ==========================================
  // 27. Crimson & Amber (Sarı & Qırmızı)
  {
    id: 'skin_amber_crimson',
    name: {
      az: 'Al-Qırmızı & Kəhrəba',
      ru: 'Ало-Красный и Янтарь',
      en: 'Crimson & Amber'
    },
    desc: {
      az: 'Alovlu al-qırmızı və parlaq qızılı kəhrəba zolaqlarının ehtiraslı harmoniyası.',
      ru: 'Страстное сочетание огненно-красного и золотистого янтаря.',
      en: 'Fiery crimson and golden amber stripes with intense energy.'
    },
    price: 400,
    category: 'modern',
    bgGradient: 'from-red-600 via-amber-500 to-yellow-500',
    tileFace: '#a90432',
    tileBorder: '#3b0710',
    pipColor: '#ffffff',
    accentPipColor: '#0284c7',
    spinnerColor: '#fdb912',
    glowEffect: '0 0 14px rgba(253, 185, 18, 0.5)',
    stripes: ['#a90432', '#fdb912']
  },
  // 28. Navy & Canary (Sarı & Lacivərd)
  {
    id: 'skin_navy_canary',
    name: {
      az: 'Gecə Mavisi & Parlaq Sarı',
      ru: 'Тёмно-Синий и Ярко-Жёлтый',
      en: 'Midnight Navy & Canary'
    },
    desc: {
      az: 'Dərin lacivərd gecə mavisi ilə parıldayan sarının əzəmətli zolaqları.',
      ru: 'Величественные полосы полуночно-синего и сияющего жёлтого.',
      en: 'Noble navy blue paired with vibrant sunny yellow stripes.'
    },
    price: 400,
    category: 'modern',
    bgGradient: 'from-blue-900 via-indigo-900 to-yellow-400',
    tileFace: '#002d72',
    tileBorder: '#0f172a',
    pipColor: '#ffffff',
    accentPipColor: '#dc2626',
    spinnerColor: '#fed100',
    glowEffect: '0 0 14px rgba(254, 209, 0, 0.5)',
    stripes: ['#002d72', '#fed100']
  },
  // 29. Black & White Stripes (Qara & Ağ Qartal)
  {
    id: 'skin_black_white_stripes',
    name: {
      az: 'Qara & Bəyaz Zolaqlar',
      ru: 'Чёрно-Белые Полосы',
      en: 'Black & White Stripes'
    },
    desc: {
      az: 'Klassik qara və xalis ağ şaquli zolaqlar, möhtəşəm qartal kontrastı.',
      ru: 'Классические чёрно-белые полосы с орлиным контрастом.',
      en: 'Classic black and pure white vertical stripes with eagle contrast.'
    },
    price: 350,
    category: 'modern',
    bgGradient: 'from-zinc-900 via-slate-700 to-white',
    tileFace: '#111111',
    tileBorder: '#000000',
    pipColor: '#e11d48',
    accentPipColor: '#06b6d4',
    spinnerColor: '#e11d48',
    glowEffect: '0 0 14px rgba(255, 255, 255, 0.45)',
    stripes: ['#111111', '#ffffff', '#111111']
  },
  // 30. Bordeaux & Sky Blue (Bordo & Mavi Dalğa)
  {
    id: 'skin_bordeaux_sky',
    name: {
      az: 'Tünd Bordo & Dəniz Mavisi',
      ru: 'Бордо и Морская Лазурь',
      en: 'Bordeaux & Sky Blue'
    },
    desc: {
      az: 'Fırtınalı dəniz mavisi ilə dərin tünd bordonun füsunkar qovuşması.',
      ru: 'Глубокий бордовый и штормовая морская лазурь.',
      en: 'Deep bordeaux blended with stormy sea azure stripes.'
    },
    price: 350,
    category: 'modern',
    bgGradient: 'from-rose-950 via-sky-600 to-rose-900',
    tileFace: '#670020',
    tileBorder: '#1e1018',
    pipColor: '#ffffff',
    accentPipColor: '#fbbf24',
    spinnerColor: '#1c95d4',
    glowEffect: '0 0 14px rgba(28, 149, 212, 0.45)',
    stripes: ['#670020', '#1c95d4']
  },
  // 31. Azure & Garnet (Katalon Göyü & Qranat)
  {
    id: 'skin_catalan_duo',
    name: {
      az: 'Katalon Göyü & Qranat',
      ru: 'Лазурно-Гранатовый',
      en: 'Azure & Deep Garnet'
    },
    desc: {
      az: 'Klassik tünd göy və dərin qranat-qırmızı zolaqların əfsanəvi naxışı.',
      ru: 'Легендарные полосы глубокого синего и насыщенного граната.',
      en: 'Legendary deep royal navy and rich garnet vertical stripes.'
    },
    price: 450,
    category: 'modern',
    bgGradient: 'from-blue-900 via-rose-900 to-amber-500',
    tileFace: '#004d98',
    tileBorder: '#0d1730',
    pipColor: '#edbb00',
    accentPipColor: '#38bdf8',
    spinnerColor: '#edbb00',
    glowEffect: '0 0 14px rgba(237, 187, 0, 0.5)',
    stripes: ['#004d98', '#a50044', '#004d98']
  },
  // 32. Royal Pearl & Gold (Kral Bəyazı & Qızılı)
  {
    id: 'skin_royal_merengue',
    name: {
      az: 'Kral Bəyazı & Qızılı Tac',
      ru: 'Королевский Белый и Золото',
      en: 'Royal Pearl & Gold'
    },
    desc: {
      az: 'Mərmər xalis bəyaz zəmin üzərində zərif qızılı və bənövşəyi kral xətləri.',
      ru: 'Белоснежная мраморная основа с благородными золотыми и пурпурными акцентами.',
      en: 'Pristine royal pearl white with noble gold and subtle violet trims.'
    },
    price: 500,
    category: 'luxury',
    bgGradient: 'from-slate-100 via-amber-100 to-indigo-100',
    tileFace: '#ffffff',
    tileBorder: '#d97706',
    pipColor: '#4f46e5',
    accentPipColor: '#dc2626',
    spinnerColor: '#f59e0b',
    glowEffect: '0 0 16px rgba(245, 158, 11, 0.55)',
    stripes: ['#ffffff', '#f1f5f9', '#ffffff']
  },
  // 33. Black Onyx & Silver Steed (Qara Cövhər & Gümüş Bəyaz - Qarabağ)
  {
    id: 'skin_karabakh_steed',
    name: {
      az: 'Qara Cövhər & Gümüş Bəyaz',
      ru: 'Чёрный Жемчуг и Серебро',
      en: 'Black Onyx & Silver Crest'
    },
    desc: {
      az: 'Qafqazın məğrur qara kəhər atlarının və gümüşü ağ qələbənin zolaqları.',
      ru: 'Символ гордости: благородные чёрные и серебристо-белые полосы.',
      en: 'Proud black onyx and silver white stripes of indomitable spirit.'
    },
    price: 450,
    category: 'baku',
    bgGradient: 'from-zinc-950 via-slate-800 to-white',
    tileFace: '#09090b',
    tileBorder: '#e2e8f0',
    pipColor: '#e2e8f0',
    accentPipColor: '#dc2626',
    spinnerColor: '#fbbf24',
    glowEffect: '0 0 15px rgba(251, 191, 36, 0.45)',
    stripes: ['#09090b', '#ffffff', '#09090b']
  },
  // 34. Ocean Navy & Neon Magenta (Göy Okean & Neon Çəhrayı - Sabah)
  {
    id: 'skin_neon_pink_blue',
    name: {
      az: 'Göy Okean & Neon Çəhrayı',
      ru: 'Синий Океан и Неон-Розовый',
      en: 'Ocean Blue & Neon Magenta'
    },
    desc: {
      az: 'Müasir dəniz mavisi ilə parlaq neon çəhrayı xətlərin dinamik vəhdəti.',
      ru: 'Динамичное сочетание глубокого синего и неоново-розового цветов.',
      en: 'Modern ocean navy with striking neon magenta and pink accents.'
    },
    price: 400,
    category: 'modern',
    bgGradient: 'from-blue-900 via-pink-600 to-fuchsia-500',
    tileFace: '#1e3a8a',
    tileBorder: '#be185d',
    pipColor: '#ffffff',
    accentPipColor: '#facc15',
    spinnerColor: '#ec4899',
    glowEffect: '0 0 15px rgba(236, 72, 153, 0.5)',
    stripes: ['#1e3a8a', '#ec4899']
  },
  // 35. Charcoal & Scarlet (Qara Kömür & Al Alov - Milan)
  {
    id: 'skin_rosso_nero',
    name: {
      az: 'Qara Kömür & Al Alov',
      ru: 'Чёрный Уголь и Алое Пламя',
      en: 'Charcoal & Scarlet'
    },
    desc: {
      az: 'Qara kömür və qızmar qırmızı zolaqların cəsarətli kontrastı.',
      ru: 'Смелый контраст глубокого чёрного и пламенно-красного.',
      en: 'Bold vertical stripes of deep charcoal black and scarlet red.'
    },
    price: 350,
    category: 'modern',
    bgGradient: 'from-black via-red-900 to-red-600',
    tileFace: '#111111',
    tileBorder: '#450a0a',
    pipColor: '#ffffff',
    accentPipColor: '#38bdf8',
    spinnerColor: '#dc2626',
    glowEffect: '0 0 14px rgba(220, 38, 38, 0.45)',
    stripes: ['#111111', '#dc2626', '#111111']
  },
  // 36. Black Granite & Sapphire (Qara Qranit & Safir Göyü - Inter)
  {
    id: 'skin_nerazzurri',
    name: {
      az: 'Qara Qranit & Safir Göyü',
      ru: 'Чёрный Гранит и Сапфир',
      en: 'Black Granite & Sapphire'
    },
    desc: {
      az: 'Qara qranit və parlaq safir mavisi zolaqların klassik harmoniyası.',
      ru: 'Классическая гармония чёрного гранита и сапфирового синего.',
      en: 'Classic harmony of granite black and brilliant sapphire blue.'
    },
    price: 350,
    category: 'modern',
    bgGradient: 'from-black via-blue-900 to-sky-500',
    tileFace: '#0a0a0a',
    tileBorder: '#0369a1',
    pipColor: '#f8fafc',
    accentPipColor: '#f59e0b',
    spinnerColor: '#f59e0b',
    glowEffect: '0 0 14px rgba(2, 132, 199, 0.45)',
    stripes: ['#0a0a0a', '#0284c7', '#0a0a0a']
  }
];
