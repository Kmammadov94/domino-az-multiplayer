import React from 'react';
import { Player, GameMode, Language } from '../types/domino';
import { translations } from '../i18n/translations';
import { AvatarView } from './AvatarView';
import { Trophy, ShieldAlert, Award } from 'lucide-react';

interface ScoreBoardProps {
  players: Player[];
  mode: GameMode;
  lang: Language;
  roundNumber: number;
  lastScoredPoints?: { playerName: string; points: number } | null;
  equippedFrame?: string;
  equippedTitle?: string;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  players,
  mode,
  lang,
  roundNumber,
  lastScoredPoints,
  equippedFrame,
  equippedTitle
}) => {
  const t = translations[lang];

  // In 4p_duo, group by team
  if (mode === '4p_duo') {
    const team1Score = players.find(p => p.team === 1)?.score || 0;
    const team2Score = players.find(p => p.team === 2)?.score || 0;

    const team1Over300 = team1Score >= 300;
    const team2Over300 = team2Score >= 300;
    const team1Over365 = team1Score >= 365;
    const team2Over365 = team2Score >= 365;

    return (
      <div className="bg-slate-900/90 backdrop-blur-md border border-amber-600/30 rounded-xl p-3 shadow-xl flex flex-col gap-2 min-w-[280px] max-w-sm">
        <div className="flex items-center justify-between text-xs text-amber-400 font-semibold border-b border-white/10 pb-1">
          <div className="flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.targetScore}</span>
          </div>
          <span className="text-slate-400">{t.round}: {roundNumber}</span>
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

        {/* Last scored points popup banner */}
        {lastScoredPoints && (
          <div className="bg-amber-500/20 border border-amber-500/40 rounded px-2 py-1 text-center text-xs font-bold text-amber-300 animate-bounce">
            ⚡ {lastScoredPoints.playerName}: +{lastScoredPoints.points} Xal
          </div>
        )}
      </div>
    );
  }

  // Solo modes (2p, 3p, 4p)
  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-amber-600/30 rounded-xl p-3 shadow-xl flex flex-col gap-2 min-w-[280px] max-w-sm">
      <div className="flex items-center justify-between text-xs text-amber-400 font-semibold border-b border-white/10 pb-1">
        <div className="flex items-center gap-1">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>{t.targetScore}</span>
        </div>
        <span className="text-slate-400">{t.round}: {roundNumber}</span>
      </div>

      <div className={`grid gap-1.5 ${players.length === 2 ? 'grid-cols-2' : players.length === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
        {players.map((p, idx) => {
          const isOver300 = p.score >= 300;
          const isOver365 = p.score >= 365;
          return (
            <div
              key={p.id}
              className={`p-1.5 rounded-lg border flex flex-col items-center ${
                idx === 0
                  ? isOver365 ? 'bg-emerald-950/50 border-emerald-400' : 'bg-emerald-900/20 border-emerald-700/50'
                  : isOver365 ? 'bg-amber-950/40 border-amber-500' : 'bg-slate-800/60 border-slate-700'
              }`}
            >
              <div className="flex items-center gap-1 mb-0.5">
                <AvatarView
                  avatarId={p.avatarId || (idx === 0 ? undefined : idx === 1 ? 'avatar_tea_master' : idx === 2 ? 'avatar_sheki_guest' : 'avatar_icherisheher_sage')}
                  frameId={idx === 0 ? equippedFrame : undefined}
                  size={20}
                  showBorder={false}
                />
                <span className={`text-[11px] font-semibold truncate max-w-[55px] ${idx === 0 ? 'text-emerald-300' : 'text-slate-300'}`}>
                  {idx === 0 ? t.player : p.name.split(' ')[0]}
                </span>
              </div>
              <span className="text-lg font-black text-white">{p.score}</span>
              <div className="w-full bg-slate-700/50 rounded-full h-1 mt-0.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${idx === 0 ? 'bg-emerald-400' : 'bg-amber-400'}`}
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

      {lastScoredPoints && (
        <div className="bg-amber-500/20 border border-amber-500/40 rounded px-2 py-0.5 text-center text-xs font-bold text-amber-300 animate-bounce">
          ⚡ {lastScoredPoints.playerName}: +{lastScoredPoints.points} Xal
        </div>
      )}
    </div>
  );
};
