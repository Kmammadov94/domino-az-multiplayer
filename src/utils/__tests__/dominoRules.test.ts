import { describe, it, expect } from 'vitest';
import {
  createDominoSet,
  dealHands,
  roundUpTo5,
  sumHandPips,
  evaluateBaglandiWinner,
  findFirstHandStarter
} from '../dominoLogic';
import {
  sumHandPips101,
  getMinBoneyardReserve,
  findFirstHandStarter101
} from '../domino101Logic';
import {
  createInitialBoard,
  placeFirstTile,
  placeTileOnBranch,
  getPlayableBranches,
  isBoardGloballyBlocked,
  getActiveOpenEnds
} from '../boardEngine';
import { selectBestAIMove } from '../aiPlayer';
import { TileData, PipValue } from '../../types/domino';

const makeTile = (left: PipValue, right: PipValue): TileData => ({
  id: `${Math.min(left, right)}-${Math.max(left, right)}`,
  left,
  right
});

describe('Domino Set & Dealing (dominoLogic)', () => {
  it('creates a standard 28-tile double-six domino set', () => {
    const set = createDominoSet();
    expect(set).toHaveLength(28);
    const ids = new Set(set.map((t) => t.id));
    expect(ids.size).toBe(28);
  });

  it('deals 7 tiles per player and leaves correct boneyard counts', () => {
    const deck = createDominoSet();
    const { hands: h4, boneyard: b4 } = dealHands('4p_duo', deck);
    expect(h4).toHaveLength(4);
    h4.forEach((h) => expect(h).toHaveLength(7));
    expect(b4).toHaveLength(0);

    const { hands: h2, boneyard: b2 } = dealHands('2p_solo', deck);
    expect(h2).toHaveLength(2);
    h2.forEach((h) => expect(h).toHaveLength(7));
    expect(b2).toHaveLength(14);
  });

  it('rounds end-of-hand pip totals up to nearest 5', () => {
    expect(roundUpTo5(0)).toBe(0);
    expect(roundUpTo5(1)).toBe(5);
    expect(roundUpTo5(5)).toBe(5);
    expect(roundUpTo5(11)).toBe(15);
    expect(roundUpTo5(23)).toBe(25);
  });

  it('requires [3:2] as first-hand starter in 365 mode', () => {
    const hands = [
      [makeTile(6, 6), makeTile(1, 0)],
      [makeTile(3, 2), makeTile(4, 4)]
    ];
    const starter = findFirstHandStarter(hands);
    expect(starter.playerIndex).toBe(1);
    expect(starter.forcedTile.id).toBe('2-3');
  });

  it('evaluates Bağlandı (blocked hand) winner by lowest pip count', () => {
    const players = [
      { id: 0, hand: [makeTile(6, 6)] },
      { id: 1, hand: [makeTile(1, 2)] }
    ];
    const res = evaluateBaglandiWinner(players, '2p_solo');
    expect(res.isTie).toBe(false);
    expect(res.winnerIndex).toBe(1);
  });
});

describe('Domino 101 Rules (domino101Logic)', () => {
  it('enforces boneyard reserve rules (1 in 3p_solo, 2 in 2p_solo, 0 in 4p)', () => {
    expect(getMinBoneyardReserve('101', '2p_solo')).toBe(2);
    expect(getMinBoneyardReserve('101', '3p_solo')).toBe(1);
    expect(getMinBoneyardReserve('101', '4p_duo')).toBe(0);
    expect(getMinBoneyardReserve('365', '2p_solo')).toBe(1);
  });

  it('applies Ayaz [0:0] penalty (10 points ONLY when alone in hand)', () => {
    expect(sumHandPips101([makeTile(0, 0)])).toBe(10);
    expect(sumHandPips101([makeTile(0, 0), makeTile(1, 2)])).toBe(3);
  });

  it('requires [1:1] as first-hand starter in 101 mode', () => {
    const hands = [
      [makeTile(6, 6), makeTile(3, 2)],
      [makeTile(1, 1), makeTile(5, 4)]
    ];
    const starter = findFirstHandStarter101(hands);
    expect(starter.playerIndex).toBe(1);
    expect(starter.forcedTile.id).toBe('1-1');
  });
});

