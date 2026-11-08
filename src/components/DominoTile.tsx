import React from 'react';
import { TileData, PipValue, DominoSkin } from '../types/domino';

interface DominoTileProps {
  tile: TileData;
  skin: DominoSkin;
  isVertical?: boolean;
  isFaceDown?: boolean;
  isPlayable?: boolean;
  isSelected?: boolean;
  isSpinner?: boolean;
  onClick?: () => void;
  scale?: number;
  className?: string;
  customWidth?: number;
  customHeight?: number;
}

// Coordinate positions for domino pips (standard 3x3 grid per half)
const PIP_POSITIONS: Record<PipValue, [number, number][]> = {
  0: [],
  1: [[50, 50]],
  2: [[26, 26], [74, 74]],
  3: [[26, 26], [50, 50], [74, 74]],
  4: [[26, 26], [74, 26], [26, 74], [74, 74]],
  5: [[26, 26], [74, 26], [50, 50], [26, 74], [74, 74]],
  6: [[26, 22], [74, 22], [26, 50], [74, 50], [26, 78], [74, 78]]
};

const DominoTileComponent: React.FC<DominoTileProps> = ({
  tile,
  skin,
  isVertical = true,
  isFaceDown = false,
  isPlayable = false,
  isSelected = false,
  isSpinner = false,
  onClick,
  scale = 1,
  className = '',
  customWidth,
  customHeight
}) => {
  // If tile data is missing and not facedown, safely return null
  if (!tile && !isFaceDown) {
    return null;
  }

  // Base dimensions (vertical: 56x112, horizontal: 112x56 or custom)
  const width = customWidth ?? ((isVertical ? 56 : 112) * scale);
  const height = customHeight ?? ((isVertical ? 112 : 56) * scale);

  if (isFaceDown) {
    return (
      <div
        onClick={onClick}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          backgroundColor: skin.tileFace,
          borderColor: skin.tileBorder,
          boxShadow: '0 4px 8px rgba(0,0,0,0.5), inset 0 1.5px 2px rgba(255,255,255,0.3), inset 0 -1.5px 2px rgba(0,0,0,0.3)'
        }}
        className={`relative rounded-lg border-2 cursor-pointer transition-transform duration-200 select-none overflow-hidden ${className}`}
      >
        {skin.isFlagSkin ? (
          <div className="absolute inset-0 flex flex-col pointer-events-none">
            {skin.flagType === 'ukraine' ? (
              <>
                <div className="h-1/2 w-full bg-[#0057b7]" />
                <div className="h-1/2 w-full bg-[#ffd700]" />
              </>
            ) : (
              <>
                <div className="h-1/3 w-full bg-[#0092bc]" />
                <div className="h-1/3 w-full bg-[#e4002b]" />
                <div className="h-1/3 w-full bg-[#009739]" />
              </>
            )}
          </div>
        ) : skin.stripes && skin.stripes.length > 0 ? (
          <div className="absolute inset-0 flex flex-row pointer-events-none rounded-md overflow-hidden z-0">
            {skin.stripes.map((color, idx) => (
              <div key={idx} className="flex-1 h-full" style={{ backgroundColor: color }} />
            ))}
          </div>
        ) : null}
        <div className="absolute inset-1.5 rounded border border-dashed border-white/25 flex items-center justify-center opacity-45 z-10">
          <div
            className="w-2.5 h-2.5 rounded-full shadow-inner"
            style={{ backgroundColor: skin.spinnerColor }}
          />
        </div>
      </div>
    );
  }

  const renderHalf = (value: PipValue, halfKey: string) => {
    const pips = PIP_POSITIONS[value] || [];
    const isSingleDot = value === 1;
    const dotRadius = isSingleDot ? 15 : 13.5;
    const accentColor = skin.accentPipColor || '#dc2626';

    return (
      <svg
        key={halfKey}
        viewBox="0 0 100 100"
        className="w-full h-full p-1"
        style={{ overflow: 'visible' }}
      >
        {pips.map(([cx, cy], i) => {
          // Center dot is at [50, 50] (exists on 1, 3, and 5; does NOT exist on 4, 2, 6)
          // Accenting the center dot provides immediate, high-contrast visual clarification between 4 and 5
          const isCenterDot = cx === 50 && cy === 50;
          const currentPipColor = isCenterDot ? accentColor : skin.pipColor;

          return (
            <g key={i}>
              {/* Pip drop shadow / carved socket effect */}
              <circle
                cx={cx}
                cy={cy + 1.8}
                r={dotRadius + 0.8}
                fill="rgba(0,0,0,0.35)"
              />
              {/* Pip outer socket frame / ring for crisp visibility & accessibility */}
              <circle
                cx={cx}
                cy={cy}
                r={dotRadius + 0.8}
                fill="none"
                stroke="rgba(0,0,0,0.4)"
                strokeWidth={isCenterDot ? 1.2 : 0.8}
                opacity={isCenterDot ? 0.8 : 0.5}
              />
              {/* Pip main bold dot */}
              <circle
                cx={cx}
                cy={cy}
                r={dotRadius}
                fill={currentPipColor}
                stroke={skin.isFlagSkin || skin.stripes ? 'rgba(0,0,0,0.55)' : isCenterDot ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.2)'}
                strokeWidth={skin.isFlagSkin || skin.stripes ? 1.2 : 0.8}
              />
              {/* Pip glossy gleam */}
              <circle
                cx={cx - (dotRadius * 0.3)}
                cy={cy - (dotRadius * 0.3)}
                r={dotRadius * 0.32}
                fill="rgba(255,255,255,0.45)"
              />
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div
      onClick={onClick}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: skin.tileFace,
        borderColor: isSelected ? '#38bdf8' : skin.tileBorder,
        boxShadow: isSelected
          ? '0 0 0 3px #38bdf8, 0 10px 20px rgba(0,0,0,0.6)'
          : isPlayable
          ? '0 0 0 2.5px #4ade80, 0 6px 14px rgba(0,0,0,0.45)'
          : skin.glowEffect || '0 4px 10px rgba(0,0,0,0.45), inset 0 1.5px 2px rgba(255,255,255,0.4), inset 0 -1.5px 2px rgba(0,0,0,0.3)',
      }}
      className={`relative rounded-lg border-2 transition-all duration-150 select-none cursor-pointer flex ${
        isVertical ? 'flex-col' : 'flex-row'
      } ${
        isPlayable ? 'hover:-translate-y-1.5 hover:brightness-105' : ''
      } ${isSelected ? '-translate-y-3' : ''} ${className}`}
    >
      {/* Background layer for Flag skin or Striped skin */}
      {skin.isFlagSkin ? (
        skin.flagType === 'ukraine' ? (
          <div className="absolute inset-0 flex flex-col pointer-events-none rounded-md overflow-hidden z-0">
            <div className="h-1/2 w-full bg-[#0057b7]" />
            <div className="h-1/2 w-full bg-[#ffd700]" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <svg viewBox="0 0 24 24" className="w-5 h-5 opacity-40">
                <path
                  d="M12 3v13 M8 6v6c0 2 4 3 4 3s4-1 4-3V6 M6 9c0 3 3 5 6 5s6-2 6-5 M12 16v4"
                  stroke="#ffffff"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </div>
          </div>
        ) : (
          <div className={`absolute inset-0 flex pointer-events-none rounded-md overflow-hidden z-0 ${
            isVertical ? 'flex-col' : 'flex-row'
          }`}>
            <div className={isVertical ? "h-1/3 w-full bg-[#0092bc]" : "w-1/3 h-full bg-[#0092bc]"} />
            <div className={isVertical ? "h-1/3 w-full bg-[#e4002b] relative flex items-center justify-center" : "w-1/3 h-full bg-[#e4002b] relative flex items-center justify-center"}>
              <svg viewBox="0 0 40 20" className="w-5 h-2.5 opacity-50">
                <path
                  d="M 16 3 A 7 7 0 1 0 24 17 A 8.5 8.5 0 1 1 16 3 Z"
                  fill="#ffffff"
                />
                <polygon
                  points="23,7 24,9 26,9 24.5,10.2 25,12 23.5,10.8 22,12 22.5,10.2 21,9 23,9"
                  fill="#ffffff"
                />
              </svg>
            </div>
            <div className={isVertical ? "h-1/3 w-full bg-[#009739]" : "w-1/3 h-full bg-[#009739]"} />
          </div>
        )
      ) : skin.stripes && skin.stripes.length > 0 ? (
        <div className={`absolute inset-0 flex pointer-events-none rounded-md overflow-hidden z-0 ${
          isVertical ? 'flex-row' : 'flex-col'
        }`}>
          {skin.stripes.map((color, idx) => (
            <div key={idx} className="flex-1 h-full w-full" style={{ backgroundColor: color }} />
          ))}
        </div>
      ) : null}

      {/* Half 1 */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden z-10">
        {renderHalf(tile.left, 'left')}
      </div>

      {/* Center divider groove with brass spinner pin */}
      <div
        className={`relative flex items-center justify-center z-10 ${
          isVertical ? 'h-[2.5px] w-full my-0' : 'w-[2.5px] h-full mx-0'
        }`}
        style={{
          backgroundColor: skin.tileBorder,
          boxShadow: '0 0.5px 1px rgba(255,255,255,0.2)'
        }}
      >
        {/* Brass center pin rivet */}
        <div
          className="absolute rounded-full shadow-md"
          style={{
            width: `${Math.max(7, Math.min(10, width * 0.18))}px`,
            height: `${Math.max(7, Math.min(10, width * 0.18))}px`,
            backgroundColor: skin.spinnerColor,
            border: `1px solid ${skin.tileBorder}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.5)'
          }}
        />
      </div>

      {/* Half 2 */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden z-10">
        {renderHalf(tile.right, 'right')}
      </div>

      {/* Spinner Crown Badge if this double is the declared Spinner ("Telefon") */}
      {isSpinner && (
        <div
          title="Telefon (Spinner)"
          className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-amber-950 text-[11px] font-black flex items-center justify-center shadow-lg border border-amber-100 z-10 animate-pulse"
        >
          ★
        </div>
      )}
    </div>
  );
};

export const DominoTile = React.memo(
  DominoTileComponent,
  (prev, next) =>
    prev.tile?.id === next.tile?.id &&
    prev.tile?.left === next.tile?.left &&
    prev.tile?.right === next.tile?.right &&
    prev.skin.id === next.skin.id &&
    prev.isVertical === next.isVertical &&
    prev.isFaceDown === next.isFaceDown &&
    prev.isPlayable === next.isPlayable &&
    prev.isSelected === next.isSelected &&
    prev.isSpinner === next.isSpinner &&
    prev.scale === next.scale &&
    prev.customWidth === next.customWidth &&
    prev.customHeight === next.customHeight &&
    prev.className === next.className &&
    prev.onClick === next.onClick
);
