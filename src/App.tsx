import React, { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react';
import {
  GameMode,
  Language,
  Player,
  TileData,
  DominoSkin,
  PlayerStats,
  GameVariant
} from './types/domino';
import {
  Match101State,
  createInitial101State,
  findFirstHandStarter101,
  process101Round,
  getMinBoneyardReserve
} from './utils/domino101Logic';
import { DOMINO_SKINS } from './data/skins';
import { translations } from './i18n/translations';
import {
  createDominoSet,
  dealHands,
  findFirstHandStarter,
  roundUpTo5,
  sumHandPips,
  checkHandReshuffle,
  evaluateBaglandiWinner,
  getMatchCoinReward
} from './utils/dominoLogic';
import {
  GameBoard,
  BranchId,
  createInitialBoard,
  placeFirstTile,
  placeTileOnBranch,
  getPlayableBranches,
  isBoardGloballyBlocked,
  isHandBlockedAfterPlay
} from './utils/boardEngine';
import { selectBestAIMove, pickAIPersonas } from './utils/aiPlayer';
import { sounds } from './utils/sound';
import {
  loadPlayerStats,
  savePlayerStats,
  checkDailyClaim,
  GoogleUserProfile,
  loadGoogleUser,
  saveGoogleUser,
  syncWithCloud,
  isGuestNoticeDismissed,
  setGuestNoticeDismissed,
  PRODUCTION_SERVER_URL,
  getBackendServerUrl,
  AppThemeMode,
  loadAppThemeMode,
  saveAppThemeMode
} from './utils/storage';

import { triggerHaptic } from './utils/haptics';
import { App as CapApp } from '@capacitor/app';
import { Browser as CapBrowser } from '@capacitor/browser';
import { DEFAULT_TABLE_THEME_ID } from './data/tableThemes';
import { TABLE_GIFTS, TableGiftDef } from './data/tableGifts';
const TeahousesModal = lazy(() => import('./components/TeahousesModal').then((m) => ({ default: m.TeahousesModal })));
import { TableGiftPicker } from './components/TableGiftPicker';
import { TableGiftAnimationOverlay, ActiveGiftAnimation } from './components/TableGiftAnimationOverlay';
import { BoardView } from './components/BoardView';
import { FloatingScoreOverlay, FloatingScoreItem } from './components/FloatingScoreOverlay';
const FriendsModal = lazy(() => import('./components/FriendsModal').then((m) => ({ default: m.FriendsModal })));
import {
  loadRecentPlayers,
  isBotName,
  FriendItem,
  loadFriends,
  saveFriends
} from './utils/friendsStorage';
import { getMyPlayerIdentity } from './utils/playerIdentity';
import { ScoreBoard } from './components/ScoreBoard';
import { PlayerControls } from './components/PlayerControls';
import { DominoTile } from './components/DominoTile';
const StoreModal = lazy(() => import('./components/StoreModal').then((m) => ({ default: m.StoreModal })));
const DailyRewardModal = lazy(() => import('./components/DailyRewardModal').then((m) => ({ default: m.DailyRewardModal })));
import { DailyTeahouseChestWidget } from './components/DailyTeahouseChestWidget';
const RulesModal = lazy(() => import('./components/RulesModal').then((m) => ({ default: m.RulesModal })));
const GameEndModal = lazy(() => import('./components/GameEndModal').then((m) => ({ default: m.GameEndModal })));
import { AzerbaijanLogo } from './components/AzerbaijanLogo';
import { BazaarTray } from './components/BazaarTray';
import { AvatarView } from './components/AvatarView';
import { DEFAULT_AVATAR_ID } from './data/avatars';
const MultiplayerLobbyModal = lazy(() => import('./components/MultiplayerLobbyModal').then((m) => ({ default: m.MultiplayerLobbyModal })));
import { TeahouseChatOverlay } from './components/TeahouseChatOverlay';
const GoogleAuthModal = lazy(() => import('./components/GoogleAuthModal').then((m) => ({ default: m.GoogleAuthModal })));
const ApkAuthBridgeView = lazy(() => import('./components/ApkAuthBridgeView').then((m) => ({ default: m.ApkAuthBridgeView })));
import {
  multiplayerSocket,
  FriendRequestPayload,
  RoomInvitePayload,
  SocialSyncState
} from './services/multiplayerSocket';
import {
  initializeAdMob,
  maybeShowMatchEndInterstitial,
  setLobbyBannerVisible,
  showRewardedCoinsAd,
  subscribeBannerHeight,
  REWARDED_AD_COINS_AMOUNT,
  type RewardedAdResult
} from './services/adMobService';
import {
  MultiplayerRoomSummary,
  MultiplayerClientGameState,
  ChatMessage
} from './types/multiplayer';
import { DoubleComboMove, findDoubleCombos } from './utils/comboEngine';
import {
  TUTORIAL_SEEN_KEY,
  createTutorialSetup,
  getTutorialBotMove,
  getTutorialCopy,
  getTutorialStep
} from './utils/tutorialScenario';
import {
  DEFAULT_RANKED_MMR,
  calculateEloUpdate,
  getTeahouseTierById
} from './data/teahouses';
import { unlockPlayAchievement, checkRankAchievements } from './services/playGamesAchievements';

import {
  Coins,
  ShoppingBag,
  Gift,
  BookOpen,
  GraduationCap,
  Volume2,
  VolumeX,
  LogOut,
  Play,
  RotateCcw,
  Sparkles,
  Globe,
  Clock,
  ShieldAlert,
  Users,
  Trophy,
  X,
  ChevronRight,
  CheckCircle
} from 'lucide-react';

export const App: React.FC = () => {
  // Global settings & Stats
  const [lang, setLang] = useState<Language>('az');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [stats, setStats] = useState<PlayerStats>(loadPlayerStats);

  // Modals
  const [showStore, setShowStore] = useState<boolean>(false);
  const [storeInitialTab, setStoreInitialTab] = useState<'skins' | 'avatars'>('skins');
  const [showDailyReward, setShowDailyReward] = useState<boolean>(false);
  const [showRules, setShowRules] = useState<boolean>(false);
  const [showGameEnd, setShowGameEnd] = useState<boolean>(false);
  const [isTutorialMode, setIsTutorialMode] = useState<boolean>(false);
  const [tutorialCompleted, setTutorialCompleted] = useState<boolean>(false);
  const [showTutorialPrompt, setShowTutorialPrompt] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const p = new URLSearchParams(window.location.search).get('apk_auth');
      if (p) return false;
      return localStorage.getItem(TUTORIAL_SEEN_KEY) !== '1';
    } catch {
      return false;
    }
  });
  const [apkAuthSessionId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const p = new URLSearchParams(window.location.search).get('apk_auth');
    return p ? p.trim() : null;
  });
  const [showGoogleAuthModal, setShowGoogleAuthModal] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(new URLSearchParams(window.location.search).get('apk_auth'));
  });
  const [openBugReportOnProfile, setOpenBugReportOnProfile] = useState(false);
  const [appTheme, setAppTheme] = useState<AppThemeMode>(loadAppThemeMode);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (appTheme === 'light') {
        root.classList.add('theme-light');
        root.setAttribute('data-theme', 'light');
      } else {
        root.classList.remove('theme-light');
        root.removeAttribute('data-theme');
      }
    }
    saveAppThemeMode(appTheme);
  }, [appTheme]);

  // Google User & Cloud Sync State
  const [googleUser, setGoogleUser] = useState<GoogleUserProfile | null>(loadGoogleUser);
  const [showGuestWarning, setShowGuestWarning] = useState<boolean>(
    !loadGoogleUser() && !isGuestNoticeDismissed()
  );
  const [betaGiftModal, setBetaGiftModal] = useState<{ amount: number; message: string } | null>(null);

  // Active Game State
  const [inGame, setInGame] = useState<boolean>(false);
  const [mode, setMode] = useState<GameMode>('4p_duo');
  const [players, setPlayers] = useState<Player[]>([]);
  const [board, setBoard] = useState<GameBoard>(createInitialBoard);
  const [boneyard, setBoneyard] = useState<TileData[]>([]);
  const [currentTurn, setCurrentTurn] = useState<number>(0);
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [selectedTile, setSelectedTile] = useState<TileData | null>(null);
  const [forcedTile, setForcedTile] = useState<TileData | null>(null);
  const [consecutivePasses, setConsecutivePasses] = useState<number>(0);
  const [lastScoredPoints, setLastScoredPoints] = useState<{
    playerName: string;
    points: number;
  } | null>(null);

  // Drag and Drop State
  const [draggedTile, setDraggedTile] = useState<TileData | null>(null);
  const [hoveredBranch, setHoveredBranch] = useState<BranchId | null>(null);
  const dragOverlayRef = useRef<HTMLDivElement | null>(null);
  const dragInitialPointRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // End of Hand Reveal & Calculation State
  const [handRevealed, setHandRevealed] = useState<boolean>(false);
  const [revealPhase, setRevealPhase] = useState<0 | 1 | 2>(0);
  const [rawBonusPoints, setRawBonusPoints] = useState<number>(0);

  // End of Hand / Match Data
  const [isBaglandi, setIsBaglandi] = useState<boolean>(false);
  const [baglandiOver365Restart, setBaglandiOver365Restart] = useState<boolean>(false);
  const [winnerIndex, setWinnerIndex] = useState<number>(0);
  const [winnerTeam, setWinnerTeam] = useState<1 | 2>(1);
  const [handBonusPoints, setHandBonusPoints] = useState<number>(0);
  const [isMatchOver, setIsMatchOver] = useState<boolean>(false);
  const [isInstant35, setIsInstant35] = useState<boolean>(false);
  const [reshuffleNotice, setReshuffleNotice] = useState<string | null>(null);
  const [lastTilePlacedPlayerIndex, setLastTilePlacedPlayerIndex] = useState<number>(0);
  const [nextHandStarterIndex, setNextHandStarterIndex] = useState<number>(0);

  // 101 Game Mode State
  const [gameVariant, setGameVariant] = useState<GameVariant>('101');
  const [match101State, setMatch101State] = useState<Match101State>(createInitial101State);
  const [is101Seka, setIs101Seka] = useState<boolean>(false);
  const [is101AyazCaught, setIs101AyazCaught] = useState<boolean>(false);

  // In Telefon 365, Double Combo is a permanent default rule; in 101 mode it never exists.
  const allowDoubleCombo = gameVariant === '365';

  // Multiplayer State
  const [showMultiplayerLobby, setShowMultiplayerLobby] = useState<boolean>(false);
  const [isMultiplayer, setIsMultiplayer] = useState<boolean>(false);
  const [mpRoom, setMpRoom] = useState<MultiplayerRoomSummary | null>(null);
  const [mpGameState, setMpGameState] = useState<MultiplayerClientGameState | null>(null);
  const [mpChatMessages, setMpChatMessages] = useState<ChatMessage[]>([]);
  const [mpMyIndex, setMpMyIndex] = useState<number>(0);
  const [mpIsHost, setMpIsHost] = useState<boolean>(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [isAutoJoining, setIsAutoJoining] = useState<boolean>(false);

  // Teahouse Rooms & Interactive Table Gifts State
  const [showTeahousesModal, setShowTeahousesModal] = useState<boolean>(false);
  const [showRankedForfeitConfirm, setShowRankedForfeitConfirm] = useState<boolean>(false);
  const [showFriendsModal, setShowFriendsModal] = useState<boolean>(false);
  const [incomingFriendRequests, setIncomingFriendRequests] = useState<FriendRequestPayload[]>([]);
  const [outgoingFriendRequestIds, setOutgoingFriendRequestIds] = useState<string[]>([]);
  const [incomingRoomInvite, setIncomingRoomInvite] = useState<RoomInvitePayload | null>(null);
  const [socialBanner, setSocialBanner] = useState<string | null>(null);
  const [isQuickMatching, setIsQuickMatching] = useState<boolean>(false);
  const [giftTargetPlayer, setGiftTargetPlayer] = useState<{ index: number; name: string; isBot?: boolean; playerTag?: string; playerId?: string } | null>(null);
  const [activeGiftAnimation, setActiveGiftAnimation] = useState<ActiveGiftAnimation | null>(null);
  const [floatingScore, setFloatingScore] = useState<FloatingScoreItem | null>(null);
  const [isScreenShaking, setIsScreenShaking] = useState<boolean>(false);

  const statsRef = useRef<PlayerStats>(stats);
  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  const mpGameStateRef = useRef<MultiplayerClientGameState | null>(mpGameState);
  useEffect(() => {
    mpGameStateRef.current = mpGameState;
  }, [mpGameState]);

  const mpMyIndexRef = useRef<number>(mpMyIndex);
  useEffect(() => {
    mpMyIndexRef.current = mpMyIndex;
  }, [mpMyIndex]);

  const langRef = useRef<Language>(lang);
  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  const googleUserRef = useRef<GoogleUserProfile | null>(googleUser);
  useEffect(() => {
    googleUserRef.current = googleUser;
  }, [googleUser]);

  const creditedGiftIdsRef = useRef<Set<string>>(new Set());
  const giftCoinsReceivedMatchRef = useRef<{ roomCode: string; count: number }>({
    roomCode: '',
    count: 0
  });

  const watchedRewardedOnCurrentMatchEndRef = useRef<boolean>(false);
  const [lobbyBannerHeight, setLobbyBannerHeight] = useState<number>(0);

  // Track viewport orientation & portrait board stage box so portrait mode renders a 1:1 framed table
  const [viewportSize, setViewportSize] = useState<{ w: number; h: number }>(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 1024,
    h: typeof window !== 'undefined' ? window.innerHeight : 768
  }));
  const boardStageRef = useRef<HTMLDivElement | null>(null);
  const [boardStageSize, setBoardStageSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  // Use the clean 1:1 framed square table layout across portrait, tablet, and desktop viewports
  const isPortraitMatch = inGame;
  const portraitBoardSide =
    isPortraitMatch && boardStageSize.w > 0 && boardStageSize.h > 0
      ? Math.max(180, Math.floor(Math.min(boardStageSize.w - 8, boardStageSize.h - 14)))
      : 0;

  useEffect(() => {
    const updateViewport = () => {
      setViewportSize({ w: window.innerWidth, h: window.innerHeight });
    };
    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);
    return () => {
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
    };
  }, []);

  useEffect(() => {
    if (!inGame || !isPortraitMatch || !boardStageRef.current) {
      setBoardStageSize({ w: 0, h: 0 });
      return;
    }
    const el = boardStageRef.current;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setBoardStageSize({
          w: entry.contentRect.width,
          h: entry.contentRect.height
        });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [inGame, isPortraitMatch, players.length, mpGameState?.players?.length]);

  const shouldShowLobbyBanner =
    !inGame &&
    !showStore &&
    !showDailyReward &&
    !showRules &&
    !showMultiplayerLobby &&
    !showTeahousesModal &&
    !showFriendsModal &&
    !showGoogleAuthModal &&
    !apkAuthSessionId;

  useEffect(() => {
    void initializeAdMob();
    return subscribeBannerHeight(setLobbyBannerHeight);
  }, []);

  useEffect(() => {
    void setLobbyBannerVisible(shouldShowLobbyBanner);
  }, [shouldShowLobbyBanner]);

  useEffect(() => {
    if (inGame && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, [inGame]);

  // Listen for native deep link appUrlOpen (dominoaz://auth) from system browser after Google Sign-In
  // and suspend/resume WebAudio DSP & background resources when app goes to background to save mobile battery.
  useEffect(() => {
    let removed = false;
    let urlListenerHandle: { remove: () => Promise<void> } | null = null;
    let stateListenerHandle: { remove: () => Promise<void> } | null = null;

    try {
      CapApp.addListener('appUrlOpen', async (data: { url: string }) => {
        if (!data?.url) return;
        try {
          await CapBrowser.close().catch(() => {});
        } catch {}

        try {
          let gId: string | null = null;
          let email: string | null = null;
          let name: string | null = null;
          let picture: string | null = null;
          let authToken: string | null = null;

          try {
            const parsed = new URL(data.url);
            gId = parsed.searchParams.get('googleId');
            email = parsed.searchParams.get('email');
            name = parsed.searchParams.get('name');
            picture = parsed.searchParams.get('picture');
            authToken = parsed.searchParams.get('authToken');
          } catch {
            const raw = data.url.replace('dominoaz://auth', 'https://dummy.local');
            try {
              const parsed = new URL(raw);
              gId = parsed.searchParams.get('googleId');
              email = parsed.searchParams.get('email');
              name = parsed.searchParams.get('name');
              picture = parsed.searchParams.get('picture');
              authToken = parsed.searchParams.get('authToken');
            } catch {
              const qStr = data.url.includes('?') ? data.url.split('?')[1] : '';
              const sp = new URLSearchParams(qStr);
              gId = sp.get('googleId');
              email = sp.get('email');
              name = sp.get('name');
              picture = sp.get('picture');
              authToken = sp.get('authToken');
            }
          }

          if (gId && email) {
            const userProfile: GoogleUserProfile = {
              googleId: gId,
              email,
              name: name || 'Google Oyunçusu',
              picture: picture || undefined,
              authToken: authToken || undefined,
              signedInAt: Date.now()
            };
            saveGoogleUser(userProfile);
            setGoogleUser(userProfile);
            setShowGuestWarning(false);
            setShowGoogleAuthModal(false);
            triggerHaptic('success');
            syncWithCloud(userProfile, statsRef.current, true).then((synced) => {
              if (synced) setStats(synced);
            });
          }
        } catch (err) {
          console.warn('Failed to parse incoming deep link auth:', err);
        }
      })
        .then((h) => {
          if (removed) h.remove().catch(() => {});
          else urlListenerHandle = h;
        })
        .catch(() => {});
    } catch {}

    // Periodically or upon resume check if a mobile external browser Google Auth session was completed
    const checkPendingMobileAuth = async () => {
      try {
        const pendingSession = localStorage.getItem('az_domino_pending_auth_session');
        if (!pendingSession) return;
        const sessionTime = Number(localStorage.getItem('az_domino_pending_auth_time') || 0);
        if (Date.now() - sessionTime > 10 * 60 * 1000) {
          try {
            localStorage.removeItem('az_domino_pending_auth_session');
            localStorage.removeItem('az_domino_pending_auth_time');
          } catch {}
          return;
        }
        const baseUrl = getBackendServerUrl() || PRODUCTION_SERVER_URL;
        const res = await fetch(`${baseUrl}/api/apk-auth/${encodeURIComponent(pendingSession)}?t=${Date.now()}`);
        const ct = res.headers.get('content-type') || '';
        if (res.ok && ct.includes('application/json')) {
          const data = await res.json();
          if (data?.authenticated && data?.user) {
            try {
              localStorage.removeItem('az_domino_pending_auth_session');
              localStorage.removeItem('az_domino_pending_auth_time');
            } catch {}
            try {
              await CapBrowser.close().catch(() => {});
            } catch {}
            saveGoogleUser(data.user);
            setGoogleUser(data.user);
            setShowGuestWarning(false);
            setShowGoogleAuthModal(false);
            triggerHaptic('success');
            syncWithCloud(data.user, statsRef.current, true).then((synced) => {
              if (synced) setStats(synced);
            });
          }
        }
      } catch (e) {
        // Transient network error
      }
    };

    // Initial check on mount
    checkPendingMobileAuth();

    try {
      CapApp.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          sounds.resume();
          checkPendingMobileAuth();
          setTimeout(checkPendingMobileAuth, 1200);
        } else {
          sounds.suspend();
        }
      })
        .then((h) => {
          if (removed) h.remove().catch(() => {});
          else stateListenerHandle = h;
        })
        .catch(() => {});
    } catch {}

    const handleVisibilityChange = () => {
      if (document.hidden) {
        sounds.suspend();
      } else {
        sounds.resume();
        checkPendingMobileAuth();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      removed = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (urlListenerHandle) urlListenerHandle.remove().catch(() => {});
      if (stateListenerHandle) stateListenerHandle.remove().catch(() => {});
    };
  }, []);

  // Setup multiplayer socket events & query param auto-join / session reconnection
  useEffect(() => {
    // Check saved session in localStorage to survive F5 / page reloads
    try {
      const savedSessionRaw = localStorage.getItem('domino_mp_session');
      if (savedSessionRaw) {
        const session = JSON.parse(savedSessionRaw);
        if (session && session.roomCode && session.sessionToken) {
          setShowMultiplayerLobby(true);
          setMpIsHost(Boolean(session.isHost));
          multiplayerSocket
            .reconnectRoom(session.roomCode, session.sessionToken)
            .then((res) => {
              if (res.success) {
                if (res.summary) setMpRoom(res.summary);
                if (typeof res.myPlayerIndex === 'number') {
                  setMpMyIndex(res.myPlayerIndex);
                }
                if (typeof res.isHost === 'boolean') {
                  setMpIsHost(res.isHost);
                }
                if (res.gameState && res.gameState.status === 'in_game') {
                  setMpGameState(res.gameState);
                  setIsMultiplayer(true);
                  setInGame(true);
                  setShowMultiplayerLobby(false);
                }
              } else {
                localStorage.removeItem('domino_mp_session');
              }
            })
            .catch(() => {
              localStorage.removeItem('domino_mp_session');
            });
        }
      } else if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);

        // Check incoming friend invite link (?friend_id=DOM-XXXX&name=Murad)
        const friendId = params.get('friend_id') || params.get('add_friend');
        if (friendId) {
          const friendName = decodeURIComponent(params.get('name') || 'Dost');
          const friendTag = params.get('tag') || undefined;
          const myId = getMyPlayerIdentity(googleUser, statsRef.current);
          multiplayerSocket
            .sendFriendRequest({
              from: {
                playerId: myId.id,
                playerTag: myId.tag,
                name: myId.name,
                handle: myId.handle,
                avatarId: myId.avatarId,
                frameId: myId.frameId,
                title: myId.title,
                matchesWon: myId.matchesWon
              },
              toPlayerId: friendId,
              toPlayerTag: friendTag,
              toName: friendName
            })
            .then((res) => {
              if (res?.message) {
                setSocialBanner(res.message);
                setTimeout(() => setSocialBanner(null), 4000);
              }
            })
            .catch(() => {});
          setShowFriendsModal(true);
        }

        const code = (params.get('room') || params.get('invite') || '').trim().toUpperCase();
        if (code) {
          setShowMultiplayerLobby(true);
          setInviteCode(code);
          setIsAutoJoining(true);

          let savedName = '';
          try {
            savedName = localStorage.getItem('domino_player_name') || '';
          } catch {}
          const resolvedName =
            googleUser?.name ||
            savedName ||
            `Qonaq ${Math.floor(100 + Math.random() * 900)}`;

          multiplayerSocket.connect();
          multiplayerSocket
            .joinRoom(
              code,
              resolvedName,
              stats.equippedSkin,
              stats.equippedAvatar || DEFAULT_AVATAR_ID
            )
            .then((res) => {
              setIsAutoJoining(false);
              if (res.success) {
                setMpIsHost(Boolean(res.isHost));
                if (res.roomCode && res.sessionToken) {
                  try {
                    localStorage.setItem(
                      'domino_mp_session',
                      JSON.stringify({
                        roomCode: res.roomCode,
                        sessionToken: res.sessionToken,
                        playerName: resolvedName,
                        isHost: res.isHost ?? false
                      })
                    );
                  } catch (e) {
                    console.error(e);
                  }
                }
                if (res.summary) {
                  setMpRoom(res.summary);
                  const mySocketId = multiplayerSocket.getSocket()?.id;
                  const mySlot = res.summary.players.find((p) => p.socketId === mySocketId);
                  if (mySlot) setMpMyIndex(mySlot.id);
                }
              } else {
                setInviteError(res.error || 'Otaq tapılmadı və ya artıq dolub.');
              }
            })
            .catch((err) => {
              setIsAutoJoining(false);
              setInviteError(err?.message || 'Otağa qoşulmaq mümkün olmadı');
            });
        }
      }
    } catch (e) {
      console.warn('Failed to restore multiplayer session:', e);
    }

    const unsubSummary = multiplayerSocket.onRoomSummary((summary) => {
      setMpRoom(summary);
      if (summary.variant) {
        setGameVariant(summary.variant);
      }
      let savedToken: string | undefined;
      try {
        const raw = localStorage.getItem('domino_mp_session');
        if (raw) savedToken = JSON.parse(raw)?.sessionToken;
      } catch {}

      const mySocketId = multiplayerSocket.getSocket()?.id;
      const mySlot = summary.players.find(
        (p) =>
          (savedToken && p.sessionToken === savedToken) ||
          (mySocketId && p.socketId === mySocketId)
      );
      if (mySlot) {
        setMpMyIndex(mySlot.id);
        if (mySlot.isHost) {
          setMpIsHost(true);
        }
      }
    });

    const unsubState = multiplayerSocket.onRoomState((state) => {
      if (state.variant) {
        setGameVariant(state.variant);
      }
      setMpGameState((prevState) => {
        if (
          state.lastScoredPoints &&
          (!prevState?.lastScoredPoints ||
            prevState.lastScoredPoints.points !== state.lastScoredPoints.points ||
            prevState.lastScoredPoints.playerName !== state.lastScoredPoints.playerName)
        ) {
          const pts = state.lastScoredPoints.points;
          const isInstant35 = pts === 35;
          setFloatingScore({
            id: `mp_sc_${Date.now()}_${Math.random()}`,
            points: pts,
            playerName: state.lastScoredPoints.playerName,
            isInstant35
          });
          if (pts >= 20 || isInstant35) {
            triggerHaptic('heavy');
            setIsScreenShaking(true);
            setTimeout(() => setIsScreenShaking(false), 450);
            sounds.playTileSlam();
          } else if (pts > 0) {
            triggerHaptic('medium');
            sounds.playScorePoints(pts);
          }
        }
        return state;
      });
      setMpMyIndex(state.myPlayerIndex);
      if (state.status === 'in_game') {
        setIsMultiplayer(true);
        setInGame(true);
        setShowMultiplayerLobby(false);

        // Record real multiplayer opponents to recent players
        if (state.players && state.players.length > 1) {
          try {
            const existing = loadRecentPlayers();
            const realOpponents = state.players
              .filter((p, idx) => idx !== state.myPlayerIndex && !p.isAI && p.name && !isBotName(p.name))
              .map((p) => {
                const cleanName = p.name.replace(/\s*\((Siz|Вы|You)\)\s*/g, '').trim();
                const tag = p.playerTag || undefined;
                return {
                  name: cleanName,
                  playerId: p.playerId || undefined,
                  playerTag: tag,
                  handle: tag ? `${cleanName}#${tag}` : undefined,
                  avatarId: p.avatarId || 'avatar_tea_master',
                  frameId: p.frameId || undefined,
                  title: p.title || undefined,
                  date: new Date().toLocaleDateString('az-AZ'),
                  isRealPlayer: true
                };
              });
            if (realOpponents.length > 0) {
              const merged = [
                ...realOpponents,
                ...existing.filter(
                  (e) =>
                    !realOpponents.some(
                      (r) =>
                        (r.playerId && e.playerId && r.playerId === e.playerId) ||
                        r.name.toLowerCase() === e.name.toLowerCase()
                    )
                )
              ].slice(0, 15);
              localStorage.setItem('domino_recent_players', JSON.stringify(merged));
            }
          } catch (e) {
            console.error(e);
          }
        }
      } else if (state.status === 'finished') {
        setShowGameEnd(true);
      }
    });

    const unsubChat = multiplayerSocket.onChatMessage((msg) => {
      setMpChatMessages((prev) => [...prev.slice(-30), msg]);

      // Detect Table Gift Projectile Event
      if (msg.emoji && msg.emoji.startsWith('gift:')) {
        const parts = msg.emoji.split(':');
        const giftId = parts[1];
        const targetIdx = parseInt(parts[2] || '0', 10);
        const targetPlayerId = parts[3] || '';
        const gift = TABLE_GIFTS.find((g) => g.id === giftId);
        if (gift) {
          setActiveGiftAnimation({
            id: msg.id,
            gift,
            senderName: msg.senderName,
            senderIndex: msg.senderIndex,
            targetIndex: isNaN(targetIdx) ? 0 : targetIdx
          });

          // Credit 50% of paid gift cost to human recipient (max 5 gifts per match)
          const curMpState = mpGameStateRef.current;
          const myIdx = curMpState?.myPlayerIndex ?? mpMyIndexRef.current;
          const myIdentity = getMyPlayerIdentity(googleUserRef.current, statsRef.current);
          const senderPlayer = curMpState?.players?.[msg.senderIndex];
          const rewardCoins = Math.floor(gift.cost * 0.5);
          const isRecipient =
            msg.senderIndex !== myIdx &&
            (targetIdx === myIdx ||
              (Boolean(targetPlayerId) && targetPlayerId === myIdentity.id) ||
              ((curMpState?.players?.length ?? 0) === 2 && msg.senderIndex !== myIdx));
          if (
            rewardCoins > 0 &&
            curMpState &&
            isRecipient &&
            senderPlayer &&
            !senderPlayer.isAI &&
            !creditedGiftIdsRef.current.has(msg.id)
          ) {
            if (giftCoinsReceivedMatchRef.current.roomCode !== curMpState.roomCode) {
              giftCoinsReceivedMatchRef.current = { roomCode: curMpState.roomCode, count: 0 };
            }
            if (giftCoinsReceivedMatchRef.current.count < 5) {
              creditedGiftIdsRef.current.add(msg.id);
              giftCoinsReceivedMatchRef.current.count += 1;
              handleUpdateStatsRef.current({
                ...statsRef.current,
                coins: statsRef.current.coins + rewardCoins
              });
              const curLang = langRef.current;
              const giftMsg =
                curLang === 'az'
                  ? `🎁 ${msg.senderName} sizə hədiyyə göndərdi: +${rewardCoins} sikkə!`
                  : curLang === 'ru'
                    ? `🎁 ${msg.senderName} отправил(а) вам подарок: +${rewardCoins} монет!`
                    : `🎁 ${msg.senderName} sent you a gift: +${rewardCoins} coins!`;
              showTemporarySocialBanner(giftMsg);
            }
          }
        }
      }
    });

    return () => {
      unsubSummary();
      unsubState();
      unsubChat();
    };
  }, []);

  // In multiplayer, show GameEndModal automatically after the reveal animation or match end
  useEffect(() => {
    const mpEnded =
      Boolean(mpGameState?.handRevealed) ||
      Boolean(mpGameState?.isMatchOver) ||
      mpGameState?.status === 'finished';
    if (isMultiplayer && mpEnded) {
      const delay = mpGameState?.isInstant35 ? 650 : 1600;
      const timer = setTimeout(() => {
        setShowGameEnd(true);
      }, delay);
      return () => clearTimeout(timer);
    } else if (isMultiplayer && !mpEnded) {
      setShowGameEnd(false);
    }
  }, [
    isMultiplayer,
    mpGameState?.handRevealed,
    mpGameState?.isMatchOver,
    mpGameState?.status,
    mpGameState?.isInstant35,
    mpGameState?.roundNumber
  ]);

  const chargedTeahouseMatchRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isMultiplayer || !mpGameState || mpGameState.status !== 'in_game' || !mpGameState.isRanked || !mpGameState.teahouseBuyIn) {
      return;
    }
    if (chargedTeahouseMatchRef.current === mpGameState.roomCode) return;
    const storageKey = `domino_charged_teahouse_${mpGameState.roomCode}`;
    try {
      if (localStorage.getItem(storageKey) === '1') {
        chargedTeahouseMatchRef.current = mpGameState.roomCode;
        return;
      }
      localStorage.setItem(storageKey, '1');
    } catch {
      // ignore storage errors
    }
    chargedTeahouseMatchRef.current = mpGameState.roomCode;
    const buyIn = mpGameState.teahouseBuyIn;
    handleUpdateStats({
      ...statsRef.current,
      coins: Math.max(0, statsRef.current.coins - buyIn)
    });
  }, [isMultiplayer, mpGameState?.status, mpGameState?.roomCode]);

  const awardedMpMatchRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isMultiplayer || !mpGameState?.isMatchOver) {
      awardedMpMatchRef.current = null;
      return;
    }
    const matchKey = `${mpGameState.roomCode}:${mpGameState.roundNumber}`;
    if (awardedMpMatchRef.current === matchKey) return;
    awardedMpMatchRef.current = matchKey;

    const myIdx = mpGameState.myPlayerIndex ?? 0;
    const mySlot = mpGameState.players[myIdx];
    const myTeam = mySlot?.team ?? 1;
    let mpUserWon: boolean;

    if (mpGameState.mode === '4p_duo') {
      const winTeam =
        mpGameState.players[mpGameState.matchWinnerIndex]?.team ??
        mpGameState.handResults?.winnerTeam ??
        1;
      mpUserWon = winTeam === myTeam;
    } else {
      mpUserWon = mpGameState.matchWinnerIndex === myIdx;
    }

    if (mpUserWon) {
      if (mpGameState.isRanked) {
        unlockPlayAchievement('cayxana_winner');
      }
      if (mpGameState.isInstant35) {
        unlockPlayAchievement('ejdaha_35');
      }
      const opponents = mpGameState.players.filter((p, idx) =>
        mpGameState.mode === '4p_duo' ? p.team !== myTeam : idx !== myIdx
      );
      if (
        (mySlot?.score ?? 0) > 0 &&
        opponents.length > 0 &&
        opponents.every((p) => (p.score ?? 0) === 0)
      ) {
        unlockPlayAchievement('sehra_aslani_dry');
      }
    }

    if (mpGameState.isRanked && mpGameState.teahousePrizePot) {
      // Ranked Çayxana match: award 90% pot on win + update Chess.com-style Elo MMR
      const oppSlot = mpGameState.players.find((_, idx) => idx !== myIdx);
      const myMmr = statsRef.current.mmr ?? DEFAULT_RANKED_MMR;
      const oppMmr = oppSlot?.mmr ?? DEFAULT_RANKED_MMR;
      const rankedPlayed = statsRef.current.rankedPlayed ?? 0;
      const rankedWon = statsRef.current.rankedWon ?? 0;
      const { nextMmr } = calculateEloUpdate(myMmr, oppMmr, mpUserWon, rankedPlayed);
      const prize = mpUserWon ? mpGameState.teahousePrizePot : 0;

      triggerHaptic('success');
      if (mpUserWon) sounds.playCoinChime();
      recordRecentOpponents(players);
      handleUpdateStats({
        ...statsRef.current,
        coins: statsRef.current.coins + prize,
        matchesPlayed: statsRef.current.matchesPlayed + 1,
        matchesWon: statsRef.current.matchesWon + (mpUserWon ? 1 : 0),
        mmr: nextMmr,
        rankedPlayed: rankedPlayed + 1,
        rankedWon: rankedWon + (mpUserWon ? 1 : 0)
      });
    } else {
      awardMatchCoins(mpUserWon, mpGameState.variant || '365', Boolean(mpGameState.hadHumanOpponentLeave));
    }
  }, [isMultiplayer, mpGameState?.isMatchOver, mpGameState?.roomCode, mpGameState?.roundNumber]);

  const handleCreateRoom = async (
    roomMode: GameMode,
    playerName: string,
    isLocked?: boolean,
    turnDuration?: number,
    roomVariant: GameVariant = gameVariant
  ) => {
    const myId = getMyPlayerIdentity(googleUser, stats);
    const res = await multiplayerSocket.createRoom(
      roomMode,
      playerName,
      stats.equippedSkin,
      stats.equippedAvatar || DEFAULT_AVATAR_ID,
      undefined,
      isLocked,
      turnDuration,
      myId.id,
      myId.tag,
      stats.equippedFrame,
      stats.equippedTitle,
      roomVariant
    );
    if (!res.success) {
      throw new Error(res.error || 'Otaq yaradıla bilmədi');
    }
    setGameVariant(roomVariant);
    setMpIsHost(true);
    if (res.roomCode && res.sessionToken) {
      try {
        localStorage.setItem(
          'domino_mp_session',
          JSON.stringify({
            roomCode: res.roomCode,
            sessionToken: res.sessionToken,
            playerName,
            isHost: true
          })
        );
        window.history.replaceState(null, '', `?room=${res.roomCode}`);
      } catch (e) {
        console.error(e);
      }
    }
    if (res.summary) {
      setMpRoom(res.summary);
      const mySocketId = multiplayerSocket.getSocket()?.id;
      const mySlot = res.summary.players.find((p) => p.socketId === mySocketId);
      if (mySlot) setMpMyIndex(mySlot.id);
    }
    return res.roomCode;
  };

  const handleJoinRoom = async (roomCode: string, playerName: string) => {
    const myId = getMyPlayerIdentity(googleUser, stats);
    const res = await multiplayerSocket.joinRoom(
      roomCode,
      playerName,
      stats.equippedSkin,
      stats.equippedAvatar || DEFAULT_AVATAR_ID,
      undefined,
      myId.id,
      myId.tag,
      stats.equippedFrame,
      stats.equippedTitle
    );
    if (!res.success) {
      throw new Error(res.error || 'Otağa qoşulmaq mümkün olmadı');
    }
    setMpIsHost(Boolean(res.isHost));
    if (res.roomCode && res.sessionToken) {
      try {
        localStorage.setItem(
          'domino_mp_session',
          JSON.stringify({
            roomCode: res.roomCode,
            sessionToken: res.sessionToken,
            playerName,
            isHost: res.isHost ?? false
          })
        );
        window.history.replaceState(null, '', `?room=${res.roomCode}`);
      } catch (e) {
        console.error(e);
      }
    }
    if (res.summary) {
      setMpRoom(res.summary);
      const mySocketId = multiplayerSocket.getSocket()?.id;
      const mySlot = res.summary.players.find((p) => p.socketId === mySocketId);
      if (mySlot) setMpMyIndex(mySlot.id);
    }
    return res.roomCode;
  };

  const handleQuickMatch = async (
    roomMode: GameMode,
    playerName: string,
    roomVariant: GameVariant = gameVariant
  ) => {
    const myId = getMyPlayerIdentity(googleUser, stats);
    const res = await multiplayerSocket.quickMatch(
      roomMode,
      playerName,
      stats.equippedSkin,
      stats.equippedAvatar || DEFAULT_AVATAR_ID,
      undefined,
      myId.id,
      myId.tag,
      stats.equippedFrame,
      stats.equippedTitle,
      roomVariant
    );
    if (!res.success) {
      throw new Error(res.error || 'Sürətli oyun tapılmadı');
    }
    setGameVariant(roomVariant);
    setMpIsHost(Boolean(res.isHost));
    if (res.roomCode && res.sessionToken) {
      try {
        localStorage.setItem(
          'domino_mp_session',
          JSON.stringify({
            roomCode: res.roomCode,
            sessionToken: res.sessionToken,
            playerName,
            isHost: res.isHost ?? false
          })
        );
        window.history.replaceState(null, '', `?room=${res.roomCode}`);
      } catch (e) {
        console.error(e);
      }
    }
    if (res.summary) {
      setMpRoom(res.summary);
      const mySocketId = multiplayerSocket.getSocket()?.id;
      const mySlot = res.summary.players.find((p) => p.socketId === mySocketId);
      if (mySlot) setMpMyIndex(mySlot.id);
    }
    setShowMultiplayerLobby(true);
    return res.roomCode;
  };

  const handleJoinTeahouse = async (tierId: string, teahouseVariant: GameVariant) => {
    const tier = getTeahouseTierById(tierId);
    if (!tier) throw new Error('Çayxana səviyyəsi tapılmadı');
    if (statsRef.current.coins < tier.buyIn) {
      throw new Error(`Bu masa üçün ən azı ${tier.buyIn} sikkə lazımdır!`);
    }

    multiplayerSocket.connect();
    const myId = getMyPlayerIdentity(googleUser, statsRef.current);
    const playerName = googleUser?.name || myId.name;
    const res = await multiplayerSocket.joinTeahouse({
      tierId,
      variant: teahouseVariant,
      playerName,
      skinId: statsRef.current.equippedSkin,
      avatarId: statsRef.current.equippedAvatar || DEFAULT_AVATAR_ID,
      playerId: myId.id,
      playerTag: myId.tag,
      frameId: statsRef.current.equippedFrame,
      title: statsRef.current.equippedTitle,
      mmr: statsRef.current.mmr ?? DEFAULT_RANKED_MMR
    });

    if (!res.success) {
      throw new Error(res.error || 'Çayxana masasına qoşulmaq mümkün olmadı');
    }

    setGameVariant(teahouseVariant);
    setMode('2p_solo');
    setIsMultiplayer(true);
    setMpIsHost(Boolean(res.isHost));
    if (res.roomCode && res.sessionToken) {
      try {
        localStorage.setItem(
          'domino_mp_session',
          JSON.stringify({
            roomCode: res.roomCode,
            sessionToken: res.sessionToken,
            playerName,
            isHost: res.isHost ?? false
          })
        );
      } catch {
        // ignore storage errors
      }
    }
    if (res.summary) {
      setMpRoom(res.summary);
      const mySocketId = multiplayerSocket.getSocket()?.id;
      const mySlot = res.summary.players.find((p) => p.socketId === mySocketId);
      if (mySlot) setMpMyIndex(mySlot.id);
    }
    setShowTeahousesModal(false);
    if (!res.autoStarted) {
      setShowMultiplayerLobby(true);
    }
  };

  const handleAddBot = async () => {
    const res = await multiplayerSocket.addBot();
    if (!res.success) {
      throw new Error(res.error || 'Bot əlavə edilə bilmədi');
    }
  };

  const handleToggleReady = (isReady: boolean) => {
    multiplayerSocket.setReady(isReady);
  };

  const handleStartGame = async () => {
    let token: string | undefined;
    try {
      const raw = localStorage.getItem('domino_mp_session');
      if (raw) token = JSON.parse(raw)?.sessionToken;
    } catch {}

    const res = await multiplayerSocket.startGame(mpRoom?.code, token);
    if (!res.success) {
      throw new Error(res.error || 'Oyunu başlatmaq mümkün olmadı');
    }
    setIsMultiplayer(true);
    setInGame(true);
    setShowMultiplayerLobby(false);
  };

  const handleLeaveRoom = () => {
    multiplayerSocket.leaveRoom();
    try {
      localStorage.removeItem('domino_mp_session');
      window.history.replaceState(null, '', window.location.pathname);
    } catch (e) {}
    setMpRoom(null);
    setMpGameState(null);
    setMpIsHost(false);
    setIsMultiplayer(false);
  };

  // Register live presence & sync two-way friends + room invites
  const showTemporarySocialBanner = (msg: string) => {
    setSocialBanner(msg);
    setTimeout(() => setSocialBanner(null), 4000);
  };

  const applySocialSyncState = (state: SocialSyncState) => {
    setIncomingFriendRequests(state.incomingRequests || []);
    setOutgoingFriendRequestIds(state.outgoingRequestIds || []);

    const localExisting = loadFriends();
    const notesById = new Map<string, string>();
    for (const lf of localExisting) {
      if (lf.note) notesById.set(lf.playerId, lf.note);
    }

    const merged: FriendItem[] = (state.friends || []).map((sf) => ({
      id: `fr_${sf.playerId}`,
      playerId: sf.playerId,
      playerTag: sf.playerTag,
      name: sf.name,
      handle: sf.handle || `${sf.name}#${sf.playerTag}`,
      avatarId: sf.avatarId,
      frameId: sf.frameId,
      title: sf.title,
      matchesWon: sf.matchesWon,
      isOnline: Boolean(sf.isOnline),
      isRealPlayer: true,
      note: notesById.get(sf.playerId),
      addedAt: new Date().toISOString()
    }));
    saveFriends(merged);
  };

  const refreshSocialState = async () => {
    try {
      const myId = getMyPlayerIdentity(googleUser, statsRef.current);
      const res = await multiplayerSocket.getSocialState(myId.id);
      if (res?.success) {
        applySocialSyncState(res);
      }
    } catch {}
  };

  useEffect(() => {
    const myId = getMyPlayerIdentity(googleUser, stats);
    multiplayerSocket.registerPresence({
      playerId: myId.id,
      playerTag: myId.tag,
      name: myId.name,
      handle: myId.handle,
      avatarId: myId.avatarId,
      frameId: myId.frameId,
      title: myId.title,
      matchesWon: myId.matchesWon
    });
  }, [
    googleUser?.googleId,
    googleUser?.name,
    stats.equippedAvatar,
    stats.equippedFrame,
    stats.equippedTitle,
    stats.matchesWon
  ]);

  useEffect(() => {
    const unsubSync = multiplayerSocket.onSocialSync((state) => {
      applySocialSyncState(state);
    });
    const unsubReq = multiplayerSocket.onFriendRequestReceived((req) => {
      triggerHaptic('medium');
      showTemporarySocialBanner(`🤝 ${req.from.name}#${req.from.playerTag} sizə dostluq sorğusu göndərdi!`);
    });
    const unsubAccepted = multiplayerSocket.onFriendRequestAccepted((data) => {
      triggerHaptic('success');
      showTemporarySocialBanner(`🎉 ${data.friend.name} dostluq sorğunuzu qəbul etdi!`);
    });
    const unsubInvite = multiplayerSocket.onRoomInviteReceived((invite) => {
      triggerHaptic('heavy');
      setIncomingRoomInvite(invite);
    });
    return () => {
      unsubSync();
      unsubReq();
      unsubAccepted();
      unsubInvite();
    };
  }, []);

  useEffect(() => {
    if (!incomingRoomInvite) return;
    const timer = setTimeout(() => {
      setIncomingRoomInvite(null);
    }, 30000);
    return () => clearTimeout(timer);
  }, [incomingRoomInvite]);

  const handleRespondFriendRequest = async (requestId: string, accept: boolean) => {
    const myId = getMyPlayerIdentity(googleUser, statsRef.current);
    const res = await multiplayerSocket.respondFriendRequest({
      playerId: myId.id,
      myProfile: {
        playerId: myId.id,
        playerTag: myId.tag,
        name: myId.name,
        handle: myId.handle,
        avatarId: myId.avatarId,
        frameId: myId.frameId,
        title: myId.title,
        matchesWon: myId.matchesWon
      },
      requestId,
      accept
    });
    if (res.success && accept) {
      showTemporarySocialBanner('🤝 Dostluq sorğusu qəbul edildi!');
    }
    await refreshSocialState();
  };

  const handleInviteFriend = async (friend: FriendItem) => {
    const myId = getMyPlayerIdentity(googleUser, statsRef.current);
    try {
      let targetRoomCode = mpRoom && mpRoom.status === 'waiting' ? mpRoom.code : undefined;
      if (!targetRoomCode) {
        targetRoomCode = await handleCreateRoom(
          '2p_solo',
          myId.name,
          true,
          undefined,
          gameVariant
        );
      }
      setShowMultiplayerLobby(true);

      if (!targetRoomCode) return;

      const invRes = await multiplayerSocket.inviteFriendToRoom({
        from: {
          playerId: myId.id,
          playerTag: myId.tag,
          name: myId.name,
          handle: myId.handle,
          avatarId: myId.avatarId,
          frameId: myId.frameId,
          title: myId.title,
          matchesWon: myId.matchesWon
        },
        targetPlayerId: friend.playerId,
        targetPlayerTag: friend.playerTag,
        targetName: friend.name,
        roomCode: targetRoomCode
      });

      if (invRes.success) {
        showTemporarySocialBanner(`📩 ${friend.name} adlı dosta oyun dəvəti göndərildi!`);
      } else {
        showTemporarySocialBanner(invRes.error || `Otaq hazırdır: ${targetRoomCode}`);
      }
    } catch (e: any) {
      showTemporarySocialBanner(e?.message || 'Otaq yaradılarkən xəta baş verdi.');
    }
  };

  // Send interactive table gift (armudu tea, tomato splatter, baklava, etc.)
  const handleSendTableGift = (gift: TableGiftDef, targetIndex: number) => {
    const curStats = statsRef.current;
    if (curStats.coins < gift.cost) return;

    if (gift.cost > 0) {
      handleUpdateStats({
        ...curStats,
        coins: Math.max(0, curStats.coins - gift.cost)
      });
    }

    const myName = effectivePlayers[localPlayerIndex]?.name || 'Sən';

    // Local animated projectile & impact
    setActiveGiftAnimation({
      id: Date.now().toString(),
      gift,
      senderName: myName,
      senderIndex: localPlayerIndex,
      targetIndex
    });

    // In multiplayer: broadcast event via chat channel
    if (effectiveInMultiplayer) {
      const targetPlayerId =
        giftTargetPlayer?.playerId ||
        (mpGameStateRef.current?.players?.[targetIndex] as any)?.playerId ||
        '';
      multiplayerSocket.sendChat(undefined, `gift:${gift.id}:${targetIndex}:${targetPlayerId}`);
    } else {
      // In singleplayer: bot humorous response
      const targetP = effectivePlayers[targetIndex];
      if (targetP && targetP.isAI) {
        setTimeout(() => {
          let botReply = '';
          if (gift.impactType === 'steam') {
            botReply = 'Çox sağ ol qardaş, çay yerinə düşdü! ☕';
          } else if (gift.impactType === 'splash_red') {
            botReply = 'Ə pomidoru niyə atırsan, daşını oyna! 🍅😅';
          } else if (gift.impactType === 'splash_egg') {
            botReply = 'Yumurta vuran əlin var olsun! 🍳';
          } else if (gift.impactType === 'applause') {
            botReply = 'Çox sağ ol, sənətə qiymət verirsən! 👏';
          } else {
            botReply = 'Nuşi-can, bərəkətli olsun! 🥟';
          }
          setMpChatMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              senderName: targetP.name,
              senderIndex: targetIndex,
              text: botReply,
              timestamp: Date.now()
            }
          ]);
        }, 1100);
      }
    }
  };

  const t = translations[lang];
  const activeSkin: DominoSkin =
    DOMINO_SKINS.find((s) => s.id === stats.equippedSkin) || DOMINO_SKINS[0];

  const dailyCheck = checkDailyClaim(stats);
  const turnTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aiJustDrewRef = useRef<boolean>(false);
  const [opponentActionNotice, setOpponentActionNotice] = useState<{
    playerIndex: number;
    text: string;
    type: 'draw' | 'pass';
  } | null>(null);

  // Synchronize sound toggle
  useEffect(() => {
    sounds.enabled = soundEnabled;
  }, [soundEnabled]);

  // Initial cloud sync if already signed in with Google (use merge mode so stale device never overwrites newer cloud coins)
  useEffect(() => {
    if (googleUser) {
      syncWithCloud(googleUser, stats, true).then((synced) => {
        if (synced && JSON.stringify(synced) !== JSON.stringify(stats)) {
          setStats(synced);
        }
      });
    }
  }, [googleUser?.googleId]);

  // Listen for server-issued coin grants (e.g. closed beta tester reward) & show one-time beta gift popup for thenovruzlu@gmail.com
  useEffect(() => {
    const onCoinGrant = (ev: Event) => {
      const detail = (ev as CustomEvent<{ amount?: number; message?: string }>).detail || {};
      const amount = typeof detail.amount === 'number' && detail.amount > 0 ? detail.amount : 2000;
      const message =
        detail.message ||
        'Thank you for being a closed beta tester! Qapalı beta test iştirakçısı olduğunuz üçün təşəkkür edirik! — "yetime hediyye"';
      try {
        if (
          googleUserRef.current?.email?.toLowerCase() === 'thenovruzlu@gmail.com' ||
          googleUserRef.current?.googleId === '100659109498091139761'
        ) {
          localStorage.setItem('domino_beta_gift_thenovruzlu_shown_v1', '1');
        }
      } catch {}
      setBetaGiftModal({ amount, message });
      sounds.playCoinChime();
      triggerHaptic('success');
    };
    window.addEventListener('domino:coin-grant', onCoinGrant);
    return () => window.removeEventListener('domino:coin-grant', onCoinGrant);
  }, []);

  useEffect(() => {
    if (
      googleUser &&
      (googleUser.email?.toLowerCase() === 'thenovruzlu@gmail.com' ||
        googleUser.googleId === '100659109498091139761')
    ) {
      try {
        if (localStorage.getItem('domino_beta_gift_thenovruzlu_shown_v1') !== '1') {
          localStorage.setItem('domino_beta_gift_thenovruzlu_shown_v1', '1');
          setBetaGiftModal({
            amount: 2000,
            message:
              'Thank you for being a closed beta tester!\nQapalı beta test iştirakçısı olduğunuz üçün təşəkkür edirik!\n"yetime hediyye"'
          });
          sounds.playCoinChime();
          triggerHaptic('success');
        }
      } catch {}
    }
  }, [googleUser?.googleId, googleUser?.email]);

  // Prompt legacy signed-in users once per session when server requires fresh authToken
  useEffect(() => {
    let prompted = false;
    const onAuthExpired = () => {
      if (prompted) return;
      prompted = true;
      setGoogleUser((prev) => {
        if (!prev) return null;
        const refreshed = { ...prev, authToken: undefined };
        saveGoogleUser(refreshed);
        return refreshed;
      });
      setShowGoogleAuthModal(true);
    };
    window.addEventListener('domino:auth-expired', onAuthExpired);
    return () => window.removeEventListener('domino:auth-expired', onAuthExpired);
  }, []);


  // Sync rank milestone achievements on launch and whenever MMR updates
  useEffect(() => {
    checkRankAchievements(stats.mmr ?? DEFAULT_RANKED_MMR);
  }, [stats.mmr]);

  // Persist stats whenever changed (and auto-sync with cloud if signed in)
  const handleUpdateStats = (newStats: PlayerStats) => {
    statsRef.current = newStats;
    setStats(newStats);
    savePlayerStats(newStats);
    if (typeof newStats.mmr === 'number') {
      checkRankAchievements(newStats.mmr);
    }
    const activeGoogleUser = googleUserRef.current || googleUser;
    if (activeGoogleUser) {
      syncWithCloud(activeGoogleUser, newStats);
    }
  };
  const handleUpdateStatsRef = useRef(handleUpdateStats);
  handleUpdateStatsRef.current = handleUpdateStats;

  // Start a new Match
  const startMatch = (chosenMode: GameMode, chosenVariant: GameVariant = gameVariant) => {
    if (isMultiplayer || mpRoom) {
      handleLeaveRoom();
      multiplayerSocket.disconnectIfIdle();
    }
    setGameVariant(chosenVariant);
    setMode(chosenMode);
    if (chosenVariant === '101') {
      setMatch101State(createInitial101State());
      setIs101Seka(false);
      setIs101AyazCaught(false);
    }
    const numPlayers =
      chosenMode === '2p_solo' ? 2 : chosenMode === '3p_solo' ? 3 : 4;
    const numAI = numPlayers - 1;
    const assignedAINames = pickAIPersonas(numAI, lang);

    const initialPlayers: Player[] = [];
    const aiAvatarPool = ['avatar_tea_master', 'avatar_sheki_guest', 'avatar_icherisheher_sage'];
    for (let i = 0; i < numPlayers; i++) {
      let pName = getMyPlayerIdentity(googleUser, stats).name;
      let isAI = false;
      let team: 1 | 2 = 1;

      if (i > 0) {
        isAI = true;
        const aiName = assignedAINames[i - 1];
        if (chosenMode === '4p_duo') {
          if (i === 2) {
            pName = `${aiName} (${lang === 'az' ? 'Partnyor' : lang === 'ru' ? 'Партнёр' : 'Partner'})`;
            team = 1;
          } else {
            pName = aiName;
            team = 2;
          }
        } else {
          pName = aiName;
          team = (i + 1) as 1 | 2;
        }
      }

      const pAvatar =
        i === 0
          ? stats.equippedAvatar || DEFAULT_AVATAR_ID
          : aiAvatarPool[i - 1] || 'avatar_tea_master';

      initialPlayers.push({
        id: i,
        name: pName,
        isAI,
        hand: [],
        score: 0,
        handRoundPoints: 0,
        team,
        avatarId: pAvatar
      });
    }

    setIsTutorialMode(false);
    setTutorialCompleted(false);
    setPlayers(initialPlayers);
    setRoundNumber(1);
    setIsMatchOver(false);
    startHand(chosenMode, initialPlayers, 1, true, 0);
    setInGame(true);
  };

  // Start scripted ~45s 1v1 Tutorial Match
  const startTutorialMatch = () => {
    try {
      localStorage.setItem(TUTORIAL_SEEN_KEY, '1');
    } catch {
      // ignore storage errors
    }
    setShowTutorialPrompt(false);
    setShowRules(false);
    setShowGameEnd(false);
    setHandRevealed(false);
    setIsMatchOver(false);
    setGameVariant('365');
    setMode('2p_solo');
    setIsTutorialMode(true);
    setTutorialCompleted(false);

    const setup = createTutorialSetup();
    const botName = pickAIPersonas(1, lang)[0] || 'Usta';
    const tutorialPlayers: Player[] = [
      {
        id: 0,
        name: getMyPlayerIdentity(googleUser, stats).name,
        isAI: false,
        hand: setup.humanHand,
        score: 0,
        handRoundPoints: 0,
        team: 1,
        avatarId: stats.equippedAvatar || DEFAULT_AVATAR_ID
      },
      {
        id: 1,
        name: botName,
        isAI: true,
        hand: setup.botHand,
        score: 0,
        handRoundPoints: 0,
        team: 2,
        avatarId: 'avatar_tea_master'
      }
    ];

    setPlayers(tutorialPlayers);
    setBoneyard(setup.boneyard);
    setBoard(createInitialBoard());
    setSelectedTile(null);
    setForcedTile(setup.forcedTile);
    setCurrentTurn(0);
    setRoundNumber(1);
    setConsecutivePasses(0);
    setLastTilePlacedPlayerIndex(0);
    setLastScoredPoints(null);
    setFloatingScore(null);
    setInGame(true);
  };

  // Start a Hand within the Match
  const startHand = (
    currentMode: GameMode,
    currentPlayers: Player[],
    round: number,
    isFirstHandOfMatch: boolean,
    prevWinnerIndex: number
  ) => {
    let fullDeck = createDominoSet();
    let dealt = dealHands(currentMode, fullDeck);
    let reshuffle = checkHandReshuffle(dealt.hands);

    // Baku Reshuffle Rule: 5+ doubles, 5 of a kind without double, or 6/7 of a kind -> reshuffle for EVERYONE!
    if (reshuffle) {
      const offendingPlayer = currentPlayers[reshuffle.playerIndex]?.name || 'Oyunçu';
      const detailStr =
        reshuffle.reason === '5_or_more_doubles'
          ? ((t as any).reshuffle5Doubles || '{count} ədəd qoşa daş').replace(
              '{count}',
              reshuffle.count.toString()
            )
          : reshuffle.reason === '5_no_double'
          ? (t.reshuffle5NoDouble || 'qoşasız 5 ədəd "{pip}" daşı').replace(
              '{pip}',
              reshuffle.pip.toString()
            )
          : (t.reshuffle6Or7 || '{count} ədəd "{pip}" daşı')
              .replace('{count}', reshuffle.count.toString())
              .replace('{pip}', reshuffle.pip.toString());

      const msg = (
        t.reshuffleNotice ||
        '🔄 Daşlar yenidən qarışdırılır: {player} əlində {detail} var!'
      )
        .replace('{player}', offendingPlayer)
        .replace('{detail}', detailStr);

      setReshuffleNotice(msg);
      sounds.playTileDraw();

      // Reshuffle all 28 tiles for everyone until clean hands are dealt
      let attempts = 0;
      while (reshuffle && attempts < 25) {
        fullDeck = createDominoSet();
        dealt = dealHands(currentMode, fullDeck);
        reshuffle = checkHandReshuffle(dealt.hands);
        attempts++;
      }

      setTimeout(() => {
        setReshuffleNotice(null);
      }, 3500);
    } else {
      setReshuffleNotice(null);
    }

    const { hands, boneyard: newBoneyard } = dealt;

    const updatedPlayers = currentPlayers.map((p, idx) => ({
      ...p,
      hand: hands[idx],
      handRoundPoints: 0
    }));

    if (turnTimeoutRef.current) {
      clearTimeout(turnTimeoutRef.current);
      turnTimeoutRef.current = null;
    }

    setBoard(createInitialBoard(gameVariant !== '101'));
    setBoneyard(newBoneyard);
    setSelectedTile(null);
    setConsecutivePasses(0);
    setLastScoredPoints(null);
    setIsBaglandi(false);
    setBaglandiOver365Restart(false);
    setIsInstant35(false);
    setShowGameEnd(false);
    setHandRevealed(false);
    setRevealPhase(0);
    setRawBonusPoints(0);

    let starter = Math.max(0, Math.min(updatedPlayers.length - 1, prevWinnerIndex));
    let mustPlayTile: TileData | null = null;

    if (isFirstHandOfMatch) {
      const { playerIndex, forcedTile: ft } =
        gameVariant === '101'
          ? findFirstHandStarter101(hands)
          : findFirstHandStarter(hands);
      starter = playerIndex;
      mustPlayTile = ft;
    }

    setForcedTile(mustPlayTile);
    setCurrentTurn(starter);
    setPlayers(updatedPlayers);
  };

  const checkSingleplayerDryWin = (finalPlayerList: Player[], activeMode: GameMode) => {
    const opponents =
      activeMode === '4p_duo'
        ? finalPlayerList.filter((p) => p.team !== 1)
        : finalPlayerList.filter((p) => p.id !== 0);
    if (opponents.length > 0 && opponents.every((p) => p.score === 0)) {
      unlockPlayAchievement('sehra_aslani_dry');
    }
  };

  const recordInstant35WinAchievements = (
    updatedPlayers: Player[],
    activeMode: GameMode,
    isWinnerUser: boolean
  ) => {
    if (!isWinnerUser) return;
    unlockPlayAchievement('ejdaha_35');
    checkSingleplayerDryWin(updatedPlayers, activeMode);
  };

  // Handle Hand Completion with relaxed reveal sequence
  const finishHand = (
    endedInBaglandi: boolean,
    roundWinnerPlayerIndex: number,
    finalPlayers: Player[],
    blockerIndex?: number,
    isBaglandiTie: boolean = false
  ) => {
    // Clear any pending AI turn timers immediately
    if (turnTimeoutRef.current) {
      clearTimeout(turnTimeoutRef.current);
      turnTimeoutRef.current = null;
    }

    if (isTutorialMode) {
      setPlayers(finalPlayers);
      setTutorialCompleted(true);
      sounds.playVictory();
      triggerHaptic('success');
      return;
    }

    // Azerbaijani rule: In 101 and 365, whoever blocked the road (placed last tile) starts the next hand!
    const effectiveBlocker = blockerIndex !== undefined ? blockerIndex : lastTilePlacedPlayerIndex;
    const nextStarter = endedInBaglandi ? effectiveBlocker : roundWinnerPlayerIndex;
    setNextHandStarterIndex(nextStarter);

    // ==========================================
    // DOMINO 101 MODE FINISH HAND
    // ==========================================
    if (gameVariant === '101') {
      setIsBaglandi(endedInBaglandi);
      setPlayers(finalPlayers);

      const res = process101Round(
        match101State,
        finalPlayers,
        endedInBaglandi ? effectiveBlocker : roundWinnerPlayerIndex,
        endedInBaglandi
      );

      setMatch101State(res.nextMatchState);
      setIs101Seka(res.isSeka);
      setIs101AyazCaught(res.ayazCaught);
      setRawBonusPoints(res.roundRawPoints);
      setHandBonusPoints(res.roundRawPoints);
      if (res.winnerTeam) {
        setWinnerTeam(res.winnerTeam);
      }
      setWinnerIndex(res.winnerPlayerIndex);

      setHandRevealed(true);
      setRevealPhase(1);

      setTimeout(() => {
        setRevealPhase(2);
        if (res.roundRawPoints > 0) {
          sounds.playScorePoints(res.roundRawPoints);
        }

        setTimeout(() => {
          const playersWith101 = finalPlayers.map((p) => {
            const pScore =
              finalPlayers.length === 3
                ? res.nextMatchState.playerAccounts?.[p.id]?.mainScore ?? 0
                : p.team === 1
                ? res.nextMatchState.team1.mainScore
                : res.nextMatchState.team2.mainScore;
            return {
              ...p,
              score: pScore
            };
          });

          setPlayers(playersWith101);

          if (res.isMatchOver) {
            setIsMatchOver(true);
            const userWon =
              finalPlayers.length === 3
                ? res.winnerPlayerIndex === 0
                : res.nextMatchState.team1.mainScore > res.nextMatchState.team2.mainScore;
            setWinnerTeam(userWon ? 1 : 2);
            awardMatchCoins(userWon, '101');
            if (userWon) {
              const isDry101 =
                finalPlayers.length === 3
                  ? [1, 2].every((idx) => (res.nextMatchState.playerAccounts?.[idx]?.mainScore ?? 0) === 0)
                  : res.nextMatchState.team2.mainScore === 0;
              if (isDry101) {
                unlockPlayAchievement('sehra_aslani_dry');
              }
            }
          } else {
            setIsMatchOver(false);
          }

          setShowGameEnd(true);
        }, 900);
      }, 800);
      return;
    }

    setIsBaglandi(endedInBaglandi);
    setIs101Seka(endedInBaglandi && isBaglandiTie);
    setWinnerIndex(roundWinnerPlayerIndex);

    // Immediately commit the updated hands (including emptied hand)
    setPlayers(finalPlayers);

    const winnerP = finalPlayers[roundWinnerPlayerIndex] || finalPlayers[0];
    const winningTeam = winnerP?.team;
    setWinnerTeam(winningTeam);

    // Calculate Opponents' leftover pips (0 if blocked game ended in exact tie)
    let rawOpponentPips = 0;
    if (!(endedInBaglandi && isBaglandiTie)) {
      if (mode === '4p_duo') {
        finalPlayers.forEach((p) => {
          if (p.team !== winningTeam) {
            rawOpponentPips += sumHandPips(p.hand);
          }
        });
      } else {
        finalPlayers.forEach((p, idx) => {
          if (idx !== roundWinnerPlayerIndex) {
            rawOpponentPips += sumHandPips(p.hand);
          }
        });
      }
    }

    // 300 Point Rule: After 300, score from opponents' hand is NOT calculated!
    const winnerCurrentTotalScore =
      mode === '4p_duo'
        ? finalPlayers.find((p) => p.team === winningTeam)?.score || 0
        : winnerP.score;

    let bonus = 0;
    if (!(endedInBaglandi && isBaglandiTie) && winnerCurrentTotalScore < 300 && rawOpponentPips > 0) {
      bonus = roundUpTo5(rawOpponentPips);
    }

    setRawBonusPoints(rawOpponentPips);
    setHandBonusPoints(bonus);

    // Step 1: Reveal all opponents' tiles on the board immediately!
    setHandRevealed(true);
    setRevealPhase(1); // Shows raw opponent pips

    // Step 2: After 800ms, animate rounding up (e.g. 23 -> 25)
    setTimeout(() => {
      setRevealPhase(2);
      if (bonus > 0) {
        sounds.playScorePoints(bonus);
      }

      // Step 3: After another 900ms, finalize scores and show Modal
      setTimeout(() => {
        const playersWithBonus = finalPlayers.map((p, idx) => {
          if (endedInBaglandi && isBaglandiTie) return p;
          const isWinner =
            mode === '4p_duo' ? p.team === winningTeam : idx === roundWinnerPlayerIndex;
          if (isWinner) {
            return {
              ...p,
              score: p.score + bonus,
              handRoundPoints: p.handRoundPoints + bonus
            };
          }
          return p;
        });

        setPlayers(playersWithBonus);

        // Check Match Victory (Target 365)
        let highestScore = 0;
        playersWithBonus.forEach((p) => {
          if (p.score > highestScore) highestScore = p.score;
        });

        if (highestScore >= 365) {
          if (endedInBaglandi) {
            setBaglandiOver365Restart(true);
            setIsMatchOver(false);
          } else {
            if (mode === '4p_duo') {
              const t1Score = playersWithBonus.find((p) => p.team === 1)?.score || 0;
              const t2Score = playersWithBonus.find((p) => p.team === 2)?.score || 0;
              if (t1Score === t2Score && t1Score >= 365) {
                setIsMatchOver(false);
              } else {
                setIsMatchOver(true);
                const userWon = t1Score > t2Score;
                setWinnerTeam(userWon ? 1 : 2);
                awardMatchCoins(userWon, '365');
                if (userWon) {
                  checkSingleplayerDryWin(playersWithBonus, mode);
                }
              }
            } else {
              const winners = playersWithBonus.filter((p) => p.score === highestScore);
              if (winners.length > 1) {
                setIsMatchOver(false);
              } else {
                setIsMatchOver(true);
                const matchWinner = winners[0];
                const matchWinnerIndex = playersWithBonus.findIndex(
                  (p) => p.id === matchWinner.id
                );
                const safeWinnerIndex = matchWinnerIndex >= 0 ? matchWinnerIndex : 0;
                setWinnerIndex(safeWinnerIndex);
                const userWon = matchWinner.id === 0;
                awardMatchCoins(userWon, '365');
                if (userWon) {
                  checkSingleplayerDryWin(playersWithBonus, mode);
                }
              }
            }
          }
        } else {
          setIsMatchOver(false);
        }

        setShowGameEnd(true);
      }, 900);
    }, 800);
  };

  // Award match gold coins & record real opponents only
  const recordRecentOpponents = (playerList: Player[]) => {
    // NEVER record AI bots in offline singleplayer mode!
    if (!isMultiplayer) return;

    try {
      const existing = loadRecentPlayers();
      const sourcePlayers: any[] =
        mpGameStateRef.current?.players?.length ? mpGameStateRef.current.players : playerList;
      const myIdx = mpGameStateRef.current?.myPlayerIndex ?? localPlayerIndex;
      const newOnes = sourcePlayers
        .filter((p, idx) => idx !== myIdx && !p.isAI && p.name && !isBotName(p.name))
        .map((p) => {
          const cleanName = p.name.replace(/\s*\((Siz|Вы|You)\)\s*/g, '').trim();
          const prevMatch = existing.find(
            (e) =>
              (p.playerId && e.playerId && p.playerId === e.playerId) ||
              e.name.toLowerCase() === cleanName.toLowerCase()
          );
          const playerTag = p.playerTag || prevMatch?.playerTag;
          const playerId = p.playerId || prevMatch?.playerId;
          const handle =
            p.handle ||
            (playerTag ? `${cleanName}#${playerTag}` : prevMatch?.handle);
          return {
            name: cleanName,
            playerId,
            playerTag,
            handle,
            avatarId: p.avatarId || prevMatch?.avatarId || 'avatar_tea_master',
            frameId: p.frameId || prevMatch?.frameId,
            title: p.title || prevMatch?.title,
            date: new Date().toLocaleDateString('az-AZ'),
            isRealPlayer: true
          };
        });
      if (newOnes.length === 0) return;
      const merged = [
        ...newOnes,
        ...existing.filter(
          (e) =>
            !newOnes.some(
              (n) =>
                (n.playerId && e.playerId && n.playerId === e.playerId) ||
                n.name.toLowerCase() === e.name.toLowerCase()
            )
        )
      ].slice(0, 15);
      localStorage.setItem('domino_recent_players', JSON.stringify(merged));
    } catch (e) {
      console.error(e);
    }
  };

  const awardMatchCoins = (
    userWon: boolean,
    variant: GameVariant = gameVariant,
    forceWinGold: boolean = false
  ) => {
    watchedRewardedOnCurrentMatchEndRef.current = false;
    triggerHaptic('success');
    if (isMultiplayer) {
      recordRecentOpponents(players);
    }
    const coinReward = getMatchCoinReward(variant, userWon || forceWinGold);
    handleUpdateStats({
      ...statsRef.current,
      coins: statsRef.current.coins + coinReward,
      matchesPlayed: statsRef.current.matchesPlayed + 1,
      matchesWon: statsRef.current.matchesWon + (userWon ? 1 : 0)
    });
  };

  const handleClaimMatchEndAdBonus = async (): Promise<RewardedAdResult> => {
    const result = await showRewardedCoinsAd();
    if (!result.rewarded) return result;
    watchedRewardedOnCurrentMatchEndRef.current = true;
    triggerHaptic('success');
    sounds.playCoinChime();
    handleUpdateStats({
      ...statsRef.current,
      coins: statsRef.current.coins + REWARDED_AD_COINS_AMOUNT
    });
    return result;
  };

  // Next hand click
  const handleNextHand = () => {
    setShowGameEnd(false);
    setRoundNumber((prev) => prev + 1);
    startHand(mode, players, roundNumber + 1, false, nextHandStarterIndex);
  };

  // Restart match click
  const handleRestartMatch = () => {
    setShowGameEnd(false);
    startMatch(mode);
  };

  const handleNextHandAction = () => {
    if (isMultiplayer && mpGameState !== null) {
      multiplayerSocket.nextHand();
      setShowGameEnd(false);
      return;
    }
    handleNextHand();
  };

  const handleRestartMatchAction = () => {
    if (isMultiplayer && mpGameState !== null) {
      if (mpGameState.isRanked && mpGameState.isMatchOver) {
        handleForfeitAction();
        setShowTeahousesModal(true);
        return;
      }
      multiplayerSocket.nextHand();
      setShowGameEnd(false);
      return;
    }
    handleRestartMatch();
  };

  const handleForfeitAction = () => {
    setShowRankedForfeitConfirm(false);
    if (isMultiplayer) {
      // If leaving mid-game in Ranked Çayxana, record Elo loss locally too (server also settles)
      if (mpGameState?.isRanked && mpGameState.status === 'in_game' && !mpGameState.isMatchOver) {
        const myIdx = mpGameState.myPlayerIndex ?? 0;
        const oppSlot = mpGameState.players.find((_, idx) => idx !== myIdx);
        const curMmr = statsRef.current.mmr ?? DEFAULT_RANKED_MMR;
        const oppMmr = oppSlot?.mmr ?? curMmr;
        const curPlayed = statsRef.current.rankedPlayed ?? 0;
        const { nextMmr } = calculateEloUpdate(curMmr, oppMmr, false, curPlayed);
        handleUpdateStats({
          ...statsRef.current,
          matchesPlayed: statsRef.current.matchesPlayed + 1,
          mmr: nextMmr,
          rankedPlayed: curPlayed + 1
        });
      }
      multiplayerSocket.leaveRoom();
      try {
        localStorage.removeItem('domino_mp_session');
        window.history.replaceState(null, '', window.location.pathname);
      } catch (e) {}
      setIsMultiplayer(false);
      setMpGameState(null);
      setMpRoom(null);
      setMpIsHost(false);
    }
    setIsTutorialMode(false);
    setTutorialCompleted(false);
    setShowGameEnd(false);
    setHandRevealed(false);
    setInGame(false);
  };

  // Execute a tile placement
  const executeMove = (
    playerIndex: number,
    tile: TileData,
    branchId: BranchId
  ) => {
    let nextBoard: GameBoard;
    let scored = 0;

    if (board.tiles.length === 0) {
      nextBoard = placeFirstTile(board, tile);
      const isDouble = tile.left === tile.right;
      // In Baku Telefon 365 rules: non-doubles (e.g. [3:2], [4:1]) NEVER score at the start!
      // Only opening doubles (e.g. [5:5] -> 10) score points on an empty board.
      // 300 Rule: If the player's score (or team score in 4p_duo) is >= 300, starting with double 5 does NOT give 10 points!
      const currentScore =
        mode === '4p_duo'
          ? players.find((p) => p.team === players[playerIndex].team)?.score || 0
          : players[playerIndex].score;

      if (isDouble && currentScore < 300) {
        const doubleSum = tile.left * 2;
        scored = doubleSum % 5 === 0 ? doubleSum : 0;
      } else {
        scored = 0;
      }
    } else {
      const res = placeTileOnBranch(board, tile, branchId);
      nextBoard = res.board;
      scored = res.scoredPoints;
    }

    // In Domino 101, turns never award in-game 5-multiple points; scoring is strictly end-of-round
    if (gameVariant === '101') {
      scored = 0;
    }

    const isDouble = tile.left === tile.right;

    // Tactile Sound & Haptic Balancing:
    // Basic moves: gentle soft clack, light haptic tick.
    // Qoşa daş (doubles): heavy wooden slam sound, heavy haptic, 200ms quick table rumble!
    if (isDouble) {
      sounds.playTileSlam();
      triggerHaptic('heavy');
      setIsScreenShaking(true);
      setTimeout(() => setIsScreenShaking(false), 200);
    } else if (scored > 0) {
      sounds.playTileClack(true);
      triggerHaptic(scored >= 20 || scored === 35 ? 'heavy' : 'medium');
    } else {
      sounds.playTileClack(false);
      triggerHaptic('light');
    }

    if (scored > 0) {
      if (scored >= 20 || scored === 35) {
        setIsScreenShaking(true);
        setTimeout(() => setIsScreenShaking(false), 450);
      }
      sounds.playScorePoints(scored);
      setLastScoredPoints({
        playerName: players[playerIndex].name,
        points: scored
      });
      setTimeout(() => setLastScoredPoints(null), 1200);
      setFloatingScore({
        id: `sc_${Date.now()}_${Math.random()}`,
        points: scored,
        playerName: players[playerIndex].name,
        isInstant35: scored === 35
      });
    } else {
      setLastScoredPoints(null);
    }

    // Update player hand & scores (keep 4p_duo team score synced across both teammates)
    const actingTeam = players[playerIndex]?.team;
    const updatedPlayers = players.map((p, idx) => {
      if (idx === playerIndex) {
        const nextHand = p.hand.filter((t) => t.id !== tile.id);
        return {
          ...p,
          hand: nextHand,
          score: p.score + scored,
          handRoundPoints: p.handRoundPoints + scored
        };
      }
      if (mode === '4p_duo' && scored > 0 && actingTeam && p.team === actingTeam) {
        return {
          ...p,
          score: p.score + scored,
          handRoundPoints: p.handRoundPoints + scored
        };
      }
      return p;
    });

    setBoard(nextBoard);
    setSelectedTile(null);
    setForcedTile(null);
    setConsecutivePasses(0);
    setLastTilePlacedPlayerIndex(playerIndex);

    // Check 35-point instant match win rule ("Masada 35 vuran oyunu birbaşa udur!")
    if (scored === 35) {
      setBoard(nextBoard);
      setPlayers(updatedPlayers);
      sounds.playVictory();
      setIsInstant35(true);
      setIsMatchOver(true);
      setHandRevealed(true);
      setRevealPhase(2);
      const isWinnerUser =
        mode === '4p_duo'
          ? updatedPlayers[playerIndex].team === 1
          : playerIndex === 0;
      setWinnerIndex(playerIndex);
      if (mode === '4p_duo') {
        setWinnerTeam(updatedPlayers[playerIndex].team);
      }
      awardMatchCoins(isWinnerUser, gameVariant);
      recordInstant35WinAchievements(updatedPlayers, mode, isWinnerUser);
      setShowGameEnd(true);
      return;
    }

    // Check if player emptied their hand (DOMINO!)
    if (updatedPlayers[playerIndex].hand.length === 0) {
      finishHand(false, playerIndex, updatedPlayers);
      return;
    }

    // Check if the board has become globally blocked ("Bağlandı")
    // (If all 7 of every open end's number have already been played on the table,
    // or if no drawable boneyard tiles remain and no player holds a playable tile)
    const minReserve = getMinBoneyardReserve(gameVariant, mode);
    const drawableCount = Math.max(0, boneyard.length - minReserve);

    if (
      isHandBlockedAfterPlay(
        nextBoard,
        updatedPlayers.map((p) => p.hand),
        drawableCount
      )
    ) {
      const { winnerIndex: lowestPlayer, isTie } = evaluateBaglandiWinner(
        updatedPlayers,
        mode,
        playerIndex
      );
      finishHand(true, lowestPlayer, updatedPlayers, playerIndex, isTie);
      return;
    }

    setPlayers(updatedPlayers);
    // Advance turn
    const nextTurn = (playerIndex + 1) % players.length;
    setCurrentTurn(nextTurn);
  };

  // Execute a Simultaneous Doubles Combo Move (2, 3, or 4 doubles in a single turn)
  const executeComboMove = (playerIndex: number, combo: DoubleComboMove) => {
    let nextBoard: GameBoard = JSON.parse(JSON.stringify(board));

    // Place each double in the combo onto its respective branch
    for (const step of combo.moves) {
      const res = placeTileOnBranch(nextBoard, step.tile, step.branchId);
      nextBoard = res.board;
    }

    const scored = combo.expectedScore;
    // All combo moves are doubles being slammed simultaneously
    sounds.playTileSlam();
    triggerHaptic('heavy');
    setIsScreenShaking(true);
    setTimeout(() => setIsScreenShaking(false), 220);

    if (scored > 0) {
      if (scored >= 20 || scored === 35) {
        setIsScreenShaking(true);
        setTimeout(() => setIsScreenShaking(false), 450);
      }
      sounds.playScorePoints(scored);
      setLastScoredPoints({
        playerName: players[playerIndex].name,
        points: scored
      });
      setTimeout(() => setLastScoredPoints(null), 1200);
      setFloatingScore({
        id: `sc_${Date.now()}_${Math.random()}`,
        points: scored,
        playerName: players[playerIndex].name,
        isInstant35: scored === 35
      });
    } else {
      setLastScoredPoints(null);
    }

    const playedTileIds = new Set(combo.moves.map((m) => m.tile.id));
    const comboActingTeam = players[playerIndex]?.team;
    const updatedPlayers = players.map((p, idx) => {
      if (idx === playerIndex) {
        const nextHand = p.hand.filter((t) => !playedTileIds.has(t.id));
        return {
          ...p,
          hand: nextHand,
          score: p.score + scored,
          handRoundPoints: p.handRoundPoints + scored
        };
      }
      if (mode === '4p_duo' && scored > 0 && comboActingTeam && p.team === comboActingTeam) {
        return {
          ...p,
          score: p.score + scored,
          handRoundPoints: p.handRoundPoints + scored
        };
      }
      return p;
    });

    setBoard(nextBoard);
    setSelectedTile(null);
    setForcedTile(null);
    setConsecutivePasses(0);

    // Check 35-point instant match win rule
    if (scored === 35) {
      setPlayers(updatedPlayers);
      sounds.playVictory();
      setIsInstant35(true);
      setIsMatchOver(true);
      setHandRevealed(true);
      setRevealPhase(2);
      const isWinnerUser =
        mode === '4p_duo'
          ? updatedPlayers[playerIndex].team === 1
          : playerIndex === 0;
      setWinnerIndex(playerIndex);
      if (mode === '4p_duo') {
        setWinnerTeam(updatedPlayers[playerIndex].team);
      }
      awardMatchCoins(isWinnerUser, gameVariant);
      recordInstant35WinAchievements(updatedPlayers, mode, isWinnerUser);
      setShowGameEnd(true);
      return;
    }

    setConsecutivePasses(0);
    setLastTilePlacedPlayerIndex(playerIndex);

    // Check if player emptied their hand (DOMINO!)
    if (updatedPlayers[playerIndex].hand.length === 0) {
      finishHand(false, playerIndex, updatedPlayers);
      return;
    }

    // Check if the board has become globally blocked ("Bağlandı")
    // (If all 7 of every open end's number have already been played on the table,
    // or if no drawable boneyard tiles remain and no player holds a playable tile)
    const minReserve = getMinBoneyardReserve(gameVariant, mode);
    const drawableCount = Math.max(0, boneyard.length - minReserve);

    if (
      isHandBlockedAfterPlay(
        nextBoard,
        updatedPlayers.map((p) => p.hand),
        drawableCount
      )
    ) {
      const { winnerIndex: lowestPlayer, isTie } = evaluateBaglandiWinner(
        updatedPlayers,
        mode,
        playerIndex
      );
      finishHand(true, lowestPlayer, updatedPlayers, playerIndex, isTie);
      return;
    }

    setPlayers(updatedPlayers);
    const nextTurn = (playerIndex + 1) % players.length;
    setCurrentTurn(nextTurn);
  };

  // Human player selects a tile from hand
  const handleSelectTile = (tile: TileData) => {
    if (effectiveHandRevealed || effectiveIsMatchOver) return;
    if (effectiveInMultiplayer) {
      if (!effectiveIsMyTurn) return;
      if (effectiveForcedTile && tile.id !== effectiveForcedTile.id) return;

      if (selectedTile?.id === tile.id) {
        setSelectedTile(null);
        return;
      }

      setSelectedTile(tile);
      sounds.playTileDraw();

      if (effectiveBoard.tiles.length === 0) {
        multiplayerSocket.playTile(tile.id, 'main_left');
        setSelectedTile(null);
      }
      return;
    }

    if (currentTurn !== 0 || handRevealed) return;
    if (forcedTile && tile.id !== forcedTile.id) return;

    if (selectedTile?.id === tile.id) {
      setSelectedTile(null);
      return;
    }

    setSelectedTile(tile);
    sounds.playTileDraw();

    // If board is empty, auto-place at center
    if (board.tiles.length === 0) {
      executeMove(0, tile, 'main_left');
    }
  };

  // Human player selects a target branch on board
  const handleSelectBranch = (branchId: BranchId) => {
    if (!selectedTile || effectiveHandRevealed || effectiveIsMatchOver) return;
    if (effectiveInMultiplayer) {
      if (!effectiveIsMyTurn) return;
      multiplayerSocket.playTile(selectedTile.id, branchId);
      setSelectedTile(null);
      setHoveredBranch(null);
      return;
    }

    if (currentTurn !== 0 || handRevealed) return;
    executeMove(0, selectedTile, branchId);
  };

  // Draw tile from Bazar (allows choosing a specific tile index or default 0)
  const handleDrawTile = (tileIndex?: number | unknown) => {
    if (effectiveHandRevealed) return;
    if (effectiveInMultiplayer) {
      if (!effectiveIsMyTurn) return;
      void multiplayerSocket.drawBazaar().then((res) => {
        if (!res.success && res.error) {
          setSocialBanner(res.error);
        }
      });
      return;
    }

    const minReserve = getMinBoneyardReserve(gameVariant, mode);
    const availableToDraw = Math.max(0, boneyard.length - minReserve);
    if (currentTurn !== 0 || availableToDraw === 0 || handRevealed) return;
    // In 101 mode: players draw 2 tiles at a time from bazaar ("2 daş 2 daş gedirsən")!
    const countToDraw = gameVariant === '101' ? Math.min(2, availableToDraw) : 1;
    const nextBoneyard = [...boneyard];
    const drawnTiles: TileData[] = [];
    for (let c = 0; c < countToDraw; c++) {
      if (nextBoneyard.length > 0) {
        drawnTiles.push(nextBoneyard[0]);
        nextBoneyard.shift();
      }
    }
    if (drawnTiles.length === 0) return;

    sounds.playTileDraw();
    setBoneyard(nextBoneyard);

    const updatedPlayers = players.map((p, idx) => {
      if (idx === 0) {
        return { ...p, hand: [...p.hand, ...drawnTiles] };
      }
      return p;
    });
    setPlayers(updatedPlayers);
  };

  // Pass turn ("Pas")
  const handlePassTurn = () => {
    if (effectiveHandRevealed) return;
    if (humanHasPlayableMove) return;
    if (effectiveBoneyardCount > currentMinReserve && !isCurrentBoardBlocked) return;
    if (effectiveInMultiplayer) {
      if (!effectiveIsMyTurn) return;
      sounds.playPassKnock();
      void multiplayerSocket.passTurn().then((res) => {
        if (!res.success && res.error) {
          setSocialBanner(res.error);
        }
      });
      return;
    }

    if (currentTurn !== 0 || handRevealed) return;
    sounds.playPassKnock();
    const nextPassCount = consecutivePasses + 1;
    setConsecutivePasses(nextPassCount);

    if (nextPassCount >= players.length) {
      // Game Blocked ("Bağlandı")
      const { winnerIndex: lowestPlayer, isTie } = evaluateBaglandiWinner(
        players,
        mode,
        lastTilePlacedPlayerIndex
      );
      finishHand(true, lowestPlayer, players, lastTilePlacedPlayerIndex, isTie);
      return;
    }

    setCurrentTurn(1 % players.length);
  };

  // AI Turn Loop
  useEffect(() => {
    if (effectiveInMultiplayer) return;
    if (!inGame || showGameEnd || handRevealed || players.length === 0) return;

    const activePlayer = players[currentTurn];
    if (!activePlayer || !activePlayer.isAI) return;

    if (turnTimeoutRef.current) {
      clearTimeout(turnTimeoutRef.current);
    }

    // Use a slightly quicker delay (800ms) right after drawing from the bazaar,
    // and the normal 1550ms delay when starting a turn or playing a tile.
    const delayMs = aiJustDrewRef.current ? 800 : 1550;

    turnTimeoutRef.current = setTimeout(() => {
      aiJustDrewRef.current = false;

      // If AI is forced to play a specific opening tile
      if (board.tiles.length === 0 && forcedTile) {
        executeMove(currentTurn, forcedTile, 'main_left');
        return;
      }

      // Check best move (or deterministic scripted move in Tutorial mode)
      const aiScore =
        mode === '4p_duo'
          ? players.find((p) => p.team === activePlayer.team)?.score || 0
          : activePlayer.score;
      const bestMove = isTutorialMode
        ? getTutorialBotMove(board, activePlayer.hand)
        : selectBestAIMove(activePlayer.hand, board, aiScore, gameVariant);

      // If Double Combos are enabled, check if AI can score with a combo!
      if (!isTutorialMode && allowDoubleCombo) {
        const aiCombos = findDoubleCombos(activePlayer.hand, board);
        if (
          aiCombos.length > 0 &&
          aiCombos[0].expectedScore >= (bestMove?.expectedScore || 0)
        ) {
          executeComboMove(currentTurn, aiCombos[0]);
          return;
        }
      }

      if (bestMove) {
        executeMove(currentTurn, bestMove.tile, bestMove.branchId);
      } else {
        // AI has no move
        const minReserve = getMinBoneyardReserve(gameVariant, mode);
        const drawableCount = Math.max(0, boneyard.length - minReserve);

        // Declare Bağlandı only when the board is visibly globally blocked,
        // or when no drawable tiles remain and no player holds a playable tile.
        if (
          isHandBlockedAfterPlay(
            board,
            players.map((p) => p.hand),
            drawableCount
          )
        ) {
          const { winnerIndex: lowestPlayer, isTie } = evaluateBaglandiWinner(
            players,
            mode,
            lastTilePlacedPlayerIndex
          );
          finishHand(true, lowestPlayer, players, lastTilePlacedPlayerIndex, isTie);
          return;
        }

        // Bots must draw from the bazaar without peeking at hidden boneyard tiles
        if (drawableCount > 0) {
          // AI draws from boneyard (2 tiles in 101 mode, 1 tile in other modes)
          const countToDraw = gameVariant === '101' ? Math.min(2, drawableCount) : 1;
          const drawn = boneyard.slice(0, countToDraw);
          const nextBoneyard = boneyard.slice(countToDraw);
          sounds.playTileDraw();
          aiJustDrewRef.current = true;
          setOpponentActionNotice({
            playerIndex: currentTurn,
            text: `📥 Bazardan ${countToDraw} daş çəkdi`,
            type: 'draw'
          });
          setTimeout(() => setOpponentActionNotice(null), 1300);
          setBoneyard(nextBoneyard);

          const updatedPlayers = players.map((p, idx) => {
            if (idx === currentTurn) {
              return { ...p, hand: [...p.hand, ...drawn] };
            }
            return p;
          });
          setPlayers(updatedPlayers);
        } else {
          // AI passes
          sounds.playPassKnock();
          setOpponentActionNotice({
            playerIndex: currentTurn,
            text: '🚫 Pas keçdi',
            type: 'pass'
          });
          setTimeout(() => setOpponentActionNotice(null), 1500);
          const nextPassCount = consecutivePasses + 1;
          setConsecutivePasses(nextPassCount);

          if (nextPassCount >= players.length) {
            // "Bağlandı"
            const { winnerIndex: lowestPlayer, isTie } = evaluateBaglandiWinner(
              players,
              mode,
              lastTilePlacedPlayerIndex
            );
            finishHand(true, lowestPlayer, players, lastTilePlacedPlayerIndex, isTie);
            return;
          }

          setCurrentTurn((currentTurn + 1) % players.length);
        }
      }
    }, delayMs);

    return () => {
      if (turnTimeoutRef.current) clearTimeout(turnTimeoutRef.current);
    };
  }, [inGame, currentTurn, board, boneyard, players, forcedTile, showGameEnd, handRevealed]);

  // Effective state variables: seamlessly switches between offline singleplayer & online multiplayer
  const effectiveInMultiplayer = isMultiplayer && mpGameState !== null;
  const effectiveBoard = effectiveInMultiplayer ? mpGameState.board : board;
  const effectiveTurn = effectiveInMultiplayer ? mpGameState.currentTurn : currentTurn;
  const effectiveIsMyTurn = effectiveInMultiplayer
    ? mpGameState.currentTurn === mpMyIndex && !mpGameState.handRevealed
    : currentTurn === 0 && !showGameEnd && !handRevealed;
  const effectiveForcedTile = effectiveInMultiplayer ? mpGameState.forcedTile : forcedTile;
  const effectiveBoneyardCount = effectiveInMultiplayer
    ? mpGameState.boneyardCount
    : boneyard.length;
  const effectiveRoundNumber = effectiveInMultiplayer
    ? mpGameState.roundNumber
    : roundNumber;
  const effectiveHandRevealed = effectiveInMultiplayer
    ? mpGameState.handRevealed
    : handRevealed;
  const effectiveRevealPhase = effectiveInMultiplayer
    ? mpGameState.revealPhase
    : revealPhase;
  const effectiveLastScored = effectiveInMultiplayer
    ? mpGameState.lastScoredPoints
    : lastScoredPoints;
  const effectiveReshuffleNotice = effectiveInMultiplayer
    ? mpGameState.reshuffleNotice
    : reshuffleNotice;
  const effectiveIsBaglandi = effectiveInMultiplayer
    ? !!mpGameState.handResults?.isBaglandi
    : isBaglandi;
  const effectiveHandBonusPoints = effectiveInMultiplayer
    ? mpGameState.handResults?.bonusPoints || 0
    : handBonusPoints;
  const effectiveRawBonusPoints = effectiveInMultiplayer
    ? mpGameState.handResults?.rawPips || 0
    : rawBonusPoints;
  const effectiveIsMatchOver = effectiveInMultiplayer
    ? mpGameState.isMatchOver
    : isMatchOver;
  const effectiveWinnerIndex = effectiveInMultiplayer
    ? (mpGameState.isMatchOver
        ? mpGameState.matchWinnerIndex
        : (mpGameState.handResults?.winnerIndex ?? 0))
    : winnerIndex;
  const effectiveWinnerTeam = effectiveInMultiplayer
    ? (mpGameState.isMatchOver
        ? (mpGameState.players[mpGameState.matchWinnerIndex]?.team || mpGameState.handResults?.winnerTeam || 1)
        : (mpGameState.handResults?.winnerTeam || 1))
    : winnerTeam;
  const effectiveIsInstant35 = effectiveInMultiplayer
    ? mpGameState.isInstant35
    : isInstant35;

  const localPlayerIndex = effectiveInMultiplayer ? mpMyIndex : 0;

  const effectivePlayers: Player[] = effectiveInMultiplayer
    ? mpGameState.players.map((p, idx) => {
        let playerHand: TileData[];
        if (idx === mpMyIndex) {
          playerHand = mpGameState.myHand;
        } else if (mpGameState.handRevealed && mpGameState.handResults?.revealedHands) {
          const revealed = mpGameState.handResults.revealedHands.find(
            (rh) => rh.playerIndex === idx
          );
          playerHand = revealed ? revealed.hand : [];
        } else {
          playerHand = Array.from({ length: p.handCount }, (_, i) => ({
            id: `hidden-${p.id}-${i}`,
            left: 0,
            right: 0
          }));
        }

        return {
          id: p.id,
          name: p.name + (idx === mpMyIndex ? ` (${lang === 'az' ? 'Siz' : lang === 'ru' ? 'Вы' : 'You'})` : ''),
          isAI: p.isAI,
          hand: playerHand,
          score: p.score,
          handRoundPoints: p.handRoundPoints,
          team: p.team || 1,
          avatarId: p.avatarId || (idx === mpMyIndex ? (stats.equippedAvatar || DEFAULT_AVATAR_ID) : 'avatar_tea_master')
        };
      })
    : players;

  const didIWinHand = effectiveInMultiplayer
    ? (effectivePlayers.length === 4 && (mpGameState?.mode === '4p_duo')
        ? (mpGameState.handResults?.winnerTeam === effectivePlayers[localPlayerIndex]?.team)
        : (mpGameState?.handResults?.winnerIndex === localPlayerIndex))
    : (mode === '4p_duo' ? winnerTeam === 1 : winnerIndex === 0);
  const roundWinnerPlayer = effectivePlayers[effectiveWinnerIndex] || effectivePlayers[0];

  const humanPlayer = effectivePlayers[effectiveInMultiplayer ? mpMyIndex : 0];
  const humanHand = effectiveInMultiplayer
    ? mpGameState.myHand
    : humanPlayer?.hand || [];
  const isMyTurn = effectiveIsMyTurn;

  const playableTileIds: string[] = useMemo(() => {
    const ids: string[] = [];
    if (isMyTurn && humanPlayer) {
      if (effectiveBoard.tiles.length === 0) {
        if (effectiveForcedTile) {
          ids.push(effectiveForcedTile.id);
        } else {
          humanHand.forEach((t) => ids.push(t.id));
        }
      } else {
        humanHand.forEach((t) => {
          const branches = getPlayableBranches(effectiveBoard, t);
          if (branches.length > 0) {
            ids.push(t.id);
          }
        });
      }
    }
    return ids;
  }, [isMyTurn, humanPlayer, effectiveBoard, effectiveForcedTile, humanHand]);

  const humanHasPlayableMove = playableTileIds.length > 0;
  const currentMinReserve = getMinBoneyardReserve(
    effectiveInMultiplayer ? (mpGameState?.variant || '365') : gameVariant,
    effectiveInMultiplayer ? (mpGameState?.mode || '4p_duo') : mode
  );
  const isCurrentBoardBlocked = useMemo(
    () => isBoardGloballyBlocked(effectiveBoard),
    [effectiveBoard]
  );

  // Auto-pass in offline mode when human player has no playable move and cannot draw from bazar
  useEffect(() => {
    if (
      !inGame ||
      effectiveInMultiplayer ||
      showGameEnd ||
      handRevealed ||
      currentTurn !== 0 ||
      board.tiles.length === 0 ||
      humanHasPlayableMove
    ) {
      return;
    }
    const canDraw = boneyard.length > currentMinReserve && !isCurrentBoardBlocked;
    if (canDraw) return;

    const timer = setTimeout(() => {
      handlePassTurn();
    }, 950);
    return () => clearTimeout(timer);
  }, [
    inGame,
    effectiveInMultiplayer,
    showGameEnd,
    handRevealed,
    currentTurn,
    board.tiles.length,
    humanHasPlayableMove,
    boneyard.length,
    currentMinReserve,
    isCurrentBoardBlocked
  ]);
  const playableBranches = useMemo(
    () => (selectedTile ? getPlayableBranches(effectiveBoard, selectedTile) : []),
    [selectedTile, effectiveBoard]
  );

  // Calculate expected scores for highlighted target branches
  const branchExpectedScores: Record<BranchId, number> = useMemo(() => {
    const scores = {} as Record<BranchId, number>;
    if (selectedTile && playableBranches.length > 0) {
      playableBranches.forEach((bId) => {
        const { scoredPoints } = placeTileOnBranch(effectiveBoard, selectedTile, bId);
        scores[bId] = scoredPoints;
      });
    }
    return scores;
  }, [selectedTile, playableBranches, effectiveBoard]);

  // Available Simultaneous Double Combos for human player
  const availableCombos = useMemo(
    () =>
      allowDoubleCombo && isMyTurn && humanHand.length > 0
        ? findDoubleCombos(humanHand, effectiveBoard)
        : [],
    [allowDoubleCombo, isMyTurn, humanHand, effectiveBoard]
  );

  // Drag and Drop Handlers (Direct DOM ref updates for 60fps zero-re-render dragging)
  const handleStartDrag = (tile: TileData, point: { x: number; y: number }) => {
    if (effectiveHandRevealed || effectiveIsMatchOver) return;
    if (effectiveInMultiplayer) {
      if (!effectiveIsMyTurn) return;
      if (effectiveForcedTile && tile.id !== effectiveForcedTile.id) return;
      dragInitialPointRef.current = point;
      setSelectedTile(tile);
      setDraggedTile(tile);
      return;
    }
    if (currentTurn !== 0 || handRevealed) return;
    if (forcedTile && tile.id !== forcedTile.id) return;
    dragInitialPointRef.current = point;
    setSelectedTile(tile);
    setDraggedTile(tile);
    triggerHaptic('light');
  };

  // Global Pointer & Touch tracking for Drag and Drop with Magnetic Proximity Snap
  useEffect(() => {
    if (!draggedTile) return;

    let currentHovered: BranchId | null = null;
    let rafId: number | null = null;
    let latestX = dragInitialPointRef.current.x;
    let latestY = dragInitialPointRef.current.y;

    // Cache target branch bounding centers once on drag start (and refresh slightly after BoardView renders target rings)
    let cachedBranchCenters: Array<{ bId: BranchId; cx: number; cy: number }> = [];
    const refreshBranchCache = () => {
      const list: Array<{ bId: BranchId; cx: number; cy: number }> = [];
      for (const bId of playableBranches) {
        const targets = document.querySelectorAll(`[data-branch-id="${bId}"]`);
        targets.forEach((node) => {
          const rect = node.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            list.push({
              bId,
              cx: rect.left + rect.width / 2,
              cy: rect.top + rect.height / 2
            });
          }
        });
      }
      cachedBranchCenters = list;
    };
    refreshBranchCache();
    const cacheTimer = setTimeout(refreshBranchCache, 40);

    const findTargetBranchAtPoint = (cx: number, cy: number): BranchId | null => {
      // 1. Direct hit via elementFromPoint
      const el = document.elementFromPoint(cx, cy);
      const branchEl = el?.closest('[data-branch-id]');
      if (branchEl) {
        const bId = branchEl.getAttribute('data-branch-id') as BranchId;
        if (bId === 'main_left' && effectiveBoard.tiles.length === 0) return 'main_left';
        if (playableBranches.includes(bId)) return bId;
      }

      // 2. Proximity hit test using cached target ring centers (or fallback query if empty)
      if (cachedBranchCenters.length === 0 && playableBranches.length > 0) {
        refreshBranchCache();
      }
      let bestBranch: BranchId | null = null;
      let minDistance = 140;

      for (const item of cachedBranchCenters) {
        const dist = Math.hypot(cx - item.cx, cy - item.cy);
        if (dist < minDistance) {
          minDistance = dist;
          bestBranch = item.bId;
        }
      }

      if (bestBranch) return bestBranch;

      // 3. Empty board: dropping anywhere on board targets 'main_left'
      if (effectiveBoard.tiles.length === 0 && el?.closest('[data-domino-board]')) {
        return 'main_left';
      }

      // 4. If board has only 1 playable branch, dropping anywhere over the board targets it
      if (playableBranches.length === 1 && el?.closest('[data-domino-board]')) {
        return playableBranches[0];
      }

      return null;
    };

    const updateDragPosition = (cx: number, cy: number) => {
      latestX = cx;
      latestY = cy;
      // Immediately move the floating tile overlay via DOM style (zero React re-renders!)
      if (dragOverlayRef.current) {
        dragOverlayRef.current.style.left = `${cx}px`;
        dragOverlayRef.current.style.top = `${cy - 20}px`;
      }
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          rafId = null;
          const target = findTargetBranchAtPoint(latestX, latestY);
          if (target !== currentHovered) {
            currentHovered = target;
            setHoveredBranch(target);
            if (target) {
              triggerHaptic('light');
            }
          }
        });
      }
    };

    const finishDrag = (cx: number, cy: number) => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      const targetBranch = findTargetBranchAtPoint(cx, cy);
      if (targetBranch) {
        triggerHaptic('medium');
        if (effectiveInMultiplayer) {
          multiplayerSocket.playTile(draggedTile.id, targetBranch);
        } else {
          executeMove(0, draggedTile, targetBranch);
        }
      }
      setDraggedTile(null);
      setHoveredBranch(null);
    };

    // Pointer events (Desktop & Modern mobile)
    const handlePointerMove = (e: PointerEvent) => {
      updateDragPosition(e.clientX, e.clientY);
    };

    const handlePointerUp = (e: PointerEvent) => {
      finishDrag(e.clientX, e.clientY);
    };

    // Native Touch events (iOS Safari & Android WebViews)
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        // Crucial: Prevent iOS Safari elastic bounce & page panning during tile drag!
        if (e.cancelable) e.preventDefault();
        const t = e.touches[0];
        updateDragPosition(t.clientX, t.clientY);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0] || e.touches[0];
      if (t) {
        finishDrag(t.clientX, t.clientY);
      } else {
        setDraggedTile(null);
        setHoveredBranch(null);
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: false });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    return () => {
      clearTimeout(cacheTimer);
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [draggedTile, playableBranches, effectiveBoard, effectiveInMultiplayer]);

  // Language cycle helper
  const cycleLanguage = () => {
    if (lang === 'az') setLang('ru');
    else if (lang === 'ru') setLang('en');
    else setLang('az');
  };

  if (apkAuthSessionId) {
    return (
      <Suspense fallback={null}>
        <ApkAuthBridgeView apkAuthSessionId={apkAuthSessionId} />
      </Suspense>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 select-none overflow-hidden font-sans">
      {/* Top Navbar */}
      {/* Top Bar Header */}
      <header
        style={{
          paddingTop: 'max(0.25rem, env(safe-area-inset-top))',
          paddingLeft: 'max(0.5rem, env(safe-area-inset-left))',
          paddingRight: 'max(0.5rem, env(safe-area-inset-right))'
        }}
        className="flex-shrink-0 min-h-11 landscape:min-h-9 py-1 sm:py-1.5 landscape:py-0.5 bg-slate-900/95 border-b border-amber-600/30 flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 z-30 shadow-md select-none"
      >
        {inGame ? (
          /* Clean, non-intrusive in-game header — all elements guaranteed visible on mobile */
          <>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <AzerbaijanLogo size="sm" compact />
              <span className="px-2 py-0.5 rounded-full bg-slate-800/90 border border-amber-500/40 text-[10px] sm:text-[11px] font-black text-amber-300 shadow">
                {effectiveInMultiplayer ? (mpGameState?.variant === '101' ? '101 XAL' : '365 XAL') : (gameVariant === '101' ? '101 XAL' : '365 XAL')}
              </span>
              {effectiveInMultiplayer && mpRoom ? (
                <div className="flex items-center gap-1 bg-emerald-950/80 border border-emerald-500/40 rounded-lg px-2 py-0.5 text-[10px] sm:text-xs">
                  <span className="font-bold text-emerald-300">Otaq:</span>
                  <span className="font-black text-white">{mpRoom.code}</span>
                  {mpGameState && mpGameState.turnTimeRemaining !== undefined && (
                    <span className="flex items-center gap-0.5 ml-1 text-amber-300 font-black text-[10px] bg-amber-500/20 px-1 rounded">
                      <Clock className="w-2.5 h-2.5 text-amber-400" />
                      {mpGameState.turnTimeRemaining}s
                    </span>
                  )}
                </div>
              ) : (
                <span className="px-2 py-0.5 rounded-lg bg-slate-800/80 border border-slate-700 text-[10px] font-bold text-slate-300">
                  🤖 Bot ilə
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
              {/* Gold Coin Balance */}
              <div className="bg-slate-800/90 border border-amber-500/40 rounded-full px-2.5 py-0.5 sm:px-3 sm:py-1 flex items-center gap-1 shadow-inner">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-black text-amber-300 text-xs sm:text-sm">
                  {stats.coins}
                </span>
              </div>

              {/* Sound Toggle */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={t.sound}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition"
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-500" />
                )}
              </button>

              {/* Forfeit Match Button */}
              <button
                onClick={() => {
                  if (
                    isMultiplayer &&
                    mpGameState?.isRanked &&
                    mpGameState.status === 'in_game' &&
                    !mpGameState.isMatchOver
                  ) {
                    setShowRankedForfeitConfirm(true);
                    return;
                  }
                  handleForfeitAction();
                }}
                title={t.forfeit}
                className="px-2 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-700 text-rose-200 transition flex items-center gap-1 active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-[10px] font-bold">{t.forfeit}</span>
              </button>
            </div>
          </>
        ) : (
          /* Native Mobile Game Lobby Status Bar: Profile on Left, Coins & Quick Toggles on Right (Single Clean Row) */
          <>
            {/* Left: Player Profile Pill */}
            <button
              onClick={() => {
                triggerHaptic('light');
                if (googleUser) {
                  setShowGoogleAuthModal(true);
                } else {
                  setStoreInitialTab('avatars');
                  setShowStore(true);
                }
              }}
              className="flex items-center gap-2 p-1 pr-3 rounded-full bg-slate-800/90 hover:bg-slate-700/90 border border-amber-500/40 shadow-md active:scale-95 transition flex-shrink-0"
              title="Profil və Hesab Məlumatları"
            >
              <div className="relative">
                <AvatarView
                  avatarId={stats.equippedAvatar || DEFAULT_AVATAR_ID}
                  frameId={stats.equippedFrame}
                  size={32}
                  showBorder={true}
                />
                {googleUser ? (
                  <span className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 rounded-full p-0.5 border border-slate-950 shadow">
                    <CheckCircle className="w-2.5 h-2.5 text-slate-950" />
                  </span>
                ) : (
                  <span className="absolute -bottom-0.5 -right-0.5 bg-amber-500 rounded-full px-1 text-[8px] font-black text-slate-950 border border-slate-950 shadow">
                    Q
                  </span>
                )}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-black text-white max-w-[100px] sm:max-w-[130px] truncate leading-tight">
                  {getMyPlayerIdentity(googleUser, stats).name}
                </span>
                <span className="text-[9px] font-bold text-amber-400/90 leading-tight">
                  {googleUser ? 'Buludla bağlı' : 'Qonaq Oyunçu'}
                </span>
              </div>
            </button>

            {/* Right: Gold Coins, Daily Bonus, Sound, Language */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Gold Coin Balance Pill with Store shortcut */}
              <button
                onClick={() => {
                  setStoreInitialTab('skins');
                  setShowStore(true);
                }}
                className="bg-slate-800/95 hover:bg-slate-700 border border-amber-500/50 rounded-full pl-2.5 pr-1.5 py-1 flex items-center gap-1.5 transition shadow-inner group active:scale-95"
                title="Qızıllar (Mağaza)"
              >
                <Coins className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="font-black text-amber-300 text-xs sm:text-sm">
                  {stats.coins}
                </span>
                <span className="w-4 h-4 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center leading-none ml-0.5">
                  +
                </span>
              </button>

              {/* Daily Reward Button */}
              <button
                onClick={() => setShowDailyReward(true)}
                title={t.dailyBonus}
                className={`p-1.5 rounded-full border transition active:scale-95 relative ${
                  dailyCheck.canClaim
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 animate-pulse ring-2 ring-amber-400/50'
                    : 'bg-slate-800/90 border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                <Gift className="w-4 h-4" />
                {dailyCheck.canClaim && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                )}
              </button>

              {/* Sound Toggle */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={t.sound}
                className="p-1.5 rounded-full bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition active:scale-95"
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-500" />
                )}
              </button>

              {/* Language Toggle */}
              <button
                onClick={cycleLanguage}
                title={t.language}
                className="px-2 py-1 rounded-full bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-[10px] font-black text-amber-300 uppercase transition active:scale-95"
              >
                {lang}
              </button>
            </div>
          </>
        )}
      </header>

      {/* Main Container */}
      <main className={`flex-1 relative flex flex-col min-h-0 ${!inGame ? 'overflow-y-auto overflow-x-hidden' : 'overflow-hidden'}`}>
        {!inGame ? (
          /* Native Mobile Game Lobby Screen — Full-height, balanced, immersive mobile gaming layout */
          <div
            className="flex-1 flex flex-col justify-between w-full max-w-lg mx-auto px-3.5 sm:px-6 py-2 pb-3 overflow-y-auto overflow-x-hidden select-none"
            style={lobbyBannerHeight > 0 ? { paddingBottom: `${lobbyBannerHeight + 12}px` } : undefined}
          >
            {/* Subtle decorative glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* TOP / HERO: Centered Game Title Emblem & Skin Quick-Selector */}
            <div className="w-full flex flex-col items-center justify-center pt-1 pb-1 z-10 text-center">
              <AzerbaijanLogo size="md" showSubtitle={true} className="justify-center" />

              {/* Dedicated Domino Skin Selector Pill — Full text, clean & tactile */}
              <button
                onClick={() => {
                  setStoreInitialTab('skins');
                  setShowStore(true);
                }}
                className="mt-2 px-3.5 py-1 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-amber-500/35 flex items-center gap-2 transition active:scale-95 shadow-md group"
                title="Daş Dəstini Dəyiş"
              >
                <span className="text-[11px] text-amber-400 font-bold">🀰 Daş Dəsti:</span>
                <span className="text-xs text-white font-extrabold group-hover:text-amber-200">
                  {activeSkin.name[lang]}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-300 group-hover:translate-x-0.5 transition" />
              </button>
            </div>

            {/* Çayxana Günün Hədiyyəsi & Armudu Stəkan / Qızıl Sandıq Widget */}
            <DailyTeahouseChestWidget
              stats={stats}
              lang={lang}
              onOpenModal={() => setShowDailyReward(true)}
            />

            {/* Guest Warning Banner (if guest) */}
            {!googleUser && showGuestWarning && (
              <div className="w-full my-1.5 bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border border-amber-500/40 rounded-2xl px-3.5 py-2 flex items-center justify-between gap-2 shadow-md z-10">
                <div className="flex items-center gap-2 min-w-0">
                  <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span className="text-[11px] text-amber-200 font-bold truncate">
                    Qonaq rejimi — Qızılları buludda qoru:
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => setShowGoogleAuthModal(true)}
                    className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow active:scale-95"
                  >
                    Google Giriş
                  </button>
                  <button
                    onClick={() => {
                      setShowGuestWarning(false);
                      setGuestNoticeDismissed(true);
                    }}
                    title="Bildirişi bağla"
                    className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Primary Online Multiplayer Action + Quick Match */}
            <div className="w-full flex gap-2 my-1.5 z-10">
              <button
                onClick={() => setShowMultiplayerLobby(true)}
                className="flex-1 py-3 px-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:brightness-110 text-slate-950 font-black text-sm shadow-[0_0_25px_rgba(20,184,166,0.3)] transition-all flex items-center justify-between group active:scale-[0.99] border border-white/30"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-slate-950/25 rounded-xl">
                    <Globe className="w-5 h-5 text-white animate-pulse" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-white font-black text-sm sm:text-base tracking-wide">
                      Canlı Onlayn Oyna
                    </span>
                    <span className="text-[10px] sm:text-[11px] text-emerald-950 font-extrabold">
                      Dostlarla otaq və ya ümumi masa
                    </span>
                  </div>
                </div>
                <span className="text-[10px] bg-slate-950 text-emerald-300 font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow">
                  Onlayn
                </span>
              </button>

              <button
                onClick={async () => {
                  if (isQuickMatching) return;
                  triggerHaptic('medium');
                  setIsQuickMatching(true);
                  try {
                    const myId = getMyPlayerIdentity(googleUser, stats);
                    await handleQuickMatch('2p_solo', googleUser?.name || myId.name);
                  } catch (e: any) {
                    showTemporarySocialBanner(e?.message || 'Tezbazar otağa qoşulmaq mümkün olmadı.');
                  } finally {
                    setIsQuickMatching(false);
                  }
                }}
                disabled={isQuickMatching}
                title="Tezbazar 1v1 Onlayn Oyun"
                className="py-3 px-3.5 rounded-2xl bg-gradient-to-b from-amber-400 to-amber-600 hover:brightness-110 disabled:opacity-60 text-slate-950 font-black flex flex-col items-center justify-center gap-0.5 shadow-md active:scale-95 transition flex-shrink-0 border border-amber-300/50"
              >
                <Sparkles className={`w-5 h-5 fill-slate-950 ${isQuickMatching ? 'animate-spin' : ''}`} />
                <span className="text-[11px] leading-none font-black">
                  {isQuickMatching ? 'Axtarılır...' : 'Tezbazar'}
                </span>
              </button>
            </div>

            {/* Game Variant Switcher: Domino 101 vs Telefon 365 */}
            <div className="w-full grid grid-cols-2 gap-2 p-1.5 bg-slate-900/90 rounded-2xl border border-slate-800/90 my-1.5 shadow-inner z-10">
              <button
                onClick={() => setGameVariant('101')}
                className={`py-2 px-3 rounded-xl font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 ${
                  gameVariant === '101'
                    ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Trophy className="w-4 h-4" />
                <span>Domino 101</span>
              </button>

              <button
                onClick={() => setGameVariant('365')}
                className={`py-2 px-3 rounded-xl font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 ${
                  gameVariant === '365'
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Telefon 365</span>
              </button>
            </div>

            {/* Offline AI Mode Buttons */}
            <div className="w-full space-y-2 my-1 z-10">
              {gameVariant === '101' ? (
                <>
                  {/* Featured 4P Duo */}
                  <button
                    onClick={() => startMatch('4p_duo', '101')}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:brightness-110 text-slate-950 font-black text-xs sm:text-sm shadow-lg transition-all flex items-center justify-between active:scale-[0.99]"
                  >
                    <span className="flex items-center gap-2.5">
                      <Play className="w-4 h-4 fill-slate-950" />
                      <span className="text-sm font-black">4 Nəfərlik Qoşa (2 vs 2)</span>
                    </span>
                    <span className="text-[11px] bg-slate-950 text-amber-300 font-bold px-3 py-1 rounded-full shadow">
                      🤖 Komanda • 101
                    </span>
                  </button>

                  {/* 2P and 3P side-by-side */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => startMatch('2p_solo', '101')}
                      className="py-3 px-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 text-slate-100 font-bold text-xs sm:text-sm transition flex flex-col items-start gap-0.5 active:scale-95 shadow"
                    >
                      <span className="font-extrabold text-white text-xs sm:text-sm">2 Nəfərlik Tək</span>
                      <span className="text-[11px] text-amber-400 font-semibold">🤖 1 vs 1 Bot</span>
                    </button>

                    <button
                      onClick={() => startMatch('3p_solo', '101')}
                      className="py-3 px-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 text-slate-100 font-bold text-xs sm:text-sm transition flex flex-col items-start gap-0.5 active:scale-95 shadow"
                    >
                      <span className="font-extrabold text-white text-xs sm:text-sm">3 Nəfərlik Tək</span>
                      <span className="text-[11px] text-amber-400 font-semibold">🤖 1 vs 2 Bot</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Featured 4P Duo */}
                  <button
                    onClick={() => startMatch('4p_duo', '365')}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 font-black text-xs sm:text-sm shadow-lg transition-all flex items-center justify-between active:scale-[0.99]"
                  >
                    <span className="flex items-center gap-2.5">
                      <Play className="w-4 h-4 fill-slate-950" />
                      <span className="text-sm font-black">4 Nəfərlik Qoşa (2 vs 2)</span>
                    </span>
                    <span className="text-[11px] bg-slate-950 text-emerald-300 font-bold px-3 py-1 rounded-full shadow">
                      🤖 Komanda • 365
                    </span>
                  </button>

                  {/* 2P, 3P, 4P Solo in a clean 3-column grid */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => startMatch('2p_solo', '365')}
                      className="py-2.5 px-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 text-slate-100 font-bold text-xs transition flex flex-col items-center gap-0.5 active:scale-95 shadow"
                    >
                      <span className="font-extrabold text-white text-xs">2 Nəfərlik</span>
                      <span className="text-[10px] text-amber-400 font-semibold">1 vs 1 Bot</span>
                    </button>

                    <button
                      onClick={() => startMatch('3p_solo', '365')}
                      className="py-2.5 px-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 text-slate-100 font-bold text-xs transition flex flex-col items-center gap-0.5 active:scale-95 shadow"
                    >
                      <span className="font-extrabold text-white text-xs">3 Nəfərlik</span>
                      <span className="text-[10px] text-amber-400 font-semibold">1 vs 2 Bot</span>
                    </button>

                    <button
                      onClick={() => startMatch('4p_solo', '365')}
                      className="py-2.5 px-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 text-slate-100 font-bold text-xs transition flex flex-col items-center gap-0.5 active:scale-95 shadow"
                    >
                      <span className="font-extrabold text-white text-xs">4 Nəfərlik</span>
                      <span className="text-[10px] text-amber-400 font-semibold">1 vs 3 Bot</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Native Mobile Game Bottom Navigation Dock */}
            <div className="w-full mt-auto pt-2 pb-1 border-t border-slate-800/90 grid grid-cols-4 gap-1.5 z-20">
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setShowStore(true);
                }}
                className="flex flex-col items-center justify-center py-2 px-1 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-amber-300 active:scale-95 transition shadow group"
              >
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-200 mt-1">Mağaza</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic('light');
                  setShowTeahousesModal(true);
                }}
                className="flex flex-col items-center justify-center py-2 px-1 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-amber-300 active:scale-95 transition shadow group"
              >
                <span className="text-base sm:text-lg leading-none group-hover:scale-110 transition-transform">☕</span>
                <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-200 mt-1">Çayxana</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic('light');
                  setShowFriendsModal(true);
                }}
                className="relative flex flex-col items-center justify-center py-2 px-1 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-teal-300 active:scale-95 transition shadow group"
              >
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-teal-400 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-200 mt-1">Dostlar</span>
                {incomingFriendRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black shadow animate-bounce">
                    {incomingFriendRequests.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  triggerHaptic('light');
                  setShowRules(true);
                }}
                className="flex flex-col items-center justify-center py-2 px-1 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-sky-300 active:scale-95 transition shadow group"
              >
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-200 mt-1">Qaydalar</span>
              </button>
            </div>
          </div>
        ) : (
          /* Active Playing Screen */
          <div className="flex-1 relative flex flex-col overflow-hidden">
            {/* Dedicated Non-Overlapping Top HUD Bar: ScoreBoard (Your & Opponent Scores) + Turn Indicator + Bazaar */}
            <div className="w-full px-2 py-1.5 landscape:py-0.5 bg-slate-950/85 border-b border-amber-500/20 flex flex-wrap items-center justify-between gap-1.5 z-30 flex-shrink-0 pointer-events-auto">
              {/* Left: Player & Opponent Scores */}
              <div className="flex items-center">
                <ScoreBoard
                  players={effectivePlayers}
                  mode={effectiveInMultiplayer ? (mpGameState?.mode || mode) : mode}
                  lang={lang}
                  roundNumber={effectiveRoundNumber}
                  lastScoredPoints={effectiveLastScored}
                  equippedFrame={stats.equippedFrame}
                  equippedTitle={stats.equippedTitle}
                  variant={effectiveInMultiplayer ? (mpGameState?.variant || '365') : gameVariant}
                  match101State={effectiveInMultiplayer ? (mpGameState?.match101State || match101State) : match101State}
                  myPlayerIndex={localPlayerIndex}
                />
              </div>

              {/* Right / Center: Turn Indicator Pill + Bazaar Tray */}
              <div className="flex items-center gap-1.5 ml-auto">
                {!effectiveHandRevealed && !effectiveForcedTile && (
                  <div className="pointer-events-none transition-all">
                    {isMyTurn ? (
                      <div className="bg-emerald-950/95 border-2 border-emerald-400 text-emerald-300 px-3 py-1 rounded-full shadow-[0_2px_12px_rgba(16,185,129,0.45)] flex items-center gap-1.5 text-[11px] sm:text-xs font-black uppercase tracking-wider backdrop-blur-md animate-fade-in">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                        <span>{t.yourTurn}</span>
                        {effectiveInMultiplayer && mpGameState?.turnTimeRemaining !== undefined && (
                          <span className="text-emerald-300 font-mono text-[10px] ml-0.5 bg-emerald-900/80 px-1.5 py-0.5 rounded-full border border-emerald-500/40">
                            ⏱ {mpGameState.turnTimeRemaining}s
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="bg-slate-900/95 border border-amber-500/70 text-slate-200 px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1.5 text-[11px] font-bold backdrop-blur-md">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse inline-block" />
                        <span className="text-amber-300 font-black max-w-[95px] sm:max-w-[130px] truncate">
                          {effectivePlayers[effectiveTurn]?.name}
                        </span>
                        <span className="text-slate-300 text-[10px] font-semibold">{t.aiThinking}</span>
                      </div>
                    )}
                  </div>
                )}

                {effectiveBoneyardCount > 0 && effectivePlayers.length < 4 && (
                  <div className="pointer-events-auto">
                    <BazaarTray
                      boneyard={boneyard}
                      count={effectiveBoneyardCount}
                      skin={activeSkin}
                      isMyTurn={isMyTurn}
                      canDraw={isMyTurn && !humanHasPlayableMove && effectiveBoneyardCount > currentMinReserve && !isCurrentBoardBlocked}
                      onDrawTile={handleDrawTile}
                      lang={lang}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Table Area (Completely below ScoreBoard & Turn Indicator so they NEVER overlap!) */}
            <div className="flex-1 relative flex flex-col overflow-hidden bg-slate-950">
              {(() => {
                const activeVariant = effectiveInMultiplayer ? (mpGameState?.variant || '365') : gameVariant;
                const active101 = effectiveInMultiplayer ? (mpGameState?.match101State || match101State) : match101State;

                const getSideScore = (playerIdx: number, p: Player | undefined) => {
                  if (effectivePlayers.length === 3 && activeVariant === '101') {
                    return active101?.playerAccounts?.[p?.id ?? playerIdx]?.mainScore ?? p?.score ?? 0;
                  }
                  return p?.score ?? 0;
                };

                const renderTopSeat = () => {
                  if (effectivePlayers.length === 2) {
                    const oppIdx = effectivePlayers.findIndex((_, i) => i !== localPlayerIndex);
                    const opponent = effectivePlayers[oppIdx] || effectivePlayers[1];
                    const isOpponentTurn = effectiveTurn === oppIdx && !effectiveHandRevealed;
                    const oppNotice = opponentActionNotice?.playerIndex === oppIdx ? opponentActionNotice : null;
                    const oppDisplayScore =
                      activeVariant === '101'
                        ? (oppIdx === 0 ? active101?.team1?.mainScore : active101?.team2?.mainScore) ??
                          opponent?.score ??
                          0
                        : opponent?.score ?? 0;
                    return (
                      <div
                        className={`${
                          isPortraitMatch
                            ? 'flex flex-col items-center pointer-events-auto'
                            : 'absolute top-1.5 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center'
                        }`}
                      >
                        <div
                          onClick={() => {
                            triggerHaptic('light');
                            if (opponent) {
                              const targetSlot = mpGameState?.players[oppIdx];
                              setGiftTargetPlayer({
                                index: oppIdx >= 0 ? oppIdx : 1,
                                name: opponent.name,
                                isBot: opponent.isAI || !effectiveInMultiplayer,
                                playerTag: targetSlot?.playerTag,
                                playerId: targetSlot?.playerId
                              });
                            }
                          }}
                          className={`flex items-center gap-1.5 mb-1 backdrop-blur-sm px-2.5 py-0.5 rounded-full border shadow cursor-pointer active:scale-95 transition-all group ${
                            isOpponentTurn
                              ? 'bg-amber-950/95 border-amber-400 ring-4 ring-amber-400/60 shadow-[0_0_25px_rgba(251,191,36,0.9)] scale-105'
                              : 'bg-slate-900/80 hover:bg-slate-800/90 border-slate-700/60'
                          }`}
                          title={`${opponent?.name} üçün hədiyyə göndər`}
                        >
                          <div className="relative">
                            <AvatarView
                              avatarId={opponent?.avatarId || 'avatar_tea_master'}
                              size={20}
                              showBorder={false}
                            />
                            {isOpponentTurn && (
                              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                              </span>
                            )}
                          </div>
                          <span className={`text-[11px] font-bold flex items-center gap-1 ${isOpponentTurn ? 'text-amber-300 font-black' : 'text-slate-300'}`}>
                            {opponent?.name} ({opponent?.hand.length} daş)
                          </span>
                          <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black">
                            ⭐ {oppDisplayScore} xal
                          </span>
                          {isOpponentTurn && (
                            <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black animate-pulse flex items-center gap-0.5 shadow">
                              <span>🎯 Növbə</span>
                            </span>
                          )}
                          <span className="text-xs group-hover:scale-125 transition-transform">🎁</span>
                        </div>
                        {oppNotice && (
                          <div className={`mb-1 px-2.5 py-0.5 rounded-full text-[10px] font-black shadow-lg border animate-bounce ${
                            oppNotice.type === 'draw'
                              ? 'bg-cyan-950/95 border-cyan-400 text-cyan-200'
                              : 'bg-rose-950/95 border-rose-400 text-rose-200'
                          }`}>
                            {oppNotice.text}
                          </div>
                        )}
                        <div className={`flex items-center -space-x-3 sm:-space-x-4 transition-all px-1.5 py-0.5 rounded-xl ${isOpponentTurn ? 'ring-2 ring-amber-400/50 bg-amber-950/20 p-0.5 shadow-[0_0_15px_rgba(251,191,36,0.35)]' : ''}`}>
                          {opponent?.hand.map((tile, i) => (
                            <div key={tile.id || i} style={{ zIndex: i }}>
                              <DominoTile
                                tile={tile}
                                skin={activeSkin}
                                isFaceDown={!effectiveHandRevealed}
                                scale={0.44}
                                isVertical={false}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  if (effectivePlayers.length === 4) {
                    const topIdx = (localPlayerIndex + 2) % 4;
                    const topPartner = effectivePlayers[topIdx];
                    const isTopTurn = effectiveTurn === topIdx && !effectiveHandRevealed;
                    const topNotice = opponentActionNotice?.playerIndex === topIdx ? opponentActionNotice : null;
                    return (
                      <div
                        className={`${
                          isPortraitMatch
                            ? 'flex flex-col items-center pointer-events-auto'
                            : 'absolute top-1.5 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center pointer-events-auto'
                        }`}
                      >
                        <div
                          onClick={() => {
                            triggerHaptic('light');
                            if (topPartner) {
                              const targetSlot = mpGameState?.players[topIdx];
                              setGiftTargetPlayer({
                                index: topIdx,
                                name: topPartner.name,
                                isBot: topPartner.isAI || !effectiveInMultiplayer,
                                playerTag: targetSlot?.playerTag,
                                playerId: targetSlot?.playerId
                              });
                            }
                          }}
                          className={`flex items-center gap-1.5 backdrop-blur-md px-3 py-1 rounded-full border shadow-lg cursor-pointer active:scale-95 transition-all group ${
                            isTopTurn
                              ? 'bg-amber-950/95 border-amber-400 ring-4 ring-amber-400/60 shadow-[0_0_25px_rgba(251,191,36,0.9)] scale-105'
                              : 'bg-slate-900/90 hover:bg-slate-800/90 border-slate-700/70'
                          }`}
                          title={`${topPartner?.name} üçün hədiyyə göndər`}
                        >
                          <div className="relative">
                            <AvatarView
                              avatarId={topPartner?.avatarId || 'avatar_sheki_guest'}
                              size={22}
                              showBorder={false}
                            />
                            {isTopTurn && (
                              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                              </span>
                            )}
                          </div>
                          <span className={`text-[11px] font-bold ${isTopTurn ? 'text-amber-300 font-black' : 'text-slate-200'}`}>
                            {topPartner?.name}
                          </span>
                          <span className="px-1.5 py-0.5 rounded-full bg-slate-800 border border-slate-600 text-emerald-300 text-[10px] font-black tracking-wide flex items-center gap-0.5 shadow-sm">
                            <span>🀰</span>
                            <span>{topPartner?.hand.length ?? 0}</span>
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-black">
                            ⭐{topPartner?.score ?? 0}
                          </span>
                          {isTopTurn && (
                            <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black animate-pulse flex items-center gap-0.5 shadow">
                              <span>🎯 Növbə</span>
                            </span>
                          )}
                          <span className="text-xs group-hover:scale-125 transition-transform">🎁</span>
                        </div>
                        {topNotice && (
                          <div className={`mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-black shadow border animate-bounce ${
                            topNotice.type === 'draw'
                              ? 'bg-cyan-950/95 border-cyan-400 text-cyan-200'
                              : 'bg-rose-950/95 border-rose-400 text-rose-200'
                          }`}>
                            {topNotice.text}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return null;
                };

                const renderSideOpponent = (
                  side: 'left' | 'right',
                  oppIdx: number,
                  fallbackAvatar: string
                ) => {
                  const opponent = effectivePlayers[oppIdx];
                  const isTurn = effectiveTurn === oppIdx && !effectiveHandRevealed;
                  const notice = opponentActionNotice?.playerIndex === oppIdx ? opponentActionNotice : null;
                  const score = getSideScore(oppIdx, opponent);
                  const isLeft = side === 'left';

                  return (
                    <div
                      className={
                        isPortraitMatch
                          ? 'w-8 flex-shrink-0 flex items-center justify-center relative z-20 pointer-events-auto'
                          : `absolute ${isLeft ? 'left-0.5 sm:left-1' : 'right-0.5 sm:right-1'} top-[42%] -translate-y-1/2 z-10 flex items-center ${isLeft ? '' : 'flex-row-reverse'} pointer-events-auto`
                      }
                    >
                      <div className="w-8 h-36 flex items-center justify-center">
                        <div
                          onClick={() => {
                            triggerHaptic('light');
                            if (opponent) {
                              const targetSlot = mpGameState?.players[oppIdx];
                              setGiftTargetPlayer({
                                index: oppIdx,
                                name: opponent.name,
                                isBot: opponent.isAI || !effectiveInMultiplayer,
                                playerTag: targetSlot?.playerTag,
                                playerId: targetSlot?.playerId
                              });
                            }
                          }}
                          title={`${opponent?.name} üçün hədiyyə göndər`}
                          className={`${isLeft ? 'rotate-90' : '-rotate-90 flex-row-reverse'} origin-center whitespace-nowrap flex items-center gap-1.5 backdrop-blur-md px-2.5 py-1 rounded-full border shadow-lg cursor-pointer active:scale-95 transition-all group ${
                            isTurn
                              ? 'bg-amber-950/95 border-amber-400 ring-4 ring-amber-400/60 shadow-[0_0_20px_rgba(251,191,36,0.85)] scale-105'
                              : 'bg-slate-900/90 hover:bg-slate-800/95 border-slate-700/80'
                          }`}
                        >
                          <div className={`relative ${isLeft ? '-rotate-90' : 'rotate-90'} flex-shrink-0`}>
                            <AvatarView
                              avatarId={opponent?.avatarId || fallbackAvatar}
                              size={20}
                              showBorder={false}
                            />
                            {isTurn && (
                              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                              </span>
                            )}
                          </div>
                          <span className={`text-[11px] font-bold max-w-[85px] sm:max-w-[120px] truncate ${isTurn ? 'text-amber-300 font-black' : 'text-slate-200'}`}>
                            {opponent?.name}
                          </span>
                          <span className="px-1.5 py-0.5 rounded-full bg-slate-800 border border-slate-600 text-amber-300 text-[10px] font-black tracking-wide flex items-center gap-0.5 shadow-sm">
                            <span className={isLeft ? '-rotate-90' : 'rotate-90'}>🀰</span>
                            <span>{opponent?.hand.length ?? 0}</span>
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-black">
                            ⭐{score}
                          </span>
                          {isTurn && (
                            <span className={`px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black animate-pulse ${isLeft ? '-rotate-90' : 'rotate-90'}`}>
                              🎯
                            </span>
                          )}
                          <span className={`text-[10px] group-hover:scale-125 transition-transform ${isLeft ? '-rotate-90' : 'rotate-90'}`}>🎁</span>
                        </div>
                      </div>
                      {notice && (
                        <div
                          className={`${
                            isPortraitMatch
                              ? `absolute ${isLeft ? 'left-9' : 'right-9'} top-1/2 -translate-y-1/2 z-30 pointer-events-none`
                              : isLeft
                              ? 'ml-1'
                              : 'mr-1'
                          } px-2.5 py-0.5 rounded-full text-[10px] font-black shadow border animate-bounce whitespace-nowrap ${
                            notice.type === 'draw'
                              ? 'bg-cyan-950/95 border-cyan-400 text-cyan-200'
                              : 'bg-rose-950/95 border-rose-400 text-rose-200'
                          }`}
                        >
                          {notice.text}
                        </div>
                      )}
                    </div>
                  );
                };

                const leftSideSeat =
                  effectivePlayers.length === 3
                    ? renderSideOpponent('left', (localPlayerIndex + 1) % 3, 'avatar_tea_master')
                    : effectivePlayers.length === 4
                    ? renderSideOpponent('left', (localPlayerIndex + 1) % 4, 'avatar_tea_master')
                    : null;

                const rightSideSeat =
                  effectivePlayers.length === 3
                    ? renderSideOpponent('right', (localPlayerIndex + 2) % 3, 'avatar_sheki_guest')
                    : effectivePlayers.length === 4
                    ? renderSideOpponent('right', (localPlayerIndex + 3) % 4, 'avatar_icherisheher_sage')
                    : null;

                return (
                  <>
                    {/* Portrait Mode: Top zone sits OUTSIDE the 1:1 framed play area so the top feels open & non-overlapping */}
                    {isPortraitMatch ? (
                      <div className="w-full flex-shrink-0 pt-2 pb-1 px-2 flex flex-col items-center justify-center relative z-20 pointer-events-none min-h-[18px]">
                        {renderTopSeat()}
                        {effectiveForcedTile && (
                          <div className="mt-1 bg-amber-500/20 border border-amber-500/50 rounded-xl px-3 py-1 max-w-xs text-[11px] text-amber-300 font-semibold shadow-lg animate-pulse text-center pointer-events-auto">
                            {t.startingTilePrompt}
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        {effectiveForcedTile && (
                          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 bg-amber-500/20 border border-amber-500/50 rounded-xl px-4 py-1.5 max-w-sm text-xs text-amber-300 font-semibold shadow-lg animate-pulse text-center">
                            {t.startingTilePrompt}
                          </div>
                        )}
                        {renderTopSeat()}
                        {leftSideSeat}
                        {rightSideSeat}
                      </>
                    )}

                    {/* Reshuffle Notice Banner */}
                    {effectiveReshuffleNotice && (
                      <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center pointer-events-none animate-fade-in">
                        <div className="bg-amber-950/95 border-2 border-amber-400 rounded-2xl px-5 py-2.5 shadow-[0_0_35px_rgba(251,191,36,0.6)] flex items-center gap-2.5 max-w-md text-center">
                          <RotateCcw className="w-4 h-4 text-amber-400 animate-spin flex-shrink-0" />
                          <span className="text-amber-200 text-xs sm:text-sm font-black tracking-wide">
                            {effectiveReshuffleNotice}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Hand End Animated Tally Overlay Banner on Table */}
                    {effectiveHandRevealed && (
                      <div
                        onClick={() => setShowGameEnd(true)}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 flex flex-col items-center pointer-events-auto cursor-pointer"
                        title="Nəticələrə dərhal keçmək üçün toxunun"
                      >
                        <div className="bg-slate-950/95 border-2 border-amber-400 rounded-2xl px-6 py-4 shadow-[0_0_35px_rgba(251,191,36,0.6)] flex flex-col items-center animate-fade-in hover:scale-105 transition-transform">
                          <span className="text-amber-400 text-xs font-black uppercase tracking-wider mb-1">
                            {effectiveIsBaglandi ? t.baglandi : t.dominoOut}
                          </span>

                          {didIWinHand ? (
                            effectiveRevealPhase === 1 ? (
                              <div className="flex flex-col items-center">
                                <span className="text-xs text-emerald-300 font-bold">Rəqiblərin əlindən:</span>
                                <span className="text-3xl font-black text-white mt-1 animate-pulse">
                                  {effectiveRawBonusPoints} xal
                                </span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center">
                                <span className="text-xs text-emerald-300 font-bold">Rəqiblərin əlindən:</span>
                                <div className="flex items-center gap-2 mt-1">
                                  {effectiveRawBonusPoints > 0 && effectiveRawBonusPoints !== effectiveHandBonusPoints && (
                                    <span className="text-xl text-slate-400 line-through">
                                      {effectiveRawBonusPoints}
                                    </span>
                                  )}
                                  <span className="text-3xl font-black text-emerald-400 animate-bounce">
                                    +{effectiveHandBonusPoints} xal
                                  </span>
                                </div>
                              </div>
                            )
                          ) : (
                            <div className="flex flex-col items-center">
                              <span className="text-xs text-amber-300 font-bold">
                                {roundWinnerPlayer?.name || 'Rəqib'} əli qazandı:
                              </span>
                              <span className="text-2xl font-black text-amber-400 mt-1">
                                +{effectiveHandBonusPoints} xal
                              </span>
                            </div>
                          )}

                          <span className="text-[10px] text-amber-300/80 mt-2 font-medium">
                            (Nəticəyə baxmaq üçün toxunun)
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Scripted Tutorial Guide Banner (Non-blocking, with Exit anytime) */}
                    {isTutorialMode && !tutorialCompleted && (() => {
                      const tutCopy = getTutorialCopy(lang);
                      const stepKind = getTutorialStep(board.tiles.length, currentTurn, humanHand);
                      const stepInfo = stepKind === 'wait_bot' ? null : tutCopy.steps[stepKind];
                      return (
                        <div className="w-full max-w-xl mx-auto px-2.5 pt-1.5 z-30 flex-shrink-0">
                          <div className="bg-slate-950/90 backdrop-blur-md border border-emerald-400/50 rounded-2xl px-3.5 py-2.5 shadow-lg flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 flex-shrink-0 mt-0.5">
                                <GraduationCap className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                                    {tutCopy.badgeLabel}
                                  </span>
                                  <span className="text-xs sm:text-sm font-black text-amber-300">
                                    {stepInfo ? stepInfo.title : tutCopy.botThinking}
                                  </span>
                                </div>
                                {stepInfo && (
                                  <p className="text-[11px] sm:text-xs text-slate-200 mt-1 leading-snug">
                                    {stepInfo.body}
                                  </p>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={handleForfeitAction}
                              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-bold flex-shrink-0 transition border border-slate-700"
                            >
                              {tutCopy.exitButton}
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Tutorial Complete Overlay */}
                    {isTutorialMode && tutorialCompleted && (() => {
                      const tutCopy = getTutorialCopy(lang);
                      return (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
                          <div className="bg-slate-900 border border-emerald-500/50 rounded-3xl max-w-md w-full p-6 shadow-2xl text-center space-y-4">
                            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
                              <Trophy className="w-7 h-7 text-emerald-300" />
                            </div>
                            <h3 className="text-xl font-black text-white">{tutCopy.completeTitle}</h3>
                            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                              {tutCopy.completeBody}
                            </p>
                            <div className="flex flex-col gap-2 pt-2">
                              <button
                                onClick={() => startMatch('2p_solo')}
                                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 font-black text-sm shadow-lg transition"
                              >
                                {tutCopy.completePlayReal}
                              </button>
                              <button
                                onClick={handleForfeitAction}
                                className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
                              >
                                {tutCopy.completeMenu}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Center Domino Table Canvas: 1:1 framed square in portrait mode, full-bleed in landscape */}
                    {isPortraitMatch ? (
                      <div className={`flex-1 min-h-0 w-full flex items-center justify-center relative ${effectivePlayers.length >= 3 ? 'px-1' : 'px-3.5'}`}>
                        {leftSideSeat}
                        <div
                          ref={boardStageRef}
                          className="flex-1 h-full min-w-0 min-h-0 flex items-center justify-center px-1 py-1"
                        >
                          <div
                            className={`relative rounded-2xl overflow-hidden border border-amber-500/35 shadow-[0_12px_40px_rgba(0,0,0,0.85)] transition-transform ${
                              isScreenShaking ? 'animate-shake' : ''
                            }`}
                            style={
                              portraitBoardSide > 0
                                ? { width: portraitBoardSide, height: portraitBoardSide }
                                : viewportSize.h > viewportSize.w
                                ? { width: '100%', aspectRatio: '1 / 1', maxHeight: '100%' }
                                : { height: '100%', aspectRatio: '1 / 1', maxWidth: '100%' }
                            }
                          >
                            <BoardView
                              board={effectiveBoard}
                              skin={activeSkin}
                              tableThemeId={stats.equippedTableTheme || DEFAULT_TABLE_THEME_ID}
                              selectedTile={selectedTile}
                              playableBranches={playableBranches}
                              onSelectBranch={handleSelectBranch}
                              branchExpectedScores={branchExpectedScores}
                              hoveredBranch={hoveredBranch}
                              boneyardCount={effectiveBoneyardCount}
                              onDrawBazaar={handleDrawTile}
                              canDrawFromBazaar={isMyTurn && !humanHasPlayableMove && effectiveBoneyardCount > currentMinReserve && !isCurrentBoardBlocked}
                              isDraggingTile={Boolean(draggedTile)}
                              variant={effectiveInMultiplayer ? (mpGameState?.variant || '365') : gameVariant}
                              isFramedSquare={true}
                            />
                          </div>
                        </div>
                        {rightSideSeat}
                      </div>
                    ) : (
                      <div className={`flex-1 w-full h-full transition-transform ${isScreenShaking ? 'animate-shake' : ''}`}>
                        <BoardView
                          board={effectiveBoard}
                          skin={activeSkin}
                          tableThemeId={stats.equippedTableTheme || DEFAULT_TABLE_THEME_ID}
                          selectedTile={selectedTile}
                          playableBranches={playableBranches}
                          onSelectBranch={handleSelectBranch}
                          branchExpectedScores={branchExpectedScores}
                          hoveredBranch={hoveredBranch}
                          boneyardCount={effectiveBoneyardCount}
                          onDrawBazaar={handleDrawTile}
                          canDrawFromBazaar={isMyTurn && !humanHasPlayableMove && effectiveBoneyardCount > currentMinReserve && !isCurrentBoardBlocked}
                          isDraggingTile={Boolean(draggedTile)}
                          variant={effectiveInMultiplayer ? (mpGameState?.variant || '365') : gameVariant}
                        />
                      </div>
                    )}
                  </>
                );
              })()}

            {/* Teahouse Chat Overlay during both singleplayer and multiplayer matches */}
            <TeahouseChatOverlay
              recentMessages={mpChatMessages}
              myPlayerIndex={localPlayerIndex}
              myPlayerName={effectivePlayers[localPlayerIndex]?.name || 'Sən'}
              onSendChat={(text?: string, emoji?: string) => {
                if (effectiveInMultiplayer) {
                  multiplayerSocket.sendChat(text, emoji);
                } else {
                  setMpChatMessages((prev) => [
                    ...prev,
                    {
                      id: Date.now().toString(),
                      senderName: googleUser?.name || 'Sən',
                      senderIndex: localPlayerIndex,
                      text,
                      emoji,
                      timestamp: Date.now()
                    }
                  ]);
                }
              }}
            />

            {/* Player Hands & Action Controls (Bottom) */}
            <PlayerControls
              hand={humanHand}
              skin={activeSkin}
              isMyTurn={isMyTurn}
              selectedTile={selectedTile}
              draggedTile={draggedTile}
              playableTileIds={playableTileIds}
              availableCombos={availableCombos}
              onExecuteCombo={(combo) => {
                if (effectiveInMultiplayer) {
                  multiplayerSocket.playCombo(combo);
                } else {
                  executeComboMove(0, combo);
                }
              }}
              boneyardCount={effectiveBoneyardCount}
              hasPlayableMove={humanHasPlayableMove}
              onSelectTile={handleSelectTile}
              onStartDrag={handleStartDrag}
              onDrawTile={handleDrawTile}
              onPassTurn={handlePassTurn}
              lang={lang}
              isBoardBlocked={isCurrentBoardBlocked}
              variant={effectiveInMultiplayer ? (mpGameState?.variant || '365') : gameVariant}
              minBoneyardReserve={currentMinReserve}
            />
            </div>
          </div>
        )}
      </main>

      {/* Floating Dragged Domino Avatar (Follows Cursor / Touch via direct DOM ref — 0 React re-renders!) */}
      {draggedTile && (
        <div
          ref={dragOverlayRef}
          className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-full mb-3 select-none will-change-transform"
          style={{
            left: `${dragInitialPointRef.current.x}px`,
            top: `${dragInitialPointRef.current.y - 20}px`,
            filter: 'drop-shadow(0 25px 40px rgba(0,0,0,0.9))'
          }}
        >
          <div className="transform -rotate-6 scale-105 animate-pulse">
            <DominoTile
              tile={draggedTile}
              skin={activeSkin}
              isVertical={true}
              customWidth={54}
              customHeight={108}
              isSelected={true}
            />
          </div>
        </div>
      )}

      {/* Modals */}
      <Suspense fallback={null}>
      <StoreModal
        isOpen={showStore}
        onClose={() => setShowStore(false)}
        lang={lang}
        stats={stats}
        onUpdateStats={handleUpdateStats}
        initialTab={storeInitialTab}
        onOpenBugReport={() => {
          setShowStore(false);
          setOpenBugReportOnProfile(true);
          setShowGoogleAuthModal(true);
        }}
      />

      <DailyRewardModal
        isOpen={showDailyReward}
        onClose={() => setShowDailyReward(false)}
        lang={lang}
        stats={stats}
        onUpdateStats={handleUpdateStats}
      />

      <RulesModal
        isOpen={showRules}
        onClose={() => setShowRules(false)}
        lang={lang}
        onStartTutorial={startTutorialMatch}
      />

      {/* Optional First-Launch Tutorial Prompt Modal (~45 seconds) */}
      {!inGame && showTutorialPrompt && !showGoogleAuthModal && !showRules && (() => {
        const tutCopy = getTutorialCopy(lang);
        const dismissTutorialPrompt = () => {
          try {
            localStorage.setItem(TUTORIAL_SEEN_KEY, '1');
          } catch {
            // ignore storage errors
          }
          setShowTutorialPrompt(false);
        };
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
                      {tutCopy.promptBadge}
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                      {tutCopy.promptTitle}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={dismissTutorialPrompt}
                  className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {tutCopy.promptBody}
              </p>

              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs font-bold">
                <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>{tutCopy.promptDuration}</span>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <button
                  onClick={startTutorialMatch}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:brightness-110 text-slate-950 font-black text-sm shadow-lg transition flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>{tutCopy.promptStart}</span>
                </button>
                <button
                  onClick={dismissTutorialPrompt}
                  className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
                >
                  {tutCopy.promptSkip}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      <GameEndModal
        isOpen={showGameEnd}
        isMatchOver={effectiveIsMatchOver}
        isBaglandi={effectiveIsBaglandi}
        baglandiOver365Restart={baglandiOver365Restart}
        isInstant35={effectiveIsInstant35}
        winnerPlayerIndex={effectiveWinnerIndex}
        winnerTeam={effectiveWinnerTeam}
        handBonusPoints={effectiveHandBonusPoints}
        rawOpponentPips={effectiveRawBonusPoints}
        players={effectivePlayers}
        mode={effectiveInMultiplayer ? (mpGameState?.mode || mode) : mode}
        lang={lang}
        myPlayerIndex={localPlayerIndex}
        isHost={
          effectiveInMultiplayer
            ? Boolean(
                mpIsHost ||
                  mpGameState?.players[localPlayerIndex]?.isHost ||
                  mpGameState?.players.every((p, idx) => idx === localPlayerIndex || p.isAI)
              )
            : true
        }
        onNextHand={handleNextHandAction}
        onRestartMatch={async () => {
          if (effectiveIsMatchOver && !watchedRewardedOnCurrentMatchEndRef.current) {
            await maybeShowMatchEndInterstitial();
          }
          handleRestartMatchAction();
        }}
        onLeaveMatch={async () => {
          if (effectiveIsMatchOver && !watchedRewardedOnCurrentMatchEndRef.current) {
            await maybeShowMatchEndInterstitial();
          }
          handleForfeitAction();
        }}
        onClaimAdBonus={effectiveIsMatchOver ? handleClaimMatchEndAdBonus : undefined}
        variant={effectiveInMultiplayer ? (mpGameState?.variant || '365') : gameVariant}
        match101State={effectiveInMultiplayer ? (mpGameState?.match101State || match101State) : match101State}
        isSeka={effectiveInMultiplayer ? !!mpGameState?.handResults?.isSeka : is101Seka}
        ayazCaught={effectiveInMultiplayer ? !!mpGameState?.handResults?.ayazCaught : is101AyazCaught}
        isRanked={effectiveInMultiplayer ? Boolean(mpGameState?.isRanked) : false}
        teahousePrizePot={effectiveInMultiplayer ? (mpGameState?.teahousePrizePot || 0) : 0}
        userMmr={stats.mmr ?? DEFAULT_RANKED_MMR}
        hadHumanOpponentLeave={effectiveInMultiplayer ? Boolean(mpGameState?.hadHumanOpponentLeave) : false}
      />

      <MultiplayerLobbyModal
        isOpen={showMultiplayerLobby}
        onClose={() => {
          if (mpRoom?.teahouseTierId && mpRoom.status === 'waiting') {
            handleLeaveRoom();
            multiplayerSocket.disconnectIfIdle();
          }
          setShowMultiplayerLobby(false);
          setInviteCode(null);
          setInviteError(null);
        }}
        lang={lang}
        currentRoom={mpRoom}
        myPlayerIndex={mpMyIndex}
        isHost={
          mpIsHost ||
          (mpRoom
            ? mpRoom.players.find((p) => p.id === mpMyIndex)?.isHost ?? (mpMyIndex === 0)
            : false)
        }
        defaultPlayerName={getMyPlayerIdentity(googleUser, stats).name}
        initialRoomCode={inviteCode || undefined}
        initialError={inviteError}
        isAutoJoining={isAutoJoining}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onQuickMatch={handleQuickMatch}
        onAddBot={handleAddBot}
        onToggleReady={handleToggleReady}
        onStartGame={handleStartGame}
        onLeaveRoom={handleLeaveRoom}
      />

      {/* Google Sign-In & Cloud Sync Modal */}
      <GoogleAuthModal
        isOpen={showGoogleAuthModal}
        onClose={() => {
          setShowGoogleAuthModal(false);
          setOpenBugReportOnProfile(false);
        }}
        currentUser={googleUser}
        apkAuthSessionId={apkAuthSessionId}
        openBugReportInitially={openBugReportOnProfile}
        themeMode={appTheme}
        onToggleTheme={(nextTheme) => {
          setAppTheme(nextTheme);
          triggerHaptic('medium');
        }}
        onNicknameChange={(nextNickname) => {
          if (googleUser) {
            const updated = { ...googleUser, name: nextNickname };
            saveGoogleUser(updated);
            setGoogleUser(updated);
          }
          triggerHaptic('light');
        }}
        onSignIn={(user) => {
          saveGoogleUser(user);
          setGoogleUser(user);
          setShowGuestWarning(false);
          syncWithCloud(user, statsRef.current, true).then((synced) => {
            if (synced) setStats(synced);
          });
        }}
        onSignOut={() => {
          saveGoogleUser(null);
          setGoogleUser(null);
          setShowGuestWarning(true);
          setGuestNoticeDismissed(false);
        }}
      />

      {/* Interactive Table Gift Projectile & Splatter Overlay */}
      <TableGiftAnimationOverlay
        activeAnimation={activeGiftAnimation}
        onFinished={() => setActiveGiftAnimation(null)}
        playerCount={effectivePlayers.length}
        myPlayerIndex={localPlayerIndex}
      />

      {/* Table Gift Picker Popover */}
      {giftTargetPlayer && (
        <TableGiftPicker
          isOpen={Boolean(giftTargetPlayer)}
          onClose={() => setGiftTargetPlayer(null)}
          targetPlayerName={giftTargetPlayer.name}
          targetPlayerIndex={giftTargetPlayer.index}
          onSendGift={handleSendTableGift}
          userCoins={stats.coins}
          lang={lang}
          isBot={giftTargetPlayer.isBot}
          playerTag={giftTargetPlayer.playerTag}
          playerId={giftTargetPlayer.playerId}
        />
      )}

      {/* Floating Animated Score Badges */}
      <FloatingScoreOverlay scoreItem={floatingScore} />

      {/* Teahouses & Ranked 1v1 Modal */}
      <TeahousesModal
        isOpen={showTeahousesModal}
        onClose={() => setShowTeahousesModal(false)}
        lang={lang}
        userCoins={stats.coins}
        userMmr={stats.mmr ?? DEFAULT_RANKED_MMR}
        rankedPlayed={stats.rankedPlayed ?? 0}
        rankedWon={stats.rankedWon ?? 0}
        onJoinTeahouse={handleJoinTeahouse}
      />

      {/* Çayxana Ranked Forfeit Warning Modal */}
      {showRankedForfeitConfirm &&
        isMultiplayer &&
        mpGameState?.isRanked &&
        mpGameState.status === 'in_game' &&
        !mpGameState.isMatchOver && (() => {
          const buyIn = mpGameState.teahouseBuyIn || 0;
          const title =
            lang === 'az'
              ? 'Çayxanadan çıxmaq istəyirsiniz?'
              : lang === 'ru'
                ? 'Выйти из матча Чайханы?'
                : 'Leave Çayxana Match?';
          const body =
            lang === 'az'
              ? `Oyun bitmədən çıxsanız, təslim olmuş sayılacaqsınız — ${buyIn > 0 ? `${buyIn} sikkəlik giriş haqqınızı` : 'sikkələrinizi'} və reytinq xalınızı itirəcəksiniz.`
              : lang === 'ru'
                ? `Если вы выйдете до окончания игры, вам засчитается поражение — вы потеряете ${buyIn > 0 ? `взнос (${buyIn} монет)` : 'монеты'} и рейтинг.`
                : `If you leave before the match ends, it counts as a forfeit — you will lose your ${buyIn > 0 ? `${buyIn} coin entry` : 'coins'} and rating.`;
          const stayLabel =
            lang === 'az' ? 'Oyuna davam et' : lang === 'ru' ? 'Продолжить игру' : 'Continue Match';
          const leaveLabel =
            lang === 'az' ? 'Təslim ol və çıx' : lang === 'ru' ? 'Сдаться и выйти' : 'Forfeit & Leave';
          return (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
              <div className="bg-slate-900 border-2 border-rose-500/70 rounded-3xl max-w-sm w-full p-5 shadow-2xl text-center space-y-4">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center">
                  <LogOut className="w-6 h-6 text-rose-400" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-black text-white">{title}</h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{body}</p>
                </div>
                <div className="flex flex-col gap-2 pt-1">
                  <button
                    onClick={() => setShowRankedForfeitConfirm(false)}
                    className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 font-black text-sm shadow-lg transition"
                  >
                    {stayLabel}
                  </button>
                  <button
                    onClick={handleForfeitAction}
                    className="w-full py-2.5 rounded-2xl bg-rose-950/90 hover:bg-rose-900 border border-rose-700 text-rose-200 font-bold text-xs transition"
                  >
                    {leaveLabel}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {/* Incoming Game Room Invite Banner */}
      {incomingRoomInvite && (
        <div className="fixed inset-x-0 top-3 z-[120] flex justify-center px-3 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-md bg-slate-900/95 border-2 border-emerald-400 rounded-2xl p-3.5 shadow-[0_15px_40px_rgba(0,0,0,0.9)] backdrop-blur-md animate-fade-in">
            <div className="flex items-center justify-between gap-2.5">
              <div className="min-w-0">
                <div className="text-xs font-black text-emerald-300">
                  🎮 Oyun Dəvəti ({incomingRoomInvite.variant} • {incomingRoomInvite.roomCode})
                </div>
                <div className="text-xs text-white font-bold truncate mt-0.5">
                  {incomingRoomInvite.from.name}#{incomingRoomInvite.from.playerTag} sizi otağa dəvət edir!
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={async () => {
                    const inv = incomingRoomInvite;
                    setIncomingRoomInvite(null);
                    try {
                      const myId = getMyPlayerIdentity(googleUser, statsRef.current);
                      setShowStore(false);
                      setShowFriendsModal(false);
                      setShowTeahousesModal(false);
                      setShowRules(false);
                      setShowDailyReward(false);
                      setShowGoogleAuthModal(false);
                      setInGame(false);
                      setShowGameEnd(false);
                      await handleJoinRoom(inv.roomCode, googleUser?.name || myId.name);
                      setShowMultiplayerLobby(true);
                    } catch (e: any) {
                      showTemporarySocialBanner(e?.message || 'Otağa qoşulmaq mümkün olmadı.');
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow active:scale-95 transition"
                >
                  Qoşul
                </button>
                <button
                  onClick={() => setIncomingRoomInvite(null)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
                >
                  Rədd et
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Social / QuickMatch Toast Banner */}
      {socialBanner && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-full bg-slate-900/95 border border-amber-400/70 text-amber-200 text-xs font-bold shadow-xl pointer-events-none animate-fade-in max-w-[90%] text-center">
          {socialBanner}
        </div>
      )}

      {/* Closed Beta Tester Coin Gift Modal */}
      {betaGiftModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in pointer-events-auto">
          <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900 to-amber-950/50 border-2 border-amber-400 rounded-3xl p-6 shadow-[0_0_55px_rgba(245,158,11,0.4)] text-center flex flex-col items-center gap-3.5">
            <div className="px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-black tracking-wide">
              🎁 Closed Beta Tester Gift • Qapalı Beta Hədiyyəsi
            </div>
            <div className="text-3xl sm:text-4xl font-black text-amber-300 drop-shadow mt-1">
              +{betaGiftModal.amount.toLocaleString()} 🪙 Qızıl Sikkə
            </div>
            <div className="space-y-1.5 text-sm text-slate-200 font-semibold leading-relaxed">
              <p>Thank you for being a closed beta tester!</p>
              <p className="text-slate-300 text-xs">
                Qapalı beta test iştirakçısı olduğunuz üçün təşəkkür edirik!
              </p>
            </div>
            <div className="w-full px-4 py-3 rounded-2xl bg-amber-500/15 border border-amber-400/60 text-amber-200 text-lg font-black italic tracking-wide shadow-inner">
              &ldquo;yetime hediyye&rdquo;
            </div>
            <button
              onClick={() => setBetaGiftModal(null)}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:brightness-110 text-slate-950 font-black text-sm shadow-lg active:scale-95 transition mt-1"
            >
              Təşəkkürlər! ({betaGiftModal.amount} 🪙 Təhvil Al)
            </button>
          </div>
        </div>
      )}

      {/* Friends & Social Modal */}
      <FriendsModal
        isOpen={showFriendsModal}
        onClose={() => setShowFriendsModal(false)}
        lang={lang}
        googleUser={googleUser}
        stats={stats}
        incomingRequests={incomingFriendRequests}
        outgoingRequestIds={outgoingFriendRequestIds}
        onRespondFriendRequest={handleRespondFriendRequest}
        onRefreshSocial={refreshSocialState}
        onInviteFriend={handleInviteFriend}
      />
      </Suspense>
    </div>
  );
};
export default App;
