import React, { useState } from 'react';
import { GameMode, Language } from '../types/domino';
import {
  MultiplayerRoomSummary,
  MultiplayerPlayerSlot
} from '../types/multiplayer';
import { AvatarView } from './AvatarView';
import { multiplayerSocket } from '../services/multiplayerSocket';
import { validatePlayerName, containsProfanity } from '../utils/profanityFilter';
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
  Share2
} from 'lucide-react';

interface MultiplayerLobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  currentRoom: MultiplayerRoomSummary | null;
  myPlayerIndex: number;
  isHost: boolean;
  onCreateRoom: (mode: GameMode, playerName: string) => Promise<void>;
  onJoinRoom: (roomCode: string, playerName: string) => Promise<void>;
  onQuickMatch: (mode: GameMode, playerName: string) => Promise<void>;
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
  onCreateRoom,
  onJoinRoom,
  onQuickMatch,
  onAddBot,
  onToggleReady,
  onStartGame,
  onLeaveRoom
}) => {
  const [tab, setTab] = useState<'create' | 'join' | 'quick'>('create');
  const [selectedMode, setSelectedMode] = useState<GameMode>('2p_solo');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [playerName, setPlayerName] = useState('Siz');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [loading, setLoading] = useState(false);
  const [startingGame, setStartingGame] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isNameProfane = containsProfanity(playerName);

  const mySocketId = multiplayerSocket.getSocket()?.id;
  const amIHost =
    isHost ||
    myPlayerIndex === 0 ||
    (currentRoom && currentRoom.players[0]?.socketId === mySocketId) ||
    (currentRoom && currentRoom.players[myPlayerIndex]?.isHost) ||
    (currentRoom && currentRoom.hostName === playerName);

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
      await onCreateRoom(selectedMode, nameCheck.sanitizedName);
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
      await onQuickMatch(selectedMode, nameCheck.sanitizedName);
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

  const handleCopyLink = (code: string) => {
    const url = `${window.location.origin}?room=${code}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border-2 border-amber-500/80 rounded-2xl w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden max-h-[92vh]">
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
        <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-4">
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

              {/* Room Mode Badge */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-1.5 text-xs text-slate-300 font-semibold">
                Rejim:{' '}
                <span className="text-amber-300 font-bold">
                  {currentRoom.mode === '2p_solo'
                    ? '2 Nəfərlik Tək'
                    : currentRoom.mode === '3p_solo'
                    ? '3 Nəfərlik Trio'
                    : '4 Nəfərlik (2v2 Cütlük)'}
                </span>
              </div>

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
                            <span className="text-xs font-bold text-slate-200">
                              {p ? p.name : 'Boş Yer'}
                            </span>
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
                    setPlayerName(e.target.value);
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
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setTab('create')}
                  className={`flex-1 py-2 text-xs font-black rounded-lg transition ${
                    tab === 'create'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Otaq Yarat
                </button>
                <button
                  onClick={() => setTab('join')}
                  className={`flex-1 py-2 text-xs font-black rounded-lg transition ${
                    tab === 'join'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Koda Görə Qoşul
                </button>
                <button
                  onClick={() => setTab('quick')}
                  className={`flex-1 py-2 text-xs font-black rounded-lg transition ${
                    tab === 'quick'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Sürətli Oyun
                </button>
              </div>

              {/* Tab 1: Create Room */}
              {tab === 'create' && (
                <div className="flex flex-col gap-3.5 animate-fade-in">
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

                  <button
                    onClick={handleCreate}
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm shadow-lg flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{loading ? 'Otaq yaradılır...' : 'Özəl Otaq Yarat'}</span>
                  </button>
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
                    placeholder="Məsələn: BAKU"
                    className="bg-slate-950 border-2 border-slate-700 rounded-xl px-4 py-3 text-lg font-black text-amber-300 text-center tracking-widest uppercase font-mono focus:outline-none focus:border-amber-400 transition"
                  />

                  <button
                    onClick={handleJoin}
                    disabled={loading || !roomCodeInput.trim()}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 hover:brightness-110 text-white font-black text-sm shadow-lg flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
                  >
                    <Users className="w-4 h-4" />
                    <span>{loading ? 'Qoşulur...' : 'Otağa Daxil Ol'}</span>
                  </button>
                </div>
              )}

              {/* Tab 3: Quick Match */}
              {tab === 'quick' && (
                <div className="flex flex-col gap-3.5 animate-fade-in text-left">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Sistem sizi avtomatik olaraq eyni vaxtda onlayn olan digər real oyunçularla bir masaya otuzduracaq.
                  </p>

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
            </>
          )}
        </div>
      </div>
    </div>
  );
};
