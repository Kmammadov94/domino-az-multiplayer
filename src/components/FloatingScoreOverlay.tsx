import React, { useEffect, useState } from 'react';
import { Sparkles, Zap } from 'lucide-react';

export interface FloatingScoreItem {
  id: string;
  points: number;
  playerName: string;
  isInstant35?: boolean;
}

interface FloatingScoreOverlayProps {
  scoreItem: FloatingScoreItem | null;
}

export const FloatingScoreOverlay: React.FC<FloatingScoreOverlayProps> = ({ scoreItem }) => {
  const [visibleItem, setVisibleItem] = useState<FloatingScoreItem | null>(null);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (scoreItem) {
      setVisibleItem(scoreItem);
      setAnimating(true);
      const timer = setTimeout(() => {
        setAnimating(false);
        setVisibleItem(null);
      }, 2200);
      return () => clearTimeout(timer);
    }
  }, [scoreItem]);

  if (!visibleItem) return null;

  const isBigScore = visibleItem.points >= 20 || visibleItem.isInstant35;

  return (
    <div className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center overflow-hidden">
      <div
        className={`flex flex-col items-center justify-center transition-all duration-700 transform ${
          animating
            ? 'opacity-100 scale-100 -translate-y-8 sm:-translate-y-16'
            : 'opacity-0 scale-75 -translate-y-24'
        }`}
      >
        {visibleItem.isInstant35 ? (
          <div className="flex flex-col items-center p-4 rounded-3xl bg-gradient-to-r from-amber-500 via-rose-600 to-amber-500 border-4 border-yellow-200 shadow-[0_0_50px_rgba(245,158,11,0.9)] animate-pulse">
            <div className="flex items-center gap-2 text-white font-black text-xl sm:text-2xl">
              <Zap className="w-6 h-6 fill-yellow-200 text-yellow-200" />
              <span>35 VURDU!</span>
              <Zap className="w-6 h-6 fill-yellow-200 text-yellow-200" />
            </div>
            <span className="text-white text-xs sm:text-sm font-extrabold uppercase tracking-widest mt-1">
              BİRBAŞA MATÇ QƏLƏBƏSİ! 🏆
            </span>
            <span className="text-amber-100 text-[11px] font-bold mt-0.5">
              {visibleItem.playerName}
            </span>
          </div>
        ) : (
          <div
            className={`flex flex-col items-center px-4 py-2 sm:px-6 sm:py-3 rounded-2xl border-2 shadow-2xl backdrop-blur-md ${
              isBigScore
                ? 'bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 text-slate-950 border-amber-200 shadow-[0_0_35px_rgba(251,191,36,0.85)] animate-bounce'
                : 'bg-slate-900/90 text-amber-300 border-amber-500/80 shadow-[0_0_20px_rgba(251,191,36,0.6)]'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Sparkles
                className={`w-5 h-5 ${
                  isBigScore ? 'text-slate-950 fill-slate-950' : 'text-amber-400'
                }`}
              />
              <span className="text-2xl sm:text-4xl font-black tracking-tight drop-shadow-md">
                +{visibleItem.points} XAL!
              </span>
              <Sparkles
                className={`w-5 h-5 ${
                  isBigScore ? 'text-slate-950 fill-slate-950' : 'text-amber-400'
                }`}
              />
            </div>
            <span
              className={`text-[10px] sm:text-xs font-bold mt-0.5 ${
                isBigScore ? 'text-slate-950/90' : 'text-amber-200/90'
              }`}
            >
              {visibleItem.playerName}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
