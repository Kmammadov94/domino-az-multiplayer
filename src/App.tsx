import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  getMinBoneyardReserve,
  sumHandPips101
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
  evaluateBaglandiWinner
} from './utils/dominoLogic';
import {
  GameBoard,
  BranchId,
  createInitialBoard,
  placeFirstTile,
  placeTileOnBranch,
  getPlayableBranches,
  isBoardGloballyBlocked,
  canAnyTileBePlayed
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
  getBackendServerUrl
} from './utils/storage';

import { triggerHaptic } from './utils/haptics';
import { App as CapApp } from '@capacitor/app';
import { Browser as CapBrowser } from '@capacitor/browser';
import { TABLE_THEMES, DEFAULT_TABLE_THEME_ID } from './data/tableThemes';
import { PLAYER_TITLES } from './data/profileCustomization';
import { TABLE_GIFTS, TableGiftDef } from './data/tableGifts';
import { TeahousesModal } from './components/TeahousesModal';
import { TableGiftPicker } from './components/TableGiftPicker';
import { TableGiftAnimationOverlay, ActiveGiftAnimation } from './components/TableGiftAnimationOverlay';
import { BoardView } from './components/BoardView';
import { FloatingScoreOverlay, FloatingScoreItem } from './components/FloatingScoreOverlay';
import { FriendsModal } from './components/FriendsModal';
import { recordRecentPlayer, loadRecentPlayers, isBotName, addFriend } from './utils/friendsStorage';
import { getMyPlayerIdentity } from './utils/playerIdentity';
import { ScoreBoard } from './components/ScoreBoard';
import { PlayerControls } from './components/PlayerControls';
import { DominoTile } from './components/DominoTile';
import { StoreModal } from './components/StoreModal';
import { DailyRewardModal } from './components/DailyRewardModal';
import { RulesModal } from './components/RulesModal';
import { GameEndModal } from './components/GameEndModal';
import { AzerbaijanLogo } from './components/AzerbaijanLogo';
import { BazaarTray } from './components/BazaarTray';
import { AvatarView } from './components/AvatarView';
import { PLAYER_AVATARS, DEFAULT_AVATAR_ID } from './data/avatars';
import { MultiplayerLobbyModal } from './components/MultiplayerLobbyModal';
import { TeahouseChatOverlay } from './components/TeahouseChatOverlay';
import { GoogleAuthModal } from './components/GoogleAuthModal';
import { ApkAuthBridgeView } from './components/ApkAuthBridgeView';
import { multiplayerSocket } from './services/multiplayerSocket';
import {
  MultiplayerRoomSummary,
  MultiplayerClientGameState,
  ChatMessage
} from './types/multiplayer';
import { DoubleComboMove, findDoubleCombos } from './utils/comboEngine';

