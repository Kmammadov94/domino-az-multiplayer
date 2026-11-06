import React, { useState, useEffect } from 'react';
import { TileData, DominoSkin, Language } from '../types/domino';
import { translations } from '../i18n/translations';
import { DominoTile } from './DominoTile';
import { Layers, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

interface BazaarTrayProps {
  boneyard?: TileData[];
  count?: number;
  skin: DominoSkin;
  isMyTurn: boolean;
  canDraw: boolean;
  onDrawTile: (index?: number) => void;
  lang: Language;
}

export const BazaarTray: React.FC<BazaarTrayProps> = ({
  boneyard,
  count,
  skin,
  isMyTurn,
  canDraw,
  onDrawTile,
  lang
}) => {
  // All Hooks must be called unconditionally at the top level
  const [isExpanded, setIsExpanded] = useState(canDraw);

  useEffect(() => {
    if (canDraw) {
      setIsExpanded(true);
    }
  }, [canDraw]);

  const totalCount = typeof count === 'number' ? count : (boneyard?.length ?? 0);
  if (totalCount === 0) return null;

  const t = translations[lang];

  // Visual tiles array (uses real boneyard in singleplayer, or generated facedown tiles in multiplayer)
  const displayTiles: TileData[] =
    boneyard && boneyard.length > 0
      ? boneyard
      : Array.from({ length: totalCount }, (_, i) => ({
          id: `mp-bz-${i}`,
          left: 0,
          right: 0
        }));

  return (
    <div
      className={`relative bg-slate-900/95 backdrop-blur-md rounded-2xl border transition-all duration-300 shadow-2xl flex flex-col items-center select-none ${
        canDraw
          ? 'border-emerald-400 ring-2 ring-emerald-400/50 shadow-[0_0_25px_rgba(52,211,153,0.35)]'
          : 'border-white/10'
      } ${isExpanded ? 'p-2.5 sm:p-3 max-w-[200px] sm:max-w-[240px]' : 'p-2 max-w-[150px]'}`}
    >
      {/* Tray Header / Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between gap-1.5 focus:outline-none"
      >
        <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
          <Layers className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>{t.boneyard}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[11px] font-black bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
            {totalCount}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          )}
        </div>
      </button>

      {/* Expanded Domino Spread Content */}
      {isExpanded && (
        <div className="w-full mt-2 pt-2 border-t border-white/10 animate-fade-in flex flex-col items-center">
          {/* Interactive prompt if player needs to draw */}
          {canDraw && (
            <div className="w-full bg-emerald-500/20 border border-emerald-400/60 rounded-lg py-1 px-1.5 text-center text-[10px] font-black text-emerald-300 mb-2 flex items-center justify-center gap-1 animate-pulse">
              <Sparkles className="w-3 h-3 text-emerald-400 flex-shrink-0" />
              <span>Daş götürün!</span>
            </div>
          )}

          {/* Visual Spread of Facedown Domino Tiles in Bazaar */}
          <div className="grid grid-cols-2 gap-1.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
            {displayTiles.map((tile, idx) => (
              <div
                key={tile.id || idx}
                onClick={() => {
                  if (canDraw) {
                    onDrawTile(idx);
                  }
                }}
                title={canDraw ? 'Daş götürmək üçün toxunun' : t.boneyard}
                className={`transition-all duration-200 transform ${
                  canDraw
                    ? 'cursor-pointer hover:scale-105 hover:-translate-y-1 active:scale-95'
                    : 'cursor-default opacity-85'
                }`}
              >
                <DominoTile
                  tile={tile}
                  skin={skin}
                  isFaceDown={true}
                  isVertical={false}
                  customWidth={50}
                  customHeight={26}
                  className={
                    canDraw
                      ? 'hover:border-emerald-400 hover:shadow-[0_0_10px_rgba(52,211,153,0.6)]'
                      : ''
                  }
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
