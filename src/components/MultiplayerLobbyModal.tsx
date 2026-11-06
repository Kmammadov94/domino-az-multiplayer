import React, { useState, useEffect } from 'react';
import { GameMode, GameVariant, Language } from '../types/domino';
import {
  MultiplayerRoomSummary,
  MultiplayerPlayerSlot,
  PublicRoomInfo
} from '../types/multiplayer';
import { AvatarView } from './AvatarView';
import { multiplayerSocket } from '../services/multiplayerSocket';
import { validatePlayerName, containsProfanity } from '../utils/profanityFilter';
import { loadRecentPlayers, isBotName, RecentPlayerItem } from '../utils/friendsStorage';
import {
  Globe,
  Users,
  Copy,
  Check,
  Play,
  UserPlus,
  LogOut,
  X,
  Sparkles,
  Share2,
  Lock,
  Unlock,
  RefreshCw,
  Search
} from 'lucide-react';

interface MultiplayerLobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  currentRoom: MultiplayerRoomSummary | null;
  myPlayerIndex: number;
  isHost: boolean;
  defaultPlayerName?: string;
  initialRoomCode?: string;
  initialError?: string | null;
  isAutoJoining?: boolean;
  onCreateRoom: (mode: GameMode, playerName: string, isLocked?: boolean, turnDuration?: number, variant?: GameVariant) => Promise<void>;
  onJoinRoom: (roomCode: string, playerName: string) => Promise<void>;
  onQuickMatch: (mode: GameMode, playerName: string, variant?: GameVariant) => Promise<void>;
  onAddBot: () => Promise<void>;
  onToggleReady: (isReady: boolean) => void;
  onStartGame: () => Promise<void>;
  onLeaveRoom: () => void;
}

