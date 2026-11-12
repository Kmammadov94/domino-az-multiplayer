import React, { useEffect, useState } from 'react';
import { GoogleUserProfile } from '../utils/storage';
import { AzerbaijanLogo } from './AzerbaijanLogo';
import { Smartphone, CheckCircle, ExternalLink, ShieldCheck } from 'lucide-react';

const GOOGLE_CLIENT_ID = '345163175505-a7dv01uno2tof42k31omil6p5c9do20g.apps.googleusercontent.com';

interface ApkAuthBridgeViewProps {
  apkAuthSessionId: string;
}

export const ApkAuthBridgeView: React.FC<ApkAuthBridgeViewProps> = ({ apkAuthSessionId }) => {
  const [gisLoaded, setGisLoaded] = useState(false);
  const [completedUser, setCompletedUser] = useState<GoogleUserProfile | null>(null);
  const [deepLinkUrls, setDeepLinkUrls] = useState<{ scheme: string; intent: string } | null>(null);

  useEffect(() => {
    let attempts = 0;
    const checkGis = () => {
      const win = window as any;
      if (win.google?.accounts?.id) {
        setGisLoaded(true);
        win.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response: { credential?: string }) => {
            if (!response?.credential) return;
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
              const profile: GoogleUserProfile = {
                googleId: payload.sub,
                email: payload.email,
                name: payload.name || payload.given_name || 'Google Oyunçusu',
                picture: payload.picture,
                signedInAt: Date.now()
              };

              const qs = new URLSearchParams({
                googleId: profile.googleId,
                name: profile.name,
                email: profile.email,
                picture: profile.picture || '',
                sessionId: apkAuthSessionId,
                signedInAt: String(profile.signedInAt)
              }).toString();

              const schemeUrl = `dominoaz://auth?${qs}`;
              const intentUrl = `intent://auth?${qs}#Intent;scheme=dominoaz;package=az.domino.telefon365;end`;

              setCompletedUser(profile);
              setDeepLinkUrls({ scheme: schemeUrl, intent: intentUrl });

              // Post Google credential to server with retries to verify & store session
              const sendAuthWithRetry = async () => {
                for (let attempt = 1; attempt <= 4; attempt++) {
                  try {
                    const res = await fetch(`/api/apk-auth/${encodeURIComponent(apkAuthSessionId)}`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ credential: response.credential, user: profile })
                    });
                    if (res.ok) break;
                  } catch (e) {
                    console.warn('Bridge POST attempt ' + attempt + ' failed:', e);
                  }
                  await new Promise((r) => setTimeout(r, 350));
                }
              };
              sendAuthWithRetry();

              // Automatic redirect attempt
              setTimeout(() => {
                window.location.href = schemeUrl;
              }, 300);
            } catch (err) {
              console.error('Failed to parse Google JWT credential:', err);
            }
          },
          auto_select: true
        });

        const btnContainer = document.getElementById('bridge-google-btn');
        if (btnContainer) {
          btnContainer.innerHTML = '';
          win.google.accounts.id.renderButton(btnContainer, {
            theme: 'filled_blue',
            size: 'large',
            type: 'standard',
            shape: 'pill',
            text: 'signin_with',
            logo_alignment: 'left',
            width: 280
          });
        }
        win.google.accounts.id.prompt();
      } else if (attempts < 25) {
        attempts++;
        setTimeout(checkGis, 250);
      }
    };

    checkGis();
  }, [apkAuthSessionId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950 text-slate-100 select-none overflow-y-auto">
      <div className="bg-slate-900 border-2 border-amber-500/70 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center animate-fade-in relative">
        <AzerbaijanLogo size="md" />

        <h1 className="text-xl font-black text-amber-300 mt-4 mb-1">
          Domino PRO Girişi
        </h1>
        <p className="text-xs text-slate-300 mb-5 leading-relaxed">
          Google hesabınızı seçin, qızıllarınız və oyun statistikanız mobil tətbiqinizə sinxronlaşdırılsın.
        </p>

        {completedUser && deepLinkUrls ? (
          <div className="flex flex-col items-center w-full gap-3 py-2 animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-lg">
              <CheckCircle className="w-8 h-8" />
            </div>

            <h2 className="text-base font-black text-emerald-300">
              Giriş Uğurla Tamamlandı!
            </h2>
            <p className="text-xs text-slate-200">
              Xoş gəldiniz, <strong>{completedUser.name}</strong>!
            </p>

            <a
              href={deepLinkUrls.scheme}
              onClick={() => {
                setTimeout(() => {
                  window.location.href = deepLinkUrls.intent;
                }, 400);
              }}
              className="mt-3 w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-green-600 text-slate-950 font-black text-sm shadow-xl flex items-center justify-center gap-2 active:scale-95 transition hover:brightness-110"
            >
              <Smartphone className="w-5 h-5" />
              <span>Domino PRO Tətbiqinə Qayıt</span>
            </a>

            <span className="text-[11px] text-slate-400 mt-1">
              Əgər tətbiq avtomatik açılmadısa, yuxarıdakı düyməyə vurun.
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center w-full gap-4">
            <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-3 flex items-start gap-2 text-left">
              <ShieldCheck className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <span className="text-[11px] text-amber-100 leading-relaxed">
                Rəsmi Google hesabınız vasitəsilə tərəqqiniz buluda yazılır və heç vaxt itmir.
              </span>
            </div>

            <div className="min-h-[48px] flex items-center justify-center my-1 w-full">
              <div id="bridge-google-btn" className="flex justify-center w-full"></div>
            </div>

            {!gisLoaded && (
              <span className="text-xs text-slate-400 animate-pulse">
                Google xidməti yüklənir...
              </span>
            )}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-800/80 w-full flex justify-center">
          <a
            href="/"
            className="text-[11px] text-slate-500 hover:text-slate-300 transition flex items-center gap-1"
          >
            <span>Və ya brauzerdə oyna</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
