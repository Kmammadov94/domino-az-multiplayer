import { TileData, PipValue, OpenEnd } from '../types/domino';

export type BranchId = 'main_left' | 'main_right' | 'spinner_top' | 'spinner_bottom';

export interface BoardTile {
  tile: TileData;
  x: number;
  y: number;
  isVertical: boolean;
  branch: BranchId;
  endValue: PipValue;
  isSpinner?: boolean;
  connections: number;
}

export interface BranchState {
  id: BranchId;
  active: boolean;
  openValue: PipValue;
  isDouble: boolean;
  tipX: number;
  tipY: number;
  direction: 'left' | 'right' | 'top' | 'bottom';
  tileCount: number;
  tipTileIndex: number;
}

export interface GameBoard {
  tiles: BoardTile[];
  branches: Record<BranchId, BranchState>;
  spinnerTile: BoardTile | null;
  spinnerDeclared: boolean;
  allowSpinner?: boolean;
}

// Fixed dimensions for standard dominoes:
// 1:2 aspect ratio. Short edge = 46px, Long edge = 92px (larger, bolder, clearer).
export const TILE_SHORT = 46;
export const TILE_LONG = 92;
export const TILE_GAP = 2; // tight 2px gap so tiles touch cleanly

export const createInitialBoard = (allowSpinner: boolean = true): GameBoard => {
  return {
    tiles: [],
    branches: {
      main_left: {
        id: 'main_left',
        active: false,
        openValue: 0,
        isDouble: false,
        tipX: 0,
        tipY: 0,
        direction: 'left',
        tileCount: 0,
        tipTileIndex: 0
      },
      main_right: {
        id: 'main_right',
        active: false,
        openValue: 0,
        isDouble: false,
        tipX: 0,
        tipY: 0,
        direction: 'right',
        tileCount: 0,
        tipTileIndex: 0
      },
      spinner_top: {
        id: 'spinner_top',
        active: false,
        openValue: 0,
        isDouble: false,
        tipX: 0,
        tipY: 0,
        direction: 'top',
        tileCount: 0,
        tipTileIndex: -1
      },
      spinner_bottom: {
        id: 'spinner_bottom',
        active: false,
        openValue: 0,
        isDouble: false,
        tipX: 0,
        tipY: 0,
        direction: 'bottom',
        tileCount: 0,
        tipTileIndex: -1
      }
    },
    spinnerTile: null,
    spinnerDeclared: false,
    allowSpinner
  };
};

// Place initial opening tile at center (0, 0)
export const placeFirstTile = (board: GameBoard, tile: TileData): GameBoard => {
  const isDouble = tile.left === tile.right;
  // If double, place crosswise (vertical: 36x72). If not double, place horizontally (72x36).
  const initialTile: BoardTile = {
    tile,
    x: 0,
    y: 0,
    isVertical: isDouble,
    branch: 'main_left',
    endValue: tile.left,
    connections: 0
  };

  const halfWidth = isDouble ? TILE_SHORT / 2 : TILE_LONG / 2;

  const newBoard: GameBoard = {
    ...board,
    tiles: [initialTile],
    branches: {
      ...board.branches,
      main_left: {
        id: 'main_left',
        active: true,
        openValue: tile.left,
        isDouble,
        tipX: -halfWidth,
        tipY: 0,
        direction: 'left',
        tileCount: 0,
        tipTileIndex: 0
      },
      main_right: {
        id: 'main_right',
        active: true,
        openValue: tile.right,
        isDouble,
        tipX: halfWidth,
        tipY: 0,
        direction: 'right',
        tileCount: 0,
        tipTileIndex: 0
      }
    }
  };

  return newBoard;
};

// Check which branches can accept this tile
export const getPlayableBranches = (board: GameBoard, tile: TileData): BranchId[] => {
  if (board.tiles.length === 0) return ['main_left'];

  const playable: BranchId[] = [];
  const branchKeys: BranchId[] =
    board.allowSpinner === false
      ? ['main_left', 'main_right']
      : ['main_left', 'main_right', 'spinner_top', 'spinner_bottom'];

  for (const bId of branchKeys) {
    const branch = board.branches[bId];
    if (branch && branch.active) {
      if (tile.left === branch.openValue || tile.right === branch.openValue) {
        playable.push(bId);
      }
    }
  }

  return playable;
};

