export interface TableGiftDef {
  id: string;
  name: {
    az: string;
    ru: string;
    en: string;
  };
  icon: string;
  type: 'friendly' | 'playful';
  cost: number;
  impactType: 'steam' | 'splash_red' | 'splash_egg' | 'applause' | 'sweet';
  message: {
    az: string;
    ru: string;
    en: string;
  };
}

export const TABLE_GIFTS: TableGiftDef[] = [
  {
    id: 'tea',
    name: { az: 'Armudu Çay', ru: 'Армуду Чай', en: 'Armudu Tea' },
    icon: '☕',
    type: 'friendly',
    cost: 0,
    impactType: 'steam',
    message: { az: 'sənə qaynar pürrəngi çay süzdü! ☕', ru: 'угостил горячим чаем! ☕', en: 'sent a hot glass of tea! ☕' }
  },
  {
    id: 'paxlava',
    name: { az: 'Şəki Paxlavası', ru: 'Шекинская Пахлава', en: 'Sheki Baklava' },
    icon: '🥮',
    type: 'friendly',
    cost: 10,
    impactType: 'sweet',
    message: { az: 'sənə ləziz paxlava göndərdi! 🍯', ru: 'угостил пахлавой! 🍯', en: 'sent delicious baklava! 🍯' }
  },
  {
    id: 'watermelon',
    name: { az: 'Sabirabad Qarpızı', ru: 'Арбуз', en: 'Watermelon' },
    icon: '🍉',
    type: 'friendly',
    cost: 10,
    impactType: 'sweet',
    message: { az: 'sənə şirin qarpız kəsdi! 🍉', ru: 'угостил сладким арбузом! 🍉', en: 'served sweet watermelon! 🍉' }
  },
  {
    id: 'tomato',
    name: { az: 'Pomidor Şilləsi', ru: 'Бросок Помидором', en: 'Tomato Splat' },
    icon: '🍅',
    type: 'playful',
    cost: 20,
    impactType: 'splash_red',
    message: { az: 'sənə pomidor atdı! 🍅💥', ru: 'бросил помидор! 🍅💥', en: 'splattered a tomato! 🍅💥' }
  },
  {
    id: 'egg',
    name: { az: 'Yumurta Çırpmaq', ru: 'Бросок Яйцом', en: 'Egg Splat' },
    icon: '🥚',
    type: 'playful',
    cost: 20,
    impactType: 'splash_egg',
    message: { az: 'sənə yumurta vurdu! 🥚🍳', ru: 'разбил яйцо! 🥚🍳', en: 'cracked an egg! 🥚🍳' }
  },
  {
    id: 'applause',
    name: { az: 'Bəh-bəh / Alqış', ru: 'Аплодисменты', en: 'Applause' },
    icon: '👏',
    type: 'friendly',
    cost: 0,
    impactType: 'applause',
    message: { az: 'gedişinə bəh-bəh dedi! 👏🔥', ru: 'поаплодировал ходу! 👏🔥', en: 'applauded the play! 👏🔥' }
  }
];
