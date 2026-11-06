import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Sparkles, X, History, Smile } from 'lucide-react';
import { ChatMessage } from '../types/multiplayer';
import { cleanProfanity, containsProfanity } from '../utils/profanityFilter';

interface TeahouseChatOverlayProps {
  onSendChat: (text?: string, emoji?: string) => void;
  recentMessages: ChatMessage[];
  myPlayerIndex?: number;
  myPlayerName?: string;
}

const BAKU_PHRASES = [
  'Çay süz, qardaş! ☕',
  'Telefon açıldı! 📞',
  'Bazar bomboşdur! 🎲',
  'Gözəl gediş idi! 👏',
  'Oyun bağlandı! 🔒',
  'Qoşanı gizlətmişdim! 🤫',
  'Salamat qalın! 😎',
  'Davam edirik! 🔥'
];

const TEAHOUSE_EMOJIS = ['☕', '🎲', '🔥', '⚡', '🏆', '👏', '😎', '🤦‍♂️', '❤️'];

export const TeahouseChatOverlay: React.FC<TeahouseChatOverlayProps> = ({
  onSendChat,
  recentMessages,
  myPlayerIndex = 0,
  myPlayerName = 'Sən'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customText, setCustomText] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'phrases'>('chat');
  const [unreadCount, setUnreadCount] = useState(0);
  const [visibleToasts, setVisibleToasts] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastSeenMsgIdRef = useRef<string | null>(null);

  // Auto-scroll chat history to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setUnreadCount(0);
      if (recentMessages.length > 0) {
        lastSeenMsgIdRef.current = recentMessages[recentMessages.length - 1].id;
      }
    }
  }, [isOpen, recentMessages]);

  // Track unread messages and temporary floating toasts
  useEffect(() => {
    if (recentMessages.length === 0) return;
    const latest = recentMessages[recentMessages.length - 1];

    if (!isOpen && latest.id !== lastSeenMsgIdRef.current) {
      setUnreadCount((prev) => prev + 1);
    }

    // Show floating toast safely in upper area of table for 5 seconds
    setVisibleToasts((prev) => [...prev.slice(-2), latest]);
    const timer = setTimeout(() => {
      setVisibleToasts((prev) => prev.filter((m) => m.id !== latest.id));
    }, 5000);

    return () => clearTimeout(timer);
  }, [recentMessages.length, isOpen]);

  const handleSendPhrase = (phrase: string) => {
    onSendChat(phrase);
    setIsOpen(false);
  };

  const handleSendEmoji = (emoji: string) => {
    onSendChat(undefined, emoji);
    setIsOpen(false);
  };

  const handleSendCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = customText.trim();
    if (!raw) return;

    const sanitized = containsProfanity(raw) ? cleanProfanity(raw) : raw;
    onSendChat(sanitized);
    setCustomText('');
  };

  const formatTime = (ts?: number) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* 1. Floating In-Game Toast Notifications:
          Positioned at TOP-RIGHT, safely away from the domino hand at the bottom!
          pointer-events-none ensures it NEVER intercepts clicks/touches on tiles or board. */}
      <div className="absolute top-20 right-3 sm:top-24 sm:right-6 z-30 flex flex-col gap-2 pointer-events-none max-w-[240px] sm:max-w-xs transition-all">
        {visibleToasts.map((msg) => {
          const isMe = msg.senderIndex === myPlayerIndex || msg.senderName === myPlayerName;
          return (
            <div
              key={msg.id}
              className="bg-slate-900/95 border border-amber-400/80 text-white rounded-2xl px-3 py-1.5 shadow-[0_4px_25px_rgba(0,0,0,0.85)] animate-fade-in flex items-center gap-2 pointer-events-none backdrop-blur-md"
            >
              <span
                className={`text-[11px] font-black truncate max-w-[90px] ${
                  isMe ? 'text-emerald-400' : 'text-amber-300'
                }`}
              >
                {isMe ? 'Sən' : msg.senderName}:
              </span>
              <span className="text-xs font-semibold truncate flex-1">
                {msg.emoji ? (
                  <span className="text-xl inline-block">{msg.emoji}</span>
                ) : (
                  msg.text
                )}
              </span>
            </div>
          );
        })}
      </div>

      {/* 2. Floating Chat Trigger Button:
          Positioned on the side/bottom-left, clear of domino racks */}
      <div className="absolute bottom-28 left-3 sm:bottom-24 sm:left-4 z-30 pointer-events-auto">
        <button
          onClick={() => {
            setIsOpen(true);
            setUnreadCount(0);
          }}
          title="Bakı Çayxana Çatı & Tarixçə"
          className="relative p-2.5 sm:p-3 rounded-full bg-slate-900/90 hover:bg-slate-800 text-amber-300 border border-amber-500/60 shadow-[0_4px_16px_rgba(0,0,0,0.6)] transition-all active:scale-95 flex items-center justify-center group"
        >
          <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform text-amber-400" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-bounce shadow">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* 3. Full In-Game Chat Modal with Complete History, Phrases & Emojis */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in pointer-events-auto">
          <div className="bg-slate-900 border-2 border-amber-500/80 rounded-3xl p-4 w-full max-w-md shadow-2xl flex flex-col h-[520px] max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-amber-300 uppercase tracking-wider">
                    Çayxana Çatı
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    Bütün oyunçularla canlı söhbət
                  </span>
                </div>
              </div>

              {/* Tabs: Chat History vs Quick Phrases */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('chat')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                    activeTab === 'chat'
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Mesajlar ({recentMessages.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('phrases')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                    activeTab === 'phrases'
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Smile className="w-3.5 h-3.5" />
                  <span>İfadə & Emoji</span>
                </button>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            {activeTab === 'chat' ? (
              /* Chat Messages History View */
              <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1">
                {recentMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                    <span className="text-3xl mb-2">☕</span>
                    <p className="text-xs font-bold text-slate-300">
                      Hələ heç bir mesaj yazılmayıb.
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      İlk salamı verin və ya aşağıdan sürətli reaksiya seçin!
                    </p>
                  </div>
                ) : (
                  recentMessages.map((msg) => {
                    const isMe =
                      msg.senderIndex === myPlayerIndex ||
                      msg.senderName === myPlayerName;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${
                          isMe ? 'items-end' : 'items-start'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-0.5 px-1">
                          <span
                            className={`text-[10px] font-black ${
                              isMe ? 'text-emerald-400' : 'text-amber-400'
                            }`}
                          >
                            {isMe ? 'Sən' : msg.senderName}
                          </span>
                          <span className="text-[9px] text-slate-500">
                            {formatTime(msg.timestamp)}
                          </span>
                        </div>
                        <div
                          className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs font-medium break-words shadow-md ${
                            isMe
                              ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-100 rounded-br-xs'
                              : 'bg-slate-800/90 border border-slate-700 text-white rounded-bl-xs'
                          }`}
                        >
                          {msg.emoji ? (
                            <span className="text-2xl leading-none inline-block">
                              {msg.emoji}
                            </span>
                          ) : (
                            msg.text
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              /* Baku Phrases & Emojis View */
              <div className="flex-1 overflow-y-auto py-2 space-y-3 pr-1">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Sürətli Bakı Çayxana İfadələri
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {BAKU_PHRASES.map((phrase) => (
                      <button
                        key={phrase}
                        onClick={() => handleSendPhrase(phrase)}
                        className="p-2.5 text-left text-xs font-bold text-slate-200 bg-slate-800/80 hover:bg-amber-600/30 hover:text-amber-200 border border-slate-700 hover:border-amber-500/60 rounded-xl transition active:scale-95 shadow-sm"
                      >
                        {phrase}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Quick 1-tap Emojis Row (Always visible at bottom above input) */}
            <div className="pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between gap-1 bg-slate-950/60 px-2 py-1 rounded-xl border border-slate-800">
                {TEAHOUSE_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleSendEmoji(emoji)}
                    title="Göndər"
                    className="text-xl sm:text-2xl hover:scale-125 transition-transform active:scale-90 p-1 rounded-lg hover:bg-slate-800/80"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input Form */}
            <form onSubmit={handleSendCustom} className="flex items-center gap-2 pt-2">
              <input
                type="text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Mesaj yazın..."
                maxLength={60}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
              />
              <button
                type="submit"
                disabled={!customText.trim()}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:hover:bg-amber-500 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow"
              >
                <span>Göndər</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
