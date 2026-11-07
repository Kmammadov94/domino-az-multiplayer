import { TileData, Language } from '../types/domino';
import { GameBoard, BranchId, getPlayableBranches, placeTileOnBranch } from './boardEngine';

export interface AIPersona {
  id: string;
  name: {
    az: string;
    ru: string;
    en: string;
  };
}

// Azerbaijani AI Player Pool
export const AI_PLAYER_POOL: AIPersona[] = [
  { id: 'mahammad', name: { az: 'Məhəmməd', ru: 'Магомед', en: 'Mahammad' } },
  { id: 'panah', name: { az: 'Pənah', ru: 'Панах', en: 'Panah' } },
  { id: 'shohrat', name: { az: 'Şöhrət', ru: 'Шохрат', en: 'Shohrat' } },
  { id: 'eldar', name: { az: 'Eldar', ru: 'Эльдар', en: 'Eldar' } },
  { id: 'rashad', name: { az: 'Rəşad', ru: 'Рашад', en: 'Rashad' } },
  { id: 'tofiq', name: { az: 'Tofiq', ru: 'Тофик', en: 'Tofiq' } }
];

export const pickAIPersonas = (count: number, lang: Language): string[] => {
  const shuffled = [...AI_PLAYER_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((p) => p.name[lang]);
};

export interface AIMove {
  tile: TileData;
  branchId: BranchId;
  expectedScore: number;
  leavesMatchingInHand?: boolean;
}

export const selectBestAIMove = (
  hand: TileData[],
  board: GameBoard,
  currentScore: number = 0,
  variant: '365' | '101' = '365'
): AIMove | null => {
  if (hand.length === 0) return null;

  // If first move of the hand on empty board
  if (board.tiles.length === 0) {
    if (variant === '101') {
      // In 101 mode, there are no opening 5-multiple points.
      // Prefer shedding heavy doubles first, or highest total pip tile.
      const sortedFor101 = [...hand].sort((a, b) => {
        const aDouble = a.left === a.right ? 1 : 0;
        const bDouble = b.left === b.right ? 1 : 0;
        if (bDouble !== aDouble) return bDouble - aDouble;
        return b.left + b.right - (a.left + a.right);
      });
      return {
        tile: sortedFor101[0],
        branchId: 'main_left',
        expectedScore: 0
      };
    }

    // In Baku Telefon 365, only opening doubles score (e.g. [5:5] -> 10 pts).
    // Non-doubles (e.g. [3:2], [4:1]) NEVER score at opening.
    // Also, after 300 points, starting with [5:5] awards 0 points!
    let bestOpening: TileData = hand[0];
    let maxScore = -1;

    for (const tile of hand) {
      const isDouble = tile.left === tile.right;
      const initialScore =
        isDouble && currentScore < 300 && (tile.left * 2) % 5 === 0
          ? tile.left * 2
          : 0;
      if (initialScore > maxScore) {
        maxScore = initialScore;
        bestOpening = tile;
      }
    }

    // If no scoring double exists, prefer double [3:2] if hand 1 opener or highest double/tile
    if (maxScore <= 0) {
      const threeTwo = hand.find(
        (t) => (t.left === 3 && t.right === 2) || (t.left === 2 && t.right === 3)
      );
      if (threeTwo) {
        bestOpening = threeTwo;
      } else {
        const double = hand.filter((t) => t.left === t.right).sort((a, b) => b.left - a.left)[0];
        if (double) bestOpening = double;
      }
    }

    return {
      tile: bestOpening,
      branchId: 'main_left',
      expectedScore: maxScore > 0 ? maxScore : 0
    };
  }

  const possibleMoves: AIMove[] = [];

  for (const tile of hand) {
    const branches = getPlayableBranches(board, tile);
    for (const bId of branches) {
      const { board: simBoard, scoredPoints } = placeTileOnBranch(board, tile, bId);
      const remainingHand = hand.filter((h) => h.id !== tile.id);
      const newOpenVal = simBoard.branches[bId]?.openValue;
      const leavesMatchingInHand =
        newOpenVal !== undefined &&
        remainingHand.some((h) => h.left === newOpenVal || h.right === newOpenVal);

      possibleMoves.push({
        tile,
        branchId: bId,
        expectedScore: variant === '101' ? 0 : scoredPoints,
        leavesMatchingInHand
      });
    }
  }

  if (possibleMoves.length === 0) return null;

  // Sort moves:
  // 1. In 365 mode: Highest scoring move (Telefon 5-multiple)
  // 2. Urgent [0:0] (Ayaz) disposal when hand is getting small (<= 3 tiles) so it isn't caught solo for 10 pts
  // 3. Doubles (to dispose of risky doubles)
  // 4. Higher pip tiles (to minimize points in hand in case of Bağlandı or loss)
  // 5. Moves that leave a matching number still in AI's remaining hand
  possibleMoves.sort((a, b) => {
    if (variant !== '101' && b.expectedScore !== a.expectedScore) {
      return b.expectedScore - a.expectedScore;
    }

    if (hand.length <= 3) {
      const aIsZeroZero = a.tile.left === 0 && a.tile.right === 0 ? 1 : 0;
      const bIsZeroZero = b.tile.left === 0 && b.tile.right === 0 ? 1 : 0;
      if (bIsZeroZero !== aIsZeroZero) {
        return bIsZeroZero - aIsZeroZero;
      }
    }

    const aIsDouble = a.tile.left === a.tile.right ? 1 : 0;
    const bIsDouble = b.tile.left === b.tile.right ? 1 : 0;
    if (bIsDouble !== aIsDouble) {
      return bIsDouble - aIsDouble;
    }

    const aPips = a.tile.left === 0 && a.tile.right === 0 ? 10 : a.tile.left + a.tile.right;
    const bPips = b.tile.left === 0 && b.tile.right === 0 ? 10 : b.tile.left + b.tile.right;
    if (bPips !== aPips) {
      return bPips - aPips;
    }

    const aSupport = a.leavesMatchingInHand ? 1 : 0;
    const bSupport = b.leavesMatchingInHand ? 1 : 0;
    return bSupport - aSupport;
  });

  return possibleMoves[0];
};