describe('Board Engine & Scoring (boardEngine)', () => {
  it('places first tile, sets spinner on first double, and calculates 5-multiples', () => {
    let board = createInitialBoard();
    board = placeFirstTile(board, makeTile(3, 2));
    const openSum = getActiveOpenEnds(board).reduce((s, e) => s + e.value, 0);
    expect(openSum).toBe(5); // 3 + 2 = 5

    const second = placeTileOnBranch(board, makeTile(3, 3), 'main_left');
    board = second.board;
    // main_left is double 3 (counts as 6), main_right is 2 -> total 8 (not multiple of 5)
    expect(second.scoredPoints).toBe(0);

    // Playing off the double [3:3] declares it as the spinner and activates top/bottom branches
    const third = placeTileOnBranch(board, makeTile(3, 4), 'main_left');
    board = third.board;
    expect(board.spinnerTile?.tile.id).toBe('3-3');
    expect(board.branches.spinner_top.active).toBe(true);
    expect(board.branches.spinner_bottom.active).toBe(true);
  });

  it('detects globally blocked board when all 7 instances of open ends are played', () => {
    let board = createInitialBoard();
    board = placeFirstTile(board, makeTile(0, 0));
    expect(isBoardGloballyBlocked(board)).toBe(false);

    // Place 0-1, 0-2, 0-3, 0-4, 0-5, 0-6 (then replace tips back to 0 via forced layout for check)
    board = {
      ...board,
      tiles: [
        { tile: makeTile(0, 0), x: 0, y: 0, isVertical: true, branch: 'main_left', endValue: 0, connections: 2 },
        { tile: makeTile(0, 1), x: -72, y: 0, isVertical: false, branch: 'main_left', endValue: 1, connections: 2 },
        { tile: makeTile(0, 2), x: 72, y: 0, isVertical: false, branch: 'main_right', endValue: 2, connections: 2 },
        { tile: makeTile(0, 3), x: -144, y: 0, isVertical: false, branch: 'main_left', endValue: 3, connections: 2 },
        { tile: makeTile(0, 4), x: 144, y: 0, isVertical: false, branch: 'main_right', endValue: 4, connections: 2 },
        { tile: makeTile(0, 5), x: -216, y: 0, isVertical: false, branch: 'main_left', endValue: 5, connections: 2 },
        { tile: makeTile(0, 6), x: 216, y: 0, isVertical: false, branch: 'main_right', endValue: 0, connections: 1 }
      ],
      branches: {
        ...board.branches,
        main_left: { ...board.branches.main_left, active: true, openValue: 0, isDouble: false },
        main_right: { ...board.branches.main_right, active: true, openValue: 0, isDouble: false }
      }
    };
    expect(isBoardGloballyBlocked(board)).toBe(true);
  });
});

describe('AI Strategy (aiPlayer)', () => {
  it('in 101 mode, prioritizes finishing the hand over everything else', () => {
    let board = createInitialBoard();
    board = placeFirstTile(board, makeTile(3, 2));
    const move = selectBestAIMove([makeTile(3, 1)], board, 0, '101');
    expect(move).not.toBeNull();
    expect(move!.tile.id).toBe('1-3');
  });

  it('in 365 mode, prioritizes scoring 5-multiple points', () => {
    let board = createInitialBoard();
    board = placeFirstTile(board, makeTile(5, 0));
    const hand = [makeTile(5, 1), makeTile(0, 5), makeTile(5, 6)];
    const move = selectBestAIMove(hand, board, 0, '365');
    expect(move).not.toBeNull();
    expect(move!.expectedScore).toBe(10);
    expect(move!.tile.id).toBe('0-5');
  });

  it('keeps sumHandPips consistent', () => {
    expect(sumHandPips([makeTile(6, 5), makeTile(1, 0)])).toBe(12);
  });
});
