import { TileData, Language } from '../types/domino';
import { GameBoard, BranchId, getPlayableBranches, placeTileOnBranch, isBoardGloballyBlocked } from './boardEngine';
import { sumHandPips } from './dominoLogic';
import { sumHandPips101 } from './domino101Logic';

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
  remainingPlayableCount?: number;
  remainingHandScore?: number;
  blocksBoard?: boolean;
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
      const remainingPlayableCount = remainingHand.filter(
        (h) => getPlayableBranches(simBoard, h).length > 0
      ).length;
      const remainingHandScore =
        variant === '101' ? sumHandPips101(remainingHand) : sumHandPips(remainingHand);
      const blocksBoard = isBoardGloballyBlocked(simBoard);

      possibleMoves.push({
        tile,
        branchId: bId,
        expectedScore: variant === '101' ? 0 : scoredPoints,
        leavesMatchingInHand,
        remainingPlayableCount,
        remainingHandScore,
        blocksBoard
      });
    }
  }

  if (possibleMoves.length === 0) return null;

  // Sort moves according to variant priorities:
  // - 101 mode: 1) Finishing (empty hand -> smart block with low hand -> keeping playable follow-ups) 2) Lower score remaining in hand
  // - 365 mode: 1) Scoring (Telefon 5-multiple) 2) Finishing / smart block with low hand 3) Lower score remaining in hand
  possibleMoves.sort((a, b) => {
    // 1. In 365 mode: Highest scoring move first
    if (variant !== '101' && b.expectedScore !== a.expectedScore) {
      return b.expectedScore - a.expectedScore;
    }

    // 2. Finishing priority:
    // 2a. Instant hand finish (if hand.length === 1, remainingHandScore === 0)
    const aFinishes = (a.remainingHandScore === 0 && hand.length === 1) ? 1 : 0;
    const bFinishes = (b.remainingHandScore === 0 && hand.length === 1) ? 1 : 0;
    if (bFinishes !== aFinishes) {
      return bFinishes - aFinishes;
    }

    // 2b. Blocking strategy: if blocking the board ("Bağlandı") with a low hand (<= 12 pts),
    // prioritize it to win the block & gain next-hand turn priority; avoid blocking with a heavy hand (> 18 pts).
    const aBlockPref = a.blocksBoard
      ? ((a.remainingHandScore ?? 99) <= 12 ? 1 : (a.remainingHandScore ?? 0) > 18 ? -1 : 0)
      : 0;
    const bBlockPref = b.blocksBoard
      ? ((b.remainingHandScore ?? 99) <= 12 ? 1 : (b.remainingHandScore ?? 0) > 18 ? -1 : 0)
      : 0;
    if (bBlockPref !== aBlockPref) {
      return bBlockPref - aBlockPref;
    }

    // 2b. Avoid dead-ending the hand (keep at least 1 playable tile on the resulting board)
    const aHasFollowUp = (a.remainingPlayableCount ?? 0) > 0 ? 1 : 0;
    const bHasFollowUp = (b.remainingPlayableCount ?? 0) > 0 ? 1 : 0;
    if (bHasFollowUp !== aHasFollowUp) {
      return bHasFollowUp - aHasFollowUp;
    }

    // 2c. In 101 mode, also favor having more playable follow-up options to finish faster
    if (variant === '101') {
      const aPlayable = a.remainingPlayableCount ?? 0;
      const bPlayable = b.remainingPlayableCount ?? 0;
      if (bPlayable !== aPlayable) {
        return bPlayable - aPlayable;
      }
    }

    // 3. Keeping lower score at hand (automatically sheds heavy tiles & avoids solo [0:0] = 10 pts)
    const aScore = a.remainingHandScore ?? 0;
    const bScore = b.remainingHandScore ?? 0;
    if (aScore !== bScore) {
      return aScore - bScore;
    }

    // 4. Tie-breakers: shed doubles first, then keep more playable options / matching end
    const aIsDouble = a.tile.left === a.tile.right ? 1 : 0;
    const bIsDouble = b.tile.left === b.tile.right ? 1 : 0;
    if (bIsDouble !== aIsDouble) {
      return bIsDouble - aIsDouble;
    }

    const aPlayable = a.remainingPlayableCount ?? 0;
    const bPlayable = b.remainingPlayableCount ?? 0;
    if (bPlayable !== aPlayable) {
      return bPlayable - aPlayable;
    }

    const aSupport = a.leavesMatchingInHand ? 1 : 0;
    const bSupport = b.leavesMatchingInHand ? 1 : 0;
    return bSupport - aSupport;
  });

  return possibleMoves[0];
};
