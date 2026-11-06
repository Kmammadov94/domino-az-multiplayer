import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GameBoard, BranchId, TILE_SHORT, TILE_LONG } from '../utils/boardEngine';
import { DominoSkin, TileData } from '../types/domino';
import { DominoTile } from './DominoTile';
import { RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

interface BoardViewProps {
  board: GameBoard;
  skin: DominoSkin;
  selectedTile: TileData | null;
  playableBranches: BranchId[];
  onSelectBranch: (branchId: BranchId) => void;
  branchExpectedScores?: Record<BranchId, number>;
  hoveredBranch?: BranchId | null;
  boneyardCount?: number;
  onDrawBazaar?: () => void;
  canDrawFromBazaar?: boolean;
}

export const BoardView: React.FC<BoardViewProps> = ({
  board,
  skin,
  selectedTile,
  playableBranches,
  onSelectBranch,
  branchExpectedScores = {} as Record<BranchId, number>,
  hoveredBranch = null
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ w: 900, h: 500 });

  // Pan and User Zoom state for free exploration
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [userZoom, setUserZoom] = useState(1.0);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

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

  // Calculate bounding box of all placed tiles
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

  // Include target tips for playable branches in the bounding box
  const branchKeys: BranchId[] = ['main_left', 'main_right', 'spinner_top', 'spinner_bottom'];
  branchKeys.forEach((bId) => {
    const branch = board.branches[bId];
    if (branch.active) {
      minX = Math.min(minX, branch.tipX - 45);
      maxX = Math.max(maxX, branch.tipX + 45);
      minY = Math.min(minY, branch.tipY - 45);
      maxY = Math.max(maxY, branch.tipY + 45);
    }
  });

  const spanX = Math.max(280, maxX - minX);
  const spanY = Math.max(180, maxY - minY);

  // Safe padding so tiles never touch HUD margins or screen boundaries
  const paddingX = Math.min(140, viewport.w * 0.15);
  const paddingY = Math.min(110, viewport.h * 0.18);
  const usableW = Math.max(260, viewport.w - paddingX * 2);
  const usableH = Math.max(180, viewport.h - paddingY * 2);

  // Dynamic auto-scale factor ensuring all tiles fit inside visible bounds
  const rawAutoScale = Math.min(usableW / spanX, usableH / spanY);
  const autoScale = Math.min(1.05, Math.max(0.38, rawAutoScale));

  const finalScale = autoScale * userZoom;
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag with left click on background
    if (e.button !== 0) return;
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    setPanOffset({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  }, []);

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setUserZoom((prev) => Math.min(1.8, Math.max(0.55, prev * zoomFactor)));
  };

  // Touch pan handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      dragStartRef.current = {
        x: e.touches[0].clientX - panOffset.x,
        y: e.touches[0].clientY - panOffset.y
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || e.touches.length !== 1) return;
    setPanOffset({
      x: e.touches[0].clientX - dragStartRef.current.x,
      y: e.touches[0].clientY - dragStartRef.current.y
    });
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
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
      {/* Felt Table Background Texture */}
      <div className="absolute inset-0 bg-radial from-[#1e5832] via-[#154726] to-[#0a2313] shadow-inner pointer-events-none opacity-95">
        {/* Subtle wood rail border shadow */}
        <div className="absolute inset-0 border-[10px] border-[#29170a] shadow-[inset_0_0_40px_rgba(0,0,0,0.8)]" />
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
        {board.tiles.map((placed, idx) => {
          const tileW = placed.isVertical ? TILE_SHORT : TILE_LONG;
          const tileH = placed.isVertical ? TILE_LONG : TILE_SHORT;

          return (
            <div
              key={`${placed.tile.id}-${idx}`}
              className="absolute transition-all duration-300"
              style={{
                left: `${placed.x}px`,
                top: `${placed.y}px`,
                transform: 'translate(-50%, -50%)',
                zIndex: placed.isSpinner ? 20 : 10
              }}
            >
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
        {board.tiles.length === 0 && selectedTile && (
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
            const branch = board.branches[bId];
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
                        : expectedScore > 0
                        ? 'w-12 h-12 border-amber-300 bg-amber-500/80 ring-4 ring-amber-400/50 shadow-[0_0_20px_rgba(251,191,36,0.8)] animate-bounce group-hover:scale-125'
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

                  {/* Expected Points Badge (+5, +10, etc.) */}
                  {expectedScore > 0 && (
                    <div
                      className={`absolute bg-amber-400 text-slate-950 text-xs font-black px-2 py-0.5 rounded-full shadow-xl border border-amber-200 pointer-events-none ${
                        isHovered ? '-top-8 scale-110' : '-top-6 animate-bounce'
                      }`}
                    >
                      +{expectedScore}
                    </div>
                  )}

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
      <div className="absolute bottom-3 right-3 z-30 flex items-center gap-1.5 pointer-events-auto bg-slate-900/85 backdrop-blur-md border border-white/10 rounded-xl p-1 shadow-lg">
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
          onClick={() => setUserZoom((prev) => Math.min(1.8, prev * 1.15))}
          title="Yaxınlaşdır"
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setUserZoom((prev) => Math.max(0.55, prev * 0.85))}
          title="Uzaqlaşdır"
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