// Place tile onto a branch
export const placeTileOnBranch = (
  board: GameBoard,
  tile: TileData,
  branchId: BranchId
): { board: GameBoard; scoredPoints: number } => {
  const newBoard: GameBoard = JSON.parse(JSON.stringify(board));
  const branch = newBoard.branches[branchId];
  const isDouble = tile.left === tile.right;

  // Determine matching vs outward end
  let matchingVal = tile.left;
  let newOpenVal = tile.right;
  if (tile.right === branch.openValue) {
    matchingVal = tile.right;
    newOpenVal = tile.left;
  } else if (tile.left === branch.openValue) {
    matchingVal = tile.left;
    newOpenVal = tile.right;
  }

  // Update parent tile's connections count
  const parentIdx = branch.tipTileIndex;
  if (parentIdx >= 0 && parentIdx < newBoard.tiles.length) {
    const parentTile = newBoard.tiles[parentIdx];
    parentTile.connections = (parentTile.connections || 0) + 1;

    // Check Spinner declaration:
    // "The spinner is not the first double played, but the first double that has tiles in both sides"
    // Spinner is strictly disabled in 101 mode (allowSpinner === false)!
    if (newBoard.allowSpinner !== false && !newBoard.spinnerDeclared) {
      const isParentDouble = parentTile.tile.left === parentTile.tile.right;
      if (isParentDouble && parentTile.connections >= 2) {
        newBoard.spinnerDeclared = true;
        parentTile.isSpinner = true;
        newBoard.spinnerTile = parentTile;

        // When a double becomes the Spinner, its 2 perpendicular arms open for play!
        if (parentTile.isVertical) {
          // Double is oriented vertically; arms extend TOP (up) and BOTTOM (down)!
          newBoard.branches.spinner_top = {
            id: 'spinner_top',
            active: true,
            openValue: parentTile.tile.left,
            isDouble: false,
            tipX: parentTile.x,
            tipY: parentTile.y - (TILE_LONG / 2),
            direction: 'top',
            tileCount: 0,
            tipTileIndex: parentIdx
          };
          newBoard.branches.spinner_bottom = {
            id: 'spinner_bottom',
            active: true,
            openValue: parentTile.tile.left,
            isDouble: false,
            tipX: parentTile.x,
            tipY: parentTile.y + (TILE_LONG / 2),
            direction: 'bottom',
            tileCount: 0,
            tipTileIndex: parentIdx
          };
        } else {
          // Double is oriented horizontally; arms extend LEFT and RIGHT!
          newBoard.branches.spinner_top = {
            id: 'spinner_top',
            active: true,
            openValue: parentTile.tile.left,
            isDouble: false,
            tipX: parentTile.x - (TILE_LONG / 2),
            tipY: parentTile.y,
            direction: 'left',
            tileCount: 0,
            tipTileIndex: parentIdx
          };
          newBoard.branches.spinner_bottom = {
            id: 'spinner_bottom',
            active: true,
            openValue: parentTile.tile.left,
            isDouble: false,
            tipX: parentTile.x + (TILE_LONG / 2),
            tipY: parentTile.y,
            direction: 'right',
            tileCount: 0,
            tipTileIndex: parentIdx
          };
        }
      }
    }
  }

  // Curving (Snake / 90-degree L-shape turn) when a line extends too far
  const direction = branch.direction;
  let shouldTurn = false;
  let nextDirection = direction;

  // Generous thresholds: let lines breathe naturally before turning (at least 3-4 tiles)
  if (branchId === 'main_left') {
    if (direction === 'left' && branch.tipX < -320) {
      shouldTurn = true;
      nextDirection = 'bottom';
    } else if (direction === 'bottom' && branch.tipY > 220) {
      shouldTurn = true;
      nextDirection = 'right';
    }
  } else if (branchId === 'main_right') {
    if (direction === 'right' && branch.tipX > 320) {
      shouldTurn = true;
      nextDirection = 'top';
    } else if (direction === 'top' && branch.tipY < -220) {
      shouldTurn = true;
      nextDirection = 'left';
    }
  } else if (branchId === 'spinner_top') {
    if (direction === 'top' && branch.tipY < -260) {
      shouldTurn = true;
      nextDirection = 'right';
    } else if (direction === 'right' && branch.tipX > 260) {
      shouldTurn = true;
      nextDirection = 'bottom';
    }
  } else if (branchId === 'spinner_bottom') {
    if (direction === 'bottom' && branch.tipY > 260) {
      shouldTurn = true;
      nextDirection = 'right';
    } else if (direction === 'right' && branch.tipX > 260) {
      shouldTurn = true;
      nextDirection = 'top';
    }
  }

  // Calculate coordinates & orientation for the new tile
  let newX = branch.tipX;
  let newY = branch.tipY;
  let isVertical = false;

  // Render tile with correct half facing outward
  let orientedTile = { id: tile.id, left: matchingVal, right: newOpenVal };

  // Rule: NEVER turn on a double or immediately after a double! Doubles must lie squarely across the line,
  // and turns only happen between normal tiles after any double.
  const canTurnNow = shouldTurn && !isDouble && !branch.isDouble && branch.tileCount >= 1;

  if (canTurnNow) {
    if (direction === 'left' && nextDirection === 'bottom') {
      isVertical = true;
      newX = branch.tipX - TILE_GAP - (TILE_SHORT / 2);
      newY = branch.tipY + (TILE_LONG / 4);
      branch.tipX = newX;
      branch.tipY = newY + (TILE_LONG / 2);
      orientedTile = { id: tile.id, left: matchingVal, right: newOpenVal };
    } else if (direction === 'right' && nextDirection === 'top') {
      isVertical = true;
      newX = branch.tipX + TILE_GAP + (TILE_SHORT / 2);
      newY = branch.tipY - (TILE_LONG / 4);
      branch.tipX = newX;
      branch.tipY = newY - (TILE_LONG / 2);
      orientedTile = { id: tile.id, left: newOpenVal, right: matchingVal };
    } else if (direction === 'bottom' && nextDirection === 'right') {
      isVertical = false;
      newY = branch.tipY + TILE_GAP + (TILE_SHORT / 2);
      newX = branch.tipX + (TILE_LONG / 4);
      branch.tipX = newX + (TILE_LONG / 2);
      branch.tipY = newY;
      orientedTile = { id: tile.id, left: matchingVal, right: newOpenVal };
    } else if (direction === 'bottom' && nextDirection === 'left') {
      isVertical = false;
      newY = branch.tipY + TILE_GAP + (TILE_SHORT / 2);
      newX = branch.tipX - (TILE_LONG / 4);
      branch.tipX = newX - (TILE_LONG / 2);
      branch.tipY = newY;
      orientedTile = { id: tile.id, left: newOpenVal, right: matchingVal };
    } else if (direction === 'top' && nextDirection === 'left') {
      isVertical = false;
      newY = branch.tipY - TILE_GAP - (TILE_SHORT / 2);
      newX = branch.tipX - (TILE_LONG / 4);
      branch.tipX = newX - (TILE_LONG / 2);
      branch.tipY = newY;
      orientedTile = { id: tile.id, left: newOpenVal, right: matchingVal };
    } else if (direction === 'top' && nextDirection === 'right') {
      isVertical = false;
      newY = branch.tipY - TILE_GAP - (TILE_SHORT / 2);
      newX = branch.tipX + (TILE_LONG / 4);
      branch.tipX = newX + (TILE_LONG / 2);
      branch.tipY = newY;
      orientedTile = { id: tile.id, left: matchingVal, right: newOpenVal };
    }
    branch.direction = nextDirection;
  } else {
    // Normal straight extension along branch.direction
    switch (direction) {
      case 'left':
        isVertical = isDouble;
        if (isDouble) {
          newX = branch.tipX - (TILE_SHORT / 2) - TILE_GAP;
          newY = branch.tipY;
          branch.tipX = newX - (TILE_SHORT / 2);
        } else {
          newX = branch.tipX - (TILE_LONG / 2) - TILE_GAP;
          newY = branch.tipY;
          branch.tipX = newX - (TILE_LONG / 2);
          orientedTile = { id: tile.id, left: newOpenVal, right: matchingVal };
        }
        break;

      case 'right':
        isVertical = isDouble;
        if (isDouble) {
          newX = branch.tipX + (TILE_SHORT / 2) + TILE_GAP;
          newY = branch.tipY;
          branch.tipX = newX + (TILE_SHORT / 2);
        } else {
          newX = branch.tipX + (TILE_LONG / 2) + TILE_GAP;
          newY = branch.tipY;
          branch.tipX = newX + (TILE_LONG / 2);
          orientedTile = { id: tile.id, left: matchingVal, right: newOpenVal };
        }
        break;

      case 'top':
        isVertical = !isDouble;
        if (isDouble) {
          newX = branch.tipX;
          newY = branch.tipY - (TILE_SHORT / 2) - TILE_GAP;
          branch.tipY = newY - (TILE_SHORT / 2);
        } else {
          newX = branch.tipX;
          newY = branch.tipY - (TILE_LONG / 2) - TILE_GAP;
          branch.tipY = newY - (TILE_LONG / 2);
          orientedTile = { id: tile.id, left: newOpenVal, right: matchingVal };
        }
        break;

      case 'bottom':
        isVertical = !isDouble;
        if (isDouble) {
          newX = branch.tipX;
          newY = branch.tipY + (TILE_SHORT / 2) + TILE_GAP;
          branch.tipY = newY + (TILE_SHORT / 2);
        } else {
          newX = branch.tipX;
          newY = branch.tipY + (TILE_LONG / 2) + TILE_GAP;
          branch.tipY = newY + (TILE_LONG / 2);
          orientedTile = { id: tile.id, left: matchingVal, right: newOpenVal };
        }
        break;
    }
  }

  const placed: BoardTile = {
    tile: orientedTile,
    x: newX,
    y: newY,
    isVertical,
    branch: branchId,
    endValue: newOpenVal,
    connections: 1
  };

  newBoard.tiles.push(placed);
  const newTileIdx = newBoard.tiles.length - 1;

  branch.tileCount++;
  branch.openValue = newOpenVal;
  branch.isDouble = isDouble;
  branch.tipTileIndex = newTileIdx;

  // Calculate current open ends & score
  const openEnds = getActiveOpenEnds(newBoard);
  let totalPips = 0;
  for (const end of openEnds) {
    if (end.isDouble) {
      totalPips += end.value * 2;
    } else {
      totalPips += end.value;
    }
  }

  const scoredPoints = (totalPips > 0 && totalPips % 5 === 0) ? totalPips : 0;
  return { board: newBoard, scoredPoints };
};

