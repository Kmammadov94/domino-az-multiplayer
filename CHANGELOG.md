# Domino PRO (Telefon 365 & Klassik 101) — Dəyişikliklər Jurnalı (Changelog)

Bütün yeniləmələr, düzəlişlər, funksionallıqlar və versiya dəyişiklikləri bu faylda xronoloji ardıcıllıqla qeyd olunur.

---

## [1.1.5] — 2026-11-07 (Performans, Batareya Qənaəti və Kritik Kod Audit Düzəlişləri)

### 🔋 Batareya Qənaəti & Mobil Performans Təkmilləşdirmələri
- **60–120 FPS Daş Sürüşdürmə Zamanı Sıfır Re-render (`src/App.tsx`)**:
  - Əvvəl oyunçu daşı barmağı ilə ekranda sürüşdürərkən hər kadrda (`pointermove` / `touchmove`) `setDragPosition` React state yenilənir və bütün oyun ağacını (`Header`, `ScoreBoard`, `BoardView`, bütün 28 daş və modalları) saniyədə 60–120 dəfə yenidən hesablayırdı.
  - İndi sürüşdürülən daşın koordinatları birbaşa DOM ref (`dragOverlayRef.current.style`) üzərindən yenilənir, hədəf qolların maqnit tutma yoxlaması isə `requestAnimationFrame` və keşlənmiş koordinatlarla (`cachedBranchCenters`) icra olunur — sürüşdürmə zamanı React re-render sayı **0**-a endirildi.
- **`DominoTile` və `BoardView` Komponentlərinin Memoizasiyası (`src/components/DominoTile.tsx`, `src/components/BoardView.tsx`)**:
  - `DominoTile` xüsusi müqayisə funksiyası ilə `React.memo`-ya büküldü ki, masadakı və əllərdəki daşlar dəyişmədikdə SVG-lər yenidən çəkilməsin.
  - `BoardView` `React.memo`-ya büküldü və `playableTileIds`, `playableBranches`, `branchExpectedScores`, `availableCombos` hesablamaları `useMemo` ilə optimallaşdırıldı.
- **Oflayn Rejimdə Lazımsız WebSocket Bağlantısının Qarşısının Alınması (`src/services/multiplayerSocket.ts`, `src/App.tsx`)**:
  - Əvvəl tətbiq açılan kimi `onRoomSummary` / `onRoomState` abunəlikləri dərhal canlı serverə WebSocket açır və istifadəçi yalnız oflayn botlarla oynasa belə arxa fonda fasiləsiz şəbəkə ping/pong trafikini açıq saxlayaraq batareya sərf edirdi.
  - İndi WebSocket yalnız istifadəçi həqiqətən onlayn otaq yaratdıqda, qoşulduqda və ya yarımçıq onlayn sessiyası olduqda açılır; otaqdan çıxdıqda isə `disconnectIfIdle()` ilə dərhal bağlanır.
- **Arxa Fonda WebAudio DSP-nin Dayandırılması (`src/utils/sound.ts`, `src/App.tsx`)**:
  - Tətbiq arxa fona keçdikdə və ya ekran söndükdə (`visibilitychange` və Capacitor `appStateChange`) `AudioContext` avtomatik `suspend()` edilir, oyuna qayıtdıqda isə `resume()` olunur.
- **Google Mobil Brauzer Körpüsündə Sonsuz Sorğuların Məhdudlaşdırılması (`src/components/GoogleAuthModal.tsx`)**:
  - İstifadəçi brauzerdə girişi yarımçıq qoyduqda `/api/apk-auth/:sessionId` sorğusunun sonsuza qədər işləməsinin qarşısını almaq üçün maksimum vaxt limiti (120 cəhd / ~2.5 dəqiqə) əlavə edildi.

### 🐛 Kritik Xəta & Yaddaş Sızması (Memory Leak) Düzəlişləri
- **Onlayn Multiplayer-də Qoşa Kombo (Simultaneous Double Combo) Server Çökməsi Düzəldildi (`server/gameRoom.ts`)**:
  - `DoubleComboMove` tipində gedişlər `combo.moves` massivində saxlanıldığı halda, serverdə `executeCombo` metodu `combo.tiles.every(...)` oxumağa çalışırdı və oyunçu onlayn oyunda eyni anda 2 qoşa daş oynadıqda server xəta verirdi. `combo.moves` dəstəyi ilə tam düzəldildi.
- **Capacitor `appUrlOpen` Dinləyici Sızması (`src/App.tsx`)**:
  - `useEffect(..., [stats])` hər dəfə qızıl/statistika dəyişdikdə yeni native `CapApp.addListener('appUrlOpen')` yaradır və Capacitor v8-də `addListener` Promise qaytardığı üçün köhnə dinləyicini silə bilmirdi. `statsRef` və tək `[]` mount effekti ilə Promise düzgün təmizləndi.

---

