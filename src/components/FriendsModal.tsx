import React, { useState, useEffect } from 'react';
import {
  FriendItem,
  RecentPlayerItem,
  loadFriends,
  addFriend,
  removeFriend,
  updateFriendNote,
  searchFriends,
  loadRecentPlayers,
  isBotName
} from '../utils/friendsStorage';
import { Language, PlayerStats } from '../types/domino';
import { GoogleUserProfile } from '../utils/storage';
import {
  getMyPlayerIdentity,
  parseFriendSearchQuery,
  PlayerIdentity
} from '../utils/playerIdentity';
import { multiplayerSocket } from '../services/multiplayerSocket';
import { AvatarView } from './AvatarView';
import { triggerHaptic } from '../utils/haptics';
import {
  Users,
  UserPlus,
  Clock,
  X,
  Share2,
  Trash2,
  Check,
  Play,
  Copy,
  Search,
  Tag,
  Edit2,
  Sparkles,
  ShieldCheck,
  Loader2,
  HelpCircle
} from 'lucide-react';

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onInviteFriend: (friendName: string) => void;
  googleUser?: GoogleUserProfile | null;
  stats?: PlayerStats | null;
}

export const FriendsModal: React.FC<FriendsModalProps> = ({
  isOpen,
  onClose,
  lang,
  onInviteFriend,
  googleUser,
  stats
}) => {
  const [tab, setTab] = useState<'list' | 'add' | 'recent'>('list');
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [recentPlayers, setRecentPlayers] = useState<RecentPlayerItem[]>([]);
  const [filterQuery, setFilterQuery] = useState('');
  
  // Add Friend state
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{
    name: string;
    playerId: string;
    playerTag: string;
    handle: string;
    avatarId: string;
    frameId?: string;
    title?: string;
    matchesWon?: number;
    isOnline: boolean;
  } | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Edit Note state
  const [editingFriendId, setEditingFriendId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState('');

  const [copiedCode, setCopiedCode] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const myIdentity = getMyPlayerIdentity(googleUser, stats);

  useEffect(() => {
    if (isOpen) {
      setFriends(loadFriends());
      setRecentPlayers(loadRecentPlayers());
      setFilterQuery('');
      setSearchQuery('');
      setSearchResult(null);
      setSearchError(null);
      setEditingFriendId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  };

  const handleCopyMyCode = () => {
    triggerHaptic('light');
    const shareText = `Məni Domino PRO-da dostluğa əlavə et: ${myIdentity.handle} (Kod: ${myIdentity.friendCode})`;
    navigator.clipboard.writeText(myIdentity.friendCode);
    setCopiedCode(true);
    showToast(`Dost kodunuz (${myIdentity.friendCode}) kopyalandı! 📋`);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleShareInviteLink = async () => {
    triggerHaptic('light');
    const url = `${window.location.origin}?friend_id=${myIdentity.id}&tag=${myIdentity.tag}&name=${encodeURIComponent(myIdentity.name)}`;
    const shareData = {
      title: 'Domino PRO Azərbaycan',
      text: `${myIdentity.name} (${myIdentity.handle}) sizi Domino PRO oyununda dostluğa dəvət edir!`,
      url
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {}
    }

    navigator.clipboard.writeText(url);
    showToast('Dostluq linki kopyalandı! WhatsApp və ya Telegram ilə göndərin.');
  };

  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    if (isBotName(query)) {
      triggerHaptic('medium');
      setSearchError('Bu ad kompüter botuna aiddir. Yalnız real oyunçuları axtara bilərsiniz.');
      return;
    }

    // Don't search yourself
    if (
      query === myIdentity.tag ||
      query === `#${myIdentity.tag}` ||
      query === myIdentity.friendCode ||
      query.toLowerCase() === myIdentity.handle.toLowerCase()
    ) {
      setSearchError('Bu sizin öz oyunçu kodunuzdur.');
      return;
    }

    setSearching(true);
    setSearchError(null);
    setSearchResult(null);

    try {
      const res = await multiplayerSocket.lookupPlayer(query);
      setSearching(false);

      if (res.success && res.player) {
        triggerHaptic('success');
        setSearchResult(res.player);
      } else {
        // If server couldn't find in active rooms / db, parse the query locally so user can still add by handle
        const parsed = parseFriendSearchQuery(query);
        if (parsed.tag && (parsed.name || parsed.friendCode)) {
          const fallbackName = parsed.name || 'Dominocu';
          setSearchResult({
            name: fallbackName,
            playerId: parsed.friendCode || `DOM-${parsed.tag}`,
            playerTag: parsed.tag,
            handle: `${fallbackName}#${parsed.tag}`,
            avatarId: 'avatar_tea_master',
            title: 'Çayxana Qonağı',
            isOnline: true
          });
        } else {
          setSearchError(res.error || 'Bu taq və ya ada uyğun oyunçu tapılmadı.');
        }
      }
    } catch {
      setSearching(false);
      // Fallback local handle parsing
      const parsed = parseFriendSearchQuery(query);
      if (parsed.tag && (parsed.name || parsed.friendCode)) {
        const fallbackName = parsed.name || 'Dominocu';
        setSearchResult({
          name: fallbackName,
          playerId: parsed.friendCode || `DOM-${parsed.tag}`,
          playerTag: parsed.tag,
          handle: `${fallbackName}#${parsed.tag}`,
          avatarId: 'avatar_tea_master',
          title: 'Çayxana Qonağı',
          isOnline: true
        });
      } else {
        setSearchError('Oyunçu tapılmadı. Zəhmət olmasa taqı (#4 rəqəm) dəqiq yoxlayın.');
      }
    }
  };

  const handleAddSearchResult = () => {
    if (!searchResult) return;

    const ok = addFriend({
      name: searchResult.name,
      playerId: searchResult.playerId,
      playerTag: searchResult.playerTag,
      avatarId: searchResult.avatarId,
      frameId: searchResult.frameId,
      title: searchResult.title,
      matchesWon: searchResult.matchesWon
    });

    if (ok) {
      triggerHaptic('success');
      setFriends(loadFriends());
      showToast(`${searchResult.name} (#${searchResult.playerTag}) dostluğa əlavə edildi! 🎉`);
      setSearchResult(null);
      setSearchQuery('');
      setTab('list');
    } else {
      triggerHaptic('medium');
      showToast('Bu oyunçu artıq dost siyahınızdadır.');
    }
  };

  const handleAddFromRecent = (rp: RecentPlayerItem) => {
    const ok = addFriend({
      name: rp.name,
      playerId: rp.playerId,
      playerTag: rp.playerTag,
      avatarId: rp.avatarId,
      frameId: rp.frameId,
      title: rp.title || 'Dominocu Yoldaş'
    });

    if (ok) {
      triggerHaptic('success');
      setFriends(loadFriends());
      showToast(`${rp.name} dostlara əlavə edildi! 🤝`);
    } else {
      showToast(`${rp.name} artıq dostunuzdur.`);
    }
  };

  const handleRemove = (id: string, name: string, tag: string) => {
    triggerHaptic('light');
    removeFriend(id);
    setFriends(loadFriends());
    showToast(`${name} (#${tag}) dostluqdan silindi.`);
  };

  const handleSaveNote = (friendId: string) => {
    triggerHaptic('light');
    updateFriendNote(friendId, noteInput);
    setFriends(loadFriends());
    setEditingFriendId(null);
    setNoteInput('');
    showToast('Qeyd saxlanıldı! 📝');
  };

  const displayedFriends = filterQuery ? searchFriends(filterQuery) : friends;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fade-in select-none pointer-events-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col max-h-[90dvh] min-h-0 overflow-hidden text-left">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 rounded-xl border border-amber-500/30">
              <Users className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-amber-300">
                {lang === 'az' && 'Dostlar & Çayxana Yoldaşları'}
                {lang === 'ru' && 'Друзья и Партнеры'}
                {lang === 'en' && 'Friends & Companions'}
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-400">
                {friends.length} nəfər dost siyahınızda
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* My Player Identity Card (Shows user's unique Name + Tag) */}
        <div className="mt-3 p-2.5 sm:p-3 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 border border-amber-500/30 flex items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-2.5 min-w-0">
            <AvatarView
              avatarId={myIdentity.avatarId}
              frameId={myIdentity.frameId}
              size={36}
              showBorder={true}
            />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-white text-xs sm:text-sm truncate">
                  {myIdentity.name}
                </span>
                <span className="text-[10px] font-extrabold bg-amber-500/20 border border-amber-500/40 text-amber-300 px-1.5 py-0.2 rounded-md">
                  #{myIdentity.tag}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 truncate">
                Dost Kodunuz: <span className="text-amber-400 font-bold">{myIdentity.friendCode}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={handleCopyMyCode}
              title="Kodu kopyala"
              className="py-1 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[10px] font-bold flex items-center gap-1 active:scale-95 transition"
            >
              {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-amber-400" />}
              <span>{copiedCode ? 'Kopyalandı' : 'Kodu Kopyala'}</span>
            </button>
          </div>
        </div>

        {/* Toast Feedback */}
        {toastMessage && (
          <div className="my-2 py-1.5 px-3 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-bold text-center animate-fade-in">
            {toastMessage}
          </div>
        )}

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 p-1 bg-slate-950 rounded-2xl border border-slate-800 my-2.5 gap-1 text-xs">
          <button
            onClick={() => setTab('list')}
            className={`py-2 px-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition ${
              tab === 'list'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Dostlarım ({friends.length})</span>
          </button>

          <button
            onClick={() => setTab('add')}
            className={`py-2 px-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition ${
              tab === 'add'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Dost Əlavə Et</span>
          </button>

          <button
            onClick={() => setTab('recent')}
            className={`py-2 px-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition ${
              tab === 'recent'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Son Rəqiblər ({recentPlayers.length})</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: Friends List with Tag Disambiguation & Note edit  */}
        {/* ======================================================== */}
        {tab === 'list' && (
          <div className="flex-1 flex flex-col min-h-[240px] overflow-hidden">
            {/* Filter Search Input (if friends >= 3) */}
            {friends.length >= 3 && (
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder="Dostların içində axtar (ad, taq və ya qeyd)..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
                />
              </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {friends.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center p-4">
                  <span className="text-4xl mb-2 opacity-60">👥</span>
                  <span className="font-bold text-slate-300 text-sm">
                    Hələ heç bir dostunuz yoxdur
                  </span>
                  <p className="text-xs text-slate-400 max-w-xs mt-1 mb-3">
                    Dostunuzun 4-rəqəmli taqını daxil edərək və ya oyun sonunda 1 kliklə dostluğa əlavə edə bilərsiniz.
                  </p>
                  <button
                    onClick={() => setTab('add')}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition active:scale-95"
                  >
                    + Dost Əlavə Et
                  </button>
                </div>
              ) : displayedFriends.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-36 text-center text-slate-500 text-xs">
                  <span>Axtarışa uyğun dost tapılmadı.</span>
                </div>
              ) : (
                displayedFriends.map((friend) => (
                  <div
                    key={friend.id}
                    className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/80 hover:border-slate-600 transition flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative">
                          <AvatarView
                            avatarId={friend.avatarId || 'avatar_tea_master'}
                            frameId={friend.frameId}
                            size={36}
                            showBorder={true}
                          />
                          {friend.isOnline && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-900 shadow" />
                          )}
                        </div>

                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-white text-sm truncate max-w-[130px] sm:max-w-[180px]">
                              {friend.name}
                            </span>
                            {/* Unique Tag Badge so identical nicknames are clearly distinguished */}
                            <span className="text-[10px] font-extrabold bg-cyan-950 text-cyan-300 border border-cyan-500/40 px-1.5 py-0.2 rounded-md">
                              #{friend.playerTag}
                            </span>
                            <span className="text-[10px] text-emerald-400 font-medium">
                              ● Onlayn
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-0.5">
                            {friend.note ? (
                              <span className="text-[10px] text-amber-300/90 font-medium truncate italic">
                                📝 {friend.note}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-medium truncate">
                                {friend.title || 'Çayxana Yoldaşı'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {/* Invite to Room Button */}
                        <button
                          onClick={() => {
                            triggerHaptic('medium');
                            onInviteFriend(friend.name);
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:brightness-110 text-white font-black text-xs flex items-center gap-1 shadow active:scale-95 transition"
                        >
                          <Play className="w-3 h-3 fill-white" />
                          <span>Dəvət</span>
                        </button>

                        {/* Edit Note Button */}
                        <button
                          onClick={() => {
                            setEditingFriendId(editingFriendId === friend.id ? null : friend.id);
                            setNoteInput(friend.note || '');
                          }}
                          title="Fərdi qeyd / ləqəb yaz"
                          className="p-2 rounded-xl text-slate-400 hover:text-amber-300 hover:bg-slate-700 transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Remove Friend Button */}
                        <button
                          onClick={() => handleRemove(friend.id, friend.name, friend.playerTag)}
                          title="Dostluğu sil"
                          className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Inline Note Editor Form */}
                    {editingFriendId === friend.id && (
                      <div className="pt-2 border-t border-slate-700/60 flex items-center gap-2 animate-fade-in">
                        <input
                          type="text"
                          value={noteInput}
                          onChange={(e) => setNoteInput(e.target.value)}
                          placeholder="Fərdi qeyd yazın (məs: Qonşu, Sinif yoldaşı)..."
                          maxLength={30}
                          className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-400"
                        />
                        <button
                          onClick={() => handleSaveNote(friend.id)}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition"
                        >
                          Saxla
                        </button>
                        <button
                          onClick={() => setEditingFriendId(null)}
                          className="p-1 text-slate-400 hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: Add Friend by Tag / Handle / Code & Invite Link  */}
        {/* ======================================================== */}
        {tab === 'add' && (
          <div className="flex-1 overflow-y-auto space-y-3.5 p-1 min-h-[240px]">
            {/* Search by Tag or Handle */}
            <form onSubmit={handleSearchSubmit} className="flex flex-col gap-2">
              <label className="text-xs font-bold text-amber-300 flex items-center justify-between">
                <span>Dost Kodu, Taq (#) və ya Ad ilə Axtarış:</span>
                <span className="text-[10px] text-slate-400 font-normal">məs: #7492 və ya Murad#7492</span>
              </label>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="məs: #4829, DOM-4829 və ya Murad#4829..."
                  maxLength={30}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white font-bold focus:outline-none focus:border-amber-400 transition"
                />
                <button
                  type="submit"
                  disabled={!searchQuery.trim() || searching}
                  className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs flex items-center gap-1.5 transition active:scale-95 shadow"
                >
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>{searching ? 'Axtarılır...' : 'Axtar'}</span>
                </button>
              </div>

              {searchError && (
                <p className="text-xs text-rose-400 font-medium animate-fade-in">
                  {searchError}
                </p>
              )}
            </form>

            {/* Found Player Card Preview */}
            {searchResult && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/60 border-2 border-amber-500/70 shadow-xl flex items-center justify-between gap-3 animate-fade-in">
                <div className="flex items-center gap-3">
                  <AvatarView
                    avatarId={searchResult.avatarId || 'avatar_tea_master'}
                    frameId={searchResult.frameId}
                    size={42}
                    showBorder={true}
                  />
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-white text-sm">
                        {searchResult.name}
                      </span>
                      <span className="text-[10px] font-extrabold bg-cyan-950 text-cyan-300 border border-cyan-500/40 px-1.5 py-0.2 rounded-md">
                        #{searchResult.playerTag}
                      </span>
                    </div>
                    <span className="text-[10px] text-amber-400/90 font-medium">
                      {searchResult.title || 'Çayxana Dominocusu'}
                    </span>
                    <span className="text-[9px] text-slate-400 mt-0.5">
                      Kod: {searchResult.playerId}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleAddSearchResult}
                  className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:brightness-110 text-white font-black text-xs flex items-center gap-1 shadow-md active:scale-95 transition"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Dost Əlavə Et</span>
                </button>
              </div>
            )}

            {/* How Same Nicknames Work Explanation Notice */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Eyni ləqəbli oyunçular necə fərqlənir?</span>
              </div>
              <p className="leading-relaxed text-slate-400">
                Domino PRO-da hər bir oyunçunun adı ilə yanaşı 4-rəqəmli unikal taqı olur (məs: <span className="text-white font-semibold">Murad#4829</span> və <span className="text-white font-semibold">Murad#1034</span>). Beləliklə, eyni ada malik dostlarınızı asanlıqla tanıya və qarışdırmadan əlavə edə bilərsiniz.
              </p>
            </div>

            {/* Shareable Invite Link */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-teal-950/70 via-slate-900 to-teal-950/70 border border-teal-500/40 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-teal-400" />
                <span className="text-xs font-black text-teal-300">
                  Şəxsi Dəvət Linkiniz (WhatsApp & Telegram)
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Bu linki dostunuza göndərin. O linkə kliklədikdə birbaşa sizinlə dost olacaq və masanıza dəvət ala biləcək.
              </p>
              <button
                onClick={handleShareInviteLink}
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow active:scale-95 transition"
              >
                <Share2 className="w-4 h-4" />
                <span>Dəvət Linkini Paylaş</span>
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: Recent Real Opponents                            */}
        {/* ======================================================== */}
        {tab === 'recent' && (
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[240px]">
            {recentPlayers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center p-4 text-slate-500">
                <Clock className="w-8 h-8 mb-2 opacity-50" />
                <span className="font-bold text-xs text-slate-300">Hələ heç bir real rəqiblə oynanmayıb.</span>
                <span className="text-[10px] text-slate-400 mt-1 max-w-xs leading-relaxed">
                  Onlayn multiplayer oyunlarında qarşılaşdığınız real oyunçular avtomatik burada əks olunacaq. Botlar bu siyahıya daxil edilmir.
                </span>
              </div>
            ) : (
              recentPlayers.map((rp, idx) => {
                const alreadyFriend = friends.some((f) => {
                  if (rp.playerId && f.playerId) return f.playerId === rp.playerId;
                  if (rp.playerTag && f.playerTag) return f.playerTag === rp.playerTag && f.name.toLowerCase() === rp.name.toLowerCase();
                  return f.name.toLowerCase() === rp.name.toLowerCase();
                });

                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/60 border border-slate-700/80 hover:border-slate-600 transition"
                  >
                    <div className="flex items-center gap-3">
                      <AvatarView
                        avatarId={rp.avatarId || 'avatar_tea_master'}
                        frameId={rp.frameId}
                        size={34}
                        showBorder={false}
                      />
                      <div className="flex flex-col text-left">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white text-sm">
                            {rp.name}
                          </span>
                          {rp.playerTag && (
                            <span className="text-[10px] font-extrabold bg-cyan-950 text-cyan-300 border border-cyan-500/40 px-1.5 py-0.2 rounded-md">
                              #{rp.playerTag}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          Son oyun: {rp.date}
                        </span>
                      </div>
                    </div>

                    <div>
                      {alreadyFriend ? (
                        <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-1 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>Dostdur</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAddFromRecent(rp)}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1 shadow active:scale-95 transition"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>+ Dostluq At</span>
                        </button>
                      )}
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
