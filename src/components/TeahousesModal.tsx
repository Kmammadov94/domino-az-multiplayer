import React, { useEffect, useState } from 'react';
import { GameVariant, Language } from '../types/domino';
import { TeahouseTierCounts } from '../types/multiplayer';
import {
  DEFAULT_RANKED_MMR,
  TEAHOUSE_TIERS,
  getRankTierForMmr
} from '../data/teahouses';
import { multiplayerSocket } from '../services/multiplayerSocket';
import { getBackendServerUrl, loadGoogleUser } from '../utils/storage';
import { unlockPlayAchievement } from '../services/playGamesAchievements';
import { AvatarView } from './AvatarView';
import { X, Coins, Users, Trophy, Sparkles, Clock, RefreshCw } from 'lucide-react';

interface LeaderboardEntry {
  googleId: string;
  name: string;
  mmr: number;
  rankedPlayed: number;
  rankedWon: number;
  avatarId: string;
}

interface TeahousesModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  userCoins: number;
  userMmr?: number;
  rankedPlayed?: number;
  rankedWon?: number;
  currentUserId?: string;
  onJoinTeahouse: (tierId: string, variant: GameVariant) => Promise<void>;
}

export const TeahousesModal: React.FC<TeahousesModalProps> = ({
  isOpen,
  onClose,
  lang,
  userCoins,
  userMmr = DEFAULT_RANKED_MMR,
  rankedPlayed = 0,
  rankedWon = 0,
  currentUserId,
  onJoinTeahouse
}) => {
  const [activeTab, setActiveTab] = useState<'tables' | 'leaderboard'>('tables');
  const [selectedVariant, setSelectedVariant] = useState<GameVariant>('365');
  const [roomCounts, setRoomCounts] = useState<Record<string, TeahouseTierCounts>>({});
  const [joiningTierId, setJoiningTierId] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingLb, setLoadingLb] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const rankTier = getRankTierForMmr(userMmr);

  const fetchStats = async (variant: GameVariant) => {
    try {
      multiplayerSocket.connect();
      const res = await multiplayerSocket.getTeahouseStats(variant);
      if (res.success && res.counts) {
        setRoomCounts(res.counts);
      }
    } catch {
      // Ignore transient network errors while polling room counts
    }
  };

  const fetchLeaderboard = async () => {
    setLoadingLb(true);
    try {
      const res = await fetch(`${getBackendServerUrl()}/api/ranked/leaderboard`);
      const data = await res.json();
      if (data?.success && Array.isArray(data.leaderboard)) {
        setLeaderboard(data.leaderboard);
        const myGoogleId = currentUserId || loadGoogleUser()?.googleId;
        let myPlayerId = '';
        try {
          myPlayerId = localStorage.getItem('domino_player_unique_id') || '';
        } catch {
          // ignore storage errors
        }
        const top5Index = (data.leaderboard as LeaderboardEntry[])
          .slice(0, 5)
          .findIndex(
            (entry) =>
              Boolean(myGoogleId && entry.googleId === myGoogleId) ||
              Boolean(myPlayerId && entry.googleId === myPlayerId)
          );
        if (top5Index >= 0) {
          unlockPlayAchievement('high_roller_top5');
        }
      }
    } catch {
      // Ignore transient errors
    } finally {
      setLoadingLb(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setErrorText(null);
    void fetchStats(selectedVariant);
    const interval = setInterval(() => {
      void fetchStats(selectedVariant);
    }, 5000);
    return () => clearInterval(interval);
  }, [isOpen, selectedVariant]);

  useEffect(() => {
    if (!isOpen || activeTab !== 'leaderboard') return;
    void fetchLeaderboard();
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const handleJoinClick = async (tierId: string) => {
    if (joiningTierId) return;
    setErrorText(null);
    setJoiningTierId(tierId);
    try {
      await onJoinTeahouse(tierId, selectedVariant);
    } catch (e: unknown) {
      setErrorText(e instanceof Error ? e.message : 'Qoşulmaq mümkün olmadı');
    } finally {
      setJoiningTierId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fade-in pointer-events-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-amber-500/40 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col max-h-[90dvh] min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-2xl">☕</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-amber-300 truncate">
                  {lang === 'az' && 'Çayxanalar • Reytinq 1v1'}
                  {lang === 'ru' && 'Чайханы • Рейтинг 1на1'}
                  {lang === 'en' && 'Teahouses • Ranked 1v1'}
                </h2>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border flex items-center gap-1 ${rankTier.badgeBgClass}`}>
                  <span>{rankTier.icon}</span>
                  <span>{rankTier.name[lang]} • {userMmr}</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {lang === 'az' && `Yalnız Çayxana oyunları reytinqə təsir edir • ${rankedWon} Qələbə / ${rankedPlayed} Oyun`}
                {lang === 'ru' && `Только матчи Чайханы влияют на рейтинг • ${rankedWon} Побед / ${rankedPlayed} Игр`}
                {lang === 'en' && `Only Teahouse matches affect rating • ${rankedWon}W / ${rankedPlayed}P`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs: Tables vs Leaderboard */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800 mt-3 flex-shrink-0">
          <button
            onClick={() => setActiveTab('tables')}
            className={`py-2 px-3 rounded-xl font-black text-xs sm:text-sm transition flex items-center justify-center gap-1.5 ${
              activeTab === 'tables'
                ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{lang === 'az' ? 'Masalar' : lang === 'ru' ? 'Столы' : 'Tables'}</span>
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`py-2 px-3 rounded-xl font-black text-xs sm:text-sm transition flex items-center justify-center gap-1.5 ${
              activeTab === 'leaderboard'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>{lang === 'az' ? 'Reytinq Cədvəli' : lang === 'ru' ? 'Таблица Лидеров' : 'Leaderboard'}</span>
          </button>
        </div>

        {errorText && (
          <div className="mt-2.5 px-3 py-2 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs font-bold">
            {errorText}
          </div>
        )}

        {activeTab === 'tables' ? (
          <>
            {/* Variant Selector: 101 vs 365 + 1m turn info */}
            <div className="flex items-center justify-between gap-2 mt-3 flex-wrap flex-shrink-0">
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950/90 rounded-xl border border-slate-800">
                <button
                  onClick={() => setSelectedVariant('101')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 ${
                    selectedVariant === '101'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Domino 101</span>
                </button>
                <button
                  onClick={() => setSelectedVariant('365')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 ${
                    selectedVariant === '365'
                      ? 'bg-teal-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Telefon 365</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300 bg-slate-800/70 px-2.5 py-1.5 rounded-xl border border-slate-700/70">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {lang === 'az' ? '1v1 • 1 dəq gediş vaxtı' : lang === 'ru' ? '1на1 • 1 мин на ход' : '1v1 • 1 min turn'}
                </span>
              </div>
            </div>

            {/* Tiers list */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1 min-h-0 pb-6">
              {TEAHOUSE_TIERS.map((room) => {
                const hasEnough = userCoins >= room.buyIn;
                const counts = roomCounts[room.id] || { waiting: 0, active: 0 };
                const isJoining = joiningTierId === room.id;

                return (
                  <div
                    key={room.id}
                    className={`relative rounded-2xl p-4 border bg-gradient-to-r ${room.bgGradient} ${room.borderAccent} shadow-lg transition-all`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center text-2xl flex-shrink-0 shadow-inner">
                        {room.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-baseline gap-2 min-w-0">
                            <h3 className="font-black text-white text-base truncate">
                              {room.name[lang]}
                            </h3>
                            <span className="text-[10px] font-bold text-amber-400/80 whitespace-nowrap">
                              • {room.location[lang]}
                            </span>
                          </div>

                          {/* Live Waiting & Active Room Counts */}
                          <div className="flex items-center gap-1.5 text-[10px] font-bold">
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-200">
                              {lang === 'az' ? `Gözləyən: ${counts.waiting}` : lang === 'ru' ? `Ждут: ${counts.waiting}` : `Waiting: ${counts.waiting}`}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200">
                              {lang === 'az' ? `Aktiv: ${counts.active}` : lang === 'ru' ? `Актив: ${counts.active}` : `Active: ${counts.active}`}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                          {room.desc[lang]}
                        </p>

                        <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap text-xs font-bold">
                            <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-lg border border-white/10">
                              <Coins className="w-3.5 h-3.5 text-amber-400" />
                              <span className="text-slate-300">
                                {lang === 'az' ? 'Giriş:' : lang === 'ru' ? 'Вход:' : 'Entry:'}
                              </span>
                              <span className={hasEnough ? 'text-amber-300' : 'text-rose-400'}>
                                {room.buyIn}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 bg-emerald-500/15 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                              <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-200">
                                {lang === 'az' ? 'Uduş:' : lang === 'ru' ? 'Приз:' : 'Win:'} {room.prizePot}
                              </span>
                            </div>
                          </div>

                          <button
                            disabled={!hasEnough || Boolean(joiningTierId)}
                            onClick={() => handleJoinClick(room.id)}
                            className={`px-4 py-2 rounded-xl font-black text-xs transition shadow-md active:scale-95 ${
                              hasEnough
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                            }`}
                          >
                            {isJoining
                              ? (lang === 'az' ? 'Qoşulur...' : lang === 'ru' ? 'Вход...' : 'Joining...')
                              : hasEnough
                              ? (lang === 'az' ? 'Oyna' : lang === 'ru' ? 'Играть' : 'Play')
                              : (lang === 'az' ? 'Kifayət deyil' : lang === 'ru' ? 'Мало монет' : 'Low Coins')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* Leaderboard Tab */
          <div className="flex-1 overflow-y-auto py-3 space-y-2 pr-1 min-h-0 pb-6">
            <div className="flex items-center justify-between px-1 pb-1">
              <span className="text-xs font-bold text-slate-400">
                {lang === 'az'
                  ? 'Top Çayxana Oyunçuları'
                  : lang === 'ru'
                  ? 'Топ игроков Чайханы'
                  : 'Top Teahouse Players'}
              </span>
              <button
                onClick={() => void fetchLeaderboard()}
                className="flex items-center gap-1 text-xs font-bold text-amber-300 hover:text-amber-200 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingLb ? 'animate-spin' : ''}`} />
                <span>{lang === 'az' ? 'Yenilə' : lang === 'ru' ? 'Обновить' : 'Refresh'}</span>
              </button>
            </div>

            {leaderboard.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                {loadingLb
                  ? (lang === 'az' ? 'Yüklənir...' : lang === 'ru' ? 'Загрузка...' : 'Loading...')
                  : (lang === 'az'
                    ? 'Hələ reytinq oyunu tamamlayan oyunçu yoxdur. İlk siz olun!'
                    : lang === 'ru'
                    ? 'Пока нет рейтинговых игр. Станьте первым!'
                    : 'No ranked matches completed yet. Be the first!')}
              </div>
            ) : (
              leaderboard.map((entry, idx) => {
                const entryTier = getRankTierForMmr(entry.mmr);
                return (
                  <div
                    key={entry.googleId}
                    className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-950/80 border border-slate-800"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-6 text-center font-black text-sm ${idx < 3 ? 'text-amber-300' : 'text-slate-500'}`}>
                        #{idx + 1}
                      </span>
                      <AvatarView avatarId={entry.avatarId} size="sm" />
                      <div className="min-w-0">
                        <div className="text-sm font-black text-white truncate">{entry.name}</div>
                        <div className="text-[11px] text-slate-400">
                          {entryTier.icon} {entryTier.name[lang]} •{' '}
                        {lang === 'az'
                          ? `${entry.rankedWon} Qələbə / ${entry.rankedPlayed} Oyun`
                          : lang === 'ru'
                            ? `${entry.rankedWon} Побед / ${entry.rankedPlayed} Игр`
                            : `${entry.rankedWon}W / ${entry.rankedPlayed}P`}
                        </div>
                      </div>
                    </div>
                    <div className="px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-black text-xs flex-shrink-0">
                      {entry.mmr}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
