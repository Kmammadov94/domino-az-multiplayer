import React, { useState, useEffect } from 'react';
import {
  FriendItem,
  RecentPlayerItem,
  loadFriends,
  addFriend,
  removeFriend,
  loadRecentPlayers,
  isBotName
} from '../utils/friendsStorage';
import { Language } from '../types/domino';
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
  Sparkles
} from 'lucide-react';

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onInviteFriend: (friendName: string) => void;
}

export const FriendsModal: React.FC<FriendsModalProps> = ({
  isOpen,
  onClose,
  lang,
  onInviteFriend
}) => {
  const [tab, setTab] = useState<'list' | 'add' | 'recent'>('list');
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [recentPlayers, setRecentPlayers] = useState<RecentPlayerItem[]>([]);
  const [newFriendName, setNewFriendName] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFriends(loadFriends());
      setRecentPlayers(loadRecentPlayers());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleAddSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newFriendName.trim();
    if (!trimmed) return;

    if (isBotName(trimmed)) {
      triggerHaptic('medium');
      showToast('⚠️ Bu ad kompüter botuna aiddir. Yalnız real oyunçuları əlavə edə bilərsiniz.');
      return;
    }

    const ok = addFriend({
      name: trimmed,
      avatarId: 'avatar_tea_master',
      title: 'Çayxana Qonağı'
    });

    if (ok) {
      triggerHaptic('success');
      setFriends(loadFriends());
      setNewFriendName('');
      showToast(`${trimmed} dostluğa əlavə edildi! 🎉`);
      setTab('list');
    } else {
      triggerHaptic('medium');
      showToast('Bu oyunçu artıq dost siyahınızdadır.');
    }
  };

  const handleAddFromRecent = (rp: RecentPlayerItem) => {
    const ok = addFriend({
      name: rp.name,
      avatarId: rp.avatarId,
      frameId: rp.frameId,
      title: 'Dominocu Yoldaş'
    });

    if (ok) {
      triggerHaptic('success');
      setFriends(loadFriends());
      showToast(`${rp.name} dostlara əlavə edildi! 🤝`);
    } else {
      showToast(`${rp.name} artıq dostunuzdur.`);
    }
  };

  const handleRemove = (id: string, name: string) => {
    triggerHaptic('light');
    removeFriend(id);
    setFriends(loadFriends());
    showToast(`${name} dostluqdan silindi.`);
  };

  const handleShareInviteLink = () => {
    triggerHaptic('light');
    const url = `${window.location.origin}?invite=friends`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    showToast('Dostluq linki kopyalandı! WhatsApp və ya Telegram ilə göndərin.');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="relative w-full max-w-lg bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
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

        {/* Toast Feedback */}
        {toastMessage && (
          <div className="my-2 py-1.5 px-3 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-bold text-center animate-fade-in">
            {toastMessage}
          </div>
        )}

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 p-1 bg-slate-950 rounded-2xl border border-slate-800 my-3 gap-1 text-xs">
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

        {/* Tab 1: Friends List */}
        {tab === 'list' && (
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
            {friends.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center p-4">
                <span className="text-4xl mb-2 opacity-60">👥</span>
                <span className="font-bold text-slate-300 text-sm">
                  Hələ heç bir dostunuz yoxdur
                </span>
                <p className="text-xs text-slate-500 max-w-xs mt-1 mb-3">
                  Oynadığınız şəxsləri matç sonunda və ya adını yazaraq dostluğa əlavə edə bilərsiniz.
                </p>
                <button
                  onClick={() => setTab('add')}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition active:scale-95"
                >
                  + Dost Əlavə Et
                </button>
              </div>
            ) : (
              friends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/60 border border-slate-700/80 hover:border-slate-600 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
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
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm truncate max-w-[120px] sm:max-w-[160px]">
                          {friend.name}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-medium">
                          ● Onlayn
                        </span>
                      </div>
                      <span className="text-[10px] text-amber-400/80 font-medium truncate">
                        {friend.title || 'Çayxana Yoldaşı'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => {
                        triggerHaptic('medium');
                        onInviteFriend(friend.name);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:brightness-110 text-white font-black text-xs flex items-center gap-1 shadow active:scale-95 transition"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>Dəvət Et</span>
                    </button>

                    <button
                      onClick={() => handleRemove(friend.id, friend.name)}
                      title="Dostluğu sil"
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Add Friend Form & Invite Link */}
        {tab === 'add' && (
          <div className="flex-1 overflow-y-auto space-y-4 p-1 min-h-[220px]">
            {/* Direct Name Input */}
            <form onSubmit={handleAddSubmit} className="flex flex-col gap-2">
              <label className="text-xs font-bold text-amber-300/90 text-left">
                Real Oyunçu / Dostunuzun Adı:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newFriendName}
                  onChange={(e) => setNewFriendName(e.target.value)}
                  placeholder="məs: Murad, Samir, Ayan..."
                  maxLength={18}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-bold focus:outline-none focus:border-amber-400 transition"
                />
                <button
                  type="submit"
                  disabled={!newFriendName.trim()}
                  className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs transition active:scale-95 shadow"
                >
                  Əlavə Et
                </button>
              </div>
              <p className="text-[10px] text-slate-400 text-left">
                💡 Yalnız real dostlarınızı və multiplayer oyunçularını əlavə edə bilərsiniz (Süni intellekt botları əlavə edilmir).
              </p>
            </form>

            {/* Shareable Invite Link */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-teal-950/70 via-slate-900 to-teal-950/70 border border-teal-500/40 flex flex-col gap-2 text-left">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-teal-400" />
                <span className="text-xs font-black text-teal-300">
                  WhatsApp & Telegram ilə Dəvət Linki
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Bu linki dostunuza göndərin, o linkə kliklədikdə dərhal sizin masanıza qoşulacaq və avtomatik dost siyahınıza düşəcək.
              </p>
              <button
                onClick={handleShareInviteLink}
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow active:scale-95 transition"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Link Kopyalandı!' : 'Dəvət Linkini Kopyala'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Recent Real Opponents */}
        {tab === 'recent' && (
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
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
                const alreadyFriend = friends.some(
                  (f) => f.name.toLowerCase() === rp.name.toLowerCase()
                );
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/60 border border-slate-700/80 hover:border-slate-600 transition"
                  >
                    <div className="flex items-center gap-3">
                      <AvatarView
                        avatarId={rp.avatarId || 'avatar_tea_master'}
                        size={32}
                        showBorder={false}
                      />
                      <div className="flex flex-col text-left">
                        <span className="font-bold text-white text-sm">
                          {rp.name}
                        </span>
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
