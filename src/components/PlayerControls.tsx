import React, { useRef, useState, useEffect } from 'react';
import { TileData, DominoSkin, Language } from '../types/domino';
import { DoubleComboMove } from '../utils/comboEngine';
import { translations } from '../i18n/translations';
import { DominoTile } from './DominoTile';
import { Layers, ArrowRightCircle, Sparkles } from 'lucide-react';

interface PlayerControlsProps {
  hand: TileData[];
  skin: DominoSkin;
  isMyTurn: boolean;
  selectedTile: TileData | null;
  draggedTile?: TileData | null;
  playableTileIds: string[];
  availableCombos?: DoubleComboMove[];
  onExecuteCombo?: (combo: DoubleComboMove) => void;
  boneyardCount: number;
  hasPlayableMove: boolean;
  onSelectTile: (tile: TileData) => void;
  onStartDrag: (tile: TileData, point: { x: number; y: number }) => void;
  onDrawTile: () => void;
  onPassTurn: () => void;
  lang: Language;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  hand,
  skin,
  isMyTurn,
  selectedTile,
  draggedTile = null,
  playableTileIds,
  availableCombos = [],
  onExecuteCombo,
  boneyardCount,
  hasPlayableMove,
  onSelectTile,
  onStartDrag,
  onDrawTile,
  onPassTurn,
  lang
}) => {
  const t = translations[lang];

  // Screen width observer for dynamic portrait mobile tile sizing
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 800
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Ref to distinguish between a fast tap/click and an active drag gesture
  const pointerCandidateRef = useRef<{
    tile: TileData;
    startX: number;
    startY: number;
  } | null>(null);

  const handlePointerDown = (e: React.PointerEvent, tile: TileData) => {
    if (!isMyTurn || !playableTileIds.includes(tile.id)) return;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    pointerCandidateRef.current = {
      tile,
      startX: e.clientX,
      startY: e.clientY
    };
  };

  const handlePointerMove = (e: React.PointerEvent, tile: TileData) => {
    if (!pointerCandidateRef.current || pointerCandidateRef.current.tile.id !== tile.id) return;
    const dx = e.clientX - pointerCandidateRef.current.startX;
    const dy = e.clientY - pointerCandidateRef.current.startY;
    const distance = Math.hypot(dx, dy);

    // If moved more than 8px, start drag mode
    if (distance > 8) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      onStartDrag(tile, { x: e.clientX, y: e.clientY });
      pointerCandidateRef.current = null;
    }
  };

  const handlePointerUp = (e: React.PointerEvent, tile: TileData) => {
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    if (pointerCandidateRef.current && pointerCandidateRef.current.tile.id === tile.id) {
      pointerCandidateRef.current = null;
      // It was a tap/click!
      onSelectTile(tile);
    }
  };

  const handlePointerCancel = (e: React.PointerEvent) => {
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    pointerCandidateRef.current = null;
  };

  // Explicit touch handlers for ultra-reliable mobile responsiveness
  const touchCandidateRef = useRef<{
    tile: TileData;
    startX: number;
    startY: number;
  } | null>(null);

  const handleTouchStart = (e: React.TouchEvent, tile: TileData) => {
    if (!isMyTurn || !playableTileIds.includes(tile.id)) return;
    if (e.touches.length > 0) {
      touchCandidateRef.current = {
        tile,
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent, tile: TileData) => {
    if (!touchCandidateRef.current || touchCandidateRef.current.tile.id !== tile.id) return;
    if (e.touches.length > 0) {
      const dx = e.touches[0].clientX - touchCandidateRef.current.startX;
      const dy = e.touches[0].clientY - touchCandidateRef.current.startY;
      if (Math.hypot(dx, dy) > 8) {
        onStartDrag(tile, { x: e.touches[0].clientX, y: e.touches[0].clientY });
        touchCandidateRef.current = null;
        pointerCandidateRef.current = null;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent, tile: TileData) => {
    if (touchCandidateRef.current && touchCandidateRef.current.tile.id === tile.id) {
      touchCandidateRef.current = null;
      onSelectTile(tile);
    }
  };

  // Dynamic tile dimension calculation:
  // Ensures ALL tiles in hand fit seamlessly on any phone in portrait mode!
  const count = hand.length;
  const isMobile = windowWidth < 640;

  // On very small mobile screens (< 480px), if hand has > 8 tiles, wrap into two rows
  const shouldWrapRows = isMobile && count > 8;
  const tilesPerRow = shouldWrapRows ? Math.ceil(count / 2) : Math.max(1, count);

  // Available width for tiles accounting for screen padding
  const availableWidth = Math.max(260, windowWidth - (isMobile ? 16 : 48));
  const gapPx = isMobile ? (tilesPerRow > 6 ? 3 : 5) : 8;
  const totalGaps = Math.max(0, tilesPerRow - 1) * gapPx;
  const containerPadding = isMobile ? 12 : 24;

  const rawTileWidth = Math.floor(
    (availableWidth - totalGaps - containerPadding) / Math.max(1, tilesPerRow)
  );

  // Clamped tile width (from 32px on small phones up to 54px on desktop)
  const dynamicTileWidth = isMobile
    ? Math.min(52, Math.max(32, rawTileWidth))
    : 54;
  const dynamicTileHeight = dynamicTileWidth * 2;

  return (
    <div className="w-full flex flex-col items-center gap-1.5 sm:gap-2 select-none z-20 pb-2 px-1">
      {/* Available Double Combos Banner / Button */}
      {availableCombos.length > 0 && onExecuteCombo && (
        <div className="flex flex-wrap items-center justify-center gap-2 mb-0.5 animate-fade-in pointer-events-auto">
          {availableCombos.map((combo) => (
            <button
              key={combo.id}
              onClick={() => onExecuteCombo(combo)}
              className="px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-[0_0_25px_rgba(251,191,36,0.85)] flex items-center gap-1.5 border-2 border-amber-200 animate-bounce active:scale-95 transition-transform cursor-pointer"
            >
              <Sparkles className="w-4 h-4 fill-slate-950 text-slate-950" />
              <span>
                ⚡ {t.doubleCombo}: {combo.moves.map((m) => `[${m.tile.left}:${m.tile.right}]`).join(' + ')}
              </span>
              <span className="bg-slate-950 text-amber-300 text-xs px-2 py-0.5 rounded-full font-black border border-amber-400/40">
                +{combo.expectedScore} Xal!
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Action Buttons Bar */}
      <div className="flex items-center gap-2.5">
        {/* Draw from Bazar (if bazar has tiles) */}
        {boneyardCount > 0 && (
          <button
            onClick={() => onDrawTile()}
            disabled={!isMyTurn || hasPlayableMove}
            className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg ${
              isMyTurn && !hasPlayableMove
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 animate-bounce'
                : 'bg-slate-800/80 text-slate-400 border border-slate-700 cursor-not-allowed'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>
              {t.drawTile} ({boneyardCount})
            </span>
          </button>
        )}

        {/* Pass Button (when no moves and bazar empty) */}
        {isMyTurn && !hasPlayableMove && boneyardCount === 0 && (
          <button
            onClick={onPassTurn}
            className="px-4 py-1.5 sm:px-5 sm:py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white shadow-lg flex items-center gap-2 animate-pulse"
          >
            <ArrowRightCircle className="w-4 h-4" />
            <span>{t.pass}</span>
          </button>
        )}
      </div>

      {/* Hand Domino Tiles Container:
          Dynamically sized so that EVERY domino tile is 100% visible on mobile portrait! */}
      <div
        className={`w-full max-w-full px-2 sm:px-4 py-1.5 sm:py-2 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm rounded-2xl border border-white/5 shadow-2xl ${
          shouldWrapRows ? 'flex-wrap gap-1 sm:gap-2' : 'overflow-x-auto overflow-y-hidden'
        }`}
        style={{
          gap: `${gapPx}px`
        }}
      >
        {hand.map((tile) => {
          const isPlayable = isMyTurn && playableTileIds.includes(tile.id);
          const isSelected = selectedTile?.id === tile.id;
          const isBeingDragged = draggedTile?.id === tile.id;
          const isPartOfCombo = availableCombos.some((c) =>
            c.moves.some((m) => m.tile.id === tile.id)
          );

          return (
            <div
              key={tile.id}
              onPointerDown={(e) => handlePointerDown(e, tile)}
              onPointerMove={(e) => handlePointerMove(e, tile)}
              onPointerUp={(e) => handlePointerUp(e, tile)}
              onPointerCancel={handlePointerCancel}
              onTouchStart={(e) => handleTouchStart(e, tile)}
              onTouchMove={(e) => handleTouchMove(e, tile)}
              onTouchEnd={(e) => handleTouchEnd(e, tile)}
              className={`touch-none transition-all duration-150 rounded-lg flex-shrink-0 ${
                isPlayable ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
              } ${isBeingDragged ? 'opacity-20 scale-95' : ''} ${
                isPartOfCombo
                  ? 'ring-2 ring-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.7)] animate-pulse'
                  : ''
              }`}
            >
              <DominoTile
                tile={tile}
                skin={skin}
                isVertical={true}
                customWidth={dynamicTileWidth}
                customHeight={dynamicTileHeight}
                isPlayable={isPlayable}
                isSelected={isSelected}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
