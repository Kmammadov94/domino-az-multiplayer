import React from 'react';
import { Language } from '../types/domino';
import { translations } from '../i18n/translations';
import { X, BookOpen, CheckCircle2, GraduationCap } from 'lucide-react';
import { getTutorialCopy } from '../utils/tutorialScenario';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onStartTutorial?: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose, lang, onStartTutorial }) => {
  if (!isOpen) return null;
  const t = translations[lang];
  const tutCopy = getTutorialCopy(lang);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in pointer-events-auto">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl w-full max-w-2xl max-h-[90dvh] min-h-0 flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-amber-300">{t.rules} — {t.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            {onStartTutorial && (
              <button
                onClick={() => {
                  onClose();
                  onStartTutorial();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 text-xs font-bold transition"
              >
                <GraduationCap className="w-4 h-4" />
                <span>{tutCopy.rulesButton}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 pb-8 space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          {lang === 'az' && (
            <>
              <section className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                <h3 className="font-bold text-amber-300 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" /> 1. İlk Gediş Qaydası
                </h3>
                <p>
                  İlk əldə oyuna <strong>[3:2]</strong> daşı olan oyunçu başlayır. Əgər heç kimdə [3:2] yoxdursa, ən kiçik qoşadan (<strong>[1:1]</strong>-dən başlayaraq; [0:0] başlaya bilməz) başlanılır. Sonrakı əllərdə əvvəlki əlin qalibi istədiyi daşla başlayır.
                </p>
                <p className="mt-2 text-amber-200/90 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 text-xs">
                  <strong>Yenidən Paylanma Qaydası (Bütün Rejimlərdə):</strong> Oyunçulardan hər hansı birinə <strong>5 və ya daha çox qoşa daş</strong> (məsələn: 5 ədəd qoşa), <strong>qoşasız 5 eyni daş</strong> (məsələn: [3:3] olmadan 5 ədəd «3»), yaxud <strong>6 və ya 7 eyni daş</strong> düşərsə, daşlar hamı üçün mütləq yenidən qarışdırılır və təzədən paylanılır!
                </p>
              </section>

              <section className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                <h3 className="font-bold text-amber-300 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" /> 2. "Telefon" (Çarpaz / Spinner)
                </h3>
                <p>
                  Telefon avtomatik ilk atılan qoşa deyil! <strong>Hər iki tərəfinə daş bağlanan ilk qoşa daş Telefon (Spinner) olur.</strong> Telefon açıldıqdan sonra onun yan tərəflərindən (qollarından) daş qoymaq olar və masada 4 açıq istiqamət yaranır.
                </p>
              </section>

              <section className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                <h3 className="font-bold text-amber-300 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" /> 3. Xal Hesablanması (5-in Qatları)
                </h3>
                <p>
                  Hər gedişdən sonra açıq ucların cəmi toplanır. Açıq uclardakı qoşa daşlar öz tam dəyəri ilə hesablanır (məsələn, açıq 5:5 = 10 xal). Əgər cəm <strong>5, 10, 15, 20, 25, 30, 35</strong> edirsə, həmin xal dərhal oyunçuya (və ya komandaya) yazılır.
                </p>
              </section>

              <section className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                <h3 className="font-bold text-amber-300 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" /> 4. "Bağlandı" və Yuxarı Yuvarlaqlaşdırma
                </h3>
                <p>
                  Oyun bağlandıqda ("Bağlandı"), əldə ən az xalı qalan qalib olur. <strong>Əgər əldə tək [0:0] (boş-boş) qalarsa, 0 yox, 10 xal sayılır!</strong> Qalan rəqiblərin əlindəki xallar <strong>heç vaxt aşağı deyil, həmişə yuxarı 5-in qatına yuvarlaqlaşdırılır</strong> (məsələn: 6 xal $\rightarrow$ 10, 11 xal $\rightarrow$ 15).
                </p>
                <p className="mt-2 text-amber-200/90 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 text-xs">
                  <strong>Erkən Bağlandı & Bazar Qaydası:</strong> Əgər masadakı bütün açıq ucların daşları artıq oynanılıbsa (məsələn, uclardakı hər bir rəqəmin 7 daşının hamısı artıq masadadırsa və bazarda və ya əllərdə heç bir gediləcək daş qala bilməzsə), oyun dərhal «Bağlandı» elan edilir. Oyunçuların bazardan mənasız yerə daş çəkib əllərinə yığmasına ehtiyac yoxdur.
                </p>
              </section>

              <section className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                <h3 className="font-bold text-amber-300 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" /> 5. 300 Qaydası və 365 Qələbəsi
                </h3>
                <p>
                  <strong>300 xaldan sonra</strong> əl bitərkən rəqibin əlindəki xallar hesablanmır (yalnız masadakı 5-liklərdən xal yazılır) və ələ qoşa 5-lə ([5:5]) başlayanda 10 xal verilmir (0 xal yazılır).
                  Hədəf <strong>365 xaldır</strong>. 365 keçilsə belə əl yarımçıq dayanmır, sona qədər oynanılır. Əgər 365 keçildikdən sonra əl "Bağlandı" ilə bitərsə, qalib elan olunmur — mütləq əlavə əl oynanılır!
                </p>
              </section>

              <section className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                <h3 className="font-bold text-amber-300 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" /> 6. Qoşa Kombosu və 35 Qızıl Qələbə
                </h3>
                <p>
                  <strong>Qoşa Kombosu</strong>: Əgər əlinizdə masadakı açıq uclara uyğun gələn 2, 3 və ya 4 qoşa daş varsa və onları birlikdə qoyduqda ümumi xal 5-in misli (10, 15, 20, 25, 30, 35) edirsə, həmin qoşaları bir gedişdə eyni anda oynaya bilərsiniz (məsələn: masada [3:2] açılıb, əlinizdə həm [3:3], həm də [2:2] varsa, hər ikisini birdən vurub 10 xal qazanırsınız).<br />
                  <strong>35 Qızıl Qələbə</strong>: Əl gedişatında masada 35 xal vuran tərəf dərhal bütün matçın qalibi olur!
                </p>
              </section>
            </>
          )}

          {lang === 'ru' && (
            <>
              <section className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                <h3 className="font-bold text-amber-300 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" /> 1. Первый Ход
                </h3>
                <p>
                  В первой сдаче начинает обладатель кости <strong>[3:2]</strong>. Если ни у кого нет [3:2], то право хода переходит к младшему дублю начиная с <strong>[1:1]</strong> (дубль [0:0] не начинает). В следующих сдачах начинает победитель предыдущей сдачи любой костью.
                </p>
                <p className="mt-2 text-amber-200/90 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 text-xs">
                  <strong>Правило пересдачи (Во всех режимах):</strong> Если игроку при раздаче выпадает <strong>5 и более дублей</strong>, <strong>5 костей одного достоинства без дубля</strong> (напр. 5 троек без [3:3]) или <strong>6-7 костей одного достоинства</strong>, объявляется полная пересдача для всех игроков!
                </p>
              </section>

              <section className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                <h3 className="font-bold text-amber-300 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" /> 2. Телефон (Крест / Спиннер)
                </h3>
                <p>
                  Спиннером становится <strong>первый дубль, к которому приставлены фишки с обеих сторон по основной линии</strong>. После этого открываются перпендикулярные ветки (до 4 активных концов).
                </p>
              </section>

              <section className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                <h3 className="font-bold text-amber-300 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" /> 3. Начисление Очков (Кратные 5)
                </h3>
                <p>
                  После каждого хода суммируются свободные концы. Открытые дубли считаются в полную стоимость (напр. 5:5 = 10). Если сумма равна <strong>5, 10, 15, 20, 25, 30, 35</strong>, она начисляется игроку/команде.
                </p>
              </section>

              <section className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                <h3 className="font-bold text-amber-300 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" /> 4. Багланды и Округление Вверх
                </h3>
                <p>
                  При блокировке («Багланды») побеждает игрок с наименьшей суммой очков. <strong>Если на руках остается только дубль [0:0] без других костей, он считается за 10 очков!</strong> Очки на руках соперников <strong>всегда округляются только ВВЕРХ до ближайшей 5-ки</strong> (6 $\rightarrow$ 10, 11 $\rightarrow$ 15).
                </p>
                <p className="mt-2 text-amber-200/90 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 text-xs">
                  <strong>Досрочное «Багланды» и Базар:</strong> Если все 7 костей каждого открытого числа на столе уже выложены (и ни в руках, ни в базаре не может быть подходящих костей), сдача немедленно объявляется заблокированной. Игрокам не нужно принудительно вытягивать весь базар.
                </p>
              </section>

              <section className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                <h3 className="font-bold text-amber-300 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" /> 5. Правило 300 и Победа в 365
                </h3>
                <p>
                  <strong>После 300 очков</strong> бонус за оставшиеся на руках кости соперника не начисляется, а при начале с дубля 5:5 10 очков не даются (0 очков).
                  Игра идет до <strong>365 очков</strong>, сдача доигрывается до конца. Если набрано $\ge 365$, но сдача завершилась «Багланды», играется следующая сдача до чистого выигрыша!
                </p>
              </section>
            </>
          )}

          {lang === 'en' && (
            <>
              <section className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                <h3 className="font-bold text-amber-300 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" /> 1. Opening Move
                </h3>
                <p>
                  The first hand begins with the player holding <strong>[3:2]</strong>. If no one has [3:2], the lowest double starting from <strong>[1:1]</strong> leads ([0:0] cannot start). In subsequent hands, the winner leads with any tile.
                </p>
                <p className="mt-2 text-amber-200/90 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 text-xs">
                  <strong>Reshuffle Rule (All Modes):</strong> If any player is dealt <strong>5 or more doubles</strong>, <strong>5 of a kind without the double</strong> (e.g. five 3s without [3:3]), or <strong>6-7 of a kind</strong>, all 28 tiles must be reshuffled and re-dealt for everyone!
                </p>
              </section>

              <section className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                <h3 className="font-bold text-amber-300 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" /> 2. The Spinner (Telefon)
                </h3>
                <p>
                  The Spinner is <strong>the first double that has tiles played to both of its sides along the line</strong>. Once triggered, its perpendicular sides open, creating up to 4 playable branches.
                </p>
              </section>

              <section className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                <h3 className="font-bold text-amber-300 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" /> 3. Scoring (Multiples of 5)
                </h3>
                <p>
                  Exposed ends are summed after every play. Open doubles count full value (e.g. 5:5 = 10). If total sum is a multiple of 5 (<strong>5, 10, 15, 20, 25, 30, 35</strong>), it is awarded immediately.
                </p>
              </section>

              <section className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                <h3 className="font-bold text-amber-300 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" /> 4. Baglandi & Always Round UP
                </h3>
                <p>
                  When blocked ("Baglandi"), the player with lowest pip sum wins. <strong>If [0:0] is left solo with no other dominoes, it counts as 10 points!</strong> Remaining opponent hand pips are <strong>never rounded down, always rounded UP to the higher multiple of 5</strong> (e.g. 6 $\rightarrow$ 10, 11 $\rightarrow$ 15).
                </p>
                <p className="mt-2 text-amber-200/90 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 text-xs">
                  <strong>Early Blocked & Boneyard Rule:</strong> If all 7 dominoes of every open branch end have already been played on the table (meaning no unplayed tile anywhere can match), the hand is immediately declared Blocked. Players are never forced to draw the entire boneyard into their hands.
                </p>
              </section>

              <section className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                <h3 className="font-bold text-amber-300 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" /> 5. The 300 Rule & 365 Victory
                </h3>
                <p>
                  <strong>After 300 points</strong>, opponents' remaining hand pips are not added (table points only), and opening the hand with double [5:5] awards 0 points instead of 10. The match target is <strong>365 points</strong>. Play never halts mid-hand; if 365 is crossed but hand ends in Baglandi, another hand is played.
                </p>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