// Retrieve all currently open ends
export const getActiveOpenEnds = (board: GameBoard): OpenEnd[] => {
  if (board.tiles.length === 0) return [];
  if (board.tiles.length === 1) {
    const first = board.tiles[0];
    const isDouble = first.tile.left === first.tile.right;
    if (isDouble) {
      return [
        {
          id: 'first_double',
          tileId: first.tile.id,
          value: first.tile.left,
          x: 0,
          y: 0,
          direction: 'left',
          isDouble: true
        }
      ];
    } else {
      return [
        {
          id: 'first_left',
          tileId: first.tile.id,
          value: first.tile.left,
          x: 0,
          y: 0,
          direction: 'left',
          isDouble: false
        },
        {
          id: 'first_right',
          tileId: first.tile.id,
          value: first.tile.right,
          x: 0,
          y: 0,
          direction: 'right',
          isDouble: false
        }
      ];
    }
  }

  const openEnds: OpenEnd[] = [];
  const branchKeys: BranchId[] =
    board.allowSpinner === false
      ? ['main_left', 'main_right']
      : ['main_left', 'main_right', 'spinner_top', 'spinner_bottom'];

  for (const bId of branchKeys) {
    const branch = board.branches[bId];
    if (branch.active) {
      // The spinner itself is completely excluded from calculations!
      // A spinner arm only contributes to the score when an actual tile has been played on it.
      if ((bId === 'spinner_top' || bId === 'spinner_bottom') && branch.tileCount === 0) {
        continue;
      }

      openEnds.push({
        id: bId,
        tileId: bId,
        value: branch.openValue,
        x: branch.tipX,
        y: branch.tipY,
        direction: branch.direction,
        isDouble: branch.isDouble
      });
    }
  }

  return openEnds;
};

