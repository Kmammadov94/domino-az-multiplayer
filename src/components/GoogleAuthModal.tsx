import React, { useState, useEffect } from 'react';
import { Cloud, CheckCircle, ShieldAlert, LogOut, X, Sparkles, Key, ExternalLink } from 'lucide-react';
import { GoogleUserProfile } from '../utils/storage';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: GoogleUserProfile | null;
  onSignIn: (user: GoogleUserProfile) => void;
  onSignOut: () => void;
}

const SAVED_CLIENT_ID_KEY = 'az_domino_google_client_id';

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSignIn,
  onSignOut
}) => {
  const [clientIdInput, setClientIdInput] = useState<string>(() => {
    return (
      localStorage.getItem(SAVED_CLIENT_ID_KEY) ||
      (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
      ''
    );
  });
  const [showConfig, setShowConfig] = useState(false);
  const [gisLoaded, setGisLoaded] = useState(false);
  const [gisError, setGisError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const checkGis = () => {
      const win = window as any;
      if (win.google?.accounts?.id) {
        setGisLoaded(true);
        initGoogleGis(win.google.accounts.id);
      } else {
        setTimeout(checkGis, 300);
      }
    };

    checkGis();
  }, [isOpen, clientIdInput]);

  const initGoogleGis = (googleIdApi: any) => {
    const activeClientId = clientIdInput.trim();
    if (!activeClientId) return;

    try {
      setGisError(null);
      googleIdApi.initialize({
        client_id: activeClientId,
        callback: (response: { credential?: string }) => {
          if (response.credential) {
            try {
              // Decode payload from JWT
              const base64Url = response.credential.split('.')[1];
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const jsonPayload = decodeURIComponent(
                atob(base64)
                  .split('')
                  .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                  .join('')
              );
              const payload = JSON.parse(jsonPayload);
              onSignIn({
                googleId: payload.sub,
                email: payload.email,
                name: payload.name || payload.given_name || 'Google Oyunçusu',
                picture: payload.picture,
                signedInAt: Date.now()
              });
              onClose();
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

      // Automatically trigger Google One-Tap popup prompt
      googleIdApi.prompt();
    } catch (e: any) {
      console.warn('GIS Init Error:', e);
      setGisError(e?.message || 'Google Client ID xətası');
    }
  };

  const handleSaveClientId = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = clientIdInput.trim();
    if (clean) {
      localStorage.setItem(SAVED_CLIENT_ID_KEY, clean);
      setShowConfig(false);
      const win = window as any;
      if (win.google?.accounts?.id) {
        initGoogleGis(win.google.accounts.id);
      }
    }
  };

  const handleOneTapDirectPrompt = () => {
    const win = window as any;
    if (win.google?.accounts?.id && clientIdInput.trim()) {
      win.google.accounts.id.prompt();
    } else {
      setShowConfig(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in pointer-events-auto">
      <div className="bg-slate-900 border-2 border-amber-500/80 rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl flex flex-col relative text-slate-100">
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
            {/* Google colored G svg logo */}
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
              Rəsmi Google Hesabı ilə Giriş
            </h2>
            <span className="text-[11px] text-amber-300 font-semibold block">
              Google OAuth 2.0 Təhlükəsiz Giriş
            </span>
          </div>
        </div>

        {currentUser ? (
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

            <h3 className="text-sm font-extrabold text-white">{currentUser.name}</h3>
            <span className="text-xs text-slate-400">{currentUser.email}</span>

            <div className="mt-3 py-1.5 px-3 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-1.5 shadow">
              <Cloud className="w-4 h-4 text-emerald-400" />
              <span>Qızıllarınız və tərəqqiniz buludla sinxronlaşdırılıb</span>
            </div>

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
          <div className="flex flex-col gap-3.5">
            {/* Friendly Non-Mandatory Warning Notice */}
            <div className="bg-amber-950/40 border border-amber-500/50 rounded-2xl p-3 flex items-start gap-2.5 shadow-md">
              <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex flex-col text-xs leading-relaxed text-amber-100">
                <span className="font-black text-amber-300 mb-0.5">
                  Məcburi deyil, amma tövsiyə olunur!
                </span>
                <span>
                  Google ilə daxil olmasanız, brauzer tarixçəsi təmizləndikdə və ya cihazınızı dəyişdikdə qazanılan qızıllarınız və açdığınız avatarlar itə bilər.
                </span>
              </div>
            </div>

            {/* Official Google Button Container */}
            <div className="flex flex-col items-center justify-center my-2 min-h-[44px]">
              <div id="google-official-btn" className="flex justify-center"></div>

              {/* If GIS button is not rendered yet, show active 1-click trigger */}
              {(!clientIdInput.trim() || !gisLoaded) && (
                <button
                  type="button"
                  onClick={handleOneTapDirectPrompt}
                  className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs sm:text-sm transition shadow-lg flex items-center justify-center gap-3 active:scale-95 border border-slate-300"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5">
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
                  <span>Google Hesabı ilə Giriş et</span>
                </button>
              )}
            </div>

            {gisError && (
              <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-[11px] font-semibold text-center">
                {gisError}
              </div>
            )}

            {/* Google Cloud Client ID Configuration Panel */}
            <div className="border border-slate-800 rounded-2xl p-3 bg-slate-950/60">
              <button
                type="button"
                onClick={() => setShowConfig(!showConfig)}
                className="w-full flex items-center justify-between text-xs font-bold text-amber-300 hover:text-amber-200"
              >
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>Google Client ID quraşdırması</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  {showConfig ? 'Gizlət ▲' : 'Dəyiş ▼'}
                </span>
              </button>

              {showConfig && (
                <form onSubmit={handleSaveClientId} className="flex flex-col gap-2 mt-3 pt-2 border-t border-slate-800">
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Google OAuth-un rəsmi popup pəncərəsi açması üçün Google Cloud Console-dan pulsuz <strong>Web Client ID</strong> lazımdır:
                  </p>
                  <input
                    type="text"
                    value={clientIdInput}
                    onChange={(e) => setClientIdInput(e.target.value)}
                    placeholder="məs: 123456-abc.apps.googleusercontent.com"
                    className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono text-[11px]"
                  />
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <a
                      href="https://console.cloud.google.com/apis/credentials"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-sky-400 hover:underline flex items-center gap-1"
                    >
                      <span>Google Console aç</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition"
                    >
                      Saxla & Aktiv Et
                    </button>
                  </div>
                </form>
              )}
            </div>

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
      </div>
    </div>
  );
};
