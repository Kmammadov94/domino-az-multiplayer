import React, { useRef } from 'react';
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

  // Ref to distinguish between a fast tap/click and an active drag gesture
  const pointerCandidateRef = useRef<{
    tile: TileData;
    startX: number;
    startY: number;
  } | null>(null);

  const handlePointerDown = (e: React.PointerEvent, tile: TileData) => {
    if (!isMyTurn || !playableTileIds.includes(tile.id)) return;
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

    // If moved more than 6px, start drag mode
    if (distance > 6) {
      onStartDrag(tile, { x: e.clientX, y: e.clientY });
      pointerCandidateRef.current = null;
    }
  };

  const handlePointerUp = (e: React.PointerEvent, tile: TileData) => {
    if (pointerCandidateRef.current && pointerCandidateRef.current.tile.id === tile.id) {
      pointerCandidateRef.current = null;
      // It was a tap/click!
      onSelectTile(tile);
    }
  };

  const handlePointerCancel = () => {
    pointerCandidateRef.current = null;
  };

  return (
    <div className="w-full flex flex-col items-center gap-2 select-none z-20 pb-2">
      {/* Available Double Combos Banner / Button */}
      {availableCombos.length > 0 && onExecuteCombo && (
        <div className="flex flex-wrap items-center justify-center gap-2 mb-0.5 animate-fade-in pointer-events-auto">
          {availableCombos.map((combo) => (
            <button
              key={combo.id}
              onClick={() => onExecuteCombo(combo)}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-[0_0_25px_rgba(251,191,36,0.85)] flex items-center gap-2 border-2 border-amber-200 animate-bounce active:scale-95 transition-transform cursor-pointer"
            >
              <Sparkles className="w-4 h-4 fill-slate-950 text-slate-950" />
              <span>
                ⚡ {t.doubleCombo}: {combo.moves.map((m) => `[${m.tile.left}:${m.tile.right}]`).join(' + ')}
              </span>
              <span className="bg-slate-950 text-amber-300 text-xs px-2.5 py-0.5 rounded-full font-black border border-amber-400/40">
                +{combo.expectedScore} Xal!
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Action Buttons Bar */}
      <div className="flex items-center gap-3">
        {/* Draw from Bazar (if bazar has tiles) */}
        {boneyardCount > 0 && (
          <button
            onClick={() => onDrawTile()}
            disabled={!isMyTurn || hasPlayableMove}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg ${
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
            className="px-5 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white shadow-lg flex items-center gap-2 animate-pulse"
          >
            <ArrowRightCircle className="w-4 h-4" />
            <span>{t.pass}</span>
          </button>
        )}
      </div>

      {/* Hand Domino Tiles Carousel */}
      <div className="max-w-full overflow-x-auto px-4 py-2 flex items-center justify-center gap-2 sm:gap-3 bg-slate-950/40 backdrop-blur-sm rounded-2xl border border-white/5 shadow-2xl">
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
              className={`touch-none transition-all duration-150 rounded-lg ${
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
                customWidth={54}
                customHeight={108}
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
