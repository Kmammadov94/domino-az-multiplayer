import { Language, TileData } from '../types/domino';
import { BranchId, GameBoard, getPlayableBranches } from './boardEngine';

export const TUTORIAL_SEEN_KEY = 'domino_az_tutorial_seen_v1';

export interface TutorialSetup {
  humanHand: TileData[];
  botHand: TileData[];
  boneyard: TileData[];
  forcedTile: TileData;
}

export function createTutorialSetup(): TutorialSetup {
  const humanHand: TileData[] = [
    { id: '5-5', left: 5, right: 5 },
    { id: '2-0', left: 2, right: 0 },
    { id: '4-6', left: 4, right: 6 }
  ];
  const botHand: TileData[] = [
    { id: '5-2', left: 5, right: 2 },
    { id: '5-1', left: 5, right: 1 },
    { id: '1-4', left: 1, right: 4 }
  ];
  const boneyard: TileData[] = [
    { id: '0-6', left: 0, right: 6 },
    { id: '3-3', left: 3, right: 3 },
    { id: '3-6', left: 3, right: 6 }
  ];
  return {
    humanHand,
    botHand,
    boneyard,
    forcedTile: humanHand[0]
  };
}

export type TutorialStepKind =
  | 'opening_double'
  | 'score_multiple_5'
  | 'draw_bazar'
  | 'play_drawn'
  | 'final_domino'
  | 'wait_bot';

export function getTutorialStep(
  boardTileCount: number,
  currentTurn: number,
  humanHand: TileData[]
): TutorialStepKind {
  if (currentTurn !== 0) return 'wait_bot';
  if (boardTileCount === 0) return 'opening_double';
  if (boardTileCount === 2) return 'score_multiple_5';
  if (boardTileCount === 4) {
    const hasDrawn = humanHand.some((t) => t.id === '0-6');
    return hasDrawn ? 'play_drawn' : 'draw_bazar';
  }
  return 'final_domino';
}

export function getTutorialBotMove(
  board: GameBoard,
  botHand: TileData[]
): { tile: TileData; branchId: BranchId; expectedScore: number } | null {
  const scriptedOrder = ['5-2', '5-1', '1-4'];
  for (const id of scriptedOrder) {
    const tile = botHand.find((t) => t.id === id);
    if (!tile) continue;
    const validBranches = getPlayableBranches(board, tile);
    if (validBranches.length > 0) {
      return { tile, branchId: validBranches[0], expectedScore: 0 };
    }
  }
  for (const tile of botHand) {
    const validBranches = getPlayableBranches(board, tile);
    if (validBranches.length > 0) {
      return { tile, branchId: validBranches[0], expectedScore: 0 };
    }
  }
  return null;
}

export interface TutorialCopy {
  promptBadge: string;
  promptTitle: string;
  promptBody: string;
  promptDuration: string;
  promptStart: string;
  promptSkip: string;
  rulesButton: string;
  badgeLabel: string;
  exitButton: string;
  botThinking: string;
  steps: Record<Exclude<TutorialStepKind, 'wait_bot'>, { title: string; body: string }>;
  completeTitle: string;
  completeBody: string;
  completePlayReal: string;
  completeMenu: string;
}

