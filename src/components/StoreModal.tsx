import React, { useState, useEffect } from 'react';
import { DominoSkin, Language, PlayerStats } from '../types/domino';
import { DOMINO_SKINS } from '../data/skins';
import { PLAYER_AVATARS, PlayerAvatar, DEFAULT_AVATAR_ID, FREE_AVATAR_IDS } from '../data/avatars';
import { translations } from '../i18n/translations';
import { DominoTile } from './DominoTile';
import { AvatarView } from './AvatarView';
import { sounds } from '../utils/sound';
import { X, Coins, Sparkles, Check, ShoppingBag, User, Layers } from 'lucide-react';

interface StoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  stats: PlayerStats;
  onUpdateStats: (newStats: PlayerStats) => void;
  initialTab?: 'skins' | 'avatars';
}

export const StoreModal: React.FC<StoreModalProps> = ({
  isOpen,
  onClose,
  lang,
  stats,
  onUpdateStats,
  initialTab = 'skins'
}) => {
  const [storeTab, setStoreTab] = useState<'skins' | 'avatars'>(initialTab);
  const [selectedSkinCategory, setSelectedSkinCategory] = useState<string>('all');
  const [selectedAvatarCategory, setSelectedAvatarCategory] = useState<string>('all');
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && initialTab) {
      setStoreTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;
  const t = translations[lang] || translations.az;

  const currentEquippedAvatar = stats.equippedAvatar || DEFAULT_AVATAR_ID;
  const currentUnlockedAvatars = stats.unlockedAvatars && stats.unlockedAvatars.length > 0
    ? stats.unlockedAvatars
    : FREE_AVATAR_IDS;

  // Skin Categories
  const skinCategories = [
    { id: 'all', label: t.skinsTabAll },
    { id: 'classic', label: t.skinsTabClassic },
    { id: 'luxury', label: t.skinsTabLuxury },
    { id: 'baku', label: t.skinsTabBaku },
    { id: 'modern', label: t.skinsTabModern },
    { id: 'public_domain', label: t.skinsTabPublicDomain }
  ];

  // Avatar Categories
  const avatarCategories = [
    { id: 'all', label: t.avatarCategories?.all || 'Hamısı (30)' },
    { id: 'baku', label: t.avatarCategories?.baku || 'Bakı & Çayxana' },
    { id: 'masters', label: t.avatarCategories?.masters || 'Ustalar' },
    { id: 'legends', label: t.avatarCategories?.legends || 'Əfsanələr' },
    { id: 'luxury', label: t.avatarCategories?.luxury || 'Lüks & Kiber' }
  ];

  const filteredSkins = DOMINO_SKINS.filter(
    (s) => selectedSkinCategory === 'all' || s.category === selectedSkinCategory
  );

  const filteredAvatars = PLAYER_AVATARS.filter(
    (a) => selectedAvatarCategory === 'all' || a.category === selectedAvatarCategory
  );

  // Equip Skin
  const handleEquipSkin = (skinId: string) => {
    onUpdateStats({
      ...stats,
      equippedSkin: skinId
    });
    sounds.playTileDraw();
  };

  // Buy Skin
  const handleBuySkin = (skin: DominoSkin) => {
    if (stats.coins < skin.price) {
      setFeedback(t.notEnoughCoins);
      setTimeout(() => setFeedback(null), 2500);
      return;
    }

    const nextCoins = stats.coins - skin.price;
    const nextUnlocked = [...stats.unlockedSkins, skin.id];
    onUpdateStats({
      ...stats,
      coins: nextCoins,
      unlockedSkins: nextUnlocked,
      equippedSkin: skin.id
    });
    sounds.playCoinChime();
  };

  // Equip Avatar
  const handleEquipAvatar = (avatarId: string) => {
    onUpdateStats({
      ...stats,
      equippedAvatar: avatarId
    });
    sounds.playTileDraw();
  };

  // Buy Avatar
  const handleBuyAvatar = (avatar: PlayerAvatar) => {
    if (stats.coins < avatar.price) {
      setFeedback(t.notEnoughCoins);
      setTimeout(() => setFeedback(null), 2500);
      return;
    }

    const nextCoins = stats.coins - avatar.price;
    const nextUnlocked = [...currentUnlockedAvatars, avatar.id];
    onUpdateStats({
      ...stats,
      coins: nextCoins,
      unlockedAvatars: nextUnlocked,
      equippedAvatar: avatar.id
    });
    sounds.playCoinChime();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border-2 border-amber-500/40 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="p-3 sm:p-4 bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/70 border-b border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 rounded-xl border border-amber-500/30">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-amber-300">{t.store}</h2>
              <p className="text-[10px] sm:text-xs text-slate-400">
                {storeTab === 'skins' ? '20 unikal domino dəsti' : '30 xüsusi profil şəkli'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Player Gold Balance */}
            <div className="bg-slate-800/90 border border-amber-500/50 rounded-full px-3 py-1 flex items-center gap-1.5 shadow-inner">
              <Coins className="w-4 h-4 text-amber-400 animate-spin-slow" />
              <span className="font-black text-amber-300 text-xs sm:text-sm">{stats.coins}</span>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition p-1.5 hover:bg-slate-800 rounded-xl"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Primary Store Tab Switcher (Skins vs Avatars) */}
        <div className="grid grid-cols-2 p-2 bg-slate-950 border-b border-slate-800 gap-2">
          <button
            onClick={() => setStoreTab('skins')}
            className={`py-2 px-3 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              storeTab === 'skins'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{t.storeTabs?.skins || 'Daş Dəstləri'}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/30 font-black">
              20
            </span>
          </button>

          <button
            onClick={() => setStoreTab('avatars')}
            className={`py-2 px-3 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              storeTab === 'avatars'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-lg'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>{t.storeTabs?.avatars || 'Profil Şəkilləri'}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/30 font-black">
              30
            </span>
          </button>
        </div>

        {/* Feedback message banner */}
        {feedback && (
          <div className="bg-rose-500/20 border-b border-rose-500/40 px-4 py-2 text-center text-xs sm:text-sm font-semibold text-rose-300 animate-fade-in">
            {feedback}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 1: DOMINO SKINS STORE                               */}
        {/* ======================================================== */}
        {storeTab === 'skins' && (
          <>
            {/* Category Tabs */}
            <div className="flex items-center gap-2 p-2.5 bg-slate-950/70 border-b border-slate-800/80 overflow-x-auto">
              {skinCategories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedSkinCategory(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    selectedSkinCategory === c.id
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Skins Grid */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {filteredSkins.map((skin) => {
                const isUnlocked = stats.unlockedSkins.includes(skin.id);
                const isEquipped = stats.equippedSkin === skin.id;

                return (
                  <div
                    key={skin.id}
                    className={`rounded-2xl border p-3 flex flex-col justify-between transition-all ${
                      isEquipped
                        ? 'bg-amber-950/40 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)]'
                        : isUnlocked
                        ? 'bg-slate-800/70 border-slate-700 hover:border-slate-500'
                        : 'bg-slate-900/80 border-slate-800 hover:border-amber-500/40'
                    }`}
                  >
                    <div>
                      {/* Skin Name */}
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-slate-100">{skin.name[lang]}</span>
                        {isEquipped && (
                          <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" /> {t.equipped}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mb-2.5 h-8 overflow-hidden line-clamp-2">
                        {skin.desc[lang]}
                      </p>
                    </div>

                    {/* Skin Preview: Pair of domino tiles */}
                    <div className="my-1.5 p-2.5 rounded-xl bg-slate-950/70 flex items-center justify-center gap-3 border border-white/5">
                      <DominoTile
                        tile={{ id: 'preview-1', left: 6, right: 6 }}
                        skin={skin}
                        scale={0.65}
                        isVertical={true}
                      />
                      <DominoTile
                        tile={{ id: 'preview-2', left: 3, right: 2 }}
                        skin={skin}
                        scale={0.65}
                        isVertical={false}
                      />
                    </div>

                    {/* Action Button */}
                    <div className="mt-2.5">
                      {isEquipped ? (
                        <button
                          disabled
                          className="w-full py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-center gap-1 cursor-default"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          {t.equipped}
                        </button>
                      ) : isUnlocked ? (
                        <button
                          onClick={() => handleEquipSkin(skin.id)}
                          className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1 shadow-md"
                        >
                          {t.equip}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBuySkin(skin)}
                          className="w-full py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 text-xs font-black transition flex items-center justify-center gap-1.5 shadow-md"
                        >
                          <Coins className="w-3.5 h-3.5" />
                          {t.buy.replace('{price}', skin.price.toString())}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ======================================================== */}
        {/* TAB 2: PROFILE PICTURES (AVATARS) STORE                  */}
        {/* ======================================================== */}
        {storeTab === 'avatars' && (
          <>
            {/* Category Tabs */}
            <div className="flex items-center gap-2 p-2.5 bg-slate-950/70 border-b border-slate-800/80 overflow-x-auto">
              {avatarCategories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedAvatarCategory(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    selectedAvatarCategory === c.id
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Avatars Grid - Pictures Only */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredAvatars.map((avatar) => {
                const isUnlocked = currentUnlockedAvatars.includes(avatar.id);
                const isEquipped = currentEquippedAvatar === avatar.id;

                return (
                  <div
                    key={avatar.id}
                    className={`rounded-2xl border p-2.5 flex flex-col items-center justify-between transition-all ${
                      isEquipped
                        ? 'bg-emerald-950/40 border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.35)] ring-2 ring-emerald-400/40'
                        : isUnlocked
                        ? 'bg-slate-900/80 border-slate-700/80 hover:border-slate-500 hover:bg-slate-800/80'
                        : 'bg-slate-950/80 border-slate-800/80 hover:border-amber-500/40'
                    }`}
                  >
                    {/* Badge / Status Top Bar */}
                    <div className="w-full flex items-center justify-between mb-1 min-h-[18px]">
                      {avatar.badge ? (
                        <span className="text-[9px] bg-slate-950 text-amber-300 font-extrabold px-1.5 py-0.5 rounded-full border border-amber-500/40">
                          {avatar.badge}
                        </span>
                      ) : avatar.price === 0 ? (
                        <span className="text-[9px] bg-emerald-950 text-emerald-300 font-extrabold px-1.5 py-0.5 rounded-full border border-emerald-500/40">
                          {t.free || 'Pulsuz'}
                        </span>
                      ) : (
                        <span />
                      )}

                      {isEquipped && (
                        <span className="text-[9px] bg-emerald-500 text-slate-950 font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow">
                          <Check className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>

                    {/* Avatar Picture (No Name) */}
                    <div
                      onClick={() => {
                        if (isUnlocked && !isEquipped) handleEquipAvatar(avatar.id);
                        else if (!isUnlocked) handleBuyAvatar(avatar);
                      }}
                      className="my-1 p-2 rounded-2xl bg-slate-950/70 flex items-center justify-center border border-white/5 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                    >
                      <AvatarView
                        avatarId={avatar.id}
                        size={80}
                        showBorder={true}
                        showGlow={isEquipped}
                      />
                    </div>

                    {/* Action Button */}
                    <div className="w-full mt-1.5">
                      {isEquipped ? (
                        <button
                          disabled
                          className="w-full py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1 cursor-default"
                        >
                          <Sparkles className="w-3 h-3 text-emerald-400" />
                          <span>{t.equipped}</span>
                        </button>
                      ) : isUnlocked ? (
                        <button
                          onClick={() => handleEquipAvatar(avatar.id)}
                          className="w-full py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1 shadow-md active:scale-95"
                        >
                          <span>{t.equip}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBuyAvatar(avatar)}
                          className="w-full py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 text-xs font-black transition flex items-center justify-center gap-1 shadow-md active:scale-95"
                        >
                          <Coins className="w-3 h-3" />
                          <span>{avatar.price}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
