import React, { useEffect, useState } from 'react';
import { TableGiftDef } from '../data/tableGifts';
import { triggerHaptic } from '../utils/haptics';

export interface ActiveGiftAnimation {
  id: string;
  gift: TableGiftDef;
  senderName: string;
  senderIndex: number;
  targetIndex: number; // 0: User (bottom), 1: Left/Top, 2: Partner (Top), 3: Right
}

interface TableGiftAnimationOverlayProps {
  activeAnimation: ActiveGiftAnimation | null;
  onFinished: () => void;
  playerCount: number;
}

// Seat approximate screen coordinate anchors (%)
const SEAT_COORDINATES: Record<number, { x: number; y: number }> = {
  0: { x: 50, y: 88 }, // Bottom (Local Player)
  1: { x: 12, y: 48 }, // Left Opponent
  2: { x: 50, y: 8 },  // Top Partner / Opponent
  3: { x: 88, y: 48 }  // Right Opponent
};

export const TableGiftAnimationOverlay: React.FC<TableGiftAnimationOverlayProps> = ({
  activeAnimation,
  onFinished,
  playerCount
}) => {
  const [phase, setPhase] = useState<'flying' | 'impact' | 'done'>('flying');

  useEffect(() => {
    if (!activeAnimation) {
      setPhase('done');
      return;
    }

    setPhase('flying');

    // Flying takes 600ms
    const flyTimer = setTimeout(() => {
      setPhase('impact');
      triggerHaptic(activeAnimation.gift.impactType.startsWith('splash') ? 'medium' : 'light');

      // Impact display lasts 1800ms
      const impactTimer = setTimeout(() => {
        setPhase('done');
        onFinished();
      }, 1800);

      return () => clearTimeout(impactTimer);
    }, 650);

    return () => clearTimeout(flyTimer);
  }, [activeAnimation]);

  if (!activeAnimation || phase === 'done') return null;

  const senderCoord = SEAT_COORDINATES[activeAnimation.senderIndex % 4] || SEAT_COORDINATES[0];
  const targetCoord = SEAT_COORDINATES[activeAnimation.targetIndex % 4] || SEAT_COORDINATES[2];

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden select-none">
      {/* 1. Flying Projectile Phase */}
      {phase === 'flying' && (
        <div
          className="absolute text-4xl sm:text-5xl transition-all duration-600 ease-out transform -translate-x-1/2 -translate-y-1/2 filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
          style={{
            left: `${targetCoord.x}%`,
            top: `${targetCoord.y}%`,
            animation: 'giftFly 0.65s cubic-bezier(0.2, 0.8, 0.2, 1) forwards'
          }}
        >
          <style>{`
            @keyframes giftFly {
              0% {
                left: ${senderCoord.x}%;
                top: ${senderCoord.y}%;
                transform: translate(-50%, -50%) scale(0.6) rotate(0deg);
                opacity: 0.8;
              }
              50% {
                transform: translate(-50%, -50%) scale(1.4) rotate(180deg);
                opacity: 1;
              }
              100% {
                left: ${targetCoord.x}%;
                top: ${targetCoord.y}%;
                transform: translate(-50%, -50%) scale(1.1) rotate(360deg);
                opacity: 1;
              }
            }
          `}</style>
          {activeAnimation.gift.icon}
        </div>
      )}

      {/* 2. Impact Splatter / Steam Phase */}
      {phase === 'impact' && (
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center animate-fade-in"
          style={{
            left: `${targetCoord.x}%`,
            top: `${targetCoord.y}%`
          }}
        >
          {/* Specific animation per gift impact type */}
          {activeAnimation.gift.impactType === 'splash_red' && (
            <div className="relative flex items-center justify-center">
              {/* Splattered Tomato Graphic */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-rose-600/85 filter blur-[0.5px] shadow-[0_0_25px_rgba(225,29,72,0.9)] animate-ping" />
              <div className="absolute text-5xl sm:text-6xl animate-bounce">
                🍅💥
              </div>
            </div>
          )}

          {activeAnimation.gift.impactType === 'splash_egg' && (
            <div className="relative flex items-center justify-center">
              {/* Splattered Egg graphic */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-amber-300/80 filter blur-[1px] shadow-[0_0_25px_rgba(252,211,77,0.9)] animate-pulse" />
              <div className="absolute text-5xl sm:text-6xl animate-bounce">
                🍳✨
              </div>
            </div>
          )}

          {activeAnimation.gift.impactType === 'steam' && (
            <div className="relative flex flex-col items-center justify-center">
              {/* Steaming Tea with rising steam glow */}
              <div className="text-5xl sm:text-6xl animate-bounce">
                ☕
              </div>
              <div className="text-xs font-black text-amber-300 bg-black/70 px-2 py-0.5 rounded-full border border-amber-500/50 mt-1 shadow">
                +1 Pürrəngi Çay! 🫖
              </div>
            </div>
          )}

          {activeAnimation.gift.impactType === 'sweet' && (
            <div className="relative flex flex-col items-center justify-center">
              <div className="text-5xl sm:text-6xl animate-pulse">
                {activeAnimation.gift.icon}
              </div>
              <div className="text-xs font-black text-amber-200 bg-black/70 px-2.5 py-0.5 rounded-full border border-amber-400/50 mt-1 shadow">
                Nuş olsun! 😋
              </div>
            </div>
          )}

          {activeAnimation.gift.impactType === 'applause' && (
            <div className="relative flex flex-col items-center justify-center">
              <div className="text-5xl sm:text-6xl animate-bounce">
                👏✨
              </div>
              <div className="text-xs font-black text-amber-300 bg-black/70 px-2.5 py-0.5 rounded-full border border-amber-400/50 mt-1 shadow">
                Bəh-bəh! 🔥
              </div>
            </div>
          )}

          {/* Banner message */}
          <div className="mt-1 px-2.5 py-0.5 rounded-full bg-slate-900/90 border border-white/20 text-[11px] font-bold text-white shadow-lg text-center whitespace-nowrap">
            {activeAnimation.senderName} {activeAnimation.gift.message.az}
          </div>
        </div>
      )}
    </div>
  );
};
