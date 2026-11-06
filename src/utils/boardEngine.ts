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
}

// Fixed dimensions for standard dominoes:
// 1:2 aspect ratio. Short edge = 46px, Long edge = 92px (larger, bolder, clearer).
export const TILE_SHORT = 46;
export const TILE_LONG = 92;
export const TILE_GAP = 2; // tight 2px gap so tiles touch cleanly

export const createInitialBoard = (): GameBoard => {
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
    spinnerDeclared: false
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
  const branchKeys: BranchId[] = ['main_left', 'main_right', 'spinner_top', 'spinner_bottom'];

  for (const bId of branchKeys) {
    const branch = board.branches[bId];
    if (branch.active) {
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
    if (!newBoard.spinnerDeclared) {
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

  // Curving (Snake / 90-degree turn) when a line extends too far
  let direction = branch.direction;
  let shouldTurn = false;
  let nextDirection = direction;

  if (branchId === 'main_left') {
    if (direction === 'left' && branch.tipX < -230) {
      shouldTurn = true;
      nextDirection = 'bottom';
    } else if (direction === 'bottom' && branch.tipY > 140) {
      shouldTurn = true;
      nextDirection = 'right';
    }
  } else if (branchId === 'main_right') {
    if (direction === 'right' && branch.tipX > 230) {
      shouldTurn = true;
      nextDirection = 'top';
    } else if (direction === 'top' && branch.tipY < -140) {
      shouldTurn = true;
      nextDirection = 'left';
    }
  } else if (branchId === 'spinner_top') {
    if (direction === 'top' && branch.tipY < -150) {
      shouldTurn = true;
      nextDirection = 'right';
    }
  } else if (branchId === 'spinner_bottom') {
    if (direction === 'bottom' && branch.tipY > 150) {
      shouldTurn = true;
      nextDirection = 'left';
    }
  }

  // Calculate coordinates & orientation for the new tile
  let newX = branch.tipX;
  let newY = branch.tipY;
  let isVertical = false;

  // Render tile with correct half facing outward
  let orientedTile = { id: tile.id, left: matchingVal, right: newOpenVal };

  if (shouldTurn) {
    if (direction === 'left' && nextDirection === 'bottom') {
      isVertical = !isDouble;
      if (isDouble) {
        newX = branch.tipX - (TILE_SHORT / 2) - TILE_GAP;
        newY = branch.tipY + (TILE_SHORT / 2) + TILE_GAP;
        branch.tipX = newX;
        branch.tipY = newY + (TILE_SHORT / 2);
        orientedTile = { id: tile.id, left: matchingVal, right: newOpenVal };
      } else {
        newX = branch.tipX - (TILE_SHORT / 2) - TILE_GAP;
        newY = branch.tipY + (TILE_LONG - TILE_SHORT) / 2;
        branch.tipX = newX;
        branch.tipY = newY + (TILE_LONG / 2);
        orientedTile = { id: tile.id, left: matchingVal, right: newOpenVal };
      }
    } else if (direction === 'right' && nextDirection === 'top') {
      isVertical = !isDouble;
      if (isDouble) {
        newX = branch.tipX + (TILE_SHORT / 2) + TILE_GAP;
        newY = branch.tipY - (TILE_SHORT / 2) - TILE_GAP;
        branch.tipX = newX;
        branch.tipY = newY - (TILE_SHORT / 2);
        orientedTile = { id: tile.id, left: matchingVal, right: newOpenVal };
      } else {
        newX = branch.tipX + (TILE_SHORT / 2) + TILE_GAP;
        newY = branch.tipY - (TILE_LONG - TILE_SHORT) / 2;
        branch.tipX = newX;
        branch.tipY = newY - (TILE_LONG / 2);
        orientedTile = { id: tile.id, left: newOpenVal, right: matchingVal };
      }
    } else if (direction === 'bottom' && nextDirection === 'right') {
      isVertical = isDouble;
      if (isDouble) {
        newX = branch.tipX + (TILE_SHORT / 2) + TILE_GAP;
        newY = branch.tipY + (TILE_SHORT / 2) + TILE_GAP;
        branch.tipX = newX + (TILE_SHORT / 2);
        branch.tipY = newY;
        orientedTile = { id: tile.id, left: matchingVal, right: newOpenVal };
      } else {
        newX = branch.tipX + (TILE_LONG - TILE_SHORT) / 2;
        newY = branch.tipY + (TILE_SHORT / 2) + TILE_GAP;
        branch.tipX = newX + (TILE_LONG / 2);
        branch.tipY = newY;
        orientedTile = { id: tile.id, left: matchingVal, right: newOpenVal };
      }
    } else if (direction === 'bottom' && nextDirection === 'left') {
      isVertical = isDouble;
      if (isDouble) {
        newX = branch.tipX - (TILE_SHORT / 2) - TILE_GAP;
        newY = branch.tipY + (TILE_SHORT / 2) + TILE_GAP;
        branch.tipX = newX - (TILE_SHORT / 2);
        branch.tipY = newY;
        orientedTile = { id: tile.id, left: matchingVal, right: newOpenVal };
      } else {
        newX = branch.tipX - (TILE_LONG - TILE_SHORT) / 2;
        newY = branch.tipY + (TILE_SHORT / 2) + TILE_GAP;
        branch.tipX = newX - (TILE_LONG / 2);
        branch.tipY = newY;
        orientedTile = { id: tile.id, left: newOpenVal, right: matchingVal };
      }
    } else if (direction === 'top' && nextDirection === 'left') {
      isVertical = isDouble;
      if (isDouble) {
        newX = branch.tipX - (TILE_SHORT / 2) - TILE_GAP;
        newY = branch.tipY - (TILE_SHORT / 2) - TILE_GAP;
        branch.tipX = newX - (TILE_SHORT / 2);
        branch.tipY = newY;
        orientedTile = { id: tile.id, left: matchingVal, right: newOpenVal };
      } else {
        newX = branch.tipX - (TILE_LONG - TILE_SHORT) / 2;
        newY = branch.tipY - (TILE_SHORT / 2) - TILE_GAP;
        branch.tipX = newX - (TILE_LONG / 2);
        branch.tipY = newY;
        orientedTile = { id: tile.id, left: newOpenVal, right: matchingVal };
      }
    } else if (direction === 'top' && nextDirection === 'right') {
      isVertical = isDouble;
      if (isDouble) {
        newX = branch.tipX + (TILE_SHORT / 2) + TILE_GAP;
        newY = branch.tipY - (TILE_SHORT / 2) - TILE_GAP;
        branch.tipX = newX + (TILE_SHORT / 2);
        branch.tipY = newY;
        orientedTile = { id: tile.id, left: matchingVal, right: newOpenVal };
      } else {
        newX = branch.tipX + (TILE_LONG - TILE_SHORT) / 2;
        newY = branch.tipY - (TILE_SHORT / 2) - TILE_GAP;
        branch.tipX = newX + (TILE_LONG / 2);
        branch.tipY = newY;
        orientedTile = { id: tile.id, left: matchingVal, right: newOpenVal };
      }
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
  const branchKeys: BranchId[] = ['main_left', 'main_right', 'spinner_top', 'spinner_bottom'];

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