/**
 * Checks if the board is mathematically and irrevocably blocked.
 * The board is blocked if every currently open branch end number has already had
 * all 7 of its tiles placed on the board.
 * In this state, neither any player nor the bazaar can possibly contain a playable tile,
 * so the hand must immediately conclude without forcing players to draw from the boneyard.
 */
export const isBoardGloballyBlocked = (board: GameBoard): boolean => {
  if (!board || board.tiles.length === 0) return false;

  const branchKeys: BranchId[] = ['main_left', 'main_right', 'spinner_top', 'spinner_bottom'];
  const activeOpenValues = new Set<PipValue>();

  for (const bId of branchKeys) {
    const branch = board.branches[bId];
    if (branch && branch.active) {
      activeOpenValues.add(branch.openValue);
    }
  }

  if (activeOpenValues.size === 0) return false;

  // In standard double-six dominoes, there are exactly 7 tiles containing any pip value V:
  // [V:0], [V:1], [V:2], [V:3], [V:4], [V:5], [V:6].
  // If for EVERY active openValue on the board, all 7 tiles containing that value
  // have already been placed on the table, then NO remaining unplayed tile anywhere
  // (neither in any player's hand nor in the bazaar) can possibly be played.
  for (const pip of activeOpenValues) {
    let countOnBoard = 0;
    for (const boardTile of board.tiles) {
      if (boardTile.tile.left === pip || boardTile.tile.right === pip) {
        countOnBoard++;
      }
    }
    if (countOnBoard < 7) {
      return false;
    }
  }

  return true;
};

