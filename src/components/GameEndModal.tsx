import React, { useState, useEffect } from 'react';
import { Player, Language, GameMode, GameVariant } from '../types/domino';
import { Match101State } from '../utils/domino101Logic';
import { getMatchCoinReward } from '../utils/dominoLogic';
import { translations } from '../i18n/translations';
import { sounds } from '../utils/sound';
import { Trophy, Frown, Coins, ArrowRight, RotateCcw, Eye, EyeOff, Sparkles, LogOut, PlayCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AvatarView } from './AvatarView';
import { isNativeMobileApp } from '../utils/storage';
import {
  REWARDED_AD_COINS_AMOUNT,
  getRewardedAdErrorNotice,
  type RewardedAdResult
} from '../services/adMobService';

interface GameEndModalProps {
  isOpen: boolean;
  isMatchOver: boolean;
  isBaglandi: boolean;
  baglandiOver365Restart: boolean;
  isInstant35?: boolean;
  winnerPlayerIndex: number;
  winnerTeam?: 1 | 2;
  handBonusPoints: number;
  rawOpponentPips?: number;
  players: Player[];
  mode: GameMode;
  lang: Language;
  myPlayerIndex?: number;
  isHost?: boolean;
  onNextHand: () => void;
  onRestartMatch: () => void;
  onLeaveMatch: () => void;
  onClaimAdBonus?: () => Promise<RewardedAdResult>;
  variant?: GameVariant;
  match101State?: Match101State;
  isSeka?: boolean;
  ayazCaught?: boolean;
  isRanked?: boolean;
  teahousePrizePot?: number;
  userMmr?: number;
}

