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
      const displayDuration = scoreItem.isInstant35 ? 1600 : 1000;
      const timer = setTimeout(() => {
        setAnimating(false);
        const hideTimer = setTimeout(() => setVisibleItem(null), 300);
        return () => clearTimeout(hideTimer);
      }, displayDuration);
      return () => clearTimeout(timer);
    }
  }, [scoreItem]);

  if (!visibleItem) return null;

  const isBigScore = visibleItem.points >= 20 || visibleItem.isInstant35;

  return (
    <div className="fixed inset-x-0 top-13 sm:top-14 pointer-events-none z-40 flex items-start justify-center overflow-hidden px-4">
      <div
        className={`flex flex-col items-center justify-center transition-all duration-300 transform ${
          animating
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-90 -translate-y-3'
        }`}
      >
        {visibleItem.isInstant35 ? (
          <div className="flex flex-col items-center p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-600 to-amber-500 border-2 sm:border-4 border-yellow-200 shadow-[0_0_40px_rgba(245,158,11,0.9)] animate-pulse">
            <div className="flex items-center gap-1.5 text-white font-black text-lg sm:text-xl">
              <Zap className="w-5 h-5 fill-yellow-200 text-yellow-200" />
              <span>35 VURDU!</span>
              <Zap className="w-5 h-5 fill-yellow-200 text-yellow-200" />
            </div>
            <span className="text-white text-[10px] sm:text-xs font-extrabold uppercase tracking-widest mt-0.5">
              BİRBAŞA MATÇ QƏLƏBƏSİ! 🏆
            </span>
            <span className="text-amber-100 text-[10px] font-bold mt-0.5">
              {visibleItem.playerName}
            </span>
          </div>
        ) : (
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 sm:px-5 sm:py-2 rounded-2xl border-2 shadow-2xl backdrop-blur-md ${
              isBigScore
                ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 border-amber-200 shadow-[0_0_35px_rgba(251,191,36,0.85)] animate-bounce'
                : 'bg-slate-900/95 text-amber-300 border-amber-500/80 shadow-[0_0_20px_rgba(251,191,36,0.5)]'
            }`}
          >
            <Sparkles
              className={`w-4 h-4 ${
                isBigScore ? 'text-slate-950 fill-slate-950' : 'text-amber-400'
              }`}
            />
            <span className="text-base sm:text-xl font-black tracking-tight drop-shadow">
              +{visibleItem.points} Xal!
            </span>
            <span
              className={`text-[10px] sm:text-xs font-bold pl-1.5 border-l ${
                isBigScore
                  ? 'text-slate-950/80 border-slate-950/30'
                  : 'text-amber-200/80 border-amber-500/30'
              }`}
            >
              {visibleItem.playerName}
            </span>
            {isBigScore && (
              <Sparkles className="w-4 h-4 text-slate-950 fill-slate-950" />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