/**
 * Checks if ANY tile in the given list can be played on the board.
 */
export const canAnyTileBePlayed = (board: GameBoard, tiles: TileData[]): boolean => {
  if (!board || tiles.length === 0) return false;
  return tiles.some((tile) => getPlayableBranches(board, tile).length > 0);
};

/**
 * Checks if the hand is blocked without peeking at hidden boneyard tiles:
 * true when all 7 dominoes of every open branch end are already on the board,
 * or when no drawable boneyard tiles remain and no player holds a playable tile.
 */
export const isHandBlockedAfterPlay = (
  board: GameBoard,
  hands: TileData[][],
  drawableCount: number
): boolean => {
  if (isBoardGloballyBlocked(board)) return true;
  return drawableCount === 0 && !hands.some((hand) => canAnyTileBePlayed(board, hand));
};

const getSpiralNextDirection = (
  branchId: BranchId,
  direction: BranchState['direction'],
  tipX: number,
  tipY: number,
  limitX: number,
  limitY: number
): BranchState['direction'] | null => {
  // Clockwise 4-quadrant spiral so branches never cross each other even on long chains
  if (branchId === 'main_left') {
    if (direction === 'left' && tipX < -limitX) return 'top';
    if (direction === 'top' && tipY < -limitY) return 'right';
    if (direction === 'right' && tipX > limitX) return 'bottom';
  } else if (branchId === 'main_right') {
    if (direction === 'right' && tipX > limitX) return 'bottom';
    if (direction === 'bottom' && tipY > limitY) return 'left';
    if (direction === 'left' && tipX < -limitX) return 'top';
  } else if (branchId === 'spinner_top') {
    if (direction === 'top' && tipY < -limitY) return 'right';
    if (direction === 'right' && tipX > limitX) return 'bottom';
    if (direction === 'bottom' && tipY > limitY) return 'left';
  } else if (branchId === 'spinner_bottom') {
    if (direction === 'bottom' && tipY > limitY) return 'left';
    if (direction === 'left' && tipX < -limitX) return 'top';
    if (direction === 'top' && tipY < -limitY) return 'right';
  }
  return null;
};