## [1.1.4] — 2026-11-07 (Sizin və Rəqibin Xallarının, Daşlarının və Növbə İndikatorunun Ayrılması)

### 🎨 İnterfeys (UI / UX) Düzəlişləri
- **Xüsusi Üst Oyun Paneli (Dedicated Non-Overlapping Top HUD Bar — `src/App.tsx`)**:
  - Əvvəl mobil ekranlarda hesab lövhəsi (`ScoreBoard`), rəqibin avatarı/daşları və növbə indikatoru (`Sizin gedişinizdir` / `Rəqib düşünür...`) hamısı `absolute` olaraq masanın yuxarı hissəsində yerləşdiyindən bir-birinin üstünə düşür və həm oyunçunun, həm də rəqibin xallarını gizlədirdi.
  - İndi oyun masasının yuxarısında heç vaxt üst-üstə düşməyən ayrıca **Üst Məlumat Zolağı (Top HUD Bar)** yaradıldı:
    - **Sol tərəfdə**: `ScoreBoard` — **Sizin xalınız** (`Sən: X`) və **Rəqibin xalı** (`Rəqib: Y`) rəngli və aydın çərçivələrdə göstərilir.
    - **Sağ tərəfdə**: Növbə indikatoru (`🟢 Sizin gedişinizdir` və ya `🟡 <Rəqib> düşünür...`) və Bazar qutusu (`BazaarTray`).
  - Rəqibin avatarı və daşları bu zolağın tam altında yerləşən oyun masası daxilində açılır, beləliklə heç bir ekranda üst-üstə düşmə baş vermir.
- **Rəqibin Ad Həbində və Sizin Əlinizin Üstündə Canlı Xal Göstəricisi (`src/App.tsx`, `src/components/PlayerControls.tsx`, `src/components/ScoreBoard.tsx`)**:
  - Hər rəqibin ad həbinin içində daş sayı ilə yanaşı onun canlı xalı da (`⭐ X xal`) birbaşa göstərilir (2P, 3P və 4P rejimlərində).
  - Oyunçunun öz əlindəki daşların düz üstündə (`PlayerControls.tsx`) canlı xal həbi (`Sən: X xal | Rəqib: Y xal`) əlavə olundu ki, həm sizin, həm də rəqibin xalları hər an 100% görünsün.

---

## [1.1.3] — 2026-11-07 (Oyun İçi Yuxarı Panel & Matç Sonu Çıxış Düyməsi)

### 🎨 İnterfeys (UI / UX) Düzəlişləri
- **Oyun İçi Yuxarı Panelin (Top Bar) Tam Görünməsi**:
  - Mobil ekranlarda yuxarı paneldəki loqo yığcam (`compact`) rejimə keçirildi ki, sağ tərəfdəki **Otaq nömrəsi, Qızıl balansı, Səs və Çıxış** düymələri ekran kənarından kəsilməsin.
  - `<header>` elementinə `flex-shrink-0`, `flex-wrap` və `safe-area-inset` boşluqları əlavə olundu.
  - `MainActivity.java` daxilində `LAYOUT_IN_DISPLAY_CUTOUT_MODE_NEVER` aktivləşdirildi ki, telefonun kamera kəsiyi (notch) yuxarı paneli örtməsin.
- **Əl və Matç Bitdikdə Çıxış (Ana Menyu) Düyməsi (`GameEndModal.tsx`)**:
  - Həm botlarla (AI), həm də onlayn multiplayer oyunlarında əl bitdikdə və ya matç bitdikdə **"Ana Menyuya Çıx / Oyundan Çıx"** düyməsi əlavə olundu (həm əsas nəticə pəncərəsində, həm də "Masanın Son Vəziyyətinə Bax" alt panelində).

---

## [1.1.2] — 2026-11-07 (İnterfeys & Növbə İndikatoru Yerləşməsi)

### 🎨 Vizual & UI Təkmilləşdirməsi
- **Növbə İndikatorunun Yeri Dəyişdirildi**:
  - Əvvəl `Sizin gedişinizdir` və ya `Rəqib düşünür...` bildiriş həbi ekranın ən yuxarı mərkəzində yerləşdiyi üçün rəqibin daşları və avatarı ilə üst-üstə düşürdü.
  - İndikator rəqib avatarı və daşlarının dərhal altına (`top-14 sm:top-16`) endirildi; beləliklə həm rəqibin xalları və daşları, həm də növbə göstəricisi üst-üstə düşmədən aydın görünür.

---

## [1.1.1] — 2026-11-07 (Mobil Brauzer Giriş Körpüsü & Avtomatik Qayıdış)

### 🔄 Mobil Tətbiqə Giriş & Sinxronizasiya Axını
- **Xüsusi Yüngül Giriş Səhifəsi (`public/auth-bridge.html`)**:
  - Mobil APK-dan daxil olanda bütün böyük veb oyununu brauzerdə yükləmək əvəzinə yalnız yüngül, tək Google düyməli pəncərə açılır.
