import React, { useState } from 'react';
import { MessageSquare, Send, Sparkles, X } from 'lucide-react';
import { ChatMessage } from '../types/multiplayer';
import { cleanProfanity, containsProfanity } from '../utils/profanityFilter';

interface TeahouseChatOverlayProps {
  onSendChat: (text?: string, emoji?: string) => void;
  recentMessages: ChatMessage[];
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
  recentMessages
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customText, setCustomText] = useState('');

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

    // Filter profanities in chat
    const sanitized = containsProfanity(raw) ? cleanProfanity(raw) : raw;
    onSendChat(sanitized);
    setCustomText('');
    setIsOpen(false);
  };

  // Only display the 2 most recent messages floating over table
  const floatingMessages = recentMessages.slice(-2);

  return (
    <>
      {/* Floating Active Chat Messages on Table */}
      <div className="absolute bottom-24 right-4 z-30 flex flex-col gap-2 pointer-events-none max-w-xs">
        {floatingMessages.map((msg) => (
          <div
            key={msg.id}
            className="bg-slate-900/95 border-2 border-amber-400/80 text-white rounded-2xl px-3.5 py-2 shadow-[0_4px_20px_rgba(0,0,0,0.8)] animate-bounce flex items-center gap-2 pointer-events-auto"
          >
            <span className="text-[11px] font-black text-amber-300">
              {msg.senderName}:
            </span>
            <span className="text-xs font-semibold">
              {msg.emoji ? (
                <span className="text-xl">{msg.emoji}</span>
              ) : (
                msg.text
              )}
            </span>
          </div>
        ))}
      </div>

      {/* Chat Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Bakı Çayxana Reaksiyaları"
        className="p-2.5 rounded-full bg-slate-800/90 hover:bg-slate-700 text-amber-300 border border-amber-500/50 shadow-lg transition active:scale-95 flex items-center justify-center group"
      >
        <MessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform text-amber-400" />
      </button>

      {/* Popup Reactions Tray */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in pointer-events-auto">
          <div className="bg-slate-900 border-2 border-amber-500/80 rounded-2xl p-4 w-full max-w-sm shadow-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-black text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-400" /> Çayxana Reaksiyaları
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Emojis Grid */}
            <div className="flex items-center justify-between gap-1 py-1 bg-slate-950/50 p-2 rounded-xl border border-slate-800">
              {TEAHOUSE_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleSendEmoji(emoji)}
                  className="text-2xl hover:scale-125 transition-transform active:scale-95 p-1 rounded-lg hover:bg-slate-800"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Baku Teahouse Phrases Grid */}
            <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
              {BAKU_PHRASES.map((phrase) => (
                <button
                  key={phrase}
                  onClick={() => handleSendPhrase(phrase)}
                  className="p-2 text-left text-[11px] font-bold text-slate-200 bg-slate-800/80 hover:bg-amber-600/30 hover:text-amber-200 border border-slate-700 hover:border-amber-500/50 rounded-xl transition active:scale-95"
                >
                  {phrase}
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <form onSubmit={handleSendCustom} className="flex items-center gap-1.5 mt-1">
              <input
                type="text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Mesaj yazın..."
                maxLength={45}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
