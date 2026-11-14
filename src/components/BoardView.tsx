import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { GameBoard, BranchId, TILE_SHORT, TILE_LONG, computeVisualBoardLayout } from '../utils/boardEngine';
import { DominoSkin, TileData } from '../types/domino';
import { TABLE_THEMES, DEFAULT_TABLE_THEME_ID, TableTheme } from '../data/tableThemes';
import { DominoTile } from './DominoTile';
import { RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

interface BoardViewProps {
  board: GameBoard;
  skin: DominoSkin;
  tableThemeId?: string;
  selectedTile: TileData | null;
  playableBranches: BranchId[];
  onSelectBranch: (branchId: BranchId) => void;
  branchExpectedScores?: Record<BranchId, number>;
  hoveredBranch?: BranchId | null;
  boneyardCount?: number;
  onDrawBazaar?: () => void;
  canDrawFromBazaar?: boolean;
  isDraggingTile?: boolean;
  variant?: '365' | '101';
  isFramedSquare?: boolean;
}

export const BoardView: React.FC<BoardViewProps> = React.memo(({
  board,
  skin,
  tableThemeId = DEFAULT_TABLE_THEME_ID,
  selectedTile,
  playableBranches,
  onSelectBranch,
  branchExpectedScores = {} as Record<BranchId, number>,
  hoveredBranch = null,
  isDraggingTile = false,
  variant = '365',
  isFramedSquare = false
}) => {
  const tableTheme: TableTheme =
    TABLE_THEMES.find((t) => t.id === tableThemeId) || TABLE_THEMES[0];
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ w: 900, h: 500 });

  // Pan and User Zoom state for free exploration
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [userZoom, setUserZoom] = useState(1.0);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef<number>(1.0);

  // Measure actual container dimensions reactively
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setViewport({
          w: entry.contentRect.width,
          h: entry.contentRect.height
        });
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Safe padding so tiles never touch HUD margins or screen boundaries
  // In framed 1:1 portrait mode, opponent badges live outside the board so internal padding stays compact & symmetrical
  const isShortLandscape = !isFramedSquare && viewport.h < 350;
  const squarePad = Math.max(28, Math.min(44, Math.min(viewport.w, viewport.h) * 0.1));
  const paddingX = isFramedSquare
    ? squarePad
    : viewport.w > 700
    ? Math.min(70, viewport.w * 0.08)
    : Math.min(140, viewport.w * 0.15);
  const paddingY = isFramedSquare
    ? squarePad
    : isShortLandscape
    ? Math.max(28, Math.min(42, viewport.h * 0.12))
    : Math.min(110, viewport.h * 0.18);
  const usableW = Math.max(isFramedSquare ? 160 : 220, viewport.w - paddingX * 2);
  const usableH = Math.max(isShortLandscape ? 120 : 160, viewport.h - paddingY * 2);

  // Dynamically re-fold domino layout visually mid-game so it stays big & fits the screen cleanly
  const visualBoard = useMemo(
    () => computeVisualBoardLayout(board, usableW, usableH),
    [board, usableW, usableH]
  );

  // Calculate bounding box of all visually placed tiles
  let minX = -80;
  let maxX = 80;
  let minY = -60;
  let maxY = 60;

  visualBoard.tiles.forEach((t) => {
    const halfW = (t.isVertical ? TILE_SHORT : TILE_LONG) / 2;
    const halfH = (t.isVertical ? TILE_LONG : TILE_SHORT) / 2;
    minX = Math.min(minX, t.x - halfW - 30);
    maxX = Math.max(maxX, t.x + halfW + 30);
    minY = Math.min(minY, t.y - halfH - 30);
    maxY = Math.max(maxY, t.y + halfH + 30);
  });

  // Include target tips for playable branches in the bounding box
  const branchKeys: BranchId[] = ['main_left', 'main_right', 'spinner_top', 'spinner_bottom'];
  branchKeys.forEach((bId) => {
    const branch = visualBoard.branches[bId];
    if (branch.active) {
      minX = Math.min(minX, branch.tipX - 45);
      maxX = Math.max(maxX, branch.tipX + 45);
      minY = Math.min(minY, branch.tipY - 45);
      maxY = Math.max(maxY, branch.tipY + 45);
    }
  });

  const spanX = Math.max(280, maxX - minX);
  const spanY = Math.max(180, maxY - minY);

  // Dynamic auto-scale factor ensuring all tiles fit inside visible bounds
  // On tablets & large screens, allow center domino tiles to render significantly larger (up to 1.85x)
  // so they are crisp, tactile, and prominent instead of looking tiny!
  const isTabletOrLarge = isFramedSquare
    ? viewport.w >= 600
    : viewport.w >= 768 || viewport.h >= 600;
  const maxAutoScale = isTabletOrLarge ? 1.85 : 1.35;
  const minAutoScale = isFramedSquare ? 0.24 : 0.28;
  const rawAutoScale = Math.min(usableW / spanX, usableH / spanY);
  const autoScale = Math.min(maxAutoScale, Math.max(minAutoScale, rawAutoScale));

  const finalScale = autoScale * userZoom;
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isDraggingTile) return;
    // Only drag with left click on background
    if (e.button !== 0) return;
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDraggingTile || !isDraggingRef.current) return;
    setPanOffset({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  }, [isDraggingTile]);

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setUserZoom((prev) => Math.min(2.5, Math.max(0.45, prev * zoomFactor)));
  };

  // Touch pan & pinch-to-zoom handlers (native multi-touch on Tablets & Mobile)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isDraggingTile) return;
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      dragStartRef.current = {
        x: e.touches[0].clientX - panOffset.x,
        y: e.touches[0].clientY - panOffset.y
      };
      pinchStartDistRef.current = null;
    } else if (e.touches.length === 2) {
      isDraggingRef.current = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStartDistRef.current = Math.hypot(dx, dy);
      pinchStartZoomRef.current = userZoom;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDraggingTile) return;
    if (e.touches.length === 1 && isDraggingRef.current) {
      setPanOffset({
        x: e.touches[0].clientX - dragStartRef.current.x,
        y: e.touches[0].clientY - dragStartRef.current.y
      });
    } else if (e.touches.length === 2 && pinchStartDistRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const currentDist = Math.hypot(dx, dy);
      if (pinchStartDistRef.current > 0) {
        const factor = currentDist / pinchStartDistRef.current;
        const newZoom = Math.min(2.5, Math.max(0.45, pinchStartZoomRef.current * factor));
        setUserZoom(newZoom);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      isDraggingRef.current = false;
      pinchStartDistRef.current = null;
    } else if (e.touches.length === 1) {
      isDraggingRef.current = true;
      dragStartRef.current = {
        x: e.touches[0].clientX - panOffset.x,
        y: e.touches[0].clientY - panOffset.y
      };
      pinchStartDistRef.current = null;
    }
  };

  // Reset view to default auto-fit
  const handleRecenter = () => {
    setPanOffset({ x: 0, y: 0 });
    setUserZoom(1.0);
  };

  const isPannedOrZoomed =
    Math.abs(panOffset.x) > 25 || Math.abs(panOffset.y) > 25 || Math.abs(userZoom - 1.0) > 0.05;

  return (
    <div
      ref={containerRef}
      data-domino-board="true"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      className="relative w-full h-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing select-none"
    >
      {/* Dynamic Table Felt Texture */}
      <div
        className={`absolute inset-0 ${tableTheme.feltClass} ${
          isFramedSquare ? 'rounded-2xl' : ''
        } shadow-inner pointer-events-none opacity-95 transition-all duration-500`}
        style={{ background: tableTheme.feltGradient }}
      >
        {/* Rail border */}
        <div
          className={`absolute inset-0 ${
            isFramedSquare ? 'border-[6px] sm:border-[8px] rounded-2xl' : 'border-[10px]'
          } ${tableTheme.railBorderClass} shadow-[inset_0_0_40px_rgba(0,0,0,0.85)]`}
        />

        {/* Carpet Ornamental Weave Center Overlay */}
        {tableTheme.patternType === 'carpet' && (
          <div className="absolute inset-0 flex items-center justify-center opacity-15 pointer-events-none">
            <div className="w-[500px] h-[340px] border-4 border-dashed border-amber-300 rounded-3xl flex items-center justify-center">
              <span className="text-8xl select-none filter blur-[0.5px]">🪡</span>
            </div>
          </div>
        )}

        {/* Midnight Velvet Gold Corner Trims */}
        {tableTheme.patternType === 'velvet' && (
          <div className="absolute inset-6 border border-amber-500/20 rounded-2xl pointer-events-none" />
        )}

        {/* Wood Corner Accents */}
        {tableTheme.patternType === 'wood' && (
          <div className="absolute inset-4 border-2 border-[#1a0e05]/60 rounded-xl pointer-events-none shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]" />
        )}
      </div>

      {/* World Container with dynamic transformation */}
      <div
        className="relative transition-transform duration-300 ease-out pointer-events-auto"
        style={{
          transform: `translate(${(-centerX + panOffset.x / finalScale) * finalScale}px, ${
            (-centerY + panOffset.y / finalScale) * finalScale
          }px) scale(${finalScale})`,
          transformOrigin: 'center center'
        }}
      >
        {/* Placed Domino Tiles on the Table */}
        {visualBoard.tiles.map((placed, idx) => {
          const tileW = placed.isVertical ? TILE_SHORT : TILE_LONG;
          const tileH = placed.isVertical ? TILE_LONG : TILE_SHORT;
          const isLastPlaced = idx === visualBoard.tiles.length - 1 && visualBoard.tiles.length > 0;
          const isDouble = placed.tile.left === placed.tile.right;

          return (
            <div
              key={`${placed.tile.id}-${idx}`}
              className={`absolute transition-all duration-300 ${
                isLastPlaced && isDouble
                  ? 'ring-4 ring-amber-400/90 shadow-[0_0_30px_rgba(251,191,36,0.95)] rounded-[7px]'
                  : isLastPlaced
                  ? 'ring-2 ring-cyan-400/90 shadow-[0_0_20px_rgba(34,211,238,0.85)] rounded-[7px]'
                  : ''
              }`}
              style={{
                left: `${placed.x}px`,
                top: `${placed.y}px`,
                transform: 'translate(-50%, -50%)',
                zIndex: isLastPlaced ? 25 : placed.isSpinner ? 20 : 10
              }}
            >
              {/* Authentic Çayxana Qoşa Daş Shockwave Blast Rings */}
              {isLastPlaced && isDouble && (
                <div className="absolute inset-0 -m-3 sm:-m-4 pointer-events-none flex items-center justify-center">
                  <span className="absolute inset-0 rounded-2xl border-2 sm:border-3 border-amber-300 animate-ping opacity-85" />
                  <span className="absolute -inset-1.5 rounded-2xl border border-amber-400/60 animate-pulse opacity-75" />
                  <span className="absolute inset-0 rounded-xl bg-amber-400/20 blur-md" />
                </div>
              )}

              <DominoTile
                tile={placed.tile}
                skin={skin}
                isVertical={placed.isVertical}
                isSpinner={placed.isSpinner}
                customWidth={tileW}
                customHeight={tileH}
              />
            </div>
          );
        })}

        {/* Empty Board Starting Target if board has no tiles */}
        {visualBoard.tiles.length === 0 && selectedTile && (
          <div
            data-branch-id="main_left"
            onClick={(e) => {
              e.stopPropagation();
              onSelectBranch('main_left');
            }}
            className={`absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-pointer z-30 transition-transform ${
              hoveredBranch === 'main_left' ? 'scale-125' : ''
            }`}
          >
            <div
              data-branch-id="main_left"
              className={`w-32 h-20 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${
                hoveredBranch === 'main_left'
                  ? 'border-amber-300 bg-amber-500/40 shadow-[0_0_30px_rgba(251,191,36,0.9)] ring-4 ring-amber-400/50'
                  : 'border-emerald-400 bg-emerald-500/25 animate-pulse hover:bg-emerald-500/35 shadow-[0_0_15px_rgba(52,211,153,0.5)]'
              }`}
            >
              <span className="text-xs font-black text-white pointer-events-none">
                {hoveredBranch === 'main_left' ? 'BURA BURAX!' : 'Bura Qoy'}
              </span>
            </div>
          </div>
        )}

        {/* Highlighted Target Branches for Selected Tile */}
        {selectedTile &&
          playableBranches.map((bId) => {
            const branch = visualBoard.branches[bId];
            if (!branch.active) return null;
            const expectedScore = branchExpectedScores[bId] || 0;
            const isHovered = hoveredBranch === bId;

            return (
              <div
                key={`target-${bId}`}
                data-branch-id={bId}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectBranch(bId);
                }}
                className="absolute cursor-pointer z-30 group"
                style={{
                  left: `${branch.tipX}px`,
                  top: `${branch.tipY}px`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                {/* Generous magnetic hit area (w-24 h-24) */}
                <div
                  data-branch-id={bId}
                  className="w-24 h-24 -m-6 flex items-center justify-center relative pointer-events-auto"
                >
                  {/* Glowing Target Ring */}
                  <div
                    data-branch-id={bId}
                    className={`rounded-full border-2 flex items-center justify-center shadow-lg transition-all duration-200 pointer-events-none ${
                      isHovered
                        ? 'w-16 h-16 border-amber-300 bg-amber-400 text-slate-950 scale-125 ring-8 ring-amber-400/50 shadow-[0_0_35px_rgba(251,191,36,0.95)]'
                        : 'w-12 h-12 border-emerald-400 bg-emerald-500/40 shadow-[0_0_12px_rgba(52,211,153,0.8)] animate-pulse group-hover:scale-125'
                    }`}
                  >
                    <span
                      className={`font-black drop-shadow-sm ${
                        isHovered ? 'text-lg text-slate-950 font-black' : 'text-base text-white'
                      }`}
                    >
                      {branch.openValue}
                    </span>
                  </div>

                  {/* Drop hint when hovered */}
                  {isHovered && (
                    <div className="absolute -bottom-7 bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg border border-amber-200 whitespace-nowrap pointer-events-none animate-pulse">
                      Burax!
                    </div>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      {/* Recenter & Zoom Controls Floating Toolset (Bottom Right of Table) */}
      <div className={`absolute ${isFramedSquare ? 'bottom-2 right-2' : 'bottom-3 right-3'} z-30 flex items-center gap-1.5 pointer-events-auto bg-slate-900/85 backdrop-blur-md border border-white/10 rounded-xl p-1 shadow-lg`}>
        {isPannedOrZoomed && (
          <button
            onClick={handleRecenter}
            title="Masaya uyğunlaşdır (Mərkəz)"
            className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold transition flex items-center gap-1 border border-amber-500/30"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Mərkəz</span>
          </button>
        )}
        <button
          onClick={() => setUserZoom((prev) => Math.min(2.5, prev * 1.15))}
          title="Yaxınlaşdır"
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition active:scale-95"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setUserZoom((prev) => Math.max(0.45, prev * 0.85))}
          title="Uzaqlaşdır"
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition active:scale-95"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
});
