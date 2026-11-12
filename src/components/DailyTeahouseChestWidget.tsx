import React from 'react';
import { Sparkles, Coins, Flame, ChevronRight, Gift, Check } from 'lucide-react';
import { Language, PlayerStats } from '../types/domino';
import { checkDailyClaim } from '../utils/storage';
import { triggerHaptic } from '../utils/haptics';
import { ArmuduTeaSvg } from './GiftIcon';

interface DailyTeahouseChestWidgetProps {
  stats: PlayerStats;
  lang: Language;
  onOpenModal: () => void;
}

export const DailyTeahouseChestWidget: React.FC<DailyTeahouseChestWidgetProps> = ({
  stats,
  lang,
  onOpenModal
}) => {
  const claimCheck = checkDailyClaim(stats);
  const currentStreak = claimCheck.streak || stats.dailyStreak || 1;

  const handleClick = () => {
    triggerHaptic(claimCheck.canClaim ? 'success' : 'light');
    onOpenModal();
  };

  return (
    <div
      onClick={handleClick}
      className={`w-full my-2 rounded-2xl p-3 sm:p-3.5 transition-all duration-300 cursor-pointer active:scale-[0.99] relative overflow-hidden group border ${
        claimCheck.canClaim
          ? 'bg-gradient-to-r from-amber-950/90 via-slate-900 to-amber-950/90 border-amber-400/80 shadow-[0_0_25px_rgba(245,158,11,0.35)] hover:border-amber-300'
          : 'bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-slate-900/90 border-slate-700/60 hover:border-slate-600'
      }`}
    >
      {/* Background ambient warmth glow */}
      {claimCheck.canClaim && (
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none animate-pulse" />
      )}

      <div className="flex items-center justify-between gap-3 relative z-10">
        {/* Left: Armudu Tea + Golden Chest Visual Emblem */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex-shrink-0">
            <div
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center border transition-all ${
                claimCheck.canClaim
                  ? 'bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 border-amber-200 text-slate-950 shadow-[0_0_20px_rgba(251,191,36,0.6)] group-hover:scale-105'
                  : 'bg-slate-800 border-slate-700 text-amber-400/80'
              }`}
            >
              {/* Steaming Armudu Glass / Chest Iconic Emblem */}
              <div className="relative flex flex-col items-center justify-center">
                {claimCheck.canClaim ? (
                  <>
                    <span className="text-2xl sm:text-3xl filter drop-shadow animate-bounce">🎁</span>
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                    </span>
                  </>
                ) : (
                  <ArmuduTeaSvg size={32} />
                )}
              </div>
            </div>
          </div>

          {/* Center: Title, Description & Streak Bar */}
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs sm:text-sm font-black text-white tracking-wide flex items-center gap-1">
                {claimCheck.canClaim ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
                    <span>Günün Hədiyyəsi Hazırdır!</span>
                  </>
                ) : (
                  <>
                    <span>Çayxana Günlük Hədiyyəsi</span>
                  </>
                )}
              </span>

              {/* Day Streak Pill */}
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-[10px] font-black text-amber-300 flex items-center gap-0.5">
                <Flame className="w-3 h-3 text-orange-400 fill-orange-400" />
                <span>{currentStreak}-ci Gün</span>
              </span>
            </div>

            <p className="text-[11px] text-slate-300 mt-0.5 truncate">
              {claimCheck.canClaim
                ? `Pürrəngi çay yanında payınızı götürün: +${claimCheck.rewardCoins} Qızıl!`
                : 'Bugünkü hədiyyə götürülüb. Sabah növbəti bonus üçün gəlin!'}
            </p>

            {/* 7-Day Mini Progression Dots */}
            <div className="flex items-center gap-1 mt-1.5">
              {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                const isClaimedDay = !claimCheck.canClaim
                  ? day <= currentStreak
                  : day < currentStreak;
                const isCurrentToday = day === currentStreak;
                const isDay7 = day === 7;

                return (
                  <div
                    key={day}
                    className={`h-1.5 rounded-full transition-all ${
                      isDay7 ? 'w-5' : 'w-3'
                    } ${
                      isClaimedDay
                        ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                        : isCurrentToday && claimCheck.canClaim
                        ? 'bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.9)]'
                        : 'bg-slate-700/80'
                    }`}
                    title={`${day}-ci Gün`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Action Button or Claim Pill */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {claimCheck.canClaim ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
              className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 text-slate-950 font-black text-xs shadow-lg flex items-center gap-1 group-hover:scale-105 active:scale-95 transition"
            >
              <Coins className="w-3.5 h-3.5 fill-slate-950" />
              <span>Götür!</span>
            </button>
          ) : (
            <div className="flex items-center gap-1 text-slate-400 group-hover:text-amber-300 transition">
              <span className="text-[10px] font-bold hidden sm:inline">Bax</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
