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
}

export const selectBestAIMove = (
  hand: TileData[],
  board: GameBoard,
  currentScore: number = 0
): AIMove | null => {
  if (hand.length === 0) return null;

  // If first move of the hand on empty board
  if (board.tiles.length === 0) {
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
      const { scoredPoints } = placeTileOnBranch(board, tile, bId);
      possibleMoves.push({
        tile,
        branchId: bId,
        expectedScore: scoredPoints
      });
    }
  }

  if (possibleMoves.length === 0) return null;

  // Sort moves:
  // 1. Highest scoring move (Telefon 5-multiple)
  // 2. Doubles (to dispose of risky doubles)
  // 3. Higher pip tiles (to minimize points in hand in case of Bağlandı)
  possibleMoves.sort((a, b) => {
    if (b.expectedScore !== a.expectedScore) {
      return b.expectedScore - a.expectedScore;
    }
    const aIsDouble = a.tile.left === a.tile.right ? 1 : 0;
    const bIsDouble = b.tile.left === b.tile.right ? 1 : 0;
    if (bIsDouble !== aIsDouble) {
      return bIsDouble - aIsDouble;
    }
    // Ayaz [0:0] carries a severe 20-point penalty in 101, so AI prioritizes discarding it!
    const aPips = a.tile.left === 0 && a.tile.right === 0 ? 20 : a.tile.left + a.tile.right;
    const bPips = b.tile.left === 0 && b.tile.right === 0 ? 20 : b.tile.left + b.tile.right;
    return bPips - aPips;
  });

  return possibleMoves[0];
};