export const MultiplayerLobbyModal: React.FC<MultiplayerLobbyModalProps> = ({
  isOpen,
  onClose,
  lang,
  currentRoom,
  myPlayerIndex,
  isHost,
  defaultPlayerName,
  initialRoomCode,
  initialError,
  isAutoJoining,
  onCreateRoom,
  onJoinRoom,
  onQuickMatch,
  onAddBot,
  onToggleReady,
  onStartGame,
  onLeaveRoom
}) => {
  const [tab, setTab] = useState<'create' | 'tables' | 'join' | 'quick'>(() =>
    initialRoomCode ? 'join' : 'create'
  );
  const [selectedMode, setSelectedMode] = useState<GameMode>('2p_solo');
  const [selectedVariant, setSelectedVariant] = useState<GameVariant>('365');
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [turnDuration, setTurnDuration] = useState<number>(30); // 30, 60, 120 seconds
  const [roomCodeInput, setRoomCodeInput] = useState(initialRoomCode || '');
  const [playerName, setPlayerName] = useState(() => {
    let saved = '';
    try {
      saved = localStorage.getItem('domino_player_name') || '';
    } catch {}
    return defaultPlayerName || saved || 'Siz';
  });
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [loading, setLoading] = useState(false);
  const [startingGame, setStartingGame] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(initialError || null);

  useEffect(() => {
    if (initialRoomCode) {
      setRoomCodeInput(initialRoomCode);
      setTab('join');
    }
  }, [initialRoomCode]);

  useEffect(() => {
    if (initialError) {
      setErrorMsg(initialError);
    }
  }, [initialError]);

  useEffect(() => {
    if (defaultPlayerName && (playerName === 'Siz' || !playerName)) {
      setPlayerName(defaultPlayerName);
    }
  }, [defaultPlayerName]);

  // Table browser states (Durak Online style)
  const [publicRooms, setPublicRooms] = useState<PublicRoomInfo[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [tableSearch, setTableSearch] = useState('');
  const [tableModeFilter, setTableModeFilter] = useState<'all' | GameMode>('all');
  const [togglingLock, setTogglingLock] = useState(false);

  const fetchPublicRooms = async () => {
    setLoadingRooms(true);
    try {
      const res = await multiplayerSocket.getPublicRooms();
      if (res.success && res.rooms) {
        setPublicRooms(res.rooms);
      }
    } catch (e) {
      console.error('Failed to fetch rooms:', e);
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    if (tab === 'tables' && isOpen) {
      fetchPublicRooms();
      const interval = setInterval(fetchPublicRooms, 4000);
      return () => clearInterval(interval);
    }
  }, [tab, isOpen]);

  if (!isOpen) return null;

  const isNameProfane = containsProfanity(playerName);

  const mySocketId = multiplayerSocket.getSocket()?.id;
  const amIHost =
    isHost ||
    myPlayerIndex === 0 ||
    (currentRoom && currentRoom.players[0]?.socketId === mySocketId) ||
    (currentRoom && currentRoom.players[myPlayerIndex]?.isHost) ||
    (currentRoom && currentRoom.hostName === playerName);

  const handleToggleLock = async () => {
    if (!currentRoom) return;
    setTogglingLock(true);
    try {
      await multiplayerSocket.toggleRoomLock(currentRoom.code);
    } catch (e: any) {
      setErrorMsg(e.message || 'Masa kilidi dəyişdirilə bilmədi');
    } finally {
      setTogglingLock(false);
    }
  };

  const handleStartGameClick = async () => {
    setStartingGame(true);
    setErrorMsg(null);
    try {
      await onStartGame();
    } catch (err: any) {
      setErrorMsg(err.message || 'Oyunu başlatmaq mümkün olmadı');
      setStartingGame(false);
    }
  };

  const handleCreate = async () => {
    const nameCheck = validatePlayerName(playerName);
    if (!nameCheck.isValid) {
      setErrorMsg(nameCheck.error || 'Nalayiq ad daxil etmək qadağandır!');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      await onCreateRoom(selectedMode, nameCheck.sanitizedName, isLocked, turnDuration, selectedVariant);
    } catch (e: any) {
      setErrorMsg(e.message || 'Xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    const nameCheck = validatePlayerName(playerName);
    if (!nameCheck.isValid) {
      setErrorMsg(nameCheck.error || 'Nalayiq ad daxil etmək qadağandır!');
      return;
    }
    if (!roomCodeInput.trim()) {
      setErrorMsg('Otaq kodunu daxil edin');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      await onJoinRoom(roomCodeInput.trim().toUpperCase(), nameCheck.sanitizedName);
    } catch (e: any) {
      setErrorMsg(e.message || 'Otaq tapılmadı');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickMatch = async () => {
    const nameCheck = validatePlayerName(playerName);
    if (!nameCheck.isValid) {
      setErrorMsg(nameCheck.error || 'Nalayiq ad daxil etmək qadağandır!');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      await onQuickMatch(selectedMode, nameCheck.sanitizedName, selectedVariant);
    } catch (e: any) {
      setErrorMsg(e.message || 'Xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = async (code: string) => {
    const url = `${window.location.origin}${window.location.pathname}?room=${code}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Domino AZ — Otaq Dəvəti',
          text: `Gəl bir yerdə Domino oynayaq! Otaq kodu: ${code}`,
          url
        });
        return;
      } catch (err) {}
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in pointer-events-auto">
      <div className="bg-slate-900 border-2 border-amber-500/80 rounded-2xl w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden max-h-[90dvh] min-h-0">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-amber-600/30 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-amber-400 animate-pulse" />
            <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
              Onlayn Çayxana — Multiplayer
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-4 min-h-0">
          {isAutoJoining && (
            <div className="bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs p-3 rounded-xl font-bold text-center flex items-center justify-center gap-2 animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
              <span>Dəvət linki aşkarlandı... #{roomCodeInput || initialRoomCode} otağına birbaşa daxil olunur...</span>
            </div>
          )}

          {errorMsg && (
            <div className="bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs p-3 rounded-xl font-semibold text-center animate-bounce">
              {errorMsg}
            </div>
          )}

          {/* VIEW A: In Waiting Room */}
          {currentRoom && currentRoom.status === 'waiting' ? (
            <div className="flex flex-col items-center gap-4 animate-fade-in">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                Otaq Kodu
              </span>

              {/* Big Room Code Box */}
              <div className="bg-slate-950 border-2 border-amber-400 rounded-2xl px-8 py-3 shadow-[0_0_25px_rgba(251,191,36,0.35)] flex items-center gap-3">
                <span className="text-3xl sm:text-4xl font-black text-amber-300 tracking-widest font-mono">
                  {currentRoom.code}
                </span>
                <button
                  onClick={() => handleCopyCode(currentRoom.code)}
                  title="Kodu kopyala"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 transition active:scale-95"
                >
                  {copiedCode ? (
                    <Check className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Share link button */}
              <button
                onClick={() => handleCopyLink(currentRoom.code)}
                className="text-xs font-bold text-amber-300/90 hover:text-amber-200 flex items-center gap-1.5 underline decoration-amber-500/50 underline-offset-4"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>
                  {copiedLink ? 'Link Kopyalandı!' : 'Dəvət Linkini Kopyala (WhatsApp / Telegram)'}
                </span>
              </button>

              {/* Room Mode & Lock Badges */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-1.5 text-xs text-slate-300 font-semibold">
                  Qayda:{' '}
                  <span className={`font-bold ${currentRoom.variant === '101' ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {currentRoom.variant === '101' ? 'Klassik 101' : 'Telefon 365'}
                  </span>
                </div>

                <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-1.5 text-xs text-slate-300 font-semibold">
                  Rejim:{' '}
                  <span className="text-amber-300 font-bold">
                    {currentRoom.mode === '2p_solo'
                      ? '2 Nəfərlik Tək'
                      : currentRoom.mode === '3p_solo'
                      ? '3 Nəfərlik Trio'
                      : '4 Nəfərlik (2v2 Cütlük)'}
                  </span>
                </div>

                <div
                  className={`border rounded-xl px-3.5 py-1.5 text-xs font-bold flex items-center gap-1.5 ${
                    currentRoom.isLocked
                      ? 'bg-rose-950/50 border-rose-500/50 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                      : 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                  }`}
                >
                  {currentRoom.isLocked ? (
                    <Lock className="w-3.5 h-3.5" />
                  ) : (
                    <Unlock className="w-3.5 h-3.5" />
                  )}
                  <span>{currentRoom.isLocked ? 'Şəxsi Masa (Kilidli)' : 'Açıq Masa (Hər kəsə)'}</span>
                </div>

                <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-1.5 text-xs text-slate-300 font-semibold flex items-center gap-1">
                  <span>⏱</span>
                  <span>Vaxt:</span>
                  <span className="text-amber-300 font-bold font-mono">
                    {currentRoom.turnDuration === 60
                      ? '1 dəq'
                      : currentRoom.turnDuration === 120
                      ? '2 dəq'
                      : '30 san'}
                  </span>
                </div>
              </div>

              {/* Host Toggle Lock Button */}
              {amIHost && (
                <button
                  onClick={handleToggleLock}
                  disabled={togglingLock}
                  className="text-[11px] font-bold text-amber-300/90 hover:text-amber-200 flex items-center gap-1.5 bg-slate-950/70 border border-amber-500/30 px-3 py-1 rounded-lg transition active:scale-95"
                >
                  {currentRoom.isLocked ? (
                    <>
                      <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Masanı Açıq Et (Sürətli oyun və Axtarış aktivləşsin)</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5 text-rose-400" />
                      <span>Masanı Kilidlə (Yalnız kodla/linklə daxil olsunlar)</span>
                    </>
                  )}
                </button>
              )}

              {/* Connected Players Slots */}
              <div className="w-full flex flex-col gap-2 mt-2">
                <span className="text-xs font-bold text-slate-400 px-1">
                  Oyunçular ({currentRoom.players.length}/{currentRoom.maxPlayers}):
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Array.from({ length: currentRoom.maxPlayers }).map((_, idx) => {
                    const p = currentRoom.players[idx] as MultiplayerPlayerSlot | undefined;
                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border flex items-center justify-between ${
                          p
                            ? 'bg-slate-800/90 border-amber-500/40'
                            : 'bg-slate-950/40 border-dashed border-slate-800 text-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {p ? (
                            <AvatarView
                              avatarId={p.avatarId || (p.isAI ? 'avatar_tea_master' : undefined)}
                              size="sm"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-slate-800 text-slate-500 border border-slate-700">
                              ?
                            </div>
                          )}
                          <div className="flex flex-col text-left">
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-bold text-slate-200">
                                {p ? p.name : 'Boş Yer'}
                              </span>
                              {p && p.playerTag && (
                                <span className="text-[9px] font-extrabold bg-cyan-950 text-cyan-300 border border-cyan-500/40 px-1 rounded">
                                  #{p.playerTag}
                                </span>
                              )}
                            </div>
                            {p && (
                              <span className="text-[10px] text-amber-400 font-semibold">
                                {p.isHost ? '👑 Otaq Sahibi' : p.isAI ? '🤖 Bot' : 'Oyunçu'}
                                {p.team && ` • Komanda ${p.team}`}
                              </span>
                            )}
                          </div>
                        </div>

                        {p && (
                          <div
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              p.isConnected === false
                                ? 'text-amber-400 bg-amber-950/60 border border-amber-500/40 animate-pulse'
                                : 'text-emerald-400 bg-emerald-950/60 border border-emerald-500/40'
                            }`}
                          >
                            {p.isConnected === false ? 'Yenidən qoşulur...' : 'Hazırdır'}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons in Room */}
              <div className="w-full space-y-2 mt-2">
                {amIHost ? (
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    {currentRoom.players.length < currentRoom.maxPlayers && (
                      <button
                        onClick={onAddBot}
                        className="w-full sm:flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
                      >
                        <UserPlus className="w-4 h-4 text-amber-400" />
                        <span>Bot Əlavə Et</span>
                      </button>
                    )}

                    <button
                      onClick={handleStartGameClick}
                      disabled={currentRoom.players.length < 2 || startingGame}
                      className={`w-full sm:flex-1 py-3 rounded-xl font-black text-sm shadow-lg flex items-center justify-center gap-2 transition active:scale-95 ${
                        currentRoom.players.length >= 2
                          ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white hover:brightness-110 cursor-pointer shadow-emerald-950/60 ring-2 ring-emerald-400/60'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/60'
                      }`}
                    >
                      {startingGame ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Başladılır...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-current" />
                          <span>
                            {currentRoom.players.length >= 2
                              ? `Oyuna Başla (${currentRoom.players.length}/${currentRoom.maxPlayers})`
                              : `Oyunçu Gözlənilir (${currentRoom.players.length}/${currentRoom.maxPlayers})`}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs font-semibold text-center flex items-center justify-center gap-2 animate-pulse">
                    <span>
                      👑 Otaq sahibinin oyunu başlatması gözlənilir... ({currentRoom.players.length}/
                      {currentRoom.maxPlayers})
                    </span>
                  </div>
                )}

                <button
                  onClick={onLeaveRoom}
                  className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-rose-900/40 text-rose-300 font-bold text-xs flex items-center justify-center gap-2 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Otaqdan Çıx</span>
                </button>
              </div>
            </div>
          ) : (
            /* VIEW B: Lobby Tabs (Create / Join / Quick) */
            <>
              {/* Name Input */}
              <div className="flex flex-col gap-1 text-left">
                <label className="text-xs font-bold text-amber-300/90">
                  Oyunçu Adınız:
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPlayerName(val);
                    try {
                      localStorage.setItem('domino_player_name', val);
                    } catch {}
                    if (errorMsg) setErrorMsg(null);
                  }}
                  maxLength={16}
                  placeholder="Adınızı yazın..."
                  className={`bg-slate-950 border rounded-xl px-3.5 py-2.5 text-sm text-white font-bold focus:outline-none transition ${
                    isNameProfane
                      ? 'border-rose-500 focus:border-rose-400 bg-rose-950/20'
                      : 'border-slate-700 focus:border-amber-400'
                  }`}
                />
                {isNameProfane && (
                  <span className="text-[11px] text-rose-400 font-bold flex items-center gap-1 mt-0.5">
                    ⚠️ Bu adda qadağan olunmuş / nalayiq ifadə aşkarlandı!
                  </span>
                )}
              </div>

              {/* Mode Tabs */}
              <div className="grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setTab('create')}
                  className={`py-2 text-[11px] font-black rounded-lg transition ${
                    tab === 'create'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Otaq Yarat
                </button>
                <button
                  onClick={() => setTab('tables')}
                  className={`py-2 text-[11px] font-black rounded-lg transition ${
                    tab === 'tables'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Masalar
                </button>
                <button
                  onClick={() => setTab('join')}
                  className={`py-2 text-[11px] font-black rounded-lg transition ${
                    tab === 'join'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Kodla Qoşul
                </button>
                <button
                  onClick={() => setTab('quick')}
                  className={`py-2 text-[11px] font-black rounded-lg transition ${
                    tab === 'quick'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Sürətli
                </button>
              </div>

              {/* Tab 1: Create Room */}
              {tab === 'create' && (
                <div className="flex flex-col gap-3.5 animate-fade-in">
                  {/* Variant Selector: Telefon 365 vs Domino 101 */}
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-xs font-bold text-slate-300">
                      Domino Rejimi:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedVariant('365')}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-left transition ${
                          selectedVariant === '365'
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                            : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-black">Telefon 365</span>
                          <span className="text-[10px] text-slate-400">Bakı qaydaları</span>
                        </div>
                        <span className="text-[10px] bg-slate-950 px-2 py-0.5 rounded-full text-emerald-300 font-bold">
                          365 XAL
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedVariant('101')}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-left transition ${
                          selectedVariant === '101'
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                            : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-black">Domino 101</span>
                          <span className="text-[10px] text-slate-400">Klassik Çayxana</span>
                        </div>
                        <span className="text-[10px] bg-slate-950 px-2 py-0.5 rounded-full text-amber-300 font-bold">
                          101 XAL
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-xs font-bold text-slate-300">
                      Oyun Rejimi:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setSelectedMode('2p_solo')}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1 text-center transition ${
                          selectedMode === '2p_solo'
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                            : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <Users className="w-5 h-5" />
                        <span className="text-xs">2 Nəfərlik</span>
                      </button>

                      <button
                        onClick={() => setSelectedMode('3p_solo')}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1 text-center transition ${
                          selectedMode === '3p_solo'
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                            : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <Users className="w-5 h-5" />
                        <span className="text-xs">3 Nəfərlik</span>
                      </button>

                      <button
                        onClick={() => setSelectedMode('4p_duo')}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1 text-center transition ${
                          selectedMode === '4p_duo'
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                            : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <Users className="w-5 h-5" />
                        <span className="text-xs">4 Nəfərlik (2v2)</span>
                      </button>
                    </div>
                  </div>

                  {/* Privacy Toggle: Public vs Private */}
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-xs font-bold text-slate-300">
                      Masa Girişi (Məxfilik):
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setIsLocked(false)}
                        className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition ${
                          !isLocked
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                            : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <Unlock className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-200">Açıq Masa</span>
                          <span className="text-[10px] text-slate-400">Hər kəs və sürətli oyun qoşula bilər</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsLocked(true)}
                        className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition ${
                          isLocked
                            ? 'bg-rose-500/20 border-rose-400 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                            : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <Lock className="w-4 h-4 flex-shrink-0 text-rose-400" />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-200">Şəxsi Masa</span>
                          <span className="text-[10px] text-slate-400">Yalnız kodla / dəvətlə</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Turn Duration Selector (Choice of 30 seconds, 1 minute, 2 minutes) */}
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span>Gediş Vaxtı (Düşünmə vaxtı):</span>
                      <span className="text-amber-400 font-mono text-[11px] font-bold">
                        {turnDuration === 30 ? '30 saniyə' : turnDuration === 60 ? '1 dəqiqə' : '2 dəqiqə'}
                      </span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setTurnDuration(30)}
                        className={`py-2 px-1 rounded-xl border flex flex-col items-center gap-0.5 text-center transition ${
                          turnDuration === 30
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold shadow-[0_0_10px_rgba(251,191,36,0.25)]'
                            : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <span className="text-xs font-bold">⚡ 30 Saniyə</span>
                        <span className="text-[9px] text-slate-400">Standart</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTurnDuration(60)}
                        className={`py-2 px-1 rounded-xl border flex flex-col items-center gap-0.5 text-center transition ${
                          turnDuration === 60
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold shadow-[0_0_10px_rgba(251,191,36,0.25)]'
                            : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <span className="text-xs font-bold">⏱ 1 Dəqiqə</span>
                        <span className="text-[9px] text-slate-400">Orta</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTurnDuration(120)}
                        className={`py-2 px-1 rounded-xl border flex flex-col items-center gap-0.5 text-center transition ${
                          turnDuration === 120
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold shadow-[0_0_10px_rgba(251,191,36,0.25)]'
                            : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <span className="text-xs font-bold">⏳ 2 Dəqiqə</span>
                        <span className="text-[9px] text-slate-400">Rahat</span>
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleCreate}
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm shadow-lg flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{loading ? 'Otaq yaradılır...' : isLocked ? '🔒 Şəxsi Otaq Yarat' : '🔓 Açıq Otaq Yarat'}</span>
                  </button>
                </div>
              )}

              {/* Tab 2: Tables Browser (Durak Online style) */}
              {tab === 'tables' && (
                <div className="flex flex-col gap-3 animate-fade-in text-left">
                  {/* Search & Refresh bar */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={tableSearch}
                        onChange={(e) => setTableSearch(e.target.value)}
                        placeholder="Masa və ya sahib axtar..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <button
                      onClick={fetchPublicRooms}
                      disabled={loadingRooms}
                      title="Yenilə"
                      className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-amber-400 hover:bg-slate-700 active:scale-95 transition"
                    >
                      <RefreshCw className={`w-4 h-4 ${loadingRooms ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  {/* Mode filter pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                    {[
                      { id: 'all', label: 'Hamısı' },
                      { id: '2p_solo', label: '2 Nəfərlik' },
                      { id: '3p_solo', label: '3 Nəfərlik' },
                      { id: '4p_duo', label: '4 Nəfərlik' }
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setTableModeFilter(item.id as any)}
                        className={`px-3 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition ${
                          tableModeFilter === item.id
                            ? 'bg-amber-500 text-slate-950 shadow'
                            : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {/* Tables List */}
                  <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto pr-1">
                    {(() => {
                      const filtered = publicRooms.filter((r) => {
                        if (tableModeFilter !== 'all' && r.mode !== tableModeFilter) return false;
                        if (tableSearch.trim()) {
                          const query = tableSearch.trim().toLowerCase();
                          const matchHost = r.hostName.toLowerCase().includes(query);
                          const matchCode = r.code.toLowerCase().includes(query);
                          if (!matchHost && !matchCode) return false;
                        }
                        return true;
                      });

                      if (loadingRooms && publicRooms.length === 0) {
                        return (
                          <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                            <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
                            <span>Aktiv masalar yüklənir...</span>
                          </div>
                        );
                      }

                      if (filtered.length === 0) {
                        return (
                          <div className="py-8 px-4 text-center rounded-xl bg-slate-950/60 border border-dashed border-slate-800 flex flex-col items-center gap-2.5">
                            <span className="text-2xl">🎲</span>
                            <p className="text-xs text-slate-400 font-semibold">
                              {tableSearch.trim() || tableModeFilter !== 'all'
                                ? 'Axtarışa uyğun gözləyən masa tapılmadı'
                                : 'Hal-hazırda gözləyən aktiv masa yoxdur'}
                            </p>
                            <button
                              onClick={() => setTab('create')}
                              className="text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3.5 py-1.5 rounded-xl transition active:scale-95"
                            >
                              + İlk Masanı Siz Açın
                            </button>
                          </div>
                        );
                      }

                      return filtered.map((r) => {
                        const modeLabel =
                          r.mode === '2p_solo' ? '2 Nəfərlik' : r.mode === '3p_solo' ? '3 Nəfərlik' : '4 Nəfərlik';
                        return (
                          <div
                            key={r.code}
                            className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/40 transition flex items-center justify-between gap-2.5"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <AvatarView
                                avatarId={r.hostAvatar || 'avatar_tea_master'}
                                size={32}
                                showBorder={false}
                              />
                              <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-black text-white truncate max-w-[110px]">
                                    {r.hostName}
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-1 rounded">
                                    #{r.code}
                                  </span>
                                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${r.variant === '101' ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'}`}>
                                    {r.variant === '101' ? '101 XAL' : '365 XAL'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                  <span className="text-amber-400 font-semibold">{modeLabel}</span>
                                  <span>•</span>
                                  <span className="text-emerald-400 font-bold">
                                    {r.playerCount}/{r.maxPlayers}
                                  </span>
                                  <span>•</span>
                                  <span className="text-amber-300 font-mono text-[9px] bg-slate-900/80 px-1 py-0.5 rounded border border-slate-700/60">
                                    ⏱ {r.turnDuration === 60 ? '1 dəq' : r.turnDuration === 120 ? '2 dəq' : '30s'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              {r.isLocked ? (
                                <button
                                  onClick={() => {
                                    setRoomCodeInput(r.code);
                                    setTab('join');
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center gap-1 active:scale-95 transition"
                                >
                                  <Lock className="w-3 h-3 text-rose-400" />
                                  <span>Kodla Qoşul</span>
                                </button>
                              ) : (
                                <button
                                  onClick={async () => {
                                    const nameCheck = validatePlayerName(playerName);
                                    if (!nameCheck.isValid) {
                                      setErrorMsg(nameCheck.error || 'Nalayiq ad daxil etmək qadağandır!');
                                      return;
                                    }
                                    setLoading(true);
                                    setErrorMsg(null);
                                    try {
                                      await onJoinRoom(r.code, nameCheck.sanitizedName);
                                    } catch (e: any) {
                                      setErrorMsg(e.message || 'Otağa qoşulmaq mümkün olmadı');
                                    } finally {
                                      setLoading(false);
                                    }
                                  }}
                                  disabled={loading}
                                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-white font-black text-xs shadow-md shadow-emerald-950/50 flex items-center gap-1 active:scale-95 transition cursor-pointer"
                                >
                                  <Unlock className="w-3 h-3" />
                                  <span>Qoşul</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}

              {/* Tab 2: Join by Code */}
              {tab === 'join' && (
                <div className="flex flex-col gap-3.5 animate-fade-in text-left">
                  <label className="text-xs font-bold text-slate-300">
                    Dostunuzun verdiyi Otaq Kodu:
                  </label>
                  <input
                    type="text"
                    value={roomCodeInput}
                    onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                    maxLength={8}
                    placeholder="Məsələn: 7K4X"
                    className="bg-slate-950 border-2 border-slate-700 rounded-xl px-4 py-3 text-lg font-black text-amber-300 text-center tracking-widest uppercase font-mono focus:outline-none focus:border-amber-400 transition"
                  />

                  <button
                    onClick={handleJoin}
                    disabled={loading || !roomCodeInput.trim()}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 hover:brightness-110 text-white font-black text-sm shadow-lg flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
                  >
                    <Users className="w-4 h-4" />
                    <span>{loading ? 'Qoşulur...' : 'Kodla Qoşul'}</span>
                  </button>
                </div>
              )}

              {/* Tab 3: Quick Match */}
              {tab === 'quick' && (
                <div className="flex flex-col gap-3.5 animate-fade-in text-left">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Sistem sizi avtomatik olaraq eyni vaxtda onlayn olan digər real oyunçularla bir masaya otuzduracaq.
                  </p>

                  {/* Variant Choice for Quick Match */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedVariant('365')}
                      className={`p-2 rounded-xl border flex items-center justify-between text-left transition ${
                        selectedVariant === '365'
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                          : 'bg-slate-800/60 border-slate-700 text-slate-400'
                      }`}
                    >
                      <span className="text-xs font-black">Telefon 365</span>
                      <span className="text-[10px] bg-slate-950 px-1.5 py-0.5 rounded text-emerald-300 font-bold">365 XAL</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedVariant('101')}
                      className={`p-2 rounded-xl border flex items-center justify-between text-left transition ${
                        selectedVariant === '101'
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                          : 'bg-slate-800/60 border-slate-700 text-slate-400'
                      }`}
                    >
                      <span className="text-xs font-black">Domino 101</span>
                      <span className="text-[10px] bg-slate-950 px-1.5 py-0.5 rounded text-amber-300 font-bold">101 XAL</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSelectedMode('2p_solo')}
                      className={`p-2.5 rounded-xl border text-xs font-bold ${
                        selectedMode === '2p_solo'
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      2 Nəfərlik Tək-tək
                    </button>
                    <button
                      onClick={() => setSelectedMode('4p_duo')}
                      className={`p-2.5 rounded-xl border text-xs font-bold ${
                        selectedMode === '4p_duo'
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      4 Nəfərlik Cütlük
                    </button>
                  </div>

                  <button
                    onClick={handleQuickMatch}
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:brightness-110 text-white font-black text-sm shadow-lg flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
                  >
                    <Globe className="w-4 h-4" />
                    <span>{loading ? 'Masa axtarılır...' : 'Sürətli Oyuna Başla'}</span>
                  </button>
                </div>
              )}

              {/* Recent Opponents & Friends Section (Real players only) */}
              {(() => {
                const recentList = loadRecentPlayers().filter((p) => p && !isBotName(p.name));
                if (recentList.length === 0) return null;

                return (
                  <div className="mt-2 pt-3 border-t border-slate-800 text-left">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-amber-300/90 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-amber-400" />
                        <span>Son Rəqiblər & Dostlar</span>
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {recentList.length} nəfər
                      </span>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {recentList.map((rp, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-2.5 py-1.5 rounded-xl flex-shrink-0"
                        >
                          <AvatarView
                            avatarId={rp.avatarId || 'avatar_tea_master'}
                            size={24}
                            showBorder={false}
                          />
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-bold text-slate-200 truncate max-w-[80px]">
                                {rp.name}
                              </span>
                              {rp.playerTag && (
                                <span className="text-[8px] font-extrabold bg-cyan-950 text-cyan-300 border border-cyan-500/40 px-1 rounded">
                                  #{rp.playerTag}
                                </span>
                              )}
                            </div>
                            <span className="text-[9px] text-slate-500">{rp.date}</span>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedMode('2p_solo');
                              handleCreate();
                            }}
                            title="Otaq yaradıb dəvət et"
                            className="ml-1 text-[10px] font-black bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-lg active:scale-95 transition"
                          >
                            Dəvət
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