const layoutBoardWithTurnLimits = (
  board: GameBoard,
  limitX: number,
  limitY: number
): GameBoard => {
  if (!board || board.tiles.length <= 1) return board;

  const firstSrc = board.tiles[0];
  const firstIsDouble = firstSrc.tile.left === firstSrc.tile.right;
  const firstHalfW = firstIsDouble ? TILE_SHORT / 2 : TILE_LONG / 2;

  const visualTiles: BoardTile[] = [
    {
      ...firstSrc,
      x: 0,
      y: 0,
      isVertical: firstIsDouble
    }
  ];

  const branches: Record<BranchId, BranchState> = {
    main_left: {
      ...board.branches.main_left,
      tipX: -firstHalfW,
      tipY: 0,
      direction: 'left',
      isDouble: firstIsDouble,
      tileCount: 0,
      tipTileIndex: 0
    },
    main_right: {
      ...board.branches.main_right,
      tipX: firstHalfW,
      tipY: 0,
      direction: 'right',
      isDouble: firstIsDouble,
      tileCount: 0,
      tipTileIndex: 0
    },
    spinner_top: {
      ...board.branches.spinner_top,
      tileCount: 0
    },
    spinner_bottom: {
      ...board.branches.spinner_bottom,
      tileCount: 0
    }
  };

  let spinnerX: number | null = null;
  if (firstSrc.isSpinner) {
    spinnerX = 0;
    if (firstIsDouble) {
      branches.spinner_top = {
        ...branches.spinner_top,
        tipX: 0,
        tipY: -TILE_LONG / 2,
        direction: 'top',
        isDouble: false
      };
      branches.spinner_bottom = {
        ...branches.spinner_bottom,
        tipX: 0,
        tipY: TILE_LONG / 2,
        direction: 'bottom',
        isDouble: false
      };
    } else {
      branches.spinner_top = {
        ...branches.spinner_top,
        tipX: -TILE_LONG / 2,
        tipY: 0,
        direction: 'left',
        isDouble: false
      };
      branches.spinner_bottom = {
        ...branches.spinner_bottom,
        tipX: TILE_LONG / 2,
        tipY: 0,
        direction: 'right',
        isDouble: false
      };
    }
  }

  for (let i = 1; i < board.tiles.length; i++) {
    const src = board.tiles[i];
    const branchId = src.branch;
    const branch = branches[branchId];
    const isDouble = src.tile.left === src.tile.right;
    const newOpenVal = src.endValue;
    const matchingVal = src.tile.left === newOpenVal ? src.tile.right : src.tile.left;

    const direction = branch.direction;
    const nextDirCandidate = getSpiralNextDirection(
      branchId,
      direction,
      branch.tipX,
      branch.tipY,
      limitX,
      limitY
    );

    const tooCloseToSpinner =
      spinnerX !== null &&
      (branchId === 'main_left' || branchId === 'main_right') &&
      Math.abs(branch.tipX - spinnerX) < 60;

    // Never turn on a double or immediately after a double ("after the doubles")
    const canTurnNow =
      nextDirCandidate !== null &&
      !isDouble &&
      !branch.isDouble &&
      branch.tileCount >= 1 &&
      !tooCloseToSpinner;

    let newX = branch.tipX;
    let newY = branch.tipY;
    let isVertical = false;
    let orientedTile: TileData = { id: src.tile.id, left: matchingVal, right: newOpenVal };

    if (canTurnNow && nextDirCandidate) {
      if (direction === 'left' && nextDirCandidate === 'bottom') {
        isVertical = true;
        newX = branch.tipX - TILE_GAP - TILE_SHORT / 2;
        newY = branch.tipY + TILE_LONG / 4;
        branch.tipX = newX;
        branch.tipY = newY + TILE_LONG / 2;
        orientedTile = { id: src.tile.id, left: matchingVal, right: newOpenVal };
      } else if (direction === 'left' && nextDirCandidate === 'top') {
        isVertical = true;
        newX = branch.tipX - TILE_GAP - TILE_SHORT / 2;
        newY = branch.tipY - TILE_LONG / 4;
        branch.tipX = newX;
        branch.tipY = newY - TILE_LONG / 2;
        orientedTile = { id: src.tile.id, left: newOpenVal, right: matchingVal };
      } else if (direction === 'right' && nextDirCandidate === 'top') {
        isVertical = true;
        newX = branch.tipX + TILE_GAP + TILE_SHORT / 2;
        newY = branch.tipY - TILE_LONG / 4;
        branch.tipX = newX;
        branch.tipY = newY - TILE_LONG / 2;
        orientedTile = { id: src.tile.id, left: newOpenVal, right: matchingVal };
      } else if (direction === 'right' && nextDirCandidate === 'bottom') {
        isVertical = true;
        newX = branch.tipX + TILE_GAP + TILE_SHORT / 2;
        newY = branch.tipY + TILE_LONG / 4;
        branch.tipX = newX;
        branch.tipY = newY + TILE_LONG / 2;
        orientedTile = { id: src.tile.id, left: matchingVal, right: newOpenVal };
      } else if (direction === 'bottom' && nextDirCandidate === 'right') {
        isVertical = false;
        newY = branch.tipY + TILE_GAP + TILE_SHORT / 2;
        newX = branch.tipX + TILE_LONG / 4;
        branch.tipX = newX + TILE_LONG / 2;
        branch.tipY = newY;
        orientedTile = { id: src.tile.id, left: matchingVal, right: newOpenVal };
      } else if (direction === 'bottom' && nextDirCandidate === 'left') {
        isVertical = false;
        newY = branch.tipY + TILE_GAP + TILE_SHORT / 2;
        newX = branch.tipX - TILE_LONG / 4;
        branch.tipX = newX - TILE_LONG / 2;
        branch.tipY = newY;
        orientedTile = { id: src.tile.id, left: newOpenVal, right: matchingVal };
      } else if (direction === 'top' && nextDirCandidate === 'left') {
        isVertical = false;
        newY = branch.tipY - TILE_GAP - TILE_SHORT / 2;
        newX = branch.tipX - TILE_LONG / 4;
        branch.tipX = newX - TILE_LONG / 2;
        branch.tipY = newY;
        orientedTile = { id: src.tile.id, left: newOpenVal, right: matchingVal };
      } else if (direction === 'top' && nextDirCandidate === 'right') {
        isVertical = false;
        newY = branch.tipY - TILE_GAP - TILE_SHORT / 2;
        newX = branch.tipX + TILE_LONG / 4;
        branch.tipX = newX + TILE_LONG / 2;
        branch.tipY = newY;
        orientedTile = { id: src.tile.id, left: matchingVal, right: newOpenVal };
      }
      branch.direction = nextDirCandidate;
    } else {
      switch (direction) {
        case 'left':
          isVertical = isDouble;
          if (isDouble) {
            newX = branch.tipX - TILE_SHORT / 2 - TILE_GAP;
            newY = branch.tipY;
            branch.tipX = newX - TILE_SHORT / 2;
          } else {
            newX = branch.tipX - TILE_LONG / 2 - TILE_GAP;
            newY = branch.tipY;
            branch.tipX = newX - TILE_LONG / 2;
            orientedTile = { id: src.tile.id, left: newOpenVal, right: matchingVal };
          }
          break;
        case 'right':
          isVertical = isDouble;
          if (isDouble) {
            newX = branch.tipX + TILE_SHORT / 2 + TILE_GAP;
            newY = branch.tipY;
            branch.tipX = newX + TILE_SHORT / 2;
          } else {
            newX = branch.tipX + TILE_LONG / 2 + TILE_GAP;
            newY = branch.tipY;
            branch.tipX = newX + TILE_LONG / 2;
            orientedTile = { id: src.tile.id, left: matchingVal, right: newOpenVal };
          }
          break;
        case 'top':
          isVertical = !isDouble;
          if (isDouble) {
            newX = branch.tipX;
            newY = branch.tipY - TILE_SHORT / 2 - TILE_GAP;
            branch.tipY = newY - TILE_SHORT / 2;
          } else {
            newX = branch.tipX;
            newY = branch.tipY - TILE_LONG / 2 - TILE_GAP;
            branch.tipY = newY - TILE_LONG / 2;
            orientedTile = { id: src.tile.id, left: newOpenVal, right: matchingVal };
          }
          break;
        case 'bottom':
          isVertical = !isDouble;
          if (isDouble) {
            newX = branch.tipX;
            newY = branch.tipY + TILE_SHORT / 2 + TILE_GAP;
            branch.tipY = newY + TILE_SHORT / 2;
          } else {
            newX = branch.tipX;
            newY = branch.tipY + TILE_LONG / 2 + TILE_GAP;
            branch.tipY = newY + TILE_LONG / 2;
            orientedTile = { id: src.tile.id, left: matchingVal, right: newOpenVal };
          }
          break;
      }
    }

    visualTiles.push({
      ...src,
      tile: orientedTile,
      x: newX,
      y: newY,
      isVertical
    });

    branch.tileCount++;
    branch.isDouble = isDouble;
    branch.tipTileIndex = i;

    if (src.isSpinner) {
      spinnerX = newX;
      if (isVertical) {
        branches.spinner_top = {
          ...branches.spinner_top,
          tipX: newX,
          tipY: newY - TILE_LONG / 2,
          direction: 'top',
          isDouble: false
        };
        branches.spinner_bottom = {
          ...branches.spinner_bottom,
          tipX: newX,
          tipY: newY + TILE_LONG / 2,
          direction: 'bottom',
          isDouble: false
        };
      } else {
        branches.spinner_top = {
          ...branches.spinner_top,
          tipX: newX - TILE_LONG / 2,
          tipY: newY,
          direction: 'left',
          isDouble: false
        };
        branches.spinner_bottom = {
          ...branches.spinner_bottom,
          tipX: newX + TILE_LONG / 2,
          tipY: newY,
          direction: 'right',
          isDouble: false
        };
      }
    }
  }

  return {
    ...board,
    tiles: visualTiles,
    branches
  };
};

