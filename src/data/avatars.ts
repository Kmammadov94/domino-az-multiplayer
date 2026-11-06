export interface PlayerAvatar {
  id: string;
  name: {
    az: string;
    ru: string;
    en: string;
  };
  title: {
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
  unlockedByDefault?: boolean;
  category: 'baku' | 'masters' | 'legends' | 'luxury';
  bgGradient: string;
  borderColor: string;
  glowColor: string;
  badge?: string;
  // Visual SVG traits
  theme: {
    bgColor: string;
    bgAccent: string;
    skinTone: string;
    hairColor: string;
    hairStyle: 'classic' | 'bald' | 'short' | 'curly' | 'gray_beard' | 'turban' | 'helmet' | 'cap' | 'crown';
    hatType?: 'kepka' | 'papakh' | 'crown' | 'helmet' | 'cap' | 'visor' | 'hood';
    facialHair?: 'mustache' | 'full_beard' | 'goatee' | 'stubble';
    glasses?: 'sunglasses' | 'reading' | 'visor' | 'monocle';
    accessory?: 'armudu' | 'domino' | 'star' | 'flame' | 'anchor' | 'oil' | 'tar';
    clothingColor: string;
  };
}

export const PLAYER_AVATARS: PlayerAvatar[] = [
  // ==========================================
  // 1-5: FREE STARTER AVATARS (0 Coins)
  // ==========================================
  {
    id: 'avatar_baku_classic',
    name: {
      az: 'Klassik Usta',
      ru: 'Классический Мастер',
      en: 'Classic Master'
    },
    title: {
      az: 'Klassik Kepkalı',
      ru: 'Классическая кепка',
      en: 'Classic Cap'
    },
    desc: {
      az: 'Ənənəvi kepkası və qara bığı ilə məşhur çayxana sakini.',
      ru: 'Житель чайханы в классической кепке с аккуратными усами.',
      en: 'Traditional teahouse regular sporting a classic cap and neat mustache.'
    },
    price: 0,
    unlockedByDefault: true,
    category: 'baku',
    bgGradient: 'from-amber-600 via-amber-800 to-slate-900',
    borderColor: 'border-amber-400',
    glowColor: 'rgba(251, 191, 36, 0.5)',
    badge: 'Milli',
    theme: {
      bgColor: '#78350f',
      bgAccent: '#b45309',
      skinTone: '#fbcfe8',
      hairColor: '#1c1917',
      hairStyle: 'cap',
      hatType: 'kepka',
      facialHair: 'mustache',
      clothingColor: '#1e293b'
    }
  },
  {
    id: 'avatar_tea_master',
    name: {
      az: 'Çayçı Əli Dayı',
      ru: 'Чайханщик Али',
      en: 'Tea Master Ali'
    },
    title: {
      az: 'Kəhrəba Çay Ustası',
      ru: 'Мастер янтарного чая',
      en: 'Amber Tea Master'
    },
    desc: {
      az: 'Pürrəngi çayı armudu stəkanda süzüb masaya təbəssümlə gətirən qocaman.',
      ru: 'Добродушный чайханщик, подающий ароматный чай в стаканах армуду.',
      en: 'Friendly teahouse master serving fresh amber tea in traditional armudu glasses.'
    },
    price: 0,
    unlockedByDefault: true,
    category: 'baku',
    bgGradient: 'from-orange-600 via-red-800 to-slate-950',
    borderColor: 'border-orange-400',
    glowColor: 'rgba(249, 115, 22, 0.5)',
    badge: 'Xalq Sevimlisi',
    theme: {
      bgColor: '#9a3412',
      bgAccent: '#ea580c',
      skinTone: '#fed7aa',
      hairColor: '#e2e8f0',
      hairStyle: 'gray_beard',
      facialHair: 'full_beard',
      accessory: 'armudu',
      clothingColor: '#7c2d12'
    }
  },
  {
    id: 'avatar_sheki_guest',
    name: {
      az: 'Şəki Qonağı',
      ru: 'Шекинский Гость',
      en: 'Sheki Guest'
    },
    title: {
      az: 'Zarafatcıl Usta',
      ru: 'Остроумный игрок',
      en: 'Witty Strategist'
    },
    desc: {
      az: 'Əsl Şəki papaqçısı, hər domino gedişinə şirin bir lətifə qoşan usta.',
      ru: 'Мастер в шекинской папахе, сопровождающий каждый ход доброй шуткой.',
      en: 'Sheki visitor wearing an authentic fleece papakh, cracking witty jokes on every tile move.'
    },
    price: 0,
    unlockedByDefault: true,
    category: 'baku',
    bgGradient: 'from-emerald-600 via-teal-800 to-slate-950',
    borderColor: 'border-emerald-400',
    glowColor: 'rgba(52, 211, 153, 0.5)',
    badge: 'Qonaq',
    theme: {
      bgColor: '#065f46',
      bgAccent: '#059669',
      skinTone: '#fde68a',
      hairColor: '#475569',
      hairStyle: 'cap',
      hatType: 'papakh',
      facialHair: 'stubble',
      clothingColor: '#0f766e'
    }
  },
  {
    id: 'avatar_young_champion',
    name: {
      az: 'Gənc Çempion',
      ru: 'Молодой Чемпион',
      en: 'Young Champion'
    },
    title: {
      az: 'Cəld Əl',
      ru: 'Быстрая рука',
      en: 'Swift Hand'
    },
    desc: {
      az: 'Kombinat çayxanasında bütün böyükləri mat qoyan gənc istedad.',
      ru: 'Молодой талант, обыгрывающий опытных старожилов в чайхане.',
      en: 'The rising domino prodigy who outsmarts seasoned teahouse veterans.'
    },
    price: 0,
    unlockedByDefault: true,
    category: 'masters',
    bgGradient: 'from-sky-600 via-blue-800 to-slate-950',
    borderColor: 'border-sky-400',
    glowColor: 'rgba(56, 189, 248, 0.5)',
    badge: 'İstedad',
    theme: {
      bgColor: '#0369a1',
      bgAccent: '#0284c7',
      skinTone: '#fed7aa',
      hairColor: '#0f172a',
      hairStyle: 'short',
      accessory: 'domino',
      clothingColor: '#1e3a8a'
    }
  },
  {
    id: 'avatar_baku_student',
    name: {
      az: 'Gənc Dominocu',
      ru: 'Молодой Доминошник',
      en: 'Young Tactician'
    },
    title: {
      az: 'Müasir Taktik',
      ru: 'Современный тактик',
      en: 'Modern Tactician'
    },
    desc: {
      az: 'Dostlarla domino stolu arxasında dincələn enerjili gənc.',
      ru: 'Энергичный игрок, проводящий свободное время за любимым домино.',
      en: 'Energetic player enjoying exciting domino rounds.'
    },
    price: 0,
    unlockedByDefault: true,
    category: 'baku',
    bgGradient: 'from-violet-600 via-purple-900 to-slate-950',
    borderColor: 'border-purple-400',
    glowColor: 'rgba(192, 132, 252, 0.5)',
    badge: 'Tələbə',
    theme: {
      bgColor: '#581c87',
      bgAccent: '#7e22ce',
      skinTone: '#fde68a',
      hairColor: '#334155',
      hairStyle: 'curly',
      glasses: 'reading',
      clothingColor: '#4338ca'
    }
  },

  // ==========================================
  // 6-15: BAKU & TEAHOUSE CHARACTERS (15-25 Gold)
  // ==========================================
  {
    id: 'avatar_kurdxani_pahlavan',
    name: {
      az: 'Kürdəxanı Pəhləvanı',
      ru: 'Кюрдаханский Богатырь',
      en: 'Kurdakhani Strongman'
    },
    title: {
      az: 'Qüdrətli Qol',
      ru: 'Мощная рука',
      en: 'Mighty Hand'
    },
    desc: {
      az: 'Masaya daşı elə vurur ki, bütün çayxana silkələnir.',
      ru: 'Ставит кости на стол с такой мощью, что звенит посуда во всей чайхане.',
      en: 'Slams his winning doubles with raw wrestling power that rattles the teacups.'
    },
    price: 15,
    category: 'baku',
    bgGradient: 'from-amber-700 via-stone-800 to-slate-950',
    borderColor: 'border-amber-500',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    theme: {
      bgColor: '#78350f',
      bgAccent: '#d97706',
      skinTone: '#fbcfe8',
      hairColor: '#0f172a',
      hairStyle: 'bald',
      facialHair: 'mustache',
      clothingColor: '#334155'
    }
  },
  {
    id: 'avatar_merdekan_gardener',
    name: {
      az: 'Mərdəkan Bağbanı',
      ru: 'Мардакянский Дачник',
      en: 'Mardakan Gardener'
    },
    title: {
      az: 'Bağlar Əhli',
      ru: 'Знаток дачных традиций',
      en: 'Dacha Veteran'
    },
    desc: {
      az: 'Xəzər mehi, əncir ağacının kölgəsi və sərin qarpız yanında domino həzzi.',
      ru: 'Ценитель неспешной игры в тени инжира под каспийский бриз.',
      en: 'Enjoys peaceful domino matches under the coastal fig shade of Caspian dachas.'
    },
    price: 15,
    category: 'baku',
    bgGradient: 'from-emerald-700 via-green-900 to-slate-950',
    borderColor: 'border-emerald-500',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    theme: {
      bgColor: '#14532d',
      bgAccent: '#16a34a',
      skinTone: '#fed7aa',
      hairColor: '#94a3b8',
      hairStyle: 'short',
      hatType: 'cap',
      clothingColor: '#166534'
    }
  },
  {
    id: 'avatar_icherisheher_sage',
    name: {
      az: 'İçərişəhər Ağsaqqalı',
      ru: 'Мудрец Ичеришехер',
      en: 'Old Fortress Sage'
    },
    title: {
      az: 'Qədim Qala Müdriki',
      ru: 'Хранитель крепости',
      en: 'Fortress Elder'
    },
    desc: {
      az: 'Qoşa Qala qapısından bəri yüzlərlə turnir görmüş dərin zəkalı ustad.',
      ru: 'Мудрый старец, помнящий сотни турниров у стен древней бакинской крепости.',
      en: 'Respected elder who has witnessed decades of iconic matches by Maiden Tower.'
    },
    price: 20,
    category: 'baku',
    bgGradient: 'from-amber-600 via-amber-950 to-black',
    borderColor: 'border-amber-400',
    glowColor: 'rgba(251, 191, 36, 0.5)',
    badge: 'Ağsaqqal',
    theme: {
      bgColor: '#78350f',
      bgAccent: '#b45309',
      skinTone: '#fed7aa',
      hairColor: '#cbd5e1',
      hairStyle: 'gray_beard',
      facialHair: 'full_beard',
      clothingColor: '#451a03'
    }
  },
  {
    id: 'avatar_bulvar_walker',
    name: {
      az: 'Bulvar Aristokratı',
      ru: 'Аристократ Бульвара',
      en: 'Boulevard Aristocrat'
    },
    title: {
      az: 'Xəzər Dəniz Gözü',
      ru: 'Морской стиль',
      en: 'Caspian Breeze'
    },
    desc: {
      az: 'Xəzər dənizkənarı parkında zərif gün eynəyi və qüsursuz domino gedişləri.',
      ru: 'Стильный завсегдатай приморского бульвара в тёмных очках с безупречной игрой.',
      en: 'Stylish boulevard gentleman wearing dark shades and placing calculated moves.'
    },
    price: 20,
    category: 'baku',
    bgGradient: 'from-teal-600 via-cyan-900 to-slate-950',
    borderColor: 'border-cyan-400',
    glowColor: 'rgba(34, 211, 238, 0.5)',
    theme: {
      bgColor: '#164e63',
      bgAccent: '#0891b2',
      skinTone: '#fbcfe8',
      hairColor: '#0f172a',
      hairStyle: 'classic',
      glasses: 'sunglasses',
      clothingColor: '#0e7490'
    }
  },
  {
    id: 'avatar_novxani_veteran',
    name: {
      az: 'Novxanı Xəzri',
      ru: 'Новханинский Ветеран',
      en: 'Novkhani Coastman'
    },
    title: {
      az: 'Külək Ruhu',
      ru: 'Дух ветров',
      en: 'Wind Spirit'
    },
    desc: {
      az: 'Qızmar yay günündə dəniz kənarında domino həvəskarı.',
      ru: 'Закалённый морем игрок, проводящий летние дни за домино на побережье.',
      en: 'Coastal domino enthusiast hardened by the famous northern Absheron winds.'
    },
    price: 25,
    category: 'baku',
    bgGradient: 'from-yellow-600 via-amber-800 to-slate-900',
    borderColor: 'border-yellow-400',
    glowColor: 'rgba(234, 179, 8, 0.5)',
    theme: {
      bgColor: '#854d0e',
      bgAccent: '#ca8a04',
      skinTone: '#fed7aa',
      hairColor: '#475569',
      hairStyle: 'short',
      facialHair: 'goatee',
      clothingColor: '#713f12'
    }
  },

  // ==========================================
  // 11-18: MASTER STRATEGISTS (20-35 Gold)
  // ==========================================
  {
    id: 'avatar_qosa_striker',
    name: {
      az: 'Qoşa Vuran Usta',
      ru: 'Мастер Двойного Удара',
      en: 'Double-Tile Striker'
    },
    title: {
      az: 'Kombinasiya Kralı',
      ru: 'Король комбинаций',
      en: 'Combo Striker'
    },
    desc: {
      az: 'Eyni anda masaya bir neçə qoşa çırparaq 35 xal vuran peşəkar.',
      ru: 'Специалист по одновременным дублям, завершающий партии сокрушительным ударом.',
      en: 'Master of simultaneous doubles combo plays capable of dropping a crushing 35 points.'
    },
    price: 25,
    category: 'masters',
    bgGradient: 'from-red-600 via-rose-900 to-black',
    borderColor: 'border-rose-400',
    glowColor: 'rgba(244, 63, 94, 0.5)',
    badge: 'Qoşa',
    theme: {
      bgColor: '#881337',
      bgAccent: '#e11d48',
      skinTone: '#fed7aa',
      hairColor: '#0f172a',
      hairStyle: 'short',
      accessory: 'domino',
      clothingColor: '#9f1239'
    }
  },
  {
    id: 'avatar_boneyard_king',
    name: {
      az: 'Bazarın Şahı',
      ru: 'Король Базара',
      en: 'King of Boneyard'
    },
    title: {
      az: 'Bütün Daşları Sayır',
      ru: 'Видит все кости',
      en: 'Tile Counter'
    },
    desc: {
      az: 'Bazarda və rəqibin əlində hansı daşların qaldığını dəqiqliklə hesablayan usta.',
      ru: 'С математической точностью помнит каждую ушедшую кость и состав базара.',
      en: 'Phenomenal tile tracker who accurately calculates every remaining unplayed tile.'
    },
    price: 30,
    category: 'masters',
    bgGradient: 'from-amber-500 via-yellow-700 to-slate-950',
    borderColor: 'border-yellow-300',
    glowColor: 'rgba(234, 179, 8, 0.6)',
    theme: {
      bgColor: '#713f12',
      bgAccent: '#eab308',
      skinTone: '#fde68a',
      hairColor: '#1e293b',
      hairStyle: 'classic',
      glasses: 'monocle',
      clothingColor: '#854d0e'
    }
  },
  {
    id: 'avatar_telefon_record',
    name: {
      az: 'Telefon 365 Qrossmeysteri',
      ru: 'Гроссмейстер 365',
      en: 'Telefon 365 Grandmaster'
    },
    title: {
      az: '365 Rekordçusu',
      ru: 'Рекордсмен года',
      en: 'Record Holder'
    },
    desc: {
      az: 'Milli Telefon 365 liqasında məğlubedilməz zirvə sahibi.',
      ru: 'Непобедимый лидер турнирной таблицы национальной лиги Телефон 365.',
      en: 'The undisputed tournament legend who holds the highest win rate at 365 pips.'
    },
    price: 35,
    category: 'masters',
    bgGradient: 'from-amber-400 via-orange-600 to-indigo-950',
    borderColor: 'border-amber-300',
    glowColor: 'rgba(251, 191, 36, 0.7)',
    badge: '365',
    theme: {
      bgColor: '#7c2d12',
      bgAccent: '#f59e0b',
      skinTone: '#fed7aa',
      hairColor: '#0f172a',
      hairStyle: 'classic',
      hatType: 'crown',
      clothingColor: '#431407'
    }
  },
  {
    id: 'avatar_baglandi_expert',
    name: {
      az: 'Bağlayan Strateq',
      ru: 'Мастер Блокировки',
      en: 'The Game Blocker'
    },
    title: {
      az: 'Kilid Sahibi',
      ru: 'Замок стола',
      en: 'Lock Strategist'
    },
    desc: {
      az: 'Oyunu lazımi anda bağlayıb minimal xalla qalib çıxan dahi.',
      ru: 'Хладнокровно закрывает концы стола в идеальный момент для победы по очкам.',
      en: 'Calculates the exact moment to block ("Bağlandı") and win by holding the lowest pips.'
    },
    price: 25,
    category: 'masters',
    bgGradient: 'from-zinc-600 via-neutral-900 to-black',
    borderColor: 'border-zinc-400',
    glowColor: 'rgba(161, 161, 170, 0.5)',
    theme: {
      bgColor: '#27272a',
      bgAccent: '#71717a',
      skinTone: '#fde68a',
      hairColor: '#18181b',
      hairStyle: 'short',
      facialHair: 'stubble',
      clothingColor: '#3f3f46'
    }
  },
  {
    id: 'avatar_professor_math',
    name: {
      az: 'Professor Zəka',
      ru: 'Профессор Логики',
      en: 'Professor Logic'
    },
    title: {
      az: 'Ehtimal Nəzəriyyəsi',
      ru: 'Теория вероятностей',
      en: 'Probability Master'
    },
    desc: {
      az: 'Hər daşın ehtimalını qabaqcadan bilən analitik beyin.',
      ru: 'Игрок с академическим подходом, просчитывающий ходы на 5 раундов вперёд.',
      en: 'Analytical mind applying probability mathematics to dominate every board branch.'
    },
    price: 30,
    category: 'masters',
    bgGradient: 'from-blue-700 via-indigo-950 to-slate-950',
    borderColor: 'border-blue-400',
    glowColor: 'rgba(96, 165, 250, 0.5)',
    theme: {
      bgColor: '#1e3a8a',
      bgAccent: '#3b82f6',
      skinTone: '#fed7aa',
      hairColor: '#e2e8f0',
      hairStyle: 'curly',
      glasses: 'reading',
      clothingColor: '#1d4ed8'
    }
  },
  {
    id: 'avatar_silent_winner',
    name: {
      az: 'Sakit Qalib',
      ru: 'Молчаливый Победитель',
      en: 'Silent Victor'
    },
    title: {
      az: 'Soyuqqanlı Taktik',
      ru: 'Ледяное спокойствие',
      en: 'Ice Tactician'
    },
    desc: {
      az: 'Bir kəlmə də danışmadan rəqibi stolda mat qoyan sakit usta.',
      ru: 'Не произносит ни слова за столом, пока не сделает решающий победный ход.',
      en: 'Never speaks a word until placing down the definitive winning domino tile.'
    },
    price: 20,
    category: 'masters',
    bgGradient: 'from-slate-700 via-gray-900 to-black',
    borderColor: 'border-slate-400',
    glowColor: 'rgba(148, 163, 184, 0.4)',
    theme: {
      bgColor: '#334155',
      bgAccent: '#64748b',
      skinTone: '#fbcfe8',
      hairColor: '#0f172a',
      hairStyle: 'short',
      glasses: 'sunglasses',
      clothingColor: '#1e293b'
    }
  },
  {
    id: 'avatar_night_grinder',
    name: {
      az: 'Gecə Qartalı',
      ru: 'Ночной Игрок',
      en: 'Midnight Grinder'
    },
    title: {
      az: 'Gecə Çayxanası',
      ru: 'Полуночные партии',
      en: 'Midnight Sessions'
    },
    desc: {
      az: 'Sübh açılanacan davam edən çətin oyunların daimi qəhrəmanı.',
      ru: 'Опытный игрок, раскрывающий свой истинный потенциал в ночных баталиях.',
      en: 'Dominates those late-night teahouse marathons that run until sunrise.'
    },
    price: 25,
    category: 'masters',
    bgGradient: 'from-indigo-900 via-purple-950 to-black',
    borderColor: 'border-indigo-400',
    glowColor: 'rgba(129, 140, 248, 0.5)',
    theme: {
      bgColor: '#312e81',
      bgAccent: '#4f46e5',
      skinTone: '#fed7aa',
      hairColor: '#0f172a',
      hairStyle: 'short',
      facialHair: 'goatee',
      clothingColor: '#3730a3'
    }
  },
  {
    id: 'avatar_bluff_tactician',
    name: {
      az: 'Gözbağlayıcı Usta',
      ru: 'Мастер Блефа',
      en: 'Bluff Tactician'
    },
    title: {
      az: 'Psixoloji Üstünlük',
      ru: 'Психологическое преимущество',
      en: 'Mind Game Pro'
    },
    desc: {
      az: 'Rəqibin diqqətini yayındırıb ən vacib daşını gizlədən dahi.',
      ru: 'Мастер психологического давления, заставляющий оппонента ошибиться.',
      en: 'Expert at reading opponents, holding back the key tile until the absolute climax.'
    },
    price: 25,
    category: 'masters',
    bgGradient: 'from-fuchsia-800 via-rose-950 to-slate-950',
    borderColor: 'border-fuchsia-400',
    glowColor: 'rgba(232, 121, 249, 0.5)',
    theme: {
      bgColor: '#701a75',
      bgAccent: '#c026d3',
      skinTone: '#fde68a',
      hairColor: '#172554',
      hairStyle: 'classic',
      facialHair: 'mustache',
      clothingColor: '#86198f'
    }
  },

  // ==========================================
  // 19-24: HERITAGE & NATIONAL LEGENDS (30-40 Gold)
  // ==========================================
  {
    id: 'avatar_shirvanshah_ruler',
    name: {
      az: 'Şirvanşah Hökmranı',
      ru: 'Правитель Ширваншахов',
      en: 'Shirvanshah Sovereign'
    },
    title: {
      az: 'Kral Əzəməti',
      ru: 'Царское величие',
      en: 'Imperial Majesty'
    },
    desc: {
      az: 'Qızıl tac və zümrüd libasda qədim sarayların strateji oyun ruhu.',
      ru: 'Царственный образ правителя древнего Ширвана в золотой короне.',
      en: 'Ancient royal sovereign adorned with a golden crown and ruby royal insignia.'
    },
    price: 40,
    category: 'legends',
    bgGradient: 'from-amber-500 via-yellow-600 to-amber-950',
    borderColor: 'border-amber-300',
    glowColor: 'rgba(251, 191, 36, 0.7)',
    badge: 'Əfsanə',
    theme: {
      bgColor: '#78350f',
      bgAccent: '#d97706',
      skinTone: '#fde68a',
      hairColor: '#1c1917',
      hairStyle: 'crown',
      hatType: 'crown',
      facialHair: 'full_beard',
      clothingColor: '#991b1b'
    }
  },
  {
    id: 'avatar_dede_qorqud',
    name: {
      az: 'Dədə Qorqud',
      ru: 'Деде Горгуд',
      en: 'Dada Gorgud'
    },
    title: {
      az: 'Dastanların Atası',
      ru: 'Мудрец сказаний',
      en: 'Ancient Epic Sage'
    },
    desc: {
      az: 'Ağ saqqalı və qopuz sədası ilə əsrlərin müdrikliyini oyuna daşıyan ozan.',
      ru: 'Великий эпический сказитель с белой бородой и мудростью веков.',
      en: 'Venerated epic sage bestowing thousand-year ancestral wisdom upon the game.'
    },
    price: 40,
    category: 'legends',
    bgGradient: 'from-stone-600 via-stone-800 to-slate-950',
    borderColor: 'border-stone-300',
    glowColor: 'rgba(214, 211, 209, 0.6)',
    badge: 'Müdrik',
    theme: {
      bgColor: '#44403c',
      bgAccent: '#78716c',
      skinTone: '#fed7aa',
      hairColor: '#f8fafc',
      hairStyle: 'gray_beard',
      hatType: 'papakh',
      facialHair: 'full_beard',
      clothingColor: '#292524'
    }
  },
  {
    id: 'avatar_garabagh_horseman',
    name: {
      az: 'Qarabağ Atlısı',
      ru: 'Карабахский Всадник',
      en: 'Karabakh Cavalier'
    },
    title: {
      az: 'Cıdır Düzü İgid',
      ru: 'Горный джигит',
      en: 'Mountain Hero'
    },
    desc: {
      az: 'Qarabağ çuxasında, məğrur qartal baxışlı və sarsılmaz iradəli bahadır.',
      ru: 'Гордый всадник в национальной папахе с непреклонной волей к победе.',
      en: 'Proud Karabakh equestrian hero carrying the spirit of victory and courage.'
    },
    price: 35,
    category: 'legends',
    bgGradient: 'from-amber-700 via-red-900 to-slate-950',
    borderColor: 'border-red-400',
    glowColor: 'rgba(239, 68, 68, 0.6)',
    badge: 'İgid',
    theme: {
      bgColor: '#7f1d1d',
      bgAccent: '#b91c1c',
      skinTone: '#fed7aa',
      hairColor: '#0f172a',
      hairStyle: 'cap',
      hatType: 'papakh',
      clothingColor: '#450a0a'
    }
  },
  {
    id: 'avatar_neft_qehremani',
    name: {
      az: 'Qara Qızıl Qəhrəmanı',
      ru: 'Герой Черного Золота',
      en: 'Black Gold Pioneer'
    },
    title: {
      az: 'Neft Daşları Qəhrəmanı',
      ru: 'Нефтяник Каспия',
      en: 'Offshore Pioneer'
    },
    desc: {
      az: 'Dənizin ortasında polad estakadalarda çalışan qəhrəman neftçi.',
      ru: 'Легендарный нефтяник с морских оснований Нефтяных Камней.',
      en: 'Courageous Caspian oil rig pioneer with an indomitable work ethic and pride.'
    },
    price: 30,
    category: 'legends',
    bgGradient: 'from-yellow-500 via-amber-800 to-slate-950',
    borderColor: 'border-amber-400',
    glowColor: 'rgba(245, 158, 11, 0.6)',
    theme: {
      bgColor: '#78350f',
      bgAccent: '#d97706',
      skinTone: '#fed7aa',
      hairColor: '#1e293b',
      hairStyle: 'helmet',
      hatType: 'helmet',
      accessory: 'oil',
      clothingColor: '#b45309'
    }
  },
  {
    id: 'avatar_caspian_captain',
    name: {
      az: 'Xəzər Kapitanı',
      ru: 'Каспийский Капитан',
      en: 'Caspian Captain'
    },
    title: {
      az: 'Dəniz Şahini',
      ru: 'Морской капитан',
      en: 'Sea Eagle'
    },
    desc: {
      az: 'Ağ furajka və mavi geyimdə Xəzərin hər dalğasını ram edən dənizçi.',
      ru: 'Капитан дальнего плавания в белоснежной фуражке, покоряющий любые шторма.',
      en: 'Distinguished ship captain in a crisp naval cap navigating through every domino storm.'
    },
    price: 30,
    category: 'legends',
    bgGradient: 'from-blue-600 via-slate-900 to-black',
    borderColor: 'border-blue-400',
    glowColor: 'rgba(59, 130, 246, 0.5)',
    theme: {
      bgColor: '#1e3a8a',
      bgAccent: '#2563eb',
      skinTone: '#fbcfe8',
      hairColor: '#94a3b8',
      hairStyle: 'cap',
      hatType: 'cap',
      facialHair: 'full_beard',
      accessory: 'anchor',
      clothingColor: '#1e40af'
    }
  },
  {
    id: 'avatar_mugam_master',
    name: {
      az: 'Muğam Ustadı',
      ru: 'Мастер Мугама',
      en: 'Mugham Maestro'
    },
    title: {
      az: 'Ruhun Sədası',
      ru: 'Мелодия души',
      en: 'Melodic Soul'
    },
    desc: {
      az: 'Hər domino gedişini bir muğam şöbəsi kimi ritmik və dərindən hiss edən sənətkar.',
      ru: 'Маэстро, превращающий каждую партию в гармоничную музыкальную поэму.',
      en: 'Renowned musical maestro feeling the rhythm and harmony of every played tile.'
    },
    price: 35,
    category: 'legends',
    bgGradient: 'from-emerald-700 via-amber-900 to-slate-950',
    borderColor: 'border-amber-400',
    glowColor: 'rgba(217, 119, 6, 0.5)',
    theme: {
      bgColor: '#064e3b',
      bgAccent: '#d97706',
      skinTone: '#fed7aa',
      hairColor: '#334155',
      hairStyle: 'classic',
      facialHair: 'mustache',
      accessory: 'tar',
      clothingColor: '#047857'
    }
  },

  // ==========================================
  // 25-30: LUXURY & CYBER GRANDMASTERS (40-50 Gold)
  // ==========================================
  {
    id: 'avatar_flame_warrior',
    name: {
      az: 'Alovlar Diyarı Ruhu',
      ru: 'Вечное Пламя',
      en: 'Eternal Flame Warrior'
    },
    title: {
      az: 'Milli Alov Rəmzi',
      ru: 'Символ Огней',
      en: 'Flame Symbol'
    },
    desc: {
      az: 'Azərbaycanın əbədi alovlarının parıltısını əks etdirən kiber zireh.',
      ru: 'Футуристический образ, вдохновленный сиянием вечных огней Азербайджана.',
      en: 'Futuristic knight adorned in blazing crimson armor inspired by eternal flames.'
    },
    price: 45,
    category: 'luxury',
    bgGradient: 'from-orange-500 via-rose-700 to-purple-950',
    borderColor: 'border-orange-400',
    glowColor: 'rgba(249, 115, 22, 0.7)',
    badge: 'Alov',
    theme: {
      bgColor: '#9a3412',
      bgAccent: '#ea580c',
      skinTone: '#fed7aa',
      hairColor: '#e11d48',
      hairStyle: 'helmet',
      hatType: 'visor',
      accessory: 'flame',
      clothingColor: '#be123c'
    }
  },
  {
    id: 'avatar_golden_grandmaster',
    name: {
      az: 'Qızıl Əl Qrossmeyster',
      ru: 'Золотой Гроссмейстер',
      en: 'Golden Grandmaster'
    },
    title: {
      az: 'Saf Qızıl Toxunuşu',
      ru: 'Золотое прикосновение',
      en: 'Midas Touch'
    },
    desc: {
      az: 'Yalnız qaliblərə məxsus saf qızıl maska və brilyant gözlü domino medalı.',
      ru: 'Элитный аватар из чистого золота для истинных чемпионов стола.',
      en: 'Exclusive solid gold masked avatar reserved strictly for top tier domino champions.'
    },
    price: 50,
    category: 'luxury',
    bgGradient: 'from-amber-300 via-yellow-500 to-amber-900',
    borderColor: 'border-yellow-200',
    glowColor: 'rgba(253, 224, 71, 0.8)',
    badge: 'Lüks',
    theme: {
      bgColor: '#a16207',
      bgAccent: '#facc15',
      skinTone: '#fef08a',
      hairColor: '#eab308',
      hairStyle: 'crown',
      hatType: 'crown',
      glasses: 'sunglasses',
      clothingColor: '#854d0e'
    }
  },
  {
    id: 'avatar_cyber_domino',
    name: {
      az: 'Kiber Dominoçu',
      ru: 'Кибер Домино',
      en: 'Cyber Domino'
    },
    title: {
      az: 'Neon Gələcək',
      ru: 'Неоновое будущее',
      en: 'Neon Future'
    },
    desc: {
      az: 'Neon qovşaqlar və lazer hədəfləmə ilə dominonu gələcəyə daşıyan kiber oyunçu.',
      ru: 'Неоновый кибер-игрок с голографическим прицелом и стильным визором.',
      en: 'Futuristic cyberpunk dominomancer with glowing neon cybernetic visor implants.'
    },
    price: 45,
    category: 'luxury',
    bgGradient: 'from-cyan-500 via-blue-800 to-fuchsia-950',
    borderColor: 'border-cyan-300',
    glowColor: 'rgba(6, 182, 212, 0.7)',
    badge: 'Kiber',
    theme: {
      bgColor: '#0e7490',
      bgAccent: '#06b6d4',
      skinTone: '#cffafe',
      hairColor: '#06b6d4',
      hairStyle: 'short',
      glasses: 'visor',
      clothingColor: '#0891b2'
    }
  },
  {
    id: 'avatar_black_panther',
    name: {
      az: 'Qara Pələng',
      ru: 'Чёрная Пантера',
      en: 'Shadow Panther'
    },
    title: {
      az: 'Gecə Yırtıcısı',
      ru: 'Ночной хищник',
      en: 'Night Predator'
    },
    desc: {
      az: 'Qaranlıqda parıldayan zümrüd gözləri ilə qəfil zərbə vuran güc.',
      ru: 'Хищный и грациозный аватар с изумрудными глазами для уверенных в себе лидеров.',
      en: 'Stealthy midnight predator striking unannounced with lethal calculating accuracy.'
    },
    price: 40,
    category: 'luxury',
    bgGradient: 'from-zinc-900 via-neutral-950 to-black',
    borderColor: 'border-emerald-400',
    glowColor: 'rgba(52, 211, 153, 0.6)',
    theme: {
      bgColor: '#18181b',
      bgAccent: '#27272a',
      skinTone: '#18181b',
      hairColor: '#09090b',
      hairStyle: 'short',
      clothingColor: '#09090b'
    }
  },
  {
    id: 'avatar_caspian_eagle',
    name: {
      az: 'Xəzər Qartalı',
      ru: 'Каспийский Орёл',
      en: 'Caspian Eagle'
    },
    title: {
      az: 'Zirvə Hökmdarı',
      ru: 'Повелитель высот',
      en: 'Apex Ruler'
    },
    desc: {
      az: 'Yüksəklərdən bütün masanı seyr edib ən düzgün anı gözləyən qızıl qartal.',
      ru: 'Гордый золотой орёл, наблюдающий за полем игры с непревзойденной высоты.',
      en: 'Majestic golden eagle surveying the entire battlefield before the final swoop.'
    },
    price: 45,
    category: 'luxury',
    bgGradient: 'from-amber-600 via-yellow-700 to-slate-950',
    borderColor: 'border-yellow-400',
    glowColor: 'rgba(250, 204, 21, 0.7)',
    badge: 'Qartal',
    theme: {
      bgColor: '#854d0e',
      bgAccent: '#eab308',
      skinTone: '#fef08a',
      hairColor: '#ca8a04',
      hairStyle: 'short',
      accessory: 'star',
      clothingColor: '#713f12'
    }
  },
  {
    id: 'avatar_domino_imperator',
    name: {
      az: 'Domino İmperatoru',
      ru: 'Император Домино',
      en: 'Domino Imperator'
    },
    title: {
      az: 'Mütləq Zirvə',
      ru: 'Абсолютная власть',
      en: 'Absolute Supremacy'
    },
    desc: {
      az: 'Bütün Azərbaycan stollarının ən ali, əlçatmaz və qüdrətli çempion avatarı.',
      ru: 'Высший титул и непревзойденный статус абсолютного повелителя игры.',
      en: 'The pinnacle status avatar crowned with imperial gold laurels and diamond dominoes.'
    },
    price: 50,
    category: 'luxury',
    bgGradient: 'from-purple-600 via-amber-500 to-rose-700',
    borderColor: 'border-amber-300',
    glowColor: 'rgba(251, 191, 36, 0.9)',
    badge: 'İmperator',
    theme: {
      bgColor: '#581c87',
      bgAccent: '#f59e0b',
      skinTone: '#fef08a',
      hairColor: '#fbbf24',
      hairStyle: 'crown',
      hatType: 'crown',
      clothingColor: '#701a75'
    }
  }
];

export const DEFAULT_AVATAR_ID = 'avatar_baku_classic';

export const FREE_AVATAR_IDS = [
  'avatar_baku_classic',
  'avatar_tea_master',
  'avatar_sheki_guest',
  'avatar_young_champion',
  'avatar_baku_student'
];
