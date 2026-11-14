import React, { useState } from 'react';
import { Player, GameMode, Language, GameVariant } from '../types/domino';
import { Match101State } from '../utils/domino101Logic';
import { translations } from '../i18n/translations';
import { AvatarView } from './AvatarView';
import { Trophy, ShieldAlert, Award, Sparkles, Coins, ChevronDown, ChevronUp } from 'lucide-react';

interface ScoreBoardProps {
  players: Player[];
  mode: GameMode;
  lang: Language;
  roundNumber: number;
  lastScoredPoints?: { playerName: string; points: number } | null;
  equippedFrame?: string;
  equippedTitle?: string;
  variant?: GameVariant;
  match101State?: Match101State;
  myPlayerIndex?: number;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  players,
  mode,
  lang,
  roundNumber,
  lastScoredPoints,
  equippedFrame,
  equippedTitle,
  variant = '365',
  match101State,
  myPlayerIndex = 0
}) => {
  const t = translations[lang];
  // Default to compact collapsed view so the scoreboard stays unobtrusive across all screen sizes
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);
  const myTeam: 1 | 2 = players[myPlayerIndex]?.team || (myPlayerIndex % 2 === 0 ? 1 : 2);
  const myPlayerObj = players[myPlayerIndex] || players[0];
  const oppPlayerObj = players.find((_, idx) => idx !== myPlayerIndex) || players[1];

  // ==========================================
  // DOMINO 101 MODE SCOREBOARD
  // ==========================================
  if (variant === '101') {
    const rawT1 = match101State?.team1 || { isOpen: false, draftScore: 0, mainScore: 0, unopenedAttempts: 0 };
    const rawT2 = match101State?.team2 || { isOpen: false, draftScore: 0, mainScore: 0, unopenedAttempts: 0 };
    const t1State = myTeam === 1 ? rawT1 : rawT2;
    const t2State = myTeam === 1 ? rawT2 : rawT1;
    const sekaBank = match101State?.sekaBank || 0;

    // Compact collapsed view for mobile or user toggle
    if (isCollapsed) {
      return (
        <div className="relative bg-slate-950/95 backdrop-blur-md border border-amber-500/50 rounded-xl px-2.5 py-1 shadow-xl flex items-center gap-2 text-xs select-none animate-fade-in max-w-[95vw]">
          <div className="flex items-center gap-1 font-bold text-amber-400">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] font-black">101</span>
          </div>

          <div className="h-4 w-[1px] bg-white/20" />

          {/* 3 Players Compact */}
          {players.length === 3 ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              {players.map((p, idx) => {
                const acc = match101State?.playerAccounts?.[p.id] || { mainScore: 0, draftScore: 0, isOpen: false };
                const isMe = idx === myPlayerIndex;
                return (
                  <span
                    key={p.id}
                    className={`text-[11px] font-bold flex items-center gap-1 px-1.5 py-0.5 rounded-lg border ${
                      isMe
                        ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
                        : 'bg-slate-800/80 border-slate-700 text-amber-300'
                    }`}
                  >
                    <span className="text-slate-300">{isMe ? 'Sən' : p.name.split(' ')[0]}:</span>
                    <span className="text-white font-black text-xs">{acc.mainScore}</span>
                    {acc.isOpen ? (
                      <span className="text-[9px] text-emerald-400">✓</span>
                    ) : (
                      <span className="text-[9px] text-amber-400/90">({acc.draftScore})</span>
                    )}
                  </span>
                );
              })}
            </div>
          ) : (
            /* 2 Teams / 2 Players Compact */
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-950/70 border border-emerald-500/50">
                <span className="text-emerald-300">
                  {mode === '2p_solo' ? 'Sən' : 'Sizin Kom.'}:
                </span>
                <span className="text-white font-black text-xs">{t1State.mainScore}</span>
                {t1State.isOpen ? (
                  <span className="text-[9px] text-emerald-400">✓</span>
                ) : (
                  <span className="text-[9px] text-amber-400/90">({t1State.draftScore})</span>
                )}
              </span>

              <span className="text-slate-500 font-black text-[10px]">VS</span>

              <span className="text-[11px] font-bold flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-950/60 border border-rose-500/40">
                <span className="text-rose-300">
                  {mode === '2p_solo' ? (oppPlayerObj?.name?.split(' ')[0] || 'Rəqib') : 'Rəqib Kom.'}:
                </span>
                <span className="text-white font-black text-xs">{t2State.mainScore}</span>
                {t2State.isOpen ? (
                  <span className="text-[9px] text-emerald-400">✓</span>
                ) : (
                  <span className="text-[9px] text-amber-400/90">({t2State.draftScore})</span>
                )}
              </span>
            </div>
          )}

          {sekaBank > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-black text-[10px] flex items-center gap-0.5">
              <Coins className="w-2.5 h-2.5 text-amber-400" />+{sekaBank}
            </span>
          )}

          <button
            onClick={() => setIsCollapsed(false)}
            className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-amber-400 transition ml-0.5"
            title="Hesab lövhəsini aç"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }

    return (
      <div className="bg-slate-900/90 backdrop-blur-md border border-amber-600/30 rounded-xl p-2.5 sm:p-3 shadow-xl flex flex-col gap-1.5 sm:gap-2 w-[240px] sm:w-[280px] animate-fade-in">
        <div className="flex items-center justify-between text-xs text-amber-400 font-semibold border-b border-white/10 pb-1">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold text-amber-300">101 Xal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">{t.round}: {roundNumber}</span>
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
              title="Yığcam rejimə keç"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Seka Bank Banner if active */}
        {sekaBank > 0 && (
          <div className="p-1.5 px-2.5 rounded-lg bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border border-amber-500/50 flex items-center justify-between text-xs animate-pulse">
            <span className="font-bold text-amber-300 flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              Seka Bankı:
            </span>
            <span className="font-black text-amber-300 text-sm">+{sekaBank} xal</span>
          </div>
        )}

        {/* Players / Teams Score Grid for 101 */}
        {players.length === 3 ? (
          <div className="grid grid-cols-3 gap-1.5">
            {players.map((p) => {
              const acc = match101State?.playerAccounts?.[p.id] || {
                isOpen: false,
                draftScore: 0,
                mainScore: 0,
                unopenedAttempts: 0
              };
              const colorClass =
                p.id === 0 ? 'text-emerald-400' : p.id === 1 ? 'text-amber-400' : 'text-cyan-400';
              const barClass =
                p.id === 0 ? 'bg-emerald-500' : p.id === 1 ? 'bg-amber-500' : 'bg-cyan-500';

              return (
                <div
                  key={p.id}
                  className={`p-1.5 rounded-xl border flex flex-col items-center transition-all ${
                    acc.mainScore >= 101
                      ? 'bg-amber-950/50 border-amber-400 ring-2 ring-amber-400/40 shadow-lg'
                      : 'bg-slate-800/70 border-slate-700'
                  }`}
                >
                  <span className={`text-[11px] font-black ${colorClass} flex items-center gap-0.5 truncate max-w-[80px]`}>
                    {p.name}
                    {acc.mainScore >= 101 && <Award className="w-2.5 h-2.5 text-amber-400" />}
                  </span>
                  <span className="text-xl font-black text-white tracking-tight my-0.5">
                    {acc.mainScore}
                  </span>
                  <div className="w-full bg-slate-700/50 rounded-full h-1 overflow-hidden">
                    <div
                      className={`${barClass} h-full rounded-full transition-all duration-300`}
                      style={{ width: `${Math.min(100, (acc.mainScore / 101) * 100)}%` }}
                    />
                  </div>

                  {acc.isOpen ? (
                    <span className="text-[9px] text-emerald-300 font-bold bg-emerald-950/60 border border-emerald-500/30 px-1 py-0.2 rounded mt-1 flex items-center gap-0.5 whitespace-nowrap">
                      <Sparkles className="w-2 h-2" /> Saya düşüb
                    </span>
                  ) : (
                    <div className="flex flex-col items-center mt-0.5 text-[9px] leading-tight">
                      <span className="text-amber-400 font-bold">
                        Qaralama: {acc.draftScore}
                      </span>
                      <span className="text-slate-400 text-[8px]">
                        {acc.unopenedAttempts}/3 cəhd
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {/* Team 1 / Player 1 */}
            <div className={`p-2 rounded-xl border flex flex-col items-center transition-all ${
              t1State.mainScore >= 101
                ? 'bg-amber-950/50 border-amber-400 ring-2 ring-amber-400/40 shadow-lg'
                : 'bg-slate-800/70 border-slate-700'
            }`}>
              <span className="text-xs font-black text-emerald-400 flex items-center gap-1">
                {mode === '2p_solo' ? (myPlayerObj?.name || t.player) : t.team1}
                {t1State.mainScore >= 101 && <Award className="w-3 h-3 text-amber-400" />}
              </span>
              <span className="text-2xl font-black text-white tracking-tight my-0.5">{t1State.mainScore}</span>
              <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (t1State.mainScore / 101) * 100)}%` }}
                />
              </div>

              {/* Status & Draft Info */}
              {t1State.isOpen ? (
                <span className="text-[10px] text-emerald-300 font-bold bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded-md mt-1.5 flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5" /> Saya düşüb ✓
                </span>
              ) : (
                <div className="flex flex-col items-center mt-1 text-[10px]">
                  <span className="text-amber-400 font-bold bg-amber-950/60 border border-amber-500/30 px-1.5 py-0.5 rounded-md">
                    Qaralama: {t1State.draftScore}
                  </span>
                  <span className="text-slate-400 text-[9px] mt-0.5">
                    {t1State.unopenedAttempts}/3 cəhd (Hədd: 13)
                  </span>
                </div>
              )}
            </div>

            {/* Team 2 / Player 2 */}
            <div className={`p-2 rounded-xl border flex flex-col items-center transition-all ${
              t2State.mainScore >= 101
                ? 'bg-amber-950/50 border-amber-400 ring-2 ring-amber-400/40 shadow-lg'
                : 'bg-slate-800/70 border-slate-700'
            }`}>
              <span className="text-xs font-black text-rose-400 flex items-center gap-1">
                {mode === '2p_solo' ? (oppPlayerObj?.name || 'Bot') : t.team2}
                {t2State.mainScore >= 101 && <Award className="w-3 h-3 text-amber-400" />}
              </span>
              <span className="text-2xl font-black text-white tracking-tight my-0.5">{t2State.mainScore}</span>
              <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (t2State.mainScore / 101) * 100)}%` }}
                />
              </div>

              {/* Status & Draft Info */}
              {t2State.isOpen ? (
                <span className="text-[10px] text-emerald-300 font-bold bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded-md mt-1.5 flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5" /> Saya düşüb ✓
                </span>
              ) : (
                <div className="flex flex-col items-center mt-1 text-[10px]">
                  <span className="text-amber-400 font-bold bg-amber-950/60 border border-amber-500/30 px-1.5 py-0.5 rounded-md">
                    Qaralama: {t2State.draftScore}
                  </span>
                  <span className="text-slate-400 text-[9px] mt-0.5">
                    {t2State.unopenedAttempts}/3 cəhd (Hədd: 13)
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 101 Ayaz Reminder Badge */}
        <div className="text-[10px] text-slate-400 flex items-center justify-between px-1 pt-0.5 border-t border-white/5">
          <span>Hədəf: 101</span>
          <span className="text-amber-400/90 font-semibold">Tək [0:0] = 10 xal (tək deyilsə 0)</span>
        </div>
      </div>
    );
  }

  // ==========================================
  // DOMINO 365 (TELEFON) MODE SCOREBOARD
  // ==========================================
  // In 4p_duo, group by team
  if (mode === '4p_duo') {
    const team1Score = players.find(p => p.team === myTeam)?.score || 0;
    const team2Score = players.find(p => p.team !== myTeam)?.score || 0;

    const team1Over300 = team1Score >= 300;
    const team2Over300 = team2Score >= 300;
    const team1Over365 = team1Score >= 365;
    const team2Over365 = team2Score >= 365;

    // Compact collapsed view for mobile or user toggle
    if (isCollapsed) {
      return (
        <div className="relative bg-slate-950/95 backdrop-blur-md border border-amber-500/50 rounded-xl px-2.5 py-1 shadow-xl flex items-center gap-2 text-xs select-none animate-fade-in max-w-[95vw]">
          <div className="flex items-center gap-1 font-bold text-amber-400">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] font-black">365</span>
          </div>

          <div className="h-4 w-[1px] bg-white/20" />

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-950/70 border border-emerald-500/50">
              <span className="text-emerald-300">Sizin Kom.:</span>
              <span className="text-white font-black text-xs">{team1Score}</span>
              {team1Over300 && <span className="text-[9px] text-amber-400">300+</span>}
            </span>

            <span className="text-slate-500 font-black text-[10px]">VS</span>

            <span className="text-[11px] font-bold flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-950/60 border border-rose-500/40">
              <span className="text-rose-300">Rəqib Kom.:</span>
              <span className="text-white font-black text-xs">{team2Score}</span>
              {team2Over300 && <span className="text-[9px] text-amber-400">300+</span>}
            </span>
          </div>

          <button
            onClick={() => setIsCollapsed(false)}
            className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-amber-400 transition ml-0.5"
            title="Hesab lövhəsini aç"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }

    return (
      <div className="bg-slate-900/90 backdrop-blur-md border border-amber-600/30 rounded-xl p-2.5 sm:p-3 shadow-xl flex flex-col gap-1.5 sm:gap-2 w-[240px] sm:w-[280px]">
        <div className="flex items-center justify-between text-xs text-amber-400 font-semibold border-b border-white/10 pb-1">
          <div className="flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.targetScore}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">{t.round}: {roundNumber}</span>
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
              title="Yığcam rejimə keç"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Teams Score Grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* Team 1 (User + Rashad) */}
          <div className={`p-2 rounded-lg border flex flex-col items-center ${
            team1Over365 ? 'bg-amber-950/40 border-amber-500' : 'bg-slate-800/60 border-slate-700'
          }`}>
            <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
              {t.team1}
              {team1Over365 && <Award className="w-3 h-3 text-amber-400" />}
            </span>
            <span className="text-2xl font-black text-white tracking-tight">{team1Score}</span>
            <div className="w-full bg-slate-700/50 rounded-full h-1.5 mt-1 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (team1Score / 365) * 100)}%` }}
              />
            </div>
            {team1Over300 && (
              <span className="text-[10px] text-amber-400 mt-1 flex items-center gap-0.5">
                <ShieldAlert className="w-2.5 h-2.5" /> 300+
              </span>
            )}
          </div>

          {/* Team 2 (Opponents Eldar + Tofiq) */}
          <div className={`p-2 rounded-lg border flex flex-col items-center ${
            team2Over365 ? 'bg-amber-950/40 border-amber-500' : 'bg-slate-800/60 border-slate-700'
          }`}>
            <span className="text-xs font-medium text-rose-400 flex items-center gap-1">
              {t.team2}
              {team2Over365 && <Award className="w-3 h-3 text-amber-400" />}
            </span>
            <span className="text-2xl font-black text-white tracking-tight">{team2Score}</span>
            <div className="w-full bg-slate-700/50 rounded-full h-1.5 mt-1 overflow-hidden">
              <div
                className="bg-rose-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (team2Score / 365) * 100)}%` }}
              />
            </div>
            {team2Over300 && (
              <span className="text-[10px] text-amber-400 mt-1 flex items-center gap-0.5">
                <ShieldAlert className="w-2.5 h-2.5" /> 300+
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Solo modes (2p, 3p, 4p)
  if (isCollapsed) {
    return (
      <div className="relative bg-slate-950/95 backdrop-blur-md border border-amber-500/50 rounded-xl px-2.5 py-1 shadow-xl flex items-center gap-2 text-xs select-none animate-fade-in max-w-[95vw]">
        <div className="flex items-center gap-1 font-bold text-amber-400">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px] font-black">365</span>
        </div>

        <div className="h-4 w-[1px] bg-white/20" />

        <div className="flex items-center gap-1.5 flex-wrap">
          {players.map((p, idx) => {
            const isMe = idx === myPlayerIndex;
            return (
              <span
                key={p.id}
                className={`text-[11px] font-bold flex items-center gap-1 px-1.5 py-0.5 rounded-lg border ${
                  isMe
                    ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-800/80 border-slate-700 text-amber-300'
                }`}
              >
                <span className={isMe ? 'text-emerald-300' : 'text-slate-300'}>
                  {isMe ? 'Sən' : p.name.split(' ')[0]}:
                </span>
                <span className="text-white font-black text-xs">{p.score}</span>
                {p.score >= 300 && <span className="text-[9px] text-amber-400">★</span>}
              </span>
            );
          })}
        </div>

        <button
          onClick={() => setIsCollapsed(false)}
          className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-amber-400 transition ml-0.5"
          title="Hesab lövhəsini aç"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-amber-600/30 rounded-xl p-2.5 sm:p-3 shadow-xl flex flex-col gap-1.5 sm:gap-2 w-[240px] sm:w-[280px]">
      <div className="flex items-center justify-between text-xs text-amber-400 font-semibold border-b border-white/10 pb-1">
        <div className="flex items-center gap-1">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>{t.targetScore}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 text-[11px]">{t.round}: {roundNumber}</span>
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
            title="Yığcam rejimə keç"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className={`grid gap-1.5 ${players.length === 2 ? 'grid-cols-2' : players.length === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
        {players.map((p, idx) => {
          const isMe = idx === myPlayerIndex;
          const isOver300 = p.score >= 300;
          const isOver365 = p.score >= 365;
          return (
            <div
              key={p.id}
              className={`p-1.5 rounded-lg border flex flex-col items-center ${
                isMe
                  ? isOver365 ? 'bg-emerald-950/50 border-emerald-400' : 'bg-emerald-900/20 border-emerald-700/50'
                  : isOver365 ? 'bg-amber-950/40 border-amber-500' : 'bg-slate-800/60 border-slate-700'
              }`}
            >
              <div className="flex items-center gap-1 mb-0.5">
                <AvatarView
                  avatarId={p.avatarId || (isMe ? undefined : idx === 1 ? 'avatar_tea_master' : idx === 2 ? 'avatar_sheki_guest' : 'avatar_icherisheher_sage')}
                  frameId={isMe ? equippedFrame : undefined}
                  size={20}
                  showBorder={false}
                />
                <span className={`text-[11px] font-semibold truncate max-w-[55px] ${isMe ? 'text-emerald-300' : 'text-slate-300'}`}>
                  {isMe ? t.player : p.name.split(' ')[0]}
                </span>
              </div>
              <span className="text-lg font-black text-white">{p.score}</span>
              <div className="w-full bg-slate-700/50 rounded-full h-1 mt-0.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${isMe ? 'bg-emerald-400' : 'bg-amber-400'}`}
                  style={{ width: `${Math.min(100, (p.score / 365) * 100)}%` }}
                />
              </div>
              {isOver300 && (
                <span className="text-[9px] text-amber-400 font-bold mt-0.5">300+</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