const measureBoardFitScale = (board: GameBoard, usableW: number, usableH: number): number => {
  let minX = -80;
  let maxX = 80;
  let minY = -60;
  let maxY = 60;

  board.tiles.forEach((t) => {
    const halfW = (t.isVertical ? TILE_SHORT : TILE_LONG) / 2;
    const halfH = (t.isVertical ? TILE_LONG : TILE_SHORT) / 2;
    minX = Math.min(minX, t.x - halfW - 30);
    maxX = Math.max(maxX, t.x + halfW + 30);
    minY = Math.min(minY, t.y - halfH - 30);
    maxY = Math.max(maxY, t.y + halfH + 30);
  });

  const branchKeys: BranchId[] = ['main_left', 'main_right', 'spinner_top', 'spinner_bottom'];
  branchKeys.forEach((bId) => {
    const branch = board.branches[bId];
    if (branch && branch.active) {
      minX = Math.min(minX, branch.tipX - 45);
      maxX = Math.max(maxX, branch.tipX + 45);
      minY = Math.min(minY, branch.tipY - 45);
      maxY = Math.max(maxY, branch.tipY + 45);
    }
  });

  const spanX = Math.max(280, maxX - minX);
  const spanY = Math.max(180, maxY - minY);
  return Math.min(usableW / spanX, usableH / spanY);
};

/**
 * Dynamically re-folds domino branches visually mid-game so the layout stays large and fits the viewport.
 * Never alters game state/rules; only adjusts visual tile coordinates & turn points.
 */
export const computeVisualBoardLayout = (
  board: GameBoard,
  usableW: number,
  usableH: number
): GameBoard => {
  if (!board || board.tiles.length <= 2) return board;

  const wide = layoutBoardWithTurnLimits(board, 320, 220);
  const wideScale = measureBoardFitScale(wide, usableW, usableH);
  if (wideScale >= 0.58) return wide;

  const medium = layoutBoardWithTurnLimits(board, 180, 160);
  const mediumScale = measureBoardFitScale(medium, usableW, usableH);
  if (mediumScale >= 0.46) {
    return mediumScale >= wideScale ? medium : wide;
  }

  const compact = layoutBoardWithTurnLimits(board, 125, 125);
  const compactScale = measureBoardFitScale(compact, usableW, usableH);

  let bestBoard = wide;
  let bestScale = wideScale;
  if (mediumScale > bestScale) {
    bestBoard = medium;
    bestScale = mediumScale;
  }
  if (compactScale > bestScale) {
    bestBoard = compact;
  }
  return bestBoard;
};
