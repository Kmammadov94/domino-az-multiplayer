import React from 'react';
import { Language, PlayerStats } from '../types/domino';
import { translations } from '../i18n/translations';
import { checkDailyClaim } from '../utils/storage';
import { sounds } from '../utils/sound';
import { X, Calendar, Gift, CheckCircle, Sparkles, Coins } from 'lucide-react';
import confetti from 'canvas-confetti';

interface DailyRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  stats: PlayerStats;
  onUpdateStats: (newStats: PlayerStats) => void;
}

export const DailyRewardModal: React.FC<DailyRewardModalProps> = ({
  isOpen,
  onClose,
  lang,
  stats,
  onUpdateStats
}) => {
  if (!isOpen) return null;
  const t = translations[lang];

  const claimCheck = checkDailyClaim(stats);

  const handleClaim = () => {
    if (!claimCheck.canClaim) return;

    const today = new Date().toISOString().split('T')[0];
    const newStats: PlayerStats = {
      ...stats,
      coins: stats.coins + claimCheck.rewardCoins,
      lastDailyClaim: today,
      dailyStreak: claimCheck.streak
    };

    onUpdateStats(newStats);
    sounds.playCoinChime();

    if (claimCheck.isDay7Bonus) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  const days = [1, 2, 3, 4, 5, 6, 7];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-amber-300">{t.dailyBonus}</h2>
            <p className="text-xs text-slate-400">
              {t.streakDays.replace('{days}', stats.dailyStreak.toString())}
            </p>
          </div>
        </div>

        {/* 7-Day Streak Calendar Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 my-5">
          {days.map((day) => {
            const isCompleted = stats.dailyStreak >= day && !claimCheck.canClaim;
            const isCurrent = claimCheck.streak === day && claimCheck.canClaim;
            const isDay7 = day === 7;

            return (
              <div
                key={day}
                className={`p-2 rounded-xl border flex flex-col items-center justify-center relative transition-all ${
                  isCurrent
                    ? 'bg-amber-500/30 border-amber-400 ring-2 ring-amber-400/50 scale-105 shadow-lg'
                    : isCompleted
                    ? 'bg-emerald-950/40 border-emerald-600/50 opacity-80'
                    : 'bg-slate-800/50 border-slate-700/60'
                } ${isDay7 ? 'sm:col-span-1 col-span-2' : ''}`}
              >
                <span className="text-[10px] font-bold text-slate-400">
                  {day}-ci Gün
                </span>

                <div className="my-1.5 flex items-center justify-center">
                  {isCompleted ? (
                    <CheckCircle className="w-6 h-6 text-emerald-400" />
                  ) : isDay7 ? (
                    <Gift className="w-6 h-6 text-amber-400 animate-bounce" />
                  ) : (
                    <Coins className="w-5 h-5 text-amber-300" />
                  )}
                </div>

                <span className={`text-xs font-black ${isDay7 ? 'text-amber-400' : 'text-slate-200'}`}>
                  {isDay7 ? '+30' : '+5'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Day 7 notice */}
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-center text-xs text-amber-300 font-medium mb-5 flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>{t.day7BonusNotice}</span>
        </div>

        {/* Claim Action Button */}
        {claimCheck.canClaim ? (
          <button
            onClick={handleClaim}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm tracking-wide shadow-lg transition-all flex items-center justify-center gap-2 transform active:scale-95"
          >
            <Coins className="w-4 h-4" />
            {t.claimBonus.replace('{coins}', claimCheck.rewardCoins.toString())}
          </button>
        ) : (
          <button
            disabled
            className="w-full py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 font-bold text-sm cursor-not-allowed flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            {t.claimed}
          </button>
        )}
      </div>
    </div>
  );
};