export const GameEndModal: React.FC<GameEndModalProps> = ({
  isOpen,
  isMatchOver,
  isBaglandi,
  baglandiOver365Restart,
  isInstant35 = false,
  winnerPlayerIndex,
  winnerTeam,
  handBonusPoints,
  rawOpponentPips,
  players = [],
  mode,
  lang,
  myPlayerIndex = 0,
  isHost = true,
  onNextHand,
  onRestartMatch,
  onLeaveMatch,
  onClaimAdBonus,
  variant = '365',
  match101State,
  isSeka = false,
  ayazCaught = false,
  isRanked = false,
  teahousePrizePot = 0,
  userMmr
}) => {
  const [isViewingBoard, setIsViewingBoard] = useState<boolean>(false);
  const [claimingAdBonus, setClaimingAdBonus] = useState<boolean>(false);
  const [adBonusClaimed, setAdBonusClaimed] = useState<boolean>(false);
  const [adErrorNotice, setAdErrorNotice] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsViewingBoard(false);
      setClaimingAdBonus(false);
      setAdBonusClaimed(false);
      setAdErrorNotice(null);
    }
  }, [isOpen]);

  const myIndex = myPlayerIndex ?? 0;
  const myPlayer = players[myIndex];
  const myTeam = myPlayer?.team ?? 1;

  // Determine whether local User won:
  let userWon = false;
  if (isMatchOver) {
    if (isInstant35) {
      userWon =
        mode === '4p_duo'
          ? (players[winnerPlayerIndex]?.team ?? 1) === myTeam
          : winnerPlayerIndex === myIndex;
    } else if (mode === '4p_duo') {
      const myTeamScore = players.find((p) => p.team === myTeam)?.score ?? 0;
      const otherTeamScore = players.find((p) => p.team !== myTeam)?.score ?? 0;
      userWon = myTeamScore > otherTeamScore;
    } else {
      const myScore = myPlayer?.score ?? 0;
      const otherScores = players.filter((_, idx) => idx !== myIndex).map((p) => p.score ?? 0);
      userWon = otherScores.length === 0 || myScore >= Math.max(...otherScores);
    }
  } else {
    // Single Hand End
    if (mode === '4p_duo') {
      userWon = winnerTeam === myTeam;
    } else {
      userWon = winnerPlayerIndex === myIndex;
    }
  }

  const winnerPlayer = players[winnerPlayerIndex] || players[0];

  useEffect(() => {
    if (isOpen && isMatchOver && (userWon || isInstant35)) {
      try {
        sounds.playVictory();
        confetti({
          particleCount: 120,
          spread: 90,
          origin: { y: 0.5 }
        });
      } catch (e) {
        console.warn('Confetti / sound notification exception:', e);
      }
    }
  }, [isOpen, isMatchOver, userWon, isInstant35]);

  if (!isOpen) return null;
  const t = translations[lang] || translations.az;

  // Mode: Minimized Floating Bar allowing user to inspect the full board & opponent tiles freely!
  if (isViewingBoard) {
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-wrap items-center justify-center gap-2 sm:gap-3 bg-slate-900/95 backdrop-blur-md border-2 border-amber-500/70 rounded-2xl p-2.5 px-4 shadow-[0_10px_35px_rgba(0,0,0,0.85)] animate-fade-in pointer-events-auto max-w-[95vw]">
        <button
          onClick={() => setIsViewingBoard(false)}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs flex items-center gap-1.5 border border-slate-700 shadow transition active:scale-95"
        >
          <EyeOff className="w-4 h-4 text-amber-400" />
          <span>{t.showResults || 'Nəticələrə Qayıt'}</span>
        </button>

        {isHost ? (
          <button
            onClick={isMatchOver ? onRestartMatch : onNextHand}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:brightness-110 text-white font-black text-xs flex items-center gap-1.5 shadow-lg transition active:scale-95"
          >
            <span>{isMatchOver ? (t.playAgain || 'Yenidən Oyna') : (t.nextHand || 'Növbəti Əl')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <span className="text-xs text-amber-300 font-bold px-2 animate-pulse">
            👑 Otaq sahibi gözlənilir...
          </span>
        )}

        <button
          onClick={onLeaveMatch}
          className="px-3.5 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-700 text-rose-200 font-bold text-xs flex items-center gap-1.5 shadow transition active:scale-95"
        >
          <LogOut className="w-4 h-4 text-rose-400" />
          <span>{t.forfeit || 'Çıxış'}</span>
        </button>
      </div>
    );
  }

  // Standard Modal View
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in pointer-events-auto">
      <div className="bg-slate-900 border-2 border-amber-500/70 rounded-2xl w-full max-w-md max-h-[90dvh] min-h-0 overflow-y-auto p-5 sm:p-6 shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col items-center text-center relative">
        {/* Glow effect behind header */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />

        {isMatchOver ? (
          <>
            {/* Match Complete Champion Badge */}
            <div className="relative mb-3 flex items-center justify-center">
              <AvatarView
                avatarId={
                  userWon
                    ? (myPlayer?.avatarId || 'avatar_baku_classic')
                    : (winnerPlayer?.avatarId || 'avatar_tea_master')
                }
                size="lg"
                showGlow={userWon}
              />
              <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-slate-900 border border-amber-400 shadow">
                {userWon ? (
                  <Trophy className="w-4 h-4 text-amber-400 animate-bounce" />
                ) : (
                  <Frown className="w-4 h-4 text-rose-400" />
                )}
              </div>
            </div>

            <h2 className="text-2xl font-black text-white mb-1">
              {isInstant35
                ? userWon
                  ? t.instant35Win
                  : t.instant35Loss
                : variant === '101'
                ? userWon
                  ? (mode === '4p_duo' ? '🎉 101 XAL! Komandanız Matçın Qalibi Oldu!' : '🎉 101 XAL! Siz Matçın Qalibi Oldunuz!')
                  : (mode === '4p_duo' ? 'Rəqib Komanda 101 Xala Çatdı!' : `${winnerPlayer?.name || 'Rəqib'} 101 Xala Çatdı!`)
                : userWon
                ? t.matchWinner
                : `${winnerPlayer?.name || 'Rəqib'} matçın qalibi oldu!`}
            </h2>
            <p className="text-xs text-amber-400/90 mb-4 font-semibold">
              {isInstant35
                ? t.instant35Desc
                : variant === '101'
                ? players.length === 3
                  ? `101 Matçı — ${players.map((p) => `${p.name}: ${match101State?.playerAccounts?.[p.id]?.mainScore ?? p.score} xal`).join(' vs ')}`
                  : mode === '2p_solo'
                  ? `101 Matçı — ${players[0]?.name || 'Siz'}: ${match101State?.team1.mainScore ?? 0} xal vs ${players[1]?.name || 'Bot'}: ${match101State?.team2.mainScore ?? 0} xal`
                  : `101 Matçı — ${t.team1}: ${match101State?.team1.mainScore ?? 0} xal vs ${t.team2}: ${match101State?.team2.mainScore ?? 0} xal`
                : mode === '4p_duo'
                ? `${t.team1}: ${players.find((p) => p.team === 1)?.score ?? 0} — ${
                    t.team2
                  }: ${players.find((p) => p.team === 2)?.score ?? 0}`
                : `365 ${t.targetScore}`}
            </p>

            {/* Quru Məğlubiyyət (Dry Defeat) Banner in 101 */}
            {variant === '101' && match101State?.isDryDefeat && (
              <div className="p-3 bg-gradient-to-r from-rose-950/80 via-red-900/60 to-rose-950/80 border-2 border-rose-500 rounded-2xl mb-4 text-center shadow-lg animate-pulse">
                <span className="text-sm font-black text-rose-300 block">🫖 QURU MƏĞLUBİYYƏT (101 vs 0)!</span>
                <span className="text-xs text-rose-200 mt-1 block">
                  Rəqib saya belə düşə bilmədi! Çayxana ənənəsinə görə çaylar və mürəbbə uduzan tərəfdəndir!
                </span>
              </div>
            )}

            {/* Coin / Ranked MMR reward badge */}
            <div className="bg-amber-500/20 border border-amber-500/40 rounded-xl px-4 py-2 flex items-center gap-2 mb-3">
              <Coins className="w-5 h-5 text-amber-400" />
              <span className="font-bold text-amber-300 text-sm">
                {isRanked
                  ? userWon
                    ? `+${teahousePrizePot} Qızıl qazanıldı!${userMmr ? ` • ${userMmr} MMR` : ''}`
                    : `Çayxana Reytinq${userMmr ? ` • ${userMmr} MMR` : ''}`
                  : `+${getMatchCoinReward(variant, userWon)} Qızıl qazanıldı!`}
              </span>
            </div>

            {onClaimAdBonus && isNativeMobileApp() && !adBonusClaimed && (
              <div className="mb-4 w-full">
                <button
                  onClick={async () => {
                    if (claimingAdBonus) return;
                    setClaimingAdBonus(true);
                    setAdErrorNotice(null);
                    try {
                      const res = await onClaimAdBonus();
                      if (res.rewarded) {
                        setAdBonusClaimed(true);
                      } else {
                        const msg = getRewardedAdErrorNotice(res, lang);
                        if (msg) setAdErrorNotice(msg);
                      }
                    } finally {
                      setClaimingAdBonus(false);
                    }
                  }}
                  disabled={claimingAdBonus}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 disabled:opacity-60 text-slate-950 font-black text-xs shadow-lg transition flex items-center justify-center gap-2 active:scale-95"
                >
                  <PlayCircle className="w-4 h-4 flex-shrink-0" />
                  <span>
                    {claimingAdBonus
                      ? (lang === 'az' ? 'Reklam açılır...' : lang === 'ru' ? 'Загрузка рекламы...' : 'Loading ad...')
                      : (lang === 'az'
                          ? `Reklama bax → +${REWARDED_AD_COINS_AMOUNT} Qızıl Qazan`
                          : lang === 'ru'
                          ? `Смотреть рекламу → +${REWARDED_AD_COINS_AMOUNT} золота`
                          : `Watch Ad → +${REWARDED_AD_COINS_AMOUNT} Gold`)}
                  </span>
                </button>
                {adErrorNotice && (
                  <p className="mt-1.5 text-[11px] font-semibold text-rose-300 text-center">
                    {adErrorNotice}
                  </p>
                )}
              </div>
            )}

            {adBonusClaimed && (
              <div className="mb-4 text-xs font-black text-emerald-400">
                ✓ +{REWARDED_AD_COINS_AMOUNT} Bonus Qızıl balansınıza əlavə edildi!
              </div>
            )}

            <div className="w-full space-y-2 mt-auto">
              {isHost ? (
                <button
                  onClick={onRestartMatch}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:brightness-110 text-slate-950 font-black text-sm shadow-xl transition flex items-center justify-center gap-2 active:scale-95"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>🔄 Təkrar Oyna (Rematch)</span>
                </button>
              ) : (
                <button
                  onClick={onRestartMatch}
                  className="w-full py-3 rounded-xl bg-amber-950/60 border border-amber-500/50 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 hover:bg-amber-900/60 transition active:scale-95"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>🔄 Otaq Sahibi ilə Təkrar Oyna</span>
                </button>
              )}

              {/* View Board Final State Button */}
              <button
                onClick={() => setIsViewingBoard(true)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95"
              >
                <Eye className="w-4 h-4 text-sky-400" />
                <span>{t.viewBoard || 'Masanın Son Vəziyyətinə Bax'}</span>
              </button>

              {/* Exit to Main Menu Button */}
              <button
                onClick={onLeaveMatch}
                className="w-full py-2.5 rounded-xl bg-rose-950/75 hover:bg-rose-900 border border-rose-800 text-rose-200 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>Ana Menyuya Çıx</span>
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Hand Complete */}
            <div className="relative mb-3 flex items-center justify-center">
              <AvatarView
                avatarId={
                  userWon
                    ? (myPlayer?.avatarId || 'avatar_baku_classic')
                    : (winnerPlayer?.avatarId || 'avatar_tea_master')
                }
                size="md"
                showGlow={userWon}
              />
              <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-slate-900 border border-amber-400 shadow">
                {userWon ? (
                  <Trophy className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                ) : (
                  <Frown className="w-3.5 h-3.5 text-rose-400" />
                )}
              </div>
            </div>

            <h2 className="text-xl font-black mb-1">
              {isSeka ? (
                <span className="text-amber-400">🤝 Seka! (Bərabərlik)</span>
              ) : userWon ? (
                <span className="text-emerald-400">
                  {isBaglandi
                    ? (mode === '4p_duo' ? 'Bağlandı! Komandanız Qazandı!' : 'Bağlandı! Siz Qazandınız!')
                    : (mode === '4p_duo' ? 'Çıxdınız! Komandanız Qazandı!' : 'Çıxdınız! Siz Qazandınız!')}
                </span>
              ) : (
                <span className="text-amber-300">
                  {isBaglandi
                    ? `${winnerPlayer?.name || 'Rəqib'} Bağlandı ilə qazandı`
                    : `${winnerPlayer?.name || 'Rəqib'} çıxdı`}
                </span>
              )}
            </h2>

            {/* 101 Specific event message */}
            {variant === '101' && match101State?.lastEventMessage && (
              <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 my-2 text-xs text-amber-200 font-bold text-center">
                {match101State.lastEventMessage}
              </div>
            )}

            {/* Ayaz [0:0] 10 Penalty Callout when caught alone */}
            {variant === '101' && ayazCaught && (
              <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/50 mb-2.5 text-xs text-rose-300 font-extrabold flex items-center justify-center gap-2">
                <span>❄️ Tək Qoşa [0:0] Qaldı:</span>
                <span className="text-white">+10 Cərimə Xalı!</span>
              </div>
            )}

            {baglandiOver365Restart ? (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl my-2 text-xs text-amber-300">
                {t.baglandiOver365Notice}
              </div>
            ) : !isSeka && (
              <p className="text-xs text-slate-400 mb-3 font-medium">
                {userWon
                  ? (isBaglandi
                      ? 'Əlinizdə ən az xal qalaraq qalib oldunuz!'
                      : 'Əlinizdəki bütün daşları bitirərək qalib oldunuz!')
                  : (isBaglandi
                      ? 'Rəqibin əlində daha az xal qaldı.'
                      : 'Rəqib əlindəki bütün daşları bitirdi.')}
              </p>
            )}

            {/* Bonus Points breakdown */}
            {handBonusPoints > 0 && (
              <div
                className={`rounded-xl px-4 py-2.5 mb-4 w-full text-center border ${
                  userWon
                    ? 'bg-emerald-950/60 border-emerald-500/60'
                    : 'bg-slate-950/70 border-amber-500/40'
                }`}
              >
                <span
                  className={`text-xs font-semibold block mb-0.5 ${
                    userWon ? 'text-emerald-300' : 'text-amber-300'
                  }`}
                >
                  {userWon
                    ? 'Rəqiblərin əlindən qazandığınız bonus xalı:'
                    : `${winnerPlayer?.name || 'Qalib'} qazandığı əl xalı:`}
                </span>
                <span
                  className={`text-2xl font-black ${
                    userWon ? 'text-white' : 'text-amber-400'
                  }`}
                >
                  {rawOpponentPips && rawOpponentPips !== handBonusPoints
                    ? `${rawOpponentPips} ➔ +${handBonusPoints} xal`
                    : `+${handBonusPoints} xal`}
                </span>
                {!userWon && (
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    (Əlinizdəki qalıq xallar qalibə əlavə edildi)
                  </span>
                )}
              </div>
            )}

            <div className="w-full space-y-2 mt-auto">
              {isHost ? (
                <button
                  onClick={onNextHand}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:brightness-110 text-white font-black text-sm shadow-lg transition flex items-center justify-center gap-2 active:scale-95"
                >
                  <span>{t.nextHand || 'Növbəti Əl'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="w-full py-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 animate-pulse">
                  <span>👑 Otaq sahibinin növbəti əli başlatması gözlənilir...</span>
                </div>
              )}

              {/* View Board Final State Button */}
              <button
                onClick={() => setIsViewingBoard(true)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95"
              >
                <Eye className="w-4 h-4 text-sky-400" />
                <span>{t.viewBoard || 'Masanın Son Vəziyyətinə Bax'}</span>
              </button>

              {/* Exit to Main Menu Button */}
              <button
                onClick={onLeaveMatch}
                className="w-full py-2.5 rounded-xl bg-rose-950/75 hover:bg-rose-900 border border-rose-800 text-rose-200 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>Oyundan Çıx (Ana Menyu)</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
