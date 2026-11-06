# 🁣 Domino Telefon 365 (Azərbaycan)

Azərbaycanın ənənəvi çayxana qaydaları ilə hazırlanmış xüsusi **"Telefon 365"** domino oyunu. Web və Android platformaları üçün tam hazırdır.

---

## 🎮 Oyun Qaydaları (Telefon 365)

1. **Oyun Rejimləri:**
   - **2 Nəfərlik Tək (1 vs 1)**: Hərəyə 7 daş, 14 daş bazarda.
   - **3 Nəfərlik Tək (1 vs 2)**: Hərəyə 7 daş, 7 daş bazarda.
   - **4 Nəfərlik Tək (1 vs 3)**: Hərəyə 7 daş, bazar yoxdur (bütün 28 daş paylanır).
   - **4 Nəfərlik Cütlük (2 vs 2)**: Siz və Rəşad (AI) rəqib Eldar və Tofiqə qarşı.

2. **İlk Gediş:**
   - İlk əldə mütləq **[3:2]** ("otuz iki") daşı olan oyunçu başlayır!
   - Əgər heç kimdə [3:2] yoxdursa, ən kiçik qoşadan (**[1:1]**-dən başlayaraq; [0:0] başlaya bilməz) başlanılır.
   - Növbəti əllərdə əvvəlki əlin qalibi istədiyi daşla başlayır.

3. **Telefon (Çarpaz / Spinner):**
   - Telefon avtomatik ilk düşən qoşa deyil! **Hər iki tərəfinə daş bağlanan ilk qoşa daş Telefon (Spinner) elan edilir.**
   - Telefon açıldıqdan sonra onun yan tərəflərindən (qollarından) daş qoşmaq olar və masada 4 açıq istiqamət yaranır.

4. **Xalların Hesablanması (5-in Qatları):**
   - Hər gedişdən sonra masadakı açıq uclar toplanır. Açıq uclardakı qoşa daşlar öz tam qiyməti ilə hesablanır (məsələn, açıq 5:5 = 10 xal).
   - Əgər ucların cəmi **5, 10, 15, 20, 25, 30, 35** edirsə, həmin xal dərhal oyunçuya (və ya komandaya) yazılır.

5. **"Bağlandı" və Yuxarı Yuvarlaqlaşdırma:**
   - Oyun bağlandıqda ("Bağlandı"), əldə ən az xalı qalan qalib olur.
   - Rəqiblərin əlində qalan xallar **heç vaxt aşağı deyil, həmişə yuxarı 5-in qatına yuvarlaqlaşdırılır** (məsələn: 6 xal $\rightarrow$ 10, 11 xal $\rightarrow$ 15).
   - Cütlük (2 vs 2) rejimində bütün rəqiblərin xalları yuxarı yuvarlaqlaşdırılaraq qalib komandaya əlavə olunur.

6. **300 Xal Qaydası:**
   - **300 xaldan sonra** əl bitərkən rəqibin əlindəki xallar hesablanmır (yalnız masadakı 5-liklərdən xal yazılır).

7. **365 Qələbə Şərti:**
   - Hədəf **365 xaldır**.
   - 365 xal keçilsə belə oyun dərhal dayandırılmır, əl sona qədər (Domino və ya Bağlandı olana qədər) davam edir.
   - Əgər 365 keçildikdən sonra əl **"Bağlandı"** ilə bitərsə, qalib elan olunmur — mütləq əlavə əl oynanılır!
   - Əl bitdikdə ən çox xal toplayan qalib gəlir (xal fərqi tələbi yoxdur, 5 xal fərq də bəs edir). Bərabərlik olarsa, əlavə əl oynanılır.

---

## 💎 Dükkan və 20 Xüsusi Daş Dəsti (Skins)

Dükkanda 20 fərqli domino dəsti mövcuddur (qiyməti 20 qızıl):
- **Klassik**: Klassik Sümük (Default), Qara Abanos, Çayxana Əntiq, Bakı Qoz Ağacı
- **Lüks & Kral**: Şah Qızılı, Zümrüd Yaşılı, Odlar Yurdu Yaqutu, Xəzər Göyü, Şahzadə Ametisti, Almaz Platin
- **Bakı & İrs**: Qarabağ İpəyi, Şəki Şəbəkəsi, Qobustan Qayası, Abşeron Butası, Bakı Qara Qızılı (Neft)
- **Modern**: Kiber Neon, Ağ Karrara Mərməri, Karbon Stels, Xəzər Qürubu, Çəhrayı Qızıl

---

## 🪙 Gündəlik Mükafat və Qızıl Sistemi

- **Gündəlik Giriş**: Hər gün daxil olanda +5 qızıl.
- **7 Günlük Ardıcıllıq**: 7-ci gün super bonusu: +25 qızıl (cəmi +30 qızıl)!
- **Oyun Qazancı**:
  - Oyunu qazandıqda: **+5 qızıl**
  - Oyunu tamamlayıb məğlub olduqda: **+3 qızıl**
  - Oyunu tərk etdikdə: 0 qızıl
- **Başlanğıc Hədiyyəsi**: 20 qızıl.

---

## 🔊 Realist Səs Mühərriki

Web Audio API vasitəsilə sıfır gecikmə ilə sintezlənmiş:
- Daşların stola çırpılması və keramika çıqqıltısı
- "Telefon!" xal çalınması
- Qızıl sikkə səsləri
- "Pas" keçərkən stola tıqqıldatma səsi
- Qələbə fanfarları

---

## 📱 Android Tətbiqi Kimi Hazırlanması

Layihəyə **Capacitor Android** inteqrasiya olunmuşdur.

### Web versiyasını işə salmaq:
```bash
npm install
npm run dev
```

### Android APK hazırlamaq / Android Studio-da açmaq:
```bash
# 1. Web kodunu build edib Android-ə sinxronizasiya etmək:
npm run cap:sync

# 2. Android Studio-da açmaq:
npm run cap:open

# və ya birbaşa Android qovluğunda debug APK yığmaq:
cd android
./gradlew assembleDebug
```
APK faylı burada yaranacaq: `android/app/build/outputs/apk/debug/app-debug.apk`
