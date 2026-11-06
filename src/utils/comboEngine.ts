import { GameBoard, BranchId, getPlayableBranches, placeTileOnBranch, getActiveOpenEnds } from './boardEngine';
import { TileData } from '../types/domino';

export interface ComboStep {
  tile: TileData;
  branchId: BranchId;
}

export interface DoubleComboMove {
  id: string;
  moves: ComboStep[];
  expectedScore: number;
}

/**
 * Searches for all valid Simultaneous Doubles Combos.
 * Rule: If a player holds 2, 3, or 4 doubles that can connect to distinct open branches,
 * and playing them together results in a total open-ends score (multiple of 5),
 * they can be played simultaneously in a single turn!
 */
export const findDoubleCombos = (
  hand: TileData[],
  board: GameBoard
): DoubleComboMove[] => {
  if (board.tiles.length === 0) return [];

  // Filter for doubles in hand
  const doubles = hand.filter((t) => t.left === t.right);
  if (doubles.length < 2) return [];

  // Map each double to the branches it can legally play on
  const playableMap = new Map<string, { tile: TileData; branches: BranchId[] }>();
  for (const d of doubles) {
    const branches = getPlayableBranches(board, d);
    if (branches.length > 0) {
      playableMap.set(d.id, { tile: d, branches });
    }
  }

  const eligibleDoubles = Array.from(playableMap.values());
  if (eligibleDoubles.length < 2) return [];

  const foundCombos: DoubleComboMove[] = [];
  const seenKeys = new Set<string>();

  // Helper to generate combinations of size k
  const getSubsets = <T>(arr: T[], size: number): T[][] => {
    if (size === 1) return arr.map((x) => [x]);
    const result: T[][] = [];
    arr.forEach((item, idx) => {
      const rest = arr.slice(idx + 1);
      const smaller = getSubsets(rest, size - 1);
      smaller.forEach((sub) => result.push([item, ...sub]));
    });
    return result;
  };

  // Check combo sizes 2, 3, and 4
  const maxK = Math.min(eligibleDoubles.length, 4);

  for (let k = 2; k <= maxK; k++) {
    const doubleSubsets = getSubsets(eligibleDoubles, k);

    for (const subset of doubleSubsets) {
      // Generate all branch assignments where each double gets a distinct branch
      const branchOptions = subset.map((item) => item.branches);

      const generateAssignments = (
        depth: number,
        usedBranches: Set<BranchId>,
        current: ComboStep[]
      ) => {
        if (depth === subset.length) {
          // We have a complete assignment for this subset of doubles
          // Simulate placing them sequentially
          let simBoard = JSON.parse(JSON.stringify(board));
          let validPlacement = true;

          for (const step of current) {
            // Verify branch is still playable on simBoard
            const playableNow = getPlayableBranches(simBoard, step.tile);
            if (!playableNow.includes(step.branchId)) {
              validPlacement = false;
              break;
            }
            const res = placeTileOnBranch(simBoard, step.tile, step.branchId);
            simBoard = res.board;
          }

          if (validPlacement) {
            // Calculate open ends score on the resulting board
            const openEnds = getActiveOpenEnds(simBoard);
            let totalPips = 0;
            for (const end of openEnds) {
              totalPips += end.isDouble ? end.value * 2 : end.value;
            }

            if (totalPips > 0 && totalPips % 5 === 0) {
              const comboKey = current
                .map((c) => `${c.tile.id}@${c.branchId}`)
                .sort()
                .join('|');

              if (!seenKeys.has(comboKey)) {
                seenKeys.add(comboKey);
                foundCombos.push({
                  id: current.map((c) => c.tile.id).sort().join('+'),
                  moves: [...current],
                  expectedScore: totalPips
                });
              }
            }
          }
          return;
        }

        const currentDouble = subset[depth];
        for (const bId of currentDouble.branches) {
          if (!usedBranches.has(bId)) {
            usedBranches.add(bId);
            current.push({ tile: currentDouble.tile, branchId: bId });
            generateAssignments(depth + 1, usedBranches, current);
            current.pop();
            usedBranches.delete(bId);
          }
        }
      };

      generateAssignments(0, new Set<BranchId>(), []);
    }
  }

  // Sort by highest expected score
  foundCombos.sort((a, b) => b.expectedScore - a.expectedScore);
  return foundCombos;
};
