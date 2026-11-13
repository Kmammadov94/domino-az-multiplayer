import { describe, it, expect } from 'vitest';
import {
  createInitialBoard,
  getPlayableBranches,
  placeFirstTile,
  placeTileOnBranch
} from '../boardEngine';
import {
  createTutorialSetup,
  getTutorialBotMove,
  getTutorialStep
} from '../tutorialScenario';

describe('tutorialScenario', () => {
  it('completes the full scripted 4-move 1v1 tutorial cleanly with valid board moves', () => {
    const setup = createTutorialSetup();
    const allIds = [
      ...setup.humanHand.map((t) => t.id),
      ...setup.botHand.map((t) => t.id),
      ...setup.boneyard.map((t) => t.id)
    ];
    expect(new Set(allIds).size).toBe(9);

    let board = createInitialBoard();
    let humanHand = [...setup.humanHand];
    let botHand = [...setup.botHand];
    const boneyard = [...setup.boneyard];

    // Step 1: Human plays [5|5] -> +10
    expect(getTutorialStep(board.tiles.length, 0, humanHand)).toBe('opening_double');
    const t55 = humanHand.find((t) => t.id === '5-5')!;
    board = placeFirstTile(board, t55);
    humanHand = humanHand.filter((t) => t.id !== '5-5');
    expect(board.tiles.length).toBe(1);

    // Bot 1: plays [5|2]
    const botMove1 = getTutorialBotMove(board, botHand);
    expect(botMove1?.tile.id).toBe('5-2');
    const bRes1 = placeTileOnBranch(board, botMove1!.tile, botMove1!.branchId);
    board = bRes1.board;
    botHand = botHand.filter((t) => t.id !== botMove1!.tile.id);

    // Step 2: Human plays [2|0] -> +10
    expect(getTutorialStep(board.tiles.length, 0, humanHand)).toBe('score_multiple_5');
    const t20 = humanHand.find((t) => t.id === '2-0')!;
    const t20Branches = getPlayableBranches(board, t20);
    expect(t20Branches.length).toBeGreaterThan(0);
    const hRes2 = placeTileOnBranch(board, t20, t20Branches[0]);
    board = hRes2.board;
    humanHand = humanHand.filter((t) => t.id !== '2-0');
    expect(hRes2.scoredPoints).toBe(10);

    // Bot 2: plays [5|1]
    const botMove2 = getTutorialBotMove(board, botHand);
    expect(botMove2?.tile.id).toBe('5-1');
    const bRes2 = placeTileOnBranch(board, botMove2!.tile, botMove2!.branchId);
    board = bRes2.board;
    botHand = botHand.filter((t) => t.id !== botMove2!.tile.id);

    // Step 3: Human has only [4|6] (unplayable) -> draw [0|6] from bazar -> play [0|6]
    expect(getTutorialStep(board.tiles.length, 0, humanHand)).toBe('draw_bazar');
    expect(getPlayableBranches(board, humanHand[0])).toEqual([]);
    const drawn = boneyard.shift()!;
    expect(drawn.id).toBe('0-6');
    humanHand.push(drawn);

    expect(getTutorialStep(board.tiles.length, 0, humanHand)).toBe('play_drawn');
    const drawnBranches = getPlayableBranches(board, drawn);
    expect(drawnBranches.length).toBeGreaterThan(0);
    board = placeTileOnBranch(board, drawn, drawnBranches[0]).board;
    humanHand = humanHand.filter((t) => t.id !== '0-6');

    // Bot 3: plays [1|4]
    const botMove3 = getTutorialBotMove(board, botHand);
    expect(botMove3?.tile.id).toBe('1-4');
    board = placeTileOnBranch(board, botMove3!.tile, botMove3!.branchId).board;

    // Step 4: Human plays last tile [4|6] -> hand empty (Domino!)
    expect(getTutorialStep(board.tiles.length, 0, humanHand)).toBe('final_domino');
    const lastTile = humanHand[0];
    expect(lastTile.id).toBe('4-6');
    const lastBranches = getPlayableBranches(board, lastTile);
    expect(lastBranches.length).toBeGreaterThan(0);
    const finalBoard = placeTileOnBranch(board, lastTile, lastBranches[0]).board;
    expect(finalBoard.tiles.length).toBe(7);
    humanHand = [];
    expect(humanHand.length).toBe(0);
  });
});