const COPY: Record<Language, TutorialCopy> = {
  az: {
    promptBadge: 'İstəyə bağlı təlim',
    promptTitle: 'Qısa təlim oyunu oynamaq istəyirsiniz?',
    promptBody:
      '1v1 ssenarili matçda daş düzülüşü, 5-in qatları ilə xal toplama və Bazardan daş çəkməyi əyani öyrənin. İstəsəniz istənilən an çıxa bilərsiniz.',
    promptDuration: 'Gözlənilən vaxt: ~45 saniyə (4 gediş)',
    promptStart: 'Təlimə Başla (~45s)',
    promptSkip: 'İndi yox, oyuna keç',
    rulesButton: 'Təlim Oyunu (~45s)',
    badgeLabel: 'TƏLİM REJİMİ',
    exitButton: 'Təlimdən çıx',
    botThinking: 'Rəqib gediş edir...',
    steps: {
      opening_double: {
        title: '1/4 · İlk Gediş və Qoşa Daş',
        body: '[5|5] daşını masaya qoyun. Telefon 365-də cəmi 5-ə bölünən açılış qoşası dərhal +10 xal verir!'
      },
      score_multiple_5: {
        title: '2/4 · Uyğunlaşdırma və 5-in Qatları',
        body: '[2|0] daşını 2 tərəfinə qoyun. Açıq ucların cəmi 5, 10, 15... olduqda xal qazanırsınız (+10)!'
      },
      draw_bazar: {
        title: '3/4 · Bazardan Daş Çəkmək',
        body: 'Əlinizdə uyğun daş yoxdur. Aşağıdakı "Bazar" düyməsinə toxunun və yeni daş çəkin.'
      },
      play_drawn: {
        title: '3/4 · Çəkilən Daşı Oynayın',
        body: 'Bazardan [0|6] gəldi! İndi onu 0 ucuna bağlayın.'
      },
      final_domino: {
        title: '4/4 · Domino! (Son Daş)',
        body: 'Sonuncu [4|6] daşınızı masaya qoyaraq əli bitirin və qalib gəlin!'
      }
    },
    completeTitle: 'Təlim Tamamlandı!',
    completeBody:
      'Əla! Artıq əsas qaydaları bilirsiniz. İndi real botlara və ya onlayn rəqiblərə qarşı oynaya bilərsiniz.',
    completePlayReal: 'Real 1v1 Oyuna Başla',
    completeMenu: 'Ana Menyuya Qayıt'
  },
  en: {
    promptBadge: 'Optional Tutorial',
    promptTitle: 'Want a quick tutorial match?',
    promptBody:
      'Play a guided 1v1 scenario to learn matching tiles, multiples-of-5 scoring, and drawing from the Bazar. You can skip or exit anytime.',
    promptDuration: 'Estimated time: ~45 seconds (4 moves)',
    promptStart: 'Start Tutorial (~45s)',
    promptSkip: 'Skip for now',
    rulesButton: 'Quick Tutorial (~45s)',
    badgeLabel: 'TUTORIAL',
    exitButton: 'Exit Tutorial',
    botThinking: 'Opponent is playing...',
    steps: {
      opening_double: {
        title: '1/4 · First Move & Doubles',
        body: 'Play [5|5] to start. In Telefon 365, an opening double divisible by 5 scores +10 points right away!'
      },
      score_multiple_5: {
        title: '2/4 · Matching & Multiples of 5',
        body: 'Play [2|0] on the 2 end. Whenever the open ends add up to 5, 10, 15..., you score (+10)!'
      },
      draw_bazar: {
        title: '3/4 · Drawing from the Bazar',
        body: 'You have no matching tile. Tap the "Bazar" button below to draw a tile.'
      },
      play_drawn: {
        title: '3/4 · Play Your Drawn Tile',
        body: 'You drew [0|6]! Place it on the matching 0 end.'
      },
      final_domino: {
        title: '4/4 · Domino! (Last Tile)',
        body: 'Play your final tile [4|6] to empty your hand and win the round!'
      }
    },
    completeTitle: 'Tutorial Complete!',
    completeBody:
      'Nice job! You know the core mechanics. Ready to jump into a real match?',
    completePlayReal: 'Play Real 1v1 Match',
    completeMenu: 'Back to Menu'
  },
  ru: {
    promptBadge: 'Необязательное обучение',
    promptTitle: 'Хотите сыграть короткий обучающий матч?',
    promptBody:
      'Пройдите пошаговый сценарий 1на1: ход дублем, очки кратные 5 и добор с Базара. Можно пропустить или выйти в любой момент.',
    promptDuration: 'Время прохождения: ~45 секунд (4 хода)',
    promptStart: 'Начать обучение (~45с)',
    promptSkip: 'Пропустить',
    rulesButton: 'Обучение (~45с)',
    badgeLabel: 'ОБУЧЕНИЕ',
    exitButton: 'Выйти',
    botThinking: 'Соперник делает ход...',
    steps: {
      opening_double: {
        title: '1/4 · Первый ход и дубль',
        body: 'Сыграйте [5|5]. В Telefon 365 стартовый дубль, кратный 5, сразу даёт +10 очков!'
      },
      score_multiple_5: {
        title: '2/4 · Стыковка и кратность 5',
        body: 'Поставьте [2|0] к 2. Когда сумма открытых концов делится на 5 (5, 10, 15...), вы получаете очки (+10)!'
      },
      draw_bazar: {
        title: '3/4 · Добор с Базара',
        body: 'У вас нет подходящей кости. Нажмите на кнопку «Базар» внизу, чтобы взять кость.'
      },
      play_drawn: {
        title: '3/4 · Сыграйте взятую кость',
        body: 'Вам выпала [0|6]! Поставьте её к открытому концу 0.'
      },
      final_domino: {
        title: '4/4 · Домино! (Последняя кость)',
        body: 'Поставьте последнюю кость [4|6], чтобы сбросить руку и победить!'
      }
    },
    completeTitle: 'Обучение завершено!',
    completeBody:
      'Отлично! Вы освоили базовые правила и готовы к настоящему матчу.',
    completePlayReal: 'Начать реальный матч 1на1',
    completeMenu: 'В меню'
  }
};

export function getTutorialCopy(lang: Language): TutorialCopy {
  return COPY[lang] || COPY.az;
}
