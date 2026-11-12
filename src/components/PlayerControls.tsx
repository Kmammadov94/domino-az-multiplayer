import React, { useRef, useState, useEffect, useMemo } from 'react';
import { TileData, DominoSkin, Language, GameVariant } from '../types/domino';
import { DoubleComboMove } from '../utils/comboEngine';
import { translations } from '../i18n/translations';
import { DominoTile } from './DominoTile';
import { Layers, ArrowRightCircle, Sparkles, ArrowUpDown } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

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
  isBoardBlocked?: boolean;
  variant?: GameVariant;
  minBoneyardReserve?: number;
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
  lang,
  isBoardBlocked = false,
  variant = '365',
  minBoneyardReserve = 1
}) => {
  const t = translations[lang];
  const canDrawFromReserve = boneyardCount > minBoneyardReserve && !isBoardBlocked;
  const availableToDraw = Math.max(0, boneyardCount - minBoneyardReserve);

  // Tile sorting mode: 'default' | 'doubles_first' | 'sum_desc'
  const [sortMode, setSortMode] = useState<'default' | 'doubles_first' | 'sum_desc'>('default');

  const cycleSortMode = () => {
    triggerHaptic('light');
    setSortMode((prev) => {
      if (prev === 'default') return 'doubles_first';
      if (prev === 'doubles_first') return 'sum_desc';
      return 'default';
    });
  };

  const sortedHand = useMemo(() => {
    if (sortMode === 'doubles_first') {
      return [...hand].sort((a, b) => {
        const aDouble = a.left === a.right ? 1 : 0;
        const bDouble = b.left === b.right ? 1 : 0;
        if (aDouble !== bDouble) return bDouble - aDouble;
        return (b.left + b.right) - (a.left + a.right);
      });
    }
    if (sortMode === 'sum_desc') {
      return [...hand].sort((a, b) => (b.left + b.right) - (a.left + a.right));
    }
    return hand;
  }, [hand, sortMode]);

  // Screen dimensions observer for dynamic portrait, landscape, and tablet sizing
  const [dimensions, setDimensions] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 800,
    height: typeof window !== 'undefined' ? window.innerHeight : 600
  }));

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
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
  // Dynamically responsive across Mobile Portrait, Landscape Mode (90° phone rotation), and Tablets!
  const { width: windowWidth, height: windowHeight } = dimensions;
  const count = hand.length;

  // Responsive device/orientation modes
  const isLandscapePhone = windowHeight <= 520 && windowWidth > windowHeight;
  const isTablet = (windowWidth >= 768 && windowHeight >= 600) || (windowHeight >= 768 && windowWidth >= 600);
  const isMobilePortrait = windowWidth < 640 && !isLandscapePhone;

  // In portrait on very small screens, wrap into two rows if count > 8
  const shouldWrapRows = isMobilePortrait && count > 8;
  const tilesPerRow = shouldWrapRows ? Math.ceil(count / 2) : Math.max(1, count);

  // Available width for tiles accounting for screen padding
  const availableWidth = Math.max(260, windowWidth - (isMobilePortrait ? 16 : isLandscapePhone ? 80 : 48));
  const gapPx = isLandscapePhone ? 4 : isMobilePortrait ? (tilesPerRow > 6 ? 3 : 5) : 8;
  const totalGaps = Math.max(0, tilesPerRow - 1) * gapPx;
  const containerPadding = isLandscapePhone ? 8 : isMobilePortrait ? 12 : 24;

  const rawTileWidth = Math.floor(
    (availableWidth - totalGaps - containerPadding) / Math.max(1, tilesPerRow)
  );

  // Dynamic Tile Dimensions:
  // - Landscape phone: compact vertical footprint (height: 68-76px) so domino board gets maximum room!
  // - Tablet: large, crisp 56px x 112px domino tiles
  // - Mobile portrait: adaptive 32-52px clamped width
  let dynamicTileWidth = 54;
  let dynamicTileHeight = 108;

  if (isLandscapePhone) {
    dynamicTileWidth = Math.min(38, Math.max(28, rawTileWidth));
    dynamicTileHeight = Math.min(76, dynamicTileWidth * 2);
  } else if (isTablet) {
    dynamicTileWidth = 56;
    dynamicTileHeight = 112;
  } else if (isMobilePortrait) {
    dynamicTileWidth = Math.min(52, Math.max(32, rawTileWidth));
    dynamicTileHeight = dynamicTileWidth * 2;
  }

  return (
    <div className={`w-full flex flex-col items-center select-none z-20 px-1 ${
      isLandscapePhone ? 'gap-1 pb-1' : 'gap-1.5 sm:gap-2 pb-2'
    }`}>
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

      {/* Control Bar: In Landscape Phone mode, combine Turn Indicator and Actions into 1 Single Compact Row to save screen height! */}
      {isLandscapePhone ? (
        <div className="w-full max-w-4xl px-2 flex items-center justify-between gap-2 text-xs flex-shrink-0">
          {/* Left: Turn prompt / Hint banner */}
          <div className="flex items-center gap-1.5 min-w-0">
            {isMyTurn && hasPlayableMove ? (
              <div className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 border border-amber-400 text-amber-300 text-[10px] font-black shadow flex items-center gap-1.5 animate-pulse truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                <span>🎯 Sizin Növbənizdir</span>
              </div>
            ) : isMyTurn && !hasPlayableMove ? (
              <div className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-[10px] font-bold truncate">
                {isBoardBlocked
                  ? '🔒 Oyun Bağlandı'
                  : canDrawFromReserve
                  ? '💡 Bazardan çəkin'
                  : '💡 Pas keçin'}
              </div>
            ) : null}
          </div>

          {/* Right: Actions (Sort, Bazar, Pass) */}
          <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto">
            {hand.length > 1 && (
              <button
                onClick={cycleSortMode}
                title="Əldəki daşları çeşidlə"
                className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700/80 shadow flex items-center gap-1 active:scale-95 transition"
              >
                <ArrowUpDown className="w-3 h-3 text-amber-400" />
                <span>
                  {sortMode === 'doubles_first'
                    ? 'Qoşa'
                    : sortMode === 'sum_desc'
                    ? 'Xal'
                    : 'Çeşid'}
                </span>
              </button>
            )}

            {canDrawFromReserve && (
              <button
                onClick={() => onDrawTile()}
                disabled={!isMyTurn || hasPlayableMove}
                className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 shadow ${
                  isMyTurn && !hasPlayableMove
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 animate-bounce'
                    : 'bg-slate-800/80 text-slate-400 border border-slate-700 cursor-not-allowed'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>Bazar ({boneyardCount})</span>
              </button>
            )}

            {isMyTurn && !hasPlayableMove && (!canDrawFromReserve || isBoardBlocked) && (
              <button
                onClick={onPassTurn}
                className="px-3 py-0.5 rounded-lg text-[10px] font-black bg-rose-600 hover:bg-rose-500 text-white shadow flex items-center gap-1 animate-pulse"
              >
                <ArrowRightCircle className="w-3 h-3" />
                <span>{t.pass}</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Portrait and Tablet layout: standard centered rows */
        <>
          {/* Action Buttons Bar & Tile Sorter */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center">
            {/* Tile Sorting Toggle Pill */}
            {hand.length > 1 && (
              <button
                onClick={cycleSortMode}
                title="Əldəki daşları çeşidlə"
                className="px-2.5 py-1 rounded-xl text-[10px] sm:text-xs font-bold bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700/80 shadow flex items-center gap-1.5 active:scale-95 transition"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {sortMode === 'doubles_first'
                    ? 'Qoşalar öndə'
                    : sortMode === 'sum_desc'
                    ? 'Böyükdən kiçiyə'
                    : 'Çeşidləmə'}
                </span>
              </button>
            )}

            {/* Draw from Bazar (if bazar has tiles exceeding minimum reserve and game is not blocked) */}
            {canDrawFromReserve && (
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
                  {variant === '101'
                    ? availableToDraw >= 2
                    ? `${t.drawTile} (+2 daş • cəmi ${boneyardCount})`
                    : `${t.drawTile} (+1 daş • cəmi ${boneyardCount})`
                    : `${t.drawTile} (${boneyardCount})`}
                </span>
              </button>
            )}

            {/* Pass Button (when no moves and (bazar reached reserve OR board is blocked)) */}
            {isMyTurn && !hasPlayableMove && (!canDrawFromReserve || isBoardBlocked) && (
              <button
                onClick={onPassTurn}
                className="px-4 py-1.5 sm:px-5 sm:py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white shadow-lg flex items-center gap-2 animate-pulse"
              >
                <ArrowRightCircle className="w-4 h-4" />
                <span>{t.pass}</span>
              </button>
            )}
          </div>

          {/* Helpful Hint Banner when player has no valid move */}
          {isMyTurn && !hasPlayableMove && (
            <div className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-[10px] sm:text-xs font-bold animate-fade-in shadow">
              {isBoardBlocked
                ? '🔒 Oyun Bağlandı — Bütün açıq ucların daşları masadadır! Pas keçin.'
                : canDrawFromReserve
                ? '💡 Gedişiniz yoxdur — Bazardan daş çəkin'
                : '💡 Gedişiniz yoxdur və bazarda rezerv qalıb — Pas keçin'}
            </div>
          )}

          {/* Visual Turn Indicator for Human Player */}
          {isMyTurn && hasPlayableMove && (
            <div className="px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 border border-amber-400 text-amber-300 text-[10px] sm:text-xs font-black shadow-[0_0_15px_rgba(251,191,36,0.45)] animate-pulse flex items-center gap-1.5">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span>🎯 Sizin Növbənizdir — Daşı masaya çəkin</span>
            </div>
          )}
        </>
      )}

      {/* Hand Domino Tiles Container:
          Dynamically sized so that EVERY domino tile is 100% visible on mobile portrait, landscape, and tablets! */}
      <div
        className={`w-full max-w-full px-2 sm:px-4 flex items-center justify-center backdrop-blur-sm border transition-all duration-300 shadow-2xl ${
          isLandscapePhone ? 'py-1 rounded-xl' : 'py-1.5 sm:py-2 rounded-2xl'
        } ${
          isMyTurn
            ? 'bg-slate-950/60 border-amber-400/80 ring-2 ring-amber-400/30 shadow-[0_0_25px_rgba(251,191,36,0.25)]'
            : 'bg-slate-950/85 border-slate-800/80 opacity-60 saturate-50'
        } ${
          shouldWrapRows ? 'flex-wrap gap-1 sm:gap-2' : 'overflow-x-auto overflow-y-hidden'
        }`}
        style={{
          gap: `${gapPx}px`
        }}
      >
        {sortedHand.map((tile) => {
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
                isPlayable
                  ? 'cursor-grab active:cursor-grabbing hover:scale-105'
                  : isMyTurn
                  ? 'opacity-65 scale-95 cursor-not-allowed'
                  : 'grayscale-[45%] brightness-75 cursor-not-allowed'
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
