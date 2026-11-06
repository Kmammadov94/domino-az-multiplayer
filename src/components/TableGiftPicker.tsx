import React, { useState } from 'react';
import { TABLE_GIFTS, TableGiftDef } from '../data/tableGifts';
import { Language } from '../types/domino';
import { Coins, X, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface TableGiftPickerProps {
  targetPlayerName: string;
  targetPlayerIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onSendGift: (gift: TableGiftDef, targetIndex: number) => void;
  userCoins: number;
  lang: Language;
}

export const TableGiftPicker: React.FC<TableGiftPickerProps> = ({
  targetPlayerName,
  targetPlayerIndex,
  isOpen,
  onClose,
  onSendGift,
  userCoins,
  lang
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-[2px] animate-fade-in">
      <div className="relative w-full max-w-sm bg-slate-900/95 border border-amber-500/50 rounded-2xl p-4 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎁</span>
            <div>
              <h3 className="text-sm font-black text-white">
                {targetPlayerName} üçün Hədiyyə
              </h3>
              <p className="text-[10px] text-slate-400">
                Masada əşya at və ya çay süz
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Gift Grid */}
        <div className="grid grid-cols-3 gap-2.5 my-3.5">
          {TABLE_GIFTS.map((gift) => {
            const canAfford = userCoins >= gift.cost;
            return (
              <button
                key={gift.id}
                disabled={!canAfford}
                onClick={() => {
                  triggerHaptic('light');
                  onSendGift(gift, targetPlayerIndex);
                  onClose();
                }}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all transform active:scale-95 group ${
                  canAfford
                    ? 'bg-slate-800/80 hover:bg-slate-700/90 border-slate-700 hover:border-amber-400/60 shadow hover:-translate-y-0.5'
                    : 'bg-slate-900/40 border-slate-800/40 opacity-50 cursor-not-allowed'
                }`}
              >
                <span className="text-3xl mb-1 group-hover:scale-125 transition-transform">
                  {gift.icon}
                </span>
                <span className="text-[11px] font-bold text-slate-200 text-center line-clamp-1">
                  {gift.name[lang] || gift.name.az}
                </span>
                <div className="flex items-center gap-1 mt-1 text-[10px] font-black text-amber-300">
                  {gift.cost === 0 ? (
                    <span className="text-emerald-400 font-bold">Pulsuz</span>
                  ) : (
                    <>
                      <Coins className="w-3 h-3 text-amber-400" />
                      <span>{gift.cost}</span>
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Balance */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>Sənin Qızılların:</span>
          <div className="flex items-center gap-1 font-black text-amber-300">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>{userCoins}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
