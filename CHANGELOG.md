# Domino PRO (Telefon 365 & Klassik 101) — Dəyişikliklər Jurnalı (Changelog)

Bütün yeniləmələr, düzəlişlər, funksionallıqlar və versiya dəyişiklikləri bu faylda xronoloji ardıcıllıqla qeyd olunur.

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
