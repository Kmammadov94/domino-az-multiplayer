import { TileData, PipValue, Player, GameMode, PlacedTile, OpenEnd } from '../types/domino';

// Generate standard 28 double-six domino set
export const createDominoSet = (): TileData[] => {
  const set: TileData[] = [];
  for (let i = 0; i <= 6; i++) {
    for (let j = i; j <= 6; j++) {
      set.push({
        id: `${j}-${i}`,
        left: j as PipValue,
        right: i as PipValue
      });
    }
  }
  return set;
};

// Shuffle using Fisher-Yates
export const shuffleTiles = (tiles: TileData[]): TileData[] => {
  const arr = [...tiles];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// Deal tiles based on mode
// 2P: 7 each (14 in bazar)
// 3P: 7 each (7 in bazar)
// 4P Solo & Duo: 7 each (0 in bazar, all 28 dealt)
export const dealHands = (
  mode: GameMode,
  deck: TileData[]
): { hands: TileData[][]; boneyard: TileData[] } => {
  const shuffled = shuffleTiles(deck);
  const hands: TileData[][] = [];
  const numPlayers = mode === '2p_solo' ? 2 : mode === '3p_solo' ? 3 : 4;

  for (let p = 0; p < numPlayers; p++) {
    hands.push(shuffled.slice(p * 7, (p + 1) * 7));
  }

  const boneyard = shuffled.slice(numPlayers * 7);
  return { hands, boneyard };
};

// Baku Reshuffle Rule:
// 1. If a player gets 5 of a kind (e.g. 5 3s) WITHOUT the double (e.g. no [3:3]), reshuffle for everyone!
// 2. If a player gets 6 or 7 of a kind, DIRECT reshuffle for everyone even if they have the double!
export interface ReshuffleReason {
  playerIndex: number;
  pip: number;
  count: number;
  reason: '5_no_double' | '6_or_7_kind';
}

export const checkHandReshuffle = (hands: TileData[][]): ReshuffleReason | null => {
  if (!hands || !Array.isArray(hands)) return null;

  for (let pIdx = 0; pIdx < hands.length; pIdx++) {
    const hand = hands[pIdx];
    if (!hand || !Array.isArray(hand)) continue;

    for (let pip = 0; pip <= 6; pip++) {
      const matchingTiles = hand.filter(t => t && (t.left === pip || t.right === pip));
      const count = matchingTiles.length;

      // 6 or 7 of a kind: automatic direct reshuffle for everyone!
      if (count >= 6) {
        return {
          playerIndex: pIdx,
          pip,
          count,
          reason: '6_or_7_kind'
        };
      }

      // 5 of a kind: reshuffle if they do NOT hold the double [pip:pip]
      if (count === 5) {
        const hasDouble = hand.some(t => t && t.left === pip && t.right === pip);
        if (!hasDouble) {
          return {
            playerIndex: pIdx,
            pip,
            count,
            reason: '5_no_double'
          };
        }
      }
    }
  }

  return null;
};

// Find player who must start Hand 1
// Baku rule: Player holding [3:2] starts!
// If no one has [3:2], lowest double starting from [1:1] (1:1, 2:2, 3:3... 0:0 not allowed)
export const findFirstHandStarter = (
  hands: TileData[][]
): { playerIndex: number; forcedTile: TileData } => {
  // 1. Look for [3:2] or [2:3]
  for (let p = 0; p < hands.length; p++) {
    const tile32 = hands[p].find(
      (t) => (t.left === 3 && t.right === 2) || (t.left === 2 && t.right === 3)
    );
    if (tile32) {
      return { playerIndex: p, forcedTile: tile32 };
    }
  }

  // 2. Look for lowest double >= [1:1]
  for (let d = 1; d <= 6; d++) {
    for (let p = 0; p < hands.length; p++) {
      const doubleTile = hands[p].find((t) => t.left === d && t.right === d);
      if (doubleTile) {
        return { playerIndex: p, forcedTile: doubleTile };
      }
    }
  }

  // Fallback (rare): highest pip tile
  let maxPips = -1;
  let starter = 0;
  let forced = hands[0][0];

  hands.forEach((hand, p) => {
    hand.forEach((t) => {
      const sum = t.left + t.right;
      if (sum > maxPips) {
        maxPips = sum;
        starter = p;
        forced = t;
      }
    });
  });

  return { playerIndex: starter, forcedTile: forced };
};

// Always round UP to higher multiple of 5 (e.g. 1->5, 6->10, 11->15, 0->0)
export const roundUpTo5 = (pips: number): number => {
  if (pips <= 0) return 0;
  return Math.ceil(pips / 5) * 5;
};

// Calculate sum of remaining pips in a hand
// Baku Telefon 365 Rule:
// If [0:0] is left completely solo in the hand with no other dominoes, it counts as 10 points!
export const sumHandPips = (hand: TileData[]): number => {
  if (!hand || !Array.isArray(hand) || hand.length === 0) return 0;
  // Baku rule: Solo [0:0] (tək boş-boş) with no other dominoes left counts as 10!
  if (hand.length === 1 && hand[0] && hand[0].left === 0 && hand[0].right === 0) {
    return 10;
  }
  return hand.reduce((acc, t) => acc + (t ? (t.left || 0) + (t.right || 0) : 0), 0);
};

// Check if a move results in a score (Telefon 5-multiple)
export const calculateBoardScore = (openEnds: OpenEnd[]): number => {
  if (openEnds.length === 0) return 0;

  let totalSum = 0;
  for (const end of openEnds) {
    if (end.isDouble) {
      // Doubles count their full sum (e.g. [5:5] = 10, [6:6] = 12)
      totalSum += end.value * 2;
    } else {
      totalSum += end.value;
    }
  }

  if (totalSum > 0 && totalSum % 5 === 0) {
    return totalSum;
  }
  return 0;
};
