import React from 'react';
import { Language } from '../types/domino';
import { X, Lock, Sparkles, Coins, Users, Trophy } from 'lucide-react';

interface TeahousesModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  userCoins: number;
}

interface TeahouseRoom {
  id: string;
  name: { az: string; ru: string; en: string };
  location: { az: string; ru: string; en: string };
  desc: { az: string; ru: string; en: string };
  buyIn: number;
  prizePot: number;
  minLevel: number;
  bgGradient: string;
  borderAccent: string;
  icon: string;
}

const TEAHOUSE_ROOMS: TeahouseRoom[] = [
  {
    id: 'novkhani',
    name: { az: 'Novxanı Çayxanası', ru: 'Чайхана Новханы', en: 'Novkhani Teahouse' },
    location: { az: 'Xəzər Dənizi Sahili', ru: 'Побережье Каспия', en: 'Caspian Coast' },
    desc: {
      az: 'Dəniz mehi, samovar çayı və başlanğıc səviyyəli həvəskar dominoçular.',
      ru: 'Морской бриз, самоварный чай и дружеские партии.',
      en: 'Sea breeze, samovar tea, and casual friendly domino matches.'
    },
    buyIn: 100,
    prizePot: 200,
    minLevel: 1,
    bgGradient: 'from-teal-950/80 via-slate-900 to-teal-900/60',
    borderAccent: 'border-teal-500/40',
    icon: '🏖️'
  },
  {
    id: 'icherisheher',
    name: { az: 'İçərişəhər Klubu', ru: 'Клуб Ичери-Шехер', en: 'Old City Club' },
    location: { az: 'Qədim Qala Divarları', ru: 'Крепостные Стены', en: 'Ancient Fortress' },
    desc: {
      az: 'Tarixi Qız Qalası kölgəsində usta oyunçular və gərgin taktiki mübarizə.',
      ru: 'У Девичьей Башни, опытные мастера и острая тактическая борьба.',
      en: 'Under the Maiden Tower, experienced masters and tactical duels.'
    },
    buyIn: 500,
    prizePot: 1000,
    minLevel: 3,
    bgGradient: 'from-amber-950/80 via-slate-900 to-amber-900/60',
    borderAccent: 'border-amber-500/40',
    icon: '🏰'
  },
  {
    id: 'targovi',
    name: { az: 'Tarqovı VIP Zalı', ru: 'VIP Зал Торговой', en: 'Targovi VIP Hall' },
    location: { az: 'Nizami Küçəsi, Bakı', ru: 'Улица Низами, Баку', en: 'Nizami Street, Baku' },
    desc: {
      az: 'Paytaxtın ən dəbdəbəli məclisi. Yüksək mərc və parlaq qızıl daşlar.',
      ru: 'Роскошный центр столицы. Высокие ставки и золотые кости.',
      en: 'The capital’s most prestigious hall. High stakes and fierce play.'
    },
    buyIn: 2500,
    prizePot: 5000,
    minLevel: 5,
    bgGradient: 'from-purple-950/80 via-slate-900 to-indigo-950/60',
    borderAccent: 'border-purple-500/40',
    icon: '🌆'
  },
  {
    id: 'caspian_highroller',
    name: { az: 'Xəzər Sahili High-Roller', ru: 'Каспийский High-Roller', en: 'Caspian High-Roller' },
    location: { az: 'Dövlət Bayrağı Meydanı', ru: 'Площадь Флага', en: 'Flag Square' },
    desc: {
      az: 'Yalnız qocaman qrossmeysterlər və ən böyük uduşlar üçün elit arena.',
      ru: 'Только для гроссмейстеров и огромных кушей.',
      en: 'Reserved for grandmasters. Winner takes the massive jackpot.'
    },
    buyIn: 10000,
    prizePot: 20000,
    minLevel: 10,
    bgGradient: 'from-rose-950/80 via-slate-900 to-amber-950/70',
    borderAccent: 'border-rose-500/50',
    icon: '👑'
  }
];

export const TeahousesModal: React.FC<TeahousesModalProps> = ({
  isOpen,
  onClose,
  lang,
  userCoins
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">☕</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-amber-300">
                  {lang === 'az' && 'Bakı Çayxanaları & Mərc Zalları'}
                  {lang === 'ru' && 'Чайханы Баку и Залы Ставок'}
                  {lang === 'en' && 'Baku Teahouses & Stakes'}
                </h2>
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  {lang === 'az' && 'Tezliklə'}
                  {lang === 'ru' && 'Скоро'}
                  {lang === 'en' && 'Coming Soon'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {lang === 'az' && 'Gələcək yenilənmədə virtual mərc masaları açılacaq'}
                {lang === 'ru' && 'В будущих обновлениях откроются столы со ставками'}
                {lang === 'en' && 'High-stakes tables opening in future updates'}
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

        {/* Content list */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
          {TEAHOUSE_ROOMS.map((room) => {
            const hasEnough = userCoins >= room.buyIn;
            return (
              <div
                key={room.id}
                className={`relative rounded-2xl p-4 border bg-gradient-to-r ${room.bgGradient} ${room.borderAccent} shadow-lg transition-all overflow-hidden`}
              >
                {/* Coming Soon Watermark / Lock Badge */}
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-amber-950/80 border border-amber-500/50 px-2.5 py-1 rounded-full shadow z-10">
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                    {lang === 'az' && 'Tezliklə'}
                    {lang === 'ru' && 'Скоро'}
                    {lang === 'en' && 'Soon'}
                  </span>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center text-2xl flex-shrink-0 shadow-inner">
                    {room.icon}
                  </div>

                  <div className="flex-1 min-w-0 pr-16">
                    <div className="flex items-baseline gap-2">
                      <h3 className="font-black text-white text-base truncate">
                        {room.name[lang]}
                      </h3>
                      <span className="text-[10px] font-bold text-amber-400/80">
                        • {room.location[lang]}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">
                      {room.desc[lang]}
                    </p>

                    {/* Financial details */}
                    <div className="flex items-center gap-4 mt-3 text-xs">
                      <div className="flex items-center gap-1.5 bg-black/30 px-2.5 py-1 rounded-lg border border-white/5">
                        <span className="text-slate-400 font-medium">Giriş:</span>
                        <div className="flex items-center gap-1 text-amber-300 font-black">
                          <Coins className="w-3.5 h-3.5 text-amber-400" />
                          {room.buyIn}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 bg-black/30 px-2.5 py-1 rounded-lg border border-white/5">
                        <span className="text-slate-400 font-medium">Bank:</span>
                        <div className="flex items-center gap-1 text-emerald-400 font-black">
                          <Trophy className="w-3.5 h-3.5" />
                          {room.prizePot}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                        <Users className="w-3 h-3" />
                        <span>4 Oyunçu</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info banner */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>Balansınız: <strong className="text-amber-300 font-black">{userCoins}</strong> Qızıl</span>
          </div>
          <span className="text-[11px] text-slate-500">
            {lang === 'az' && 'Beta sınaq mərhələsində mərclər deaktivdir'}
            {lang === 'ru' && 'В стадии бета-теста ставки отключены'}
            {lang === 'en' && 'Stakes disabled during beta phase'}
          </span>
        </div>
      </div>
    </div>
  );
};