- **Tətbiqə Avtomatik Qayıdış (Auto-Return & Deep-Link)**:
  - Brauzerdə hesab seçilən kimi istifadəçi `dominoaz://auth` deep-link və Android Intent vasitəsilə dərhal mobil tətbiqə qaytarılır.
  - `@capacitor/browser` və `@capacitor/app` vasitəsilə xarici brauzer pəncərəsi avtomatik bağlanır (`CapBrowser.close()`).
  - `MainActivity.java` daxilində `onNewIntent` əlavə edilərək dərin keçidlərin mobil tətbiq daxilinə dərhal çatması təmin olundu.
- **Mobil APK Bulud Sinxronizasiyası**:
  - Mobil tətbiq brauzerdəki giriş məlumatlarını qəbul edən kimi avtomatik olaraq profilini yadda saxlayır, qonaq xəbərdarlığını bağlayır və qızıl balansını buludla tam sinxronlaşdırır.

---

## [1.1.0] — 2026-11-07 (Google Play Closed Beta & Mobil Yeniləmə)

### 🚀 Google Play & Mobil APK Hazırlığı
- **Android App Bundle (.aab) & Release APK**:
  - Google Play Console tələblərinə uyğun (`targetSdkVersion 36`, `minSdkVersion 24`, `versionCode 2`, `versionName "1.1.0"`).
  - Rəsmi release imzalama açarı (`domino-release-key.jks`) yaradıldı və `build.gradle` daxilində konfiqurasiya edildi.
  - İmzalanmış paketlər layihə kökünə çıxarıldı: `Domino-AZ.apk`, `Domino-AZ-GooglePlay.aab`.

### 🔐 Google Auth & Giriş Təkmilləşdirmələri
- **Error 400: origin_mismatch Həlli**:
  - Mobil WebView-də Google Identity Services bloklanmasının qarşısını almaq üçün təhlükəsiz **Mobil Brauzer Körpüsü (`/api/apk-auth/:sessionId`)** sistemi tətbiq edildi.
  - `AndroidManifest.xml` daxilində `dominoaz://auth` deep-link əlavə olundu (brauzerdə giriş edildikdən sonra avtomatik mobil tətbiqə qayıdır).
  - Mobil interfeysdə xəta verən daxili iframe düyməsi çıxarıldı, vahid rəsmi Google düyməsi yerləşdirildi.

### 🌐 Şəbəkə, Multiplayer & Bulud Sinxronizasiyası
- **Mobil APK Canlı Server Əlaqəsi**:
  - `getBackendServerUrl()` funksiyası vasitəsilə mobil APK-nın lokal əvəzinə birbaşa canlı `https://domino-az-multiplayer.onrender.com` serverinə qoşulması təmin edildi.
  - Real-time multiplayer, otaq yaratma/qoşulma və Google Cloud qızıl/statistika sinxronizasiyası mobil tətbiqdə aktivləşdirildi.

### 🎨 İnterfeys (UI / UX) Təkmilləşdirmələri
- **Yuxarı Menyu Paneli (Header)**:
  - Üfüqi sürüşdürmə (`overflow-x-auto`) ləğv edildi, `flex-wrap` əlavə olundu; kiçik ekranlarda avtomatik iki səliqəli sətirə bölünərək bütün düymələrin (avatar, qızıllar, Google, mağaza, dostlar, qaydalar, səs, dil, onlayn) görünməsi təmin edildi.
- **Oyun Masası**:
  - Son qoyulmuş daşın lövhədə yaşıl işıqla vurğulanması (`highlightLastPlacedTile`).
  - Rəqiblərin/botların gedişləri üçün hərəkətli bildirişlər ("📥 Bazardan X daş çəkdi", "🚫 Pas keçdi").
  - Növbənin kimdə olduğunu göstərən vizual indikatorlar və botların gedişlərini izləməyi rahatlaşdırmaq üçün gecikmə tənzimləmələri.

### 📜 Mağaza & Hüquqi Materiallar (`google-play-assets/`)
- **Məxfilik Siyasəti (Privacy Policy)**:
  - Canlı səhifə: `https://domino-az-multiplayer.onrender.com/privacy.html`
  - Tərtibatçı əlaqə e-poçtu: `sadpocketgames@gmail.com`
- **Qrafik Materiallar**:
  - 512x512 Mağaza ikonu (`app-icon-512x512.png`).
  - 1024x500 Feature Graphic (`feature-graphic-1024x500.png` — tam Azərbaycan şriftləri ilə).
  - 4 ədəd 1920x1080 telefon skrinşotu (`screenshot-1-modes.png` ... `screenshot-4-skins-gifts.png`).
  - 7-inch və 10-inch planşet skrinşotları (`tablet-7inch-*.png`, `tablet-10inch-*.png`).
  - Google Play məlumatları və anket təlimatı (`GOOGLE_PLAY_INFO.md`, `PRIVACY_POLICY.md`).

---
