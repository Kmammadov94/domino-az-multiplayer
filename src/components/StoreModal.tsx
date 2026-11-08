import React, { useState, useEffect } from 'react';
import { DominoSkin, Language, PlayerStats } from '../types/domino';
import { DOMINO_SKINS } from '../data/skins';
import { PLAYER_AVATARS, PlayerAvatar, DEFAULT_AVATAR_ID, FREE_AVATAR_IDS } from '../data/avatars';
import { AVATAR_FRAMES, PLAYER_TITLES, DEFAULT_FRAME_ID, DEFAULT_TITLE_ID, AvatarFrame, PlayerTitle } from '../data/profileCustomization';
import { TABLE_THEMES, DEFAULT_TABLE_THEME_ID, TableTheme } from '../data/tableThemes';
import { translations } from '../i18n/translations';
import { DominoTile } from './DominoTile';
import { AvatarView } from './AvatarView';
import { sounds } from '../utils/sound';
import { triggerHaptic } from '../utils/haptics';
import { X, Coins, Sparkles, Check, ShoppingBag, User, Layers, Shield, Award, Palette } from 'lucide-react';

interface StoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  stats: PlayerStats;
  onUpdateStats: (newStats: PlayerStats) => void;
  initialTab?: 'skins' | 'avatars' | 'frames' | 'titles' | 'tables';
}

