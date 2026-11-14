import React, { useState, useEffect, useRef } from 'react';
import { Cloud, CheckCircle, ShieldAlert, LogOut, X, Smartphone, ExternalLink, Loader2, RefreshCw, Bug, Send, Sun, Moon } from 'lucide-react';
import { Browser as CapBrowser } from '@capacitor/browser';
import {
  GoogleUserProfile,
  isNativeMobileApp,
  getBackendServerUrl,
  PRODUCTION_SERVER_URL,
  AppThemeMode
} from '../utils/storage';
import { getCustomNickname, saveCustomNickname } from '../utils/playerIdentity';
import { validatePlayerName } from '../utils/profanityFilter';

export const GOOGLE_CLIENT_ID =
  '345163175505-a7dv01uno2tof42k31omil6p5c9do20g.apps.googleusercontent.com';

export const SUPPORT_EMAIL = 'sadpocketgames@gmail.com';
export const DEFAULT_BUG_SUBJECT = '[Bug & Feedback] Domino Pro: ';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: GoogleUserProfile | null;
  onSignIn: (user: GoogleUserProfile) => void;
  onSignOut: () => void;
  apkAuthSessionId?: string | null;
  openBugReportInitially?: boolean;
  themeMode?: AppThemeMode;
  onToggleTheme?: (mode: AppThemeMode) => void;
  onNicknameChange?: (nickname: string) => void;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSignIn,
  onSignOut,
  apkAuthSessionId = null,
  openBugReportInitially = false,
  themeMode = 'dark',
  onToggleTheme,
  onNicknameChange
}) => {
  const [showBugForm, setShowBugForm] = useState(openBugReportInitially);
  const [bugSubject, setBugSubject] = useState(DEFAULT_BUG_SUBJECT);
  const [bugDescription, setBugDescription] = useState('');
  const [bugNotice, setBugNotice] = useState<string | null>(null);
  const [nicknameInput, setNicknameInput] = useState<string>(() => getCustomNickname() || currentUser?.name || '');
  const [nicknameStatus, setNicknameStatus] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen && currentUser) {
      setNicknameInput(getCustomNickname() || currentUser.name || '');
      setNicknameStatus(null);
    }
  }, [isOpen, currentUser]);

  useEffect(() => {
    if (isOpen && openBugReportInitially) {
      setShowBugForm(true);
    }
  }, [isOpen, openBugReportInitially]);

  const handleSendBugReport = (e: React.FormEvent) => {
    e.preventDefault();
    const desc = bugDescription.trim();
    if (!desc) {
      setBugNotice('Zəhmət olmasa problemin təsvirini yazın.');
      return;
    }
    const finalSubject = (bugSubject.trim() || DEFAULT_BUG_SUBJECT.trim());
    const platform = isNativeMobileApp() ? 'Android App' : 'Web';
    const playerInfo = currentUser ? `${currentUser.name} (${currentUser.email})` : 'Qonaq Oyunçu';
    const body = `${desc}\n\n---\nOyunçu: ${playerInfo}\nPlatforma: ${platform}\nVersiya: Domino PRO 1.2.2`;
    const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(finalSubject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
    setBugNotice(`E-poçt tətbiqiniz açılır (${SUPPORT_EMAIL})...`);
  };
  const [gisLoaded, setGisLoaded] = useState(false);
  const [gisError, setGisError] = useState<string | null>(null);
  const [waitingForMobileBrowser, setWaitingForMobileBrowser] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => {
    try {
      const sess = localStorage.getItem('az_domino_pending_auth_session');
      const time = Number(localStorage.getItem('az_domino_pending_auth_time') || 0);
      if (sess && Date.now() - time < 10 * 60 * 1000) return sess;
    } catch {}
    return null;
  });
  const [apkBridgeCompleted, setApkBridgeCompleted] = useState(false);
  const [completedProfile, setCompletedProfile] = useState<GoogleUserProfile | null>(null);
  const [bridgeReturnUrls, setBridgeReturnUrls] = useState<{ scheme: string; intent: string } | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isNative = isNativeMobileApp();

  // Helper to query backend for mobile authentication completion
  const checkSessionAuth = async (sessionIdToPoll: string): Promise<boolean> => {
    if (!sessionIdToPoll) return false;
    try {
      setIsCheckingAuth(true);
      const baseUrl = getBackendServerUrl() || PRODUCTION_SERVER_URL;
      const res = await fetch(`${baseUrl}/api/apk-auth/${encodeURIComponent(sessionIdToPoll)}?t=${Date.now()}`);
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data?.authenticated && data?.user) {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          try {
            localStorage.removeItem('az_domino_pending_auth_session');
            localStorage.removeItem('az_domino_pending_auth_time');
          } catch {}
          try {
            await CapBrowser.close().catch(() => {});
          } catch {}
          setWaitingForMobileBrowser(false);
          setIsCheckingAuth(false);
          onSignIn(data.user);
          onClose();
          return true;
        }
      }
    } catch (e) {
      // Ignore transient network errors
    } finally {
      setIsCheckingAuth(false);
    }
    return false;
  };

  // Run a rapid burst of checks when app regains focus or browser closes
  const runRapidPolling = (sessionIdToPoll: string) => {
    checkSessionAuth(sessionIdToPoll);
    let burstCount = 0;
    const burstTimer = setInterval(async () => {
      burstCount++;
      const done = await checkSessionAuth(sessionIdToPoll);
      if (done || burstCount >= 16) {
        clearInterval(burstTimer);
      }
    }, 500);
  };

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    // Check if there was an active pending session (< 10 mins old)
    try {
      const pending = localStorage.getItem('az_domino_pending_auth_session');
      const time = Number(localStorage.getItem('az_domino_pending_auth_time') || 0);
      if (pending && Date.now() - time < 10 * 60 * 1000) {
        setActiveSessionId(pending);
        setWaitingForMobileBrowser(true);
        checkSessionAuth(pending);
      }
    } catch {}

    if (isNative) {
      // On Android APK WebView (https://localhost), Google blocks embedded WebView origin with Error 400: origin_mismatch.
      // Use the official Mobile Browser Auth Bridge directly instead of rendering the broken WebView iframe button.
      return;
    }

    let attempts = 0;
    const checkGis = () => {
      const win = window as any;
      if (win.google?.accounts?.id) {
        setGisLoaded(true);
        initGoogleGis(win.google.accounts.id);
      } else if (attempts < 20) {
        attempts++;
        setTimeout(checkGis, 250);
      } else {
        setGisError('Google Identity Services xidməti yüklənə bilmədi.');
      }
    };

    checkGis();
  }, [isOpen, apkAuthSessionId, isNative]);

  const handleCompleteSignIn = async (profile: GoogleUserProfile, credential?: string) => {
    let resolvedProfile: GoogleUserProfile = profile;

    if (credential && !apkAuthSessionId) {
      try {
        const res = await fetch(`${getBackendServerUrl() || PRODUCTION_SERVER_URL}/api/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential })
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.profile) {
            resolvedProfile = data.profile;
          }
        }
      } catch {
        // Offline fallback: proceed with local profile
      }
    }

    onSignIn(resolvedProfile);
    setCompletedProfile(resolvedProfile);

    // If this browser tab was opened from the Android APK (?apk_auth=...), send the credential to the bridge endpoint first so we get the signed authToken!
    if (apkAuthSessionId) {
      try {
        const res = await fetch(`${getBackendServerUrl() || PRODUCTION_SERVER_URL}/api/apk-auth/${encodeURIComponent(apkAuthSessionId)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential, user: resolvedProfile })
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.user) {
            resolvedProfile = data.user;
            onSignIn(resolvedProfile);
            setCompletedProfile(resolvedProfile);
          }
        }
      } catch (e) {
        console.warn('Failed to send APK bridge auth:', e);
      }

      const qs = new URLSearchParams({
        googleId: resolvedProfile.googleId,
        name: resolvedProfile.name,
        email: resolvedProfile.email,
        picture: resolvedProfile.picture || '',
        authToken: resolvedProfile.authToken || '',
        sessionId: apkAuthSessionId,
        signedInAt: String(resolvedProfile.signedInAt)
      }).toString();

      const schemeUrl = `dominoaz://auth?${qs}`;
      const intentUrl = `intent://auth?${qs}#Intent;scheme=dominoaz;package=az.domino.telefon365;end`;

      setBridgeReturnUrls({ scheme: schemeUrl, intent: intentUrl });
      setApkBridgeCompleted(true);

      // Attempt automatic deep-link redirect back into the Android APK
      setTimeout(() => {
        window.location.href = schemeUrl;
      }, 300);
      return;
    }

    onClose();
  };

  const initGoogleGis = (googleIdApi: any) => {
    try {
      setGisError(null);
      googleIdApi.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response: { credential?: string }) => {
          if (response.credential) {
            try {
              const base64Url = response.credential.split('.')[1];
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const jsonPayload = decodeURIComponent(
                atob(base64)
                  .split('')
                  .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                  .join('')
              );
              const payload = JSON.parse(jsonPayload);
              handleCompleteSignIn(
                {
                  googleId: payload.sub,
                  email: payload.email,
                  name: payload.name || payload.given_name || 'Google Oyunçusu',
                  picture: payload.picture,
                  signedInAt: Date.now()
                },
                response.credential
              );
            } catch (err) {
              console.error('Failed to parse Google JWT credential:', err);
            }
          }
        },
        auto_select: false
      });

      const btnContainer = document.getElementById('google-official-btn');
      if (btnContainer) {
        btnContainer.innerHTML = '';
        googleIdApi.renderButton(btnContainer, {
          theme: 'filled_blue',
          size: 'large',
          type: 'standard',
          shape: 'pill',
          text: 'signin_with',
          logo_alignment: 'left',
          width: 280
        });
      }

      if (!isNative) {
        googleIdApi.prompt();
      }
    } catch (e: any) {
      console.warn('GIS Init Error:', e);
      if (!isNative) {
        setGisError(e?.message || 'Google xidmətinə qoşulma xətası');
      }
    }
  };

  // Start Mobile Browser Auth Bridge for Android APK (avoids WebView origin_mismatch 100%)
  const handleStartMobileBrowserAuth = async () => {
    const sessionId = `apk_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    setActiveSessionId(sessionId);
    try {
      localStorage.setItem('az_domino_pending_auth_session', sessionId);
      localStorage.setItem('az_domino_pending_auth_time', String(Date.now()));
    } catch {}

    setWaitingForMobileBrowser(true);
    setGisError(null);

    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    const baseUrl = getBackendServerUrl() || PRODUCTION_SERVER_URL;
    // Direct dedicated authentication bridge page — no full web game load!
    const bridgeUrl = `${baseUrl}/auth-bridge.html?apk_auth=${encodeURIComponent(sessionId)}`;

    let browserFinishedHandle: { remove: () => Promise<void> } | null = null;
    try {
      CapBrowser.addListener('browserFinished', () => {
        // User closed browser or pressed back — run aggressive rapid polling instead of cancelling!
        runRapidPolling(sessionId);
      }).then((h) => {
        browserFinishedHandle = h;
      }).catch(() => {});
    } catch {}

    try {
      await CapBrowser.open({ url: bridgeUrl, windowName: '_blank' });
    } catch {
      window.open(bridgeUrl, '_system');
    }

    // Steady background polling (every 1.5s for up to 120 attempts / 3 minutes)
    let pollAttempts = 0;
    pollIntervalRef.current = setInterval(async () => {
      pollAttempts++;
      if (pollAttempts > 120) {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        browserFinishedHandle?.remove().catch(() => {});
        setWaitingForMobileBrowser(false);
        setGisError('Giriş vaxtı bitdi. Yenidən cəhd edin.');
        return;
      }
      const done = await checkSessionAuth(sessionId);
      if (done) {
        browserFinishedHandle?.remove().catch(() => {});
      }
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in pointer-events-auto">
      <div className="bg-slate-900 border-2 border-amber-500/80 rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl flex flex-col relative text-slate-100 max-h-[90dvh] min-h-0 overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-lg p-2 flex-shrink-0">
            <svg viewBox="0 0 24 24" className="w-6 h-6">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-1.5">
              Google &amp; Profil Hesabı
            </h2>
            <span className="text-[11px] text-amber-300 font-semibold block">
              Rəsmi Giriş &bull; Tənzimləmələr &bull; Təhlükəsizlik
            </span>
          </div>
        </div>

        {/* Theme Mode Selector (Dark vs Light) */}
        {onToggleTheme && (
          <div className="mb-4 p-2.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between gap-3 shadow-sm">
            <div className="flex flex-col text-left">
              <span className="text-xs font-black text-white">Görünüş Mövzusu:</span>
              <span className="text-[10px] text-slate-400 font-semibold">
                {themeMode === 'light' ? '☀️ İşıqlı (Ağ) Rejim' : '🌙 Qaranlıq (Defolt) Rejim'}
              </span>
            </div>
            <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => onToggleTheme('dark')}
                className={`py-1.5 px-3 rounded-lg text-xs font-black flex items-center gap-1.5 transition ${
                  themeMode === 'dark'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Qaranlıq</span>
              </button>
              <button
                type="button"
                onClick={() => onToggleTheme('light')}
                className={`py-1.5 px-3 rounded-lg text-xs font-black flex items-center gap-1.5 transition ${
                  themeMode === 'light'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>İşıqlı</span>
              </button>
            </div>
          </div>
        )}

        {apkBridgeCompleted && (completedProfile || currentUser) ? (
          <div className="flex flex-col items-center py-5 text-center gap-3">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-lg">
              <CheckCircle className="w-9 h-9" />
            </div>
            <h3 className="text-base font-black text-emerald-300">
              Giriş Uğurla Tamamlandı!
            </h3>
            <p className="text-xs text-slate-300 max-w-xs">
              <strong>{(completedProfile || currentUser)?.name}</strong> hesabınız Domino PRO mobil tətbiqinə bağlandı.
            </p>
            <a
              href={bridgeReturnUrls?.scheme || 'dominoaz://auth'}
              onClick={() => {
                if (bridgeReturnUrls?.intent) {
                  setTimeout(() => {
                    window.location.href = bridgeReturnUrls.intent;
                  }, 400);
                }
              }}
              className="mt-2 w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 text-slate-950 font-black text-sm shadow-lg flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition"
            >
              <Smartphone className="w-4 h-4" />
              <span>Domino PRO Tətbiqinə Qayıt</span>
            </a>
          </div>
        ) : currentUser ? (
          /* Already Signed In View */
          <div className="flex flex-col items-center py-4 text-center">
            <div className="relative mb-3">
              {currentUser.picture ? (
                <img
                  src={currentUser.picture}
                  alt={currentUser.name}
                  className="w-16 h-16 rounded-full border-2 border-emerald-400 shadow-xl object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-emerald-600/30 border-2 border-emerald-400 flex items-center justify-center text-xl font-black text-emerald-300 shadow-xl">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 rounded-full text-slate-950 shadow">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>

            <h3 className="text-sm font-extrabold text-white">{getCustomNickname() || currentUser.name}</h3>
            <span className="text-xs text-slate-400">{currentUser.email}</span>

            <div className="mt-3 py-1.5 px-3 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-1.5 shadow">
              <Cloud className="w-4 h-4 text-emerald-400" />
              <span>Qızıllarınız və tərəqqiniz buludla sinxronlaşdırılıb</span>
            </div>

            {/* Custom Nickname Editor for Google Account */}
            <div className="w-full mt-4 p-3 rounded-2xl bg-slate-800/70 border border-slate-700/80 text-left">
              <label className="text-[10px] font-bold text-amber-300 uppercase tracking-wide block mb-1.5">
                Oyun Ləqəbi (Nickname)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={16}
                  value={nicknameInput}
                  onChange={(e) => {
                    setNicknameInput(e.target.value);
                    if (nicknameStatus) setNicknameStatus(null);
                  }}
                  placeholder={currentUser.name}
                  className="flex-1 min-w-0 bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    const check = validatePlayerName(nicknameInput);
                    if (!check.isValid) {
                      setNicknameStatus({ type: 'err', text: check.error || 'Keçərsiz ad' });
                      return;
                    }
                    const saved = saveCustomNickname(check.sanitizedName);
                    setNicknameInput(saved);
                    setNicknameStatus({ type: 'ok', text: '✓ Ləqəb yadda saxlanıldı' });
                    onNicknameChange?.(saved);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 active:scale-95 text-slate-950 font-black text-xs shadow transition flex-shrink-0"
                >
                  Saxla
                </button>
              </div>
              {nicknameStatus && (
                <p
                  className={`mt-1.5 text-[11px] font-bold ${
                    nicknameStatus.type === 'ok' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {nicknameStatus.text}
                </p>
              )}
            </div>

            {apkAuthSessionId && (
              <button
                onClick={() => handleCompleteSignIn(currentUser)}
                className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs shadow-lg flex items-center justify-center gap-2"
              >
                <Smartphone className="w-4 h-4" />
                <span>Bu Hesabı Mobil Tətbiqə Göndər</span>
              </button>
            )}

            <div className="w-full mt-6 pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
              >
                Tamam
              </button>
              <button
                onClick={() => {
                  onSignOut();
                  onClose();
                }}
                className="py-2.5 px-4 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold text-xs transition flex items-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>Çıxış</span>
              </button>
            </div>
          </div>
        ) : (
          /* Not Signed In View */
          <div className="flex flex-col gap-4">
            {/* Friendly Non-Mandatory Warning Notice */}
            <div className="bg-amber-950/40 border border-amber-500/50 rounded-2xl p-3 flex items-start gap-2.5 shadow-md">
              <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex flex-col text-xs leading-relaxed text-amber-100">
                <span className="font-black text-amber-300 mb-0.5">
                  Məcburi deyil, amma tövsiyə olunur!
                </span>
                <span>
                  Google ilə daxil olduqda qızıllarınız və açdığınız dəstlər Google hesabınızda qorunur. İstənilən telefon və ya kompüterdən daxil olduqda qızıllarınız yerində olacaq.
                </span>
              </div>
            </div>

            {/* If running inside Android APK, show the official Google login button or active sync status with verification button */}
            {isNative ? (
              <div className="flex flex-col items-center gap-2.5 my-1 w-full">
                {waitingForMobileBrowser ? (
                  <div className="w-full flex flex-col items-center gap-2.5">
                    <div className="w-full p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex flex-col items-center text-center gap-1.5">
                      <div className="flex items-center gap-2 text-amber-300 font-bold text-xs sm:text-sm">
                        <Loader2 className={`w-4 h-4 text-amber-400 ${isCheckingAuth ? 'animate-spin' : ''}`} />
                        <span>Brauzerdə Google Girişi Gözlənilir</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-tight">
                        Brauzerdə Google hesabınızı seçdikdən sonra tətbiqə qayıdın.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const sess = activeSessionId || localStorage.getItem('az_domino_pending_auth_session');
                        if (sess) checkSessionAuth(sess);
                      }}
                      disabled={isCheckingAuth}
                      className="w-full max-w-[320px] py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:brightness-110 active:scale-95 text-slate-950 font-black text-sm shadow-xl flex items-center justify-center gap-2.5 transition border border-emerald-400 cursor-pointer"
                    >
                      <RefreshCw className={`w-4 h-4 ${isCheckingAuth ? 'animate-spin' : ''}`} />
                      <span>{isCheckingAuth ? 'Yoxlanılır...' : '🔄 Girişi Yoxla və Tamamla'}</span>
                    </button>

                    <div className="flex items-center justify-between w-full max-w-[320px] px-2 text-[11px]">
                      <button
                        type="button"
                        onClick={handleStartMobileBrowserAuth}
                        className="text-amber-400 hover:text-amber-300 underline font-semibold"
                      >
                        Brauzeri təkrar aç
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setWaitingForMobileBrowser(false);
                          setActiveSessionId(null);
                          try {
                            localStorage.removeItem('az_domino_pending_auth_session');
                            localStorage.removeItem('az_domino_pending_auth_time');
                          } catch {}
                          if (pollIntervalRef.current) {
                            clearInterval(pollIntervalRef.current);
                            pollIntervalRef.current = null;
                          }
                        }}
                        className="text-slate-400 hover:text-slate-200"
                      >
                        Ləğv et
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleStartMobileBrowserAuth}
                      className="w-full max-w-[300px] py-3 px-5 rounded-full bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm transition shadow-xl flex items-center justify-center gap-3 active:scale-95 border border-slate-200"
                    >
                      <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>Google ilə Daxil Olun</span>
                    </button>
                    <span className="text-[11px] text-slate-400 text-center">
                      Təhlükəsiz rəsmi Google girişi
                    </span>
                  </>
                )}
              </div>
            ) : (
              /* Official Google Button Container on Web (rendered directly by Google's native SDK) */
              <div className="flex flex-col items-center justify-center my-1 min-h-[48px]">
                <div id="google-official-btn" className="flex justify-center w-full"></div>
              </div>
            )}

            {gisError && (
              <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-[11px] font-semibold text-center">
                {gisError}
              </div>
            )}

            {/* Voluntary Continue as Guest Button */}
            <div className="border-t border-slate-800 pt-3 flex flex-col items-center">
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-slate-400 hover:text-white underline transition py-1"
              >
                İndi deyil, Qonaq kimi davam et
              </button>
            </div>
          </div>
        )}

        {/* Report a Bug / Feedback Section inside Profile */}
        {!apkBridgeCompleted && (
          <div className="mt-4 pt-3 border-t border-slate-800/90">
            <button
              type="button"
              onClick={() => {
                setShowBugForm((prev) => !prev);
                setBugNotice(null);
              }}
              className="w-full py-2 px-3 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 text-xs font-bold text-amber-300 flex items-center justify-between transition"
            >
              <span className="flex items-center gap-2">
                <Bug className="w-4 h-4 text-rose-400" />
                <span>Xəta Bildir / Rəy Göndər</span>
              </span>
              <span className="text-[10px] text-slate-400">
                {showBugForm ? 'Bağla ▲' : 'Aç ▼'}
              </span>
            </button>

            {showBugForm && (
              <form onSubmit={handleSendBugReport} className="mt-2.5 flex flex-col gap-2 bg-slate-950/70 border border-slate-800 rounded-2xl p-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    Mövzu:
                  </label>
                  <input
                    type="text"
                    value={bugSubject}
                    onChange={(e) => setBugSubject(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    Problemin təsviri:
                  </label>
                  <textarea
                    rows={3}
                    value={bugDescription}
                    onChange={(e) => {
                      setBugDescription(e.target.value);
                      if (bugNotice) setBugNotice(null);
                    }}
                    placeholder="Xətanı və ya təklifinizi ətraflı yazın..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
                  />
                </div>

                {bugNotice && (
                  <p className="text-[11px] font-semibold text-amber-300">
                    {bugNotice}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow active:scale-95 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>E-poçt ilə Göndər</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