import {
  Coins,
  ShoppingBag,
  Gift,
  BookOpen,
  Volume2,
  VolumeX,
  Languages,
  LogOut,
  Play,
  RotateCcw,
  Sparkles,
  Globe,
  Clock,
  Cloud,
  ShieldAlert,
  Users,
  Bot,
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
  const [apkAuthSessionId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const p = new URLSearchParams(window.location.search).get('apk_auth');
    return p ? p.trim() : null;
  });
  const [showGoogleAuthModal, setShowGoogleAuthModal] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(new URLSearchParams(window.location.search).get('apk_auth'));
  });

  // Google User & Cloud Sync State
  const [googleUser, setGoogleUser] = useState<GoogleUserProfile | null>(loadGoogleUser);
  const [showGuestWarning, setShowGuestWarning] = useState<boolean>(
    !loadGoogleUser() && !isGuestNoticeDismissed()
  );

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
  const [showFriendsModal, setShowFriendsModal] = useState<boolean>(false);
  const [giftTargetPlayer, setGiftTargetPlayer] = useState<{ index: number; name: string; isBot?: boolean; playerTag?: string; playerId?: string } | null>(null);
  const [activeGiftAnimation, setActiveGiftAnimation] = useState<ActiveGiftAnimation | null>(null);
  const [floatingScore, setFloatingScore] = useState<FloatingScoreItem | null>(null);
  const [isScreenShaking, setIsScreenShaking] = useState<boolean>(false);

  const statsRef = useRef<PlayerStats>(stats);
  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

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

          try {
            const parsed = new URL(data.url);
            gId = parsed.searchParams.get('googleId');
            email = parsed.searchParams.get('email');
            name = parsed.searchParams.get('name');
            picture = parsed.searchParams.get('picture');
          } catch {
            const raw = data.url.replace('dominoaz://auth', 'https://dummy.local');
            try {
              const parsed = new URL(raw);
              gId = parsed.searchParams.get('googleId');
              email = parsed.searchParams.get('email');
              name = parsed.searchParams.get('name');
              picture = parsed.searchParams.get('picture');
            } catch {
              const qStr = data.url.includes('?') ? data.url.split('?')[1] : '';
              const sp = new URLSearchParams(qStr);
              gId = sp.get('googleId');
              email = sp.get('email');
              name = sp.get('name');
              picture = sp.get('picture');
            }
          }

          if (gId && email) {
            const userProfile: GoogleUserProfile = {
              googleId: gId,
              email,
              name: name || 'Google Oyunçusu',
              picture: picture || undefined,
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
          const friendName = params.get('name') || 'Dost';
          const friendTag = params.get('tag') || undefined;
          addFriend({
            name: decodeURIComponent(friendName),
            playerId: friendId,
            playerTag: friendTag,
            title: 'Dəvət Edilən Dost'
          });
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
              .map((p) => ({
                name: p.name.replace(/\s*\((Siz|Вы|You)\)\s*/g, '').trim(),
                avatarId: p.avatarId || 'avatar_tea_master',
                date: new Date().toLocaleDateString('az-AZ'),
                isRealPlayer: true
              }));
            if (realOpponents.length > 0) {
              const merged = [
                ...realOpponents,
                ...existing.filter((e) => !realOpponents.some((r) => r.name.toLowerCase() === e.name.toLowerCase()))
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
        const targetIdx = parseInt(parts[2], 10);
        const gift = TABLE_GIFTS.find((g) => g.id === giftId);
        if (gift) {
          setActiveGiftAnimation({
            id: msg.id,
            gift,
            senderName: msg.senderName,
            senderIndex: msg.senderIndex,
            targetIndex: isNaN(targetIdx) ? 0 : targetIdx
          });
        }
      }
    });

    return () => {
      unsubSummary();
      unsubState();
      unsubChat();
    };
  }, []);

  // In multiplayer, show GameEndModal automatically after the reveal animation
  useEffect(() => {
    if (isMultiplayer && mpGameState?.handRevealed) {
      const timer = setTimeout(() => {
        setShowGameEnd(true);
      }, 1600);
      return () => clearTimeout(timer);
    } else if (isMultiplayer && !mpGameState?.handRevealed) {
      setShowGameEnd(false);
    }
  }, [isMultiplayer, mpGameState?.handRevealed, mpGameState?.roundNumber]);

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
    multiplayerSocket.disconnectIfIdle();
    try {
      localStorage.removeItem('domino_mp_session');
      window.history.replaceState(null, '', window.location.pathname);
    } catch (e) {}
    setMpRoom(null);
    setMpGameState(null);
    setMpIsHost(false);
    setIsMultiplayer(false);
  };

  // Send interactive table gift (armudu tea, tomato splatter, baklava, etc.)
  const handleSendTableGift = (gift: TableGiftDef, targetIndex: number) => {
    if (stats.coins < gift.cost) return;

    if (gift.cost > 0) {
      handleUpdateStats({
        ...stats,
        coins: Math.max(0, stats.coins - gift.cost)
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
      multiplayerSocket.sendChatMessage(undefined, `gift:${gift.id}:${targetIndex}`);
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

  // Initial cloud sync if already signed in with Google
  useEffect(() => {
    if (googleUser) {
      syncWithCloud(googleUser, stats).then((synced) => {
        if (synced && JSON.stringify(synced) !== JSON.stringify(stats)) {
          setStats(synced);
        }
      });
    }
  }, [googleUser?.googleId]);


  // Persist stats whenever changed (and auto-sync with cloud if signed in)
  const handleUpdateStats = (newStats: PlayerStats) => {
    setStats(newStats);
    savePlayerStats(newStats);
    if (googleUser) {
      syncWithCloud(googleUser, newStats);
    }
  };

  // Start a new Match
  const startMatch = (chosenMode: GameMode, chosenVariant: GameVariant = gameVariant) => {
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
      let pName = t.player;
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

    setPlayers(initialPlayers);
    setRoundNumber(1);
    setIsMatchOver(false);
    startHand(chosenMode, initialPlayers, 1, true, 0);
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
            awardMatchCoins(userWon);
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
                awardMatchCoins(userWon);
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
                awardMatchCoins(userWon);
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
      const newOnes = playerList
        .filter((p, idx) => idx !== localPlayerIndex && !p.isAI && !isBotName(p.name))
        .map((p) => ({
          name: p.name.replace(/\s*\((Siz|Вы|You)\)\s*/g, '').trim(),
          avatarId: p.avatarId || 'avatar_tea_master',
          date: new Date().toLocaleDateString('az-AZ'),
          isRealPlayer: true
        }));
      if (newOnes.length === 0) return;
      const merged = [
        ...newOnes,
        ...existing.filter((e) => !newOnes.some((n) => n.name.toLowerCase() === e.name.toLowerCase()))
      ].slice(0, 15);
      localStorage.setItem('domino_recent_players', JSON.stringify(merged));
    } catch (e) {
      console.error(e);
    }
  };

  const awardMatchCoins = (userWon: boolean) => {
    triggerHaptic('success');
    if (isMultiplayer) {
      recordRecentOpponents(players);
    }
    const coinReward = userWon ? 5 : 3;
    handleUpdateStats({
      ...stats,
      coins: stats.coins + coinReward,
      matchesPlayed: stats.matchesPlayed + 1,
      matchesWon: stats.matchesWon + (userWon ? 1 : 0)
    });
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
      multiplayerSocket.nextHand();
      setShowGameEnd(false);
      return;
    }
    handleRestartMatch();
  };

  const handleForfeitAction = () => {
    if (isMultiplayer) {
      multiplayerSocket.leaveRoom();
      multiplayerSocket.disconnectIfIdle();
      try {
        localStorage.removeItem('domino_mp_session');
        window.history.replaceState(null, '', window.location.pathname);
      } catch (e) {}
      setIsMultiplayer(false);
      setMpGameState(null);
      setMpRoom(null);
      setMpIsHost(false);
    }
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
    if (scored > 0 || isDouble) {
      if (scored >= 15 || isDouble) {
        sounds.playTileSlam();
      } else {
        sounds.playTileClack(true);
      }
    } else {
      sounds.playTileClack(false);
    }

    if (scored > 0) {
      if (scored >= 20 || scored === 35) {
        triggerHaptic('heavy');
        setIsScreenShaking(true);
        setTimeout(() => setIsScreenShaking(false), 450);
      } else {
        triggerHaptic('medium');
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
      triggerHaptic('light');
      setLastScoredPoints(null);
    }

    // Update player hand & scores
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
      const isWinnerUser =
        mode === '4p_duo'
          ? updatedPlayers[playerIndex].team === 1
          : playerIndex === 0;
      setWinnerIndex(playerIndex);
      if (mode === '4p_duo') {
        setWinnerTeam(updatedPlayers[playerIndex].team);
      }
      awardMatchCoins(isWinnerUser);
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
    // or if no remaining unplayed tile anywhere can possibly be played)
    const minReserve = getMinBoneyardReserve(gameVariant, mode);
    const drawableBoneyard = boneyard.slice(0, Math.max(0, boneyard.length - minReserve));
    const isGloballyBlocked = isBoardGloballyBlocked(nextBoard);
    const noUnplayedMoveExists =
      !updatedPlayers.some((p) => canAnyTileBePlayed(nextBoard, p.hand)) &&
      !canAnyTileBePlayed(nextBoard, drawableBoneyard);

    if (isGloballyBlocked || noUnplayedMoveExists) {
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
    const isDouble = true; // All combo moves are doubles!
    if (scored > 0 || isDouble) {
      if (scored >= 15 || isDouble) {
        sounds.playTileSlam();
      } else {
        sounds.playTileClack(true);
      }
    } else {
      sounds.playTileClack(false);
    }

    if (scored > 0) {
      if (scored >= 20 || scored === 35) {
        triggerHaptic('heavy');
        setIsScreenShaking(true);
        setTimeout(() => setIsScreenShaking(false), 450);
      } else {
        triggerHaptic('medium');
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
      triggerHaptic('light');
      setLastScoredPoints(null);
    }

    const playedTileIds = new Set(combo.moves.map((m) => m.tile.id));
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
      const isWinnerUser =
        mode === '4p_duo'
          ? updatedPlayers[playerIndex].team === 1
          : playerIndex === 0;
      setWinnerIndex(playerIndex);
      if (mode === '4p_duo') {
        setWinnerTeam(updatedPlayers[playerIndex].team);
      }
      awardMatchCoins(isWinnerUser);
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
    // or if no remaining unplayed tile anywhere can possibly be played)
    const minReserve = getMinBoneyardReserve(gameVariant, mode);
    const drawableBoneyard = boneyard.slice(0, Math.max(0, boneyard.length - minReserve));
    const isGloballyBlocked = isBoardGloballyBlocked(nextBoard);
    const noUnplayedMoveExists =
      !updatedPlayers.some((p) => canAnyTileBePlayed(nextBoard, p.hand)) &&
      !canAnyTileBePlayed(nextBoard, drawableBoneyard);

    if (isGloballyBlocked || noUnplayedMoveExists) {
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
    if (effectiveHandRevealed) return;
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
    if (!selectedTile || effectiveHandRevealed) return;
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
      multiplayerSocket.drawBazaar();
      return;
    }

    const minReserve = getMinBoneyardReserve(gameVariant, mode);
    const availableToDraw = Math.max(0, boneyard.length - minReserve);
    if (currentTurn !== 0 || availableToDraw === 0 || handRevealed) return;
    // In 101 mode: players draw 2 tiles at a time from bazaar ("2 daş 2 daş gedirsən")!
    const countToDraw = gameVariant === '101' ? Math.min(2, availableToDraw) : 1;
    let nextBoneyard = [...boneyard];
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
    if (effectiveInMultiplayer) {
      if (!effectiveIsMyTurn) return;
      sounds.playPassKnock();
      multiplayerSocket.passTurn();
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

      // Check best move
      const aiScore =
        mode === '4p_duo'
          ? players.find((p) => p.team === activePlayer.team)?.score || 0
          : activePlayer.score;
      const bestMove = selectBestAIMove(activePlayer.hand, board, aiScore, gameVariant);

      // If Double Combos are enabled, check if AI can score with a combo!
      if (allowDoubleCombo) {
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
        const drawableBoneyard = boneyard.slice(0, Math.max(0, boneyard.length - minReserve));
        const isGloballyBlocked = isBoardGloballyBlocked(board);
        const canBazaarHelp = canAnyTileBePlayed(board, drawableBoneyard);

        // If the board is blocked, or neither players nor drawable boneyard has any playable tile,
        // declare Bağlandı immediately without forcing useless boneyard draws!
        if (isGloballyBlocked || (!players.some((p) => canAnyTileBePlayed(board, p.hand)) && !canBazaarHelp)) {
          const { winnerIndex: lowestPlayer, isTie } = evaluateBaglandiWinner(
            players,
            mode,
            lastTilePlacedPlayerIndex
          );
          finishHand(true, lowestPlayer, players, lastTilePlacedPlayerIndex, isTie);
          return;
        }

        if (drawableBoneyard.length > 0 && canBazaarHelp) {
          // AI draws from boneyard (2 tiles in 101 mode, 1 tile in other modes)
          const countToDraw = gameVariant === '101' ? Math.min(2, drawableBoneyard.length) : 1;
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
    ? (mpGameState.handResults?.winnerTeam || 1)
    : winnerTeam;
  const effectiveIsInstant35 = effectiveInMultiplayer
    ? mpGameState.isInstant35
    : isInstant35;

  const localPlayerIndex = effectiveInMultiplayer ? mpMyIndex : 0;

  const effectivePlayers: Player[] = effectiveInMultiplayer
    ? mpGameState.players.map((p, idx) => {
        let playerHand: TileData[] = [];
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
  const currentDrawableBoneyard = useMemo(
    () => boneyard.slice(0, Math.max(0, boneyard.length - currentMinReserve)),
    [boneyard, currentMinReserve]
  );
  const isCurrentBoardBlocked = useMemo(
    () =>
      isBoardGloballyBlocked(effectiveBoard) ||
      (!effectiveInMultiplayer &&
        currentDrawableBoneyard.length > 0 &&
        !canAnyTileBePlayed(effectiveBoard, currentDrawableBoneyard) &&
        !effectivePlayers.some((p) => canAnyTileBePlayed(effectiveBoard, p.hand))),
    [effectiveBoard, effectiveInMultiplayer, currentDrawableBoneyard, effectivePlayers]
  );
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
    if (effectiveHandRevealed) return;
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
    return <ApkAuthBridgeView apkAuthSessionId={apkAuthSessionId} />;
  }

  return (
    <div className="w-full h-full min-h-[100dvh] max-h-[100dvh] flex flex-col bg-slate-950 text-slate-100 select-none overflow-hidden font-sans">
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
                onClick={handleForfeitAction}
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
                  {googleUser?.name || 'Siz'}
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
          <div className="flex-1 flex flex-col justify-between w-full max-w-lg mx-auto px-3.5 sm:px-6 py-2 pb-3 overflow-y-auto overflow-x-hidden select-none">
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
                onClick={() => {
                  triggerHaptic('medium');
                  handleQuickMatch('2p_solo', googleUser?.name || 'Siz');
                }}
                title="Tezbazar 1v1 Onlayn Oyun"
                className="py-3 px-3.5 rounded-2xl bg-gradient-to-b from-amber-400 to-amber-600 hover:brightness-110 text-slate-950 font-black flex flex-col items-center justify-center gap-0.5 shadow-md active:scale-95 transition flex-shrink-0 border border-amber-300/50"
              >
                <Sparkles className="w-5 h-5 fill-slate-950" />
                <span className="text-[11px] leading-none font-black">Tezbazar</span>
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
                className="flex flex-col items-center justify-center py-2 px-1 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-teal-300 active:scale-95 transition shadow group"
              >
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-teal-400 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-200 mt-1">Dostlar</span>
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
            <div className="flex-1 relative flex flex-col overflow-hidden">
              {/* Starting tile notice banner */}
              {effectiveForcedTile && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 bg-amber-500/20 border border-amber-500/50 rounded-xl px-4 py-1.5 max-w-sm text-xs text-amber-300 font-semibold shadow-lg animate-pulse text-center">
                  {t.startingTilePrompt}
                </div>
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

            {/* Opponent Hands Indicators (Positioned safely away from the domino line) */}
            {/* 1. In 2P Solo: Single Opponent at TOP CENTER facing player */}
            {effectivePlayers.length === 2 && (() => {
              const oppIdx = effectivePlayers.findIndex((_, i) => i !== localPlayerIndex);
              const opponent = effectivePlayers[oppIdx] || effectivePlayers[1];
              const isOpponentTurn = effectiveTurn === oppIdx && !effectiveHandRevealed;
              const oppNotice = opponentActionNotice?.playerIndex === oppIdx ? opponentActionNotice : null;
              const activeVariant = effectiveInMultiplayer ? (mpGameState?.variant || '365') : gameVariant;
              const active101 = effectiveInMultiplayer ? (mpGameState?.match101State || match101State) : match101State;
              const oppDisplayScore = activeVariant === '101'
                ? ((oppIdx === 0 ? active101?.team1?.mainScore : active101?.team2?.mainScore) ?? opponent?.score ?? 0)
                : (opponent?.score ?? 0);
              return (
                <div className="absolute top-1.5 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
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
                          scale={0.48}
                          isVertical={false}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* 2. In 3P Trio: Opponent 1 (Left Side) and Opponent 2 (Right Side) — Minimalist Badges (Name & Tile Count) */}
            {effectivePlayers.length === 3 && (() => {
              const leftIdx = (localPlayerIndex + 1) % 3;
              const rightIdx = (localPlayerIndex + 2) % 3;
              const leftOpponent = effectivePlayers[leftIdx];
              const rightOpponent = effectivePlayers[rightIdx];
              const isLeftTurn = effectiveTurn === leftIdx && !effectiveHandRevealed;
              const isRightTurn = effectiveTurn === rightIdx && !effectiveHandRevealed;
              const leftNotice = opponentActionNotice?.playerIndex === leftIdx ? opponentActionNotice : null;
              const rightNotice = opponentActionNotice?.playerIndex === rightIdx ? opponentActionNotice : null;
              const activeVariant = effectiveInMultiplayer ? (mpGameState?.variant || '365') : gameVariant;
              const active101 = effectiveInMultiplayer ? (mpGameState?.match101State || match101State) : match101State;
              const leftScore = activeVariant === '101'
                ? (active101?.playerAccounts?.[leftOpponent?.id ?? leftIdx]?.mainScore ?? leftOpponent?.score ?? 0)
                : (leftOpponent?.score ?? 0);
              const rightScore = activeVariant === '101'
                ? (active101?.playerAccounts?.[rightOpponent?.id ?? rightIdx]?.mainScore ?? rightOpponent?.score ?? 0)
                : (rightOpponent?.score ?? 0);
              return (
                <>
                  {/* Left Side Opponent Badge — Turned vertically along left edge */}
                  <div className="absolute left-0.5 sm:left-1 top-[42%] -translate-y-1/2 z-10 flex items-center pointer-events-auto">
                    <div className="w-8 h-36 flex items-center justify-center">
                      <div
                        onClick={() => {
                          triggerHaptic('light');
                          if (leftOpponent) {
                            const targetSlot = mpGameState?.players[leftIdx];
                            setGiftTargetPlayer({
                              index: leftIdx,
                              name: leftOpponent.name,
                              isBot: leftOpponent.isAI || !effectiveInMultiplayer,
                              playerTag: targetSlot?.playerTag,
                              playerId: targetSlot?.playerId
                            });
                          }
                        }}
                        title={`${leftOpponent?.name} üçün hədiyyə göndər`}
                        className={`rotate-90 origin-center whitespace-nowrap flex items-center gap-1.5 backdrop-blur-md px-2.5 py-1 rounded-full border shadow-lg cursor-pointer active:scale-95 transition-all group ${
                          isLeftTurn
                            ? 'bg-amber-950/95 border-amber-400 ring-4 ring-amber-400/60 shadow-[0_0_20px_rgba(251,191,36,0.85)] scale-105'
                            : 'bg-slate-900/90 hover:bg-slate-800/95 border-slate-700/80'
                        }`}
                      >
                        <div className="relative -rotate-90 flex-shrink-0">
                          <AvatarView
                            avatarId={leftOpponent?.avatarId || 'avatar_tea_master'}
                            size={20}
                            showBorder={false}
                          />
                          {isLeftTurn && (
                            <span className="absolute -top-1 -right-1 flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                            </span>
                          )}
                        </div>
                        <span className={`text-[11px] font-bold max-w-[85px] sm:max-w-[120px] truncate ${isLeftTurn ? 'text-amber-300 font-black' : 'text-slate-200'}`}>
                          {leftOpponent?.name}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-full bg-slate-800 border border-slate-600 text-amber-300 text-[10px] font-black tracking-wide flex items-center gap-0.5 shadow-sm">
                          <span className="-rotate-90">🀰</span>
                          <span>{leftOpponent?.hand.length ?? 0}</span>
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-black">
                          ⭐{leftScore}
                        </span>
                        {isLeftTurn && (
                          <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black animate-pulse -rotate-90">
                            🎯
                          </span>
                        )}
                        <span className="text-[10px] group-hover:scale-125 transition-transform -rotate-90">🎁</span>
                      </div>
                    </div>
                    {leftNotice && (
                      <div className={`ml-1 px-2.5 py-0.5 rounded-full text-[10px] font-black shadow border animate-bounce whitespace-nowrap ${
                        leftNotice.type === 'draw'
                          ? 'bg-cyan-950/95 border-cyan-400 text-cyan-200'
                          : 'bg-rose-950/95 border-rose-400 text-rose-200'
                      }`}>
                        {leftNotice.text}
                      </div>
                    )}
                  </div>

                  {/* Right Side Opponent Badge — Turned vertically along right edge */}
                  <div className="absolute right-0.5 sm:right-1 top-[42%] -translate-y-1/2 z-10 flex items-center flex-row-reverse pointer-events-auto">
                    <div className="w-8 h-36 flex items-center justify-center">
                      <div
                        onClick={() => {
                          triggerHaptic('light');
                          if (rightOpponent) {
                            const targetSlot = mpGameState?.players[rightIdx];
                            setGiftTargetPlayer({
                              index: rightIdx,
                              name: rightOpponent.name,
                              isBot: rightOpponent.isAI || !effectiveInMultiplayer,
                              playerTag: targetSlot?.playerTag,
                              playerId: targetSlot?.playerId
                            });
                          }
                        }}
                        title={`${rightOpponent?.name} üçün hədiyyə göndər`}
                        className={`-rotate-90 origin-center whitespace-nowrap flex flex-row-reverse items-center gap-1.5 backdrop-blur-md px-2.5 py-1 rounded-full border shadow-lg cursor-pointer active:scale-95 transition-all group ${
                          isRightTurn
                            ? 'bg-amber-950/95 border-amber-400 ring-4 ring-amber-400/60 shadow-[0_0_20px_rgba(251,191,36,0.85)] scale-105'
                            : 'bg-slate-900/90 hover:bg-slate-800/95 border-slate-700/80'
                        }`}
                      >
                        <div className="relative rotate-90 flex-shrink-0">
                          <AvatarView
                            avatarId={rightOpponent?.avatarId || 'avatar_sheki_guest'}
                            size={20}
                            showBorder={false}
                          />
                          {isRightTurn && (
                            <span className="absolute -top-1 -right-1 flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                            </span>
                          )}
                        </div>
                        <span className={`text-[11px] font-bold max-w-[85px] sm:max-w-[120px] truncate ${isRightTurn ? 'text-amber-300 font-black' : 'text-slate-200'}`}>
                          {rightOpponent?.name}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-full bg-slate-800 border border-slate-600 text-amber-300 text-[10px] font-black tracking-wide flex items-center gap-0.5 shadow-sm">
                          <span className="rotate-90">🀰</span>
                          <span>{rightOpponent?.hand.length ?? 0}</span>
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-black">
                          ⭐{rightScore}
                        </span>
                        {isRightTurn && (
                          <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black animate-pulse rotate-90">
                            🎯
                          </span>
                        )}
                        <span className="text-[10px] group-hover:scale-125 transition-transform rotate-90">🎁</span>
                      </div>
                    </div>
                    {rightNotice && (
                      <div className={`mr-1 px-2.5 py-0.5 rounded-full text-[10px] font-black shadow border animate-bounce whitespace-nowrap ${
                        rightNotice.type === 'draw'
                          ? 'bg-cyan-950/95 border-cyan-400 text-cyan-200'
                          : 'bg-rose-950/95 border-rose-400 text-rose-200'
                      }`}>
                        {rightNotice.text}
                      </div>
                    )}
                  </div>
                </>
              );
            })()}

            {/* 3. In 4P (Duo or Solo): Partner at Top, Opponents at Left and Right — Minimalist Badges (Name & Tile Count) */}
            {effectivePlayers.length === 4 && (() => {
              const topIdx = (localPlayerIndex + 2) % 4;
              const leftIdx = (localPlayerIndex + 1) % 4;
              const rightIdx = (localPlayerIndex + 3) % 4;
              const topPartner = effectivePlayers[topIdx];
              const leftOpponent = effectivePlayers[leftIdx];
              const rightOpponent = effectivePlayers[rightIdx];
              const isTopTurn = effectiveTurn === topIdx && !effectiveHandRevealed;
              const isLeftTurn = effectiveTurn === leftIdx && !effectiveHandRevealed;
              const isRightTurn = effectiveTurn === rightIdx && !effectiveHandRevealed;
              const topNotice = opponentActionNotice?.playerIndex === topIdx ? opponentActionNotice : null;
              const leftNotice = opponentActionNotice?.playerIndex === leftIdx ? opponentActionNotice : null;
              const rightNotice = opponentActionNotice?.playerIndex === rightIdx ? opponentActionNotice : null;
              return (
                <>
                  {/* Top Partner Badge */}
                  <div className="absolute top-1.5 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center pointer-events-auto">
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

                  {/* Left Side Opponent Badge — Turned vertically along left edge */}
                  <div className="absolute left-0.5 sm:left-1 top-[42%] -translate-y-1/2 z-10 flex items-center pointer-events-auto">
                    <div className="w-8 h-36 flex items-center justify-center">
                      <div
                        onClick={() => {
                          triggerHaptic('light');
                          if (leftOpponent) {
                            const targetSlot = mpGameState?.players[leftIdx];
                            setGiftTargetPlayer({
                              index: leftIdx,
                              name: leftOpponent.name,
                              isBot: leftOpponent.isAI || !effectiveInMultiplayer,
                              playerTag: targetSlot?.playerTag,
                              playerId: targetSlot?.playerId
                            });
                          }
                        }}
                        className={`rotate-90 origin-center whitespace-nowrap flex items-center gap-1.5 backdrop-blur-md px-2.5 py-1 rounded-full border shadow-lg cursor-pointer active:scale-95 transition-all group ${
                          isLeftTurn
                            ? 'bg-amber-950/95 border-amber-400 ring-4 ring-amber-400/60 shadow-[0_0_20px_rgba(251,191,36,0.85)] scale-105'
                            : 'bg-slate-900/90 hover:bg-slate-800/95 border-slate-700/80'
                        }`}
                        title={`${leftOpponent?.name} üçün hədiyyə göndər`}
                      >
                        <div className="relative -rotate-90 flex-shrink-0">
                          <AvatarView
                            avatarId={leftOpponent?.avatarId || 'avatar_tea_master'}
                            size={20}
                            showBorder={false}
                          />
                          {isLeftTurn && (
                            <span className="absolute -top-1 -right-1 flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                            </span>
                          )}
                        </div>
                        <span className={`text-[11px] font-bold max-w-[85px] sm:max-w-[120px] truncate ${isLeftTurn ? 'text-amber-300 font-black' : 'text-slate-200'}`}>
                          {leftOpponent?.name}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-full bg-slate-800 border border-slate-600 text-amber-300 text-[10px] font-black tracking-wide flex items-center gap-0.5 shadow-sm">
                          <span className="-rotate-90">🀰</span>
                          <span>{leftOpponent?.hand.length ?? 0}</span>
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-black">
                          ⭐{leftOpponent?.score ?? 0}
                        </span>
                        {isLeftTurn && (
                          <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black animate-pulse -rotate-90">
                            🎯
                          </span>
                        )}
                        <span className="text-[10px] group-hover:scale-125 transition-transform -rotate-90">🎁</span>
                      </div>
                    </div>
                    {leftNotice && (
                      <div className={`ml-1 px-2.5 py-0.5 rounded-full text-[10px] font-black shadow border animate-bounce whitespace-nowrap ${
                        leftNotice.type === 'draw'
                          ? 'bg-cyan-950/95 border-cyan-400 text-cyan-200'
                          : 'bg-rose-950/95 border-rose-400 text-rose-200'
                      }`}>
                        {leftNotice.text}
                      </div>
                    )}
                  </div>

                  {/* Right Side Opponent Badge — Turned vertically along right edge */}
                  <div className="absolute right-0.5 sm:right-1 top-[42%] -translate-y-1/2 z-10 flex items-center flex-row-reverse pointer-events-auto">
                    <div className="w-8 h-36 flex items-center justify-center">
                      <div
                        onClick={() => {
                          triggerHaptic('light');
                          if (rightOpponent) {
                            const targetSlot = mpGameState?.players[rightIdx];
                            setGiftTargetPlayer({
                              index: rightIdx,
                              name: rightOpponent.name,
                              isBot: rightOpponent.isAI || !effectiveInMultiplayer,
                              playerTag: targetSlot?.playerTag,
                              playerId: targetSlot?.playerId
                            });
                          }
                        }}
                        className={`-rotate-90 origin-center whitespace-nowrap flex flex-row-reverse items-center gap-1.5 backdrop-blur-md px-2.5 py-1 rounded-full border shadow-lg cursor-pointer active:scale-95 transition-all group ${
                          isRightTurn
                            ? 'bg-amber-950/95 border-amber-400 ring-4 ring-amber-400/60 shadow-[0_0_20px_rgba(251,191,36,0.85)] scale-105'
                            : 'bg-slate-900/90 hover:bg-slate-800/95 border-slate-700/80'
                        }`}
                        title={`${rightOpponent?.name} üçün hədiyyə göndər`}
                      >
                        <div className="relative rotate-90 flex-shrink-0">
                          <AvatarView
                            avatarId={rightOpponent?.avatarId || 'avatar_icherisheher_sage'}
                            size={20}
                            showBorder={false}
                          />
                          {isRightTurn && (
                            <span className="absolute -top-1 -right-1 flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                            </span>
                          )}
                        </div>
                        <span className={`text-[11px] font-bold max-w-[85px] sm:max-w-[120px] truncate ${isRightTurn ? 'text-amber-300 font-black' : 'text-slate-200'}`}>
                          {rightOpponent?.name}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-full bg-slate-800 border border-slate-600 text-amber-300 text-[10px] font-black tracking-wide flex items-center gap-0.5 shadow-sm">
                          <span className="rotate-90">🀰</span>
                          <span>{rightOpponent?.hand.length ?? 0}</span>
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-black">
                          ⭐{rightOpponent?.score ?? 0}
                        </span>
                        {isRightTurn && (
                          <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black animate-pulse rotate-90">
                            🎯
                          </span>
                        )}
                        <span className="text-[10px] group-hover:scale-125 transition-transform rotate-90">🎁</span>
                      </div>
                    </div>
                    {rightNotice && (
                      <div className={`mr-1 px-2.5 py-0.5 rounded-full text-[10px] font-black shadow border animate-bounce whitespace-nowrap ${
                        rightNotice.type === 'draw'
                          ? 'bg-cyan-950/95 border-cyan-400 text-cyan-200'
                          : 'bg-rose-950/95 border-rose-400 text-rose-200'
                      }`}>
                        {rightNotice.text}
                      </div>
                    )}
                  </div>
                </>
              );
            })()}

            {/* The Domino Table Canvas / Board View */}
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
                canDrawFromBazaar={isMyTurn && !humanHasPlayableMove && effectiveBoneyardCount > getMinBoneyardReserve(gameVariant, mode) && !isCurrentBoardBlocked}
                isDraggingTile={Boolean(draggedTile)}
                variant={effectiveInMultiplayer ? (mpGameState?.variant || '365') : gameVariant}
              />
            </div>

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
      <StoreModal
        isOpen={showStore}
        onClose={() => setShowStore(false)}
        lang={lang}
        stats={stats}
        onUpdateStats={handleUpdateStats}
        initialTab={storeInitialTab}
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
      />

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
        isHost={effectiveInMultiplayer ? mpIsHost : true}
        onNextHand={handleNextHandAction}
        onRestartMatch={handleRestartMatchAction}
        onLeaveMatch={handleForfeitAction}
        variant={effectiveInMultiplayer ? (mpGameState?.variant || '365') : gameVariant}
        match101State={effectiveInMultiplayer ? (mpGameState?.match101State || match101State) : match101State}
        isSeka={effectiveInMultiplayer ? !!mpGameState?.handResults?.isSeka : is101Seka}
        ayazCaught={effectiveInMultiplayer ? !!mpGameState?.handResults?.ayazCaught : is101AyazCaught}
      />

      <MultiplayerLobbyModal
        isOpen={showMultiplayerLobby}
        onClose={() => {
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
        defaultPlayerName={googleUser?.name}
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
        onClose={() => setShowGoogleAuthModal(false)}
        currentUser={googleUser}
        apkAuthSessionId={apkAuthSessionId}
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

      {/* Teahouses & Stakes Modal [Coming Soon] */}
      <TeahousesModal
        isOpen={showTeahousesModal}
        onClose={() => setShowTeahousesModal(false)}
        lang={lang}
        userCoins={stats.coins}
      />

      {/* Friends & Social Modal */}
      <FriendsModal
        isOpen={showFriendsModal}
        onClose={() => setShowFriendsModal(false)}
        lang={lang}
        googleUser={googleUser}
        stats={stats}
        onInviteFriend={() => {
          handleCreateRoom('2p_solo', googleUser?.name || 'Siz');
          setShowMultiplayerLobby(true);
        }}
      />
    </div>
  );
};
export default App;