export const StoreModal: React.FC<StoreModalProps> = ({
  isOpen,
  onClose,
  lang,
  stats,
  onUpdateStats,
  initialTab = 'skins'
}) => {
  const [storeTab, setStoreTab] = useState<'skins' | 'avatars' | 'frames' | 'titles' | 'tables'>(initialTab);
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
    { id: 'all', label: t.avatarCategories?.all || 'Hamısı' },
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
    triggerHaptic('light');
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
    triggerHaptic('success');
    sounds.playCoinChime();
  };

  const currentEquippedFrame = stats.equippedFrame || DEFAULT_FRAME_ID;
  const currentUnlockedFrames = stats.unlockedFrames && stats.unlockedFrames.length > 0
    ? stats.unlockedFrames
    : [DEFAULT_FRAME_ID];

  const currentEquippedTitle = stats.equippedTitle || DEFAULT_TITLE_ID;
  const currentUnlockedTitles = stats.unlockedTitles && stats.unlockedTitles.length > 0
    ? stats.unlockedTitles
    : [DEFAULT_TITLE_ID];

  const currentEquippedTable = stats.equippedTableTheme || DEFAULT_TABLE_THEME_ID;

  // Equip Frame
  const handleEquipFrame = (frameId: string) => {
    onUpdateStats({
      ...stats,
      equippedFrame: frameId
    });
    triggerHaptic('light');
    sounds.playTileDraw();
  };

  // Buy Frame
  const handleBuyFrame = (frame: AvatarFrame) => {
    if (stats.coins < frame.price) {
      setFeedback(t.notEnoughCoins);
      setTimeout(() => setFeedback(null), 2500);
      return;
    }

    const nextCoins = stats.coins - frame.price;
    const nextUnlocked = [...currentUnlockedFrames, frame.id];
    onUpdateStats({
      ...stats,
      coins: nextCoins,
      unlockedFrames: nextUnlocked,
      equippedFrame: frame.id
    });
    triggerHaptic('success');
    sounds.playCoinChime();
  };

  // Equip Title
  const handleEquipTitle = (titleId: string) => {
    onUpdateStats({
      ...stats,
      equippedTitle: titleId
    });
    triggerHaptic('light');
    sounds.playTileDraw();
  };

  // Buy Title
  const handleBuyTitle = (title: PlayerTitle) => {
    if (stats.coins < title.price) {
      setFeedback(t.notEnoughCoins);
      setTimeout(() => setFeedback(null), 2500);
      return;
    }

    const nextCoins = stats.coins - title.price;
    const nextUnlocked = [...currentUnlockedTitles, title.id];
    onUpdateStats({
      ...stats,
      coins: nextCoins,
      unlockedTitles: nextUnlocked,
      equippedTitle: title.id
    });
    triggerHaptic('success');
    sounds.playCoinChime();
  };

  // Equip Table Theme
  const handleEquipTableTheme = (themeId: string) => {
    onUpdateStats({
      ...stats,
      equippedTableTheme: themeId
    });
    triggerHaptic('medium');
    sounds.playTileDraw();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in pointer-events-auto">
      <div className="bg-slate-900 border-2 border-amber-500/40 rounded-3xl w-full max-w-4xl h-[90dvh] max-h-[780px] flex flex-col shadow-2xl overflow-hidden min-h-0 relative">
        {/* Top Header */}
        <div className="p-3 sm:p-4 flex-shrink-0 bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/70 border-b border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 rounded-xl border border-amber-500/30">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-amber-300">{t.store}</h2>
              <p className="text-[10px] sm:text-xs text-slate-400">
                {storeTab === 'skins' && (lang === 'az' ? 'Unikal domino daş dəstləri' : lang === 'ru' ? 'Уникальные наборы домино' : 'Unique domino tile sets')}
                {storeTab === 'avatars' && (lang === 'az' ? 'Xüsusi profil şəkilləri' : lang === 'ru' ? 'Особые аватары профиля' : 'Custom profile avatars')}
                {storeTab === 'frames' && (lang === 'az' ? 'Avatar çərçivələri və parlaq effektlər' : lang === 'ru' ? 'Рамки аватара и эффекты' : 'Avatar frames and effects')}
                {storeTab === 'titles' && (lang === 'az' ? 'Masa titulları və çayxana dərəcələri' : lang === 'ru' ? 'Титулы стола и звания' : 'Table titles and ranks')}
                {storeTab === 'tables' && (lang === 'az' ? 'Masa örtüyü və çuxa dizaynı' : lang === 'ru' ? 'Сукно стола и дизайн' : 'Table cloth and theme design')}
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

        {/* Primary Store Tab Switcher (5 Tabs: Skins, Avatars, Frames, Titles, Tables) */}
        <div className="grid grid-cols-5 p-1.5 flex-shrink-0 bg-slate-950 border-b border-slate-800 gap-1 sm:gap-1.5 text-[11px] sm:text-xs">
          <button
            onClick={() => setStoreTab('skins')}
            className={`py-2 px-1 sm:px-2 rounded-xl font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition-all min-w-0 ${
              storeTab === 'skins'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md font-black'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{t.storeTabs?.skins || 'Daşlar'}</span>
          </button>

          <button
            onClick={() => setStoreTab('avatars')}
            className={`py-2 px-1 sm:px-2 rounded-xl font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition-all min-w-0 ${
              storeTab === 'avatars'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md font-black'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{t.storeTabs?.avatars || 'Avatarlar'}</span>
          </button>

          <button
            onClick={() => setStoreTab('frames')}
            className={`py-2 px-1 sm:px-2 rounded-xl font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition-all min-w-0 ${
              storeTab === 'frames'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-md font-black'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">Çərçivələr</span>
          </button>

          <button
            onClick={() => setStoreTab('titles')}
            className={`py-2 px-1 sm:px-2 rounded-xl font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition-all min-w-0 ${
              storeTab === 'titles'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-slate-950 shadow-md font-black'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">Titullar</span>
          </button>

          <button
            onClick={() => setStoreTab('tables')}
            className={`py-2 px-1 sm:px-2 rounded-xl font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition-all min-w-0 ${
              storeTab === 'tables'
                ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 shadow-md font-black'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">Örtük</span>
          </button>
        </div>

        {/* Feedback message banner */}
        {feedback && (
          <div className="flex-shrink-0 bg-rose-500/20 border-b border-rose-500/40 px-4 py-2 text-center text-xs sm:text-sm font-semibold text-rose-300 animate-fade-in">
            {feedback}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 1: DOMINO SKINS STORE                               */}
        {/* ======================================================== */}
        {storeTab === 'skins' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Category Tabs */}
            <div className="flex-shrink-0 flex items-center gap-2 p-2.5 bg-slate-950/70 border-b border-slate-800/80 overflow-x-auto no-scrollbar">
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
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 pr-2.5 sm:p-4 sm:pr-3.5 pb-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {filteredSkins.map((skin) => {
                const isUnlocked = stats.unlockedSkins.includes(skin.id) || !!skin.unlockedByDefault;
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
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: PROFILE PICTURES (AVATARS) STORE                  */}
        {/* ======================================================== */}
        {storeTab === 'avatars' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Category Tabs */}
            <div className="flex-shrink-0 flex items-center gap-2 p-2.5 bg-slate-950/70 border-b border-slate-800/80 overflow-x-auto no-scrollbar">
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
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 pr-2.5 sm:p-4 sm:pr-3.5 pb-12 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
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
          </div>
        )}

        {/* 3. Avatar Frames Tab */}
        {storeTab === 'frames' && (
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 pr-3 sm:p-5 sm:pr-4 pb-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {AVATAR_FRAMES.map((frame) => {
              const isEquipped = currentEquippedFrame === frame.id;
              const isUnlocked = currentUnlockedFrames.includes(frame.id) || frame.price === 0;

              return (
                <div
                  key={frame.id}
                  className={`relative rounded-2xl p-4 border flex flex-col items-center text-center transition-all ${
                    isEquipped
                      ? 'bg-amber-950/40 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.2)]'
                      : 'bg-slate-800/60 border-slate-700/80 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-white text-sm">{frame.name[lang] || frame.name.az}</h3>
                    {frame.badge && <span className="text-base">{frame.badge}</span>}
                  </div>

                  <p className="text-[11px] text-slate-400 mb-3 line-clamp-2">
                    {frame.desc[lang] || frame.desc.az}
                  </p>

                  <div className="my-2 p-3 rounded-2xl bg-slate-950 flex items-center justify-center">
                    <AvatarView
                      avatarId={currentEquippedAvatar}
                      frameId={frame.id}
                      size={72}
                      showBorder={true}
                    />
                  </div>

                  <div className="w-full mt-3">
                    {isEquipped ? (
                      <button
                        disabled
                        className="w-full py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-bold flex items-center justify-center gap-1"
                      >
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>Seçilib</span>
                      </button>
                    ) : isUnlocked ? (
                      <button
                        onClick={() => handleEquipFrame(frame.id)}
                        className="w-full py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition active:scale-95"
                      >
                        Quraşdır
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBuyFrame(frame)}
                        className="w-full py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 text-slate-950 text-xs font-black transition flex items-center justify-center gap-1 active:scale-95 shadow"
                      >
                        <Coins className="w-3 h-3" />
                        <span>{frame.price} Qızıl</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 4. Player Titles Tab */}
        {storeTab === 'titles' && (
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 pr-3 sm:p-5 sm:pr-4 pb-12 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PLAYER_TITLES.map((title) => {
              const isEquipped = currentEquippedTitle === title.id;
              const isUnlocked = currentUnlockedTitles.includes(title.id) || title.price === 0;

              return (
                <div
                  key={title.id}
                  className={`relative rounded-2xl p-4 border flex items-center justify-between gap-3 transition-all ${
                    isEquipped
                      ? 'bg-purple-950/40 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.2)]'
                      : 'bg-slate-800/60 border-slate-700/80 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl p-2 rounded-xl bg-black/40 border border-white/5 flex-shrink-0">
                      {title.icon || '🏆'}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span className="font-black text-white text-sm truncate">
                        {title.title[lang] || title.title.az}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border mt-1 inline-block w-fit ${title.badgeColor}`}>
                        Masa Titulu
                      </span>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {isEquipped ? (
                      <button
                        disabled
                        className="py-1.5 px-3 rounded-xl bg-purple-500/20 border border-purple-400/50 text-purple-300 text-xs font-bold flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Aktiv</span>
                      </button>
                    ) : isUnlocked ? (
                      <button
                        onClick={() => handleEquipTitle(title.id)}
                        className="py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition active:scale-95"
                      >
                        Seç
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBuyTitle(title)}
                        className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 text-slate-950 text-xs font-black transition flex items-center gap-1 active:scale-95 shadow"
                      >
                        <Coins className="w-3 h-3" />
                        <span>{title.price}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 5. Table Themes Tab */}
        {storeTab === 'tables' && (
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 pr-3 sm:p-5 sm:pr-4 pb-12 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {TABLE_THEMES.map((theme) => {
              const isEquipped = currentEquippedTable === theme.id;

              return (
                <div
                  key={theme.id}
                  className={`relative rounded-2xl p-4 border flex flex-col justify-between transition-all ${
                    isEquipped
                      ? 'bg-teal-950/40 border-teal-400 shadow-[0_0_20px_rgba(45,212,191,0.2)]'
                      : 'bg-slate-800/60 border-slate-700/80 hover:border-slate-600'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <h3 className="font-bold text-white text-sm">
                        {theme.name[lang] || theme.name.az}
                      </h3>
                      <div
                        className="w-5 h-5 rounded-full border border-white/30 shadow"
                        style={{ backgroundColor: theme.previewColor }}
                      />
                    </div>
                    <p className="text-xs text-slate-300 mb-3">
                      {theme.desc[lang] || theme.desc.az}
                    </p>

                    {/* Table Felt Swatch Preview */}
                    <div className={`h-24 rounded-xl ${theme.feltClass} border-4 ${theme.railBorderClass} relative shadow-inner overflow-hidden flex items-center justify-center`}>
                      <span className="text-xs font-bold text-white/50 tracking-wider uppercase select-none">
                        {theme.patternType}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3">
                    {isEquipped ? (
                      <button
                        disabled
                        className="w-full py-1.5 rounded-xl bg-teal-500/20 border border-teal-400/50 text-teal-300 text-xs font-bold flex items-center justify-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Masada İstifadə Olunur</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEquipTableTheme(theme.id)}
                        className="w-full py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition active:scale-95 shadow"
                      >
                        Bu Örtüyü Seç
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
