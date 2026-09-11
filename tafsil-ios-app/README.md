# tafsil.net — Mobile Application (React Native / Expo)

iOS öncelikli native mobil uygulama. Offline-first mimari, kelime senkron sesli okuma, 3 kademeli etkileşimli ezber stüdyosu ve yönlü çevrimsiz kavram ağı (DAG Explorer).

## Detaylı Geliştirici & Ajan Kılavuzu
Mobil geliştirme şartnamesi için bkz:
👉 **[docs/agents/03-MOBILE-APP-AGENT.md](file:///Users/alperaydin/Projects/kuran-tafsil-net/docs/agents/03-MOBILE-APP-AGENT.md)**
👉 **[docs/agents/00-MASTER-BLUEPRINT.md](file:///Users/alperaydin/Projects/kuran-tafsil-net/docs/agents/00-MASTER-BLUEPRINT.md)**

## Tasarım Kaynağı (Source of Truth)
Arayüz tasarımı, tipografi, renkler ve ekran akışları için referans prototip:
👉 **`design/project/Tafsil.dc.html`**

## Temel Özellikler
- 3 Dinamik Arayüz Modu: Keşif, Öğrenme, Odak
- Senkron Ses Vurgulama (Karaoke Highlight): Arapça tilavet + Türkçe sesli meal
- Etkileşimli Ezber Stüdyosu: Akordeon akışı ve Apple SFSpeechRecognizer on-device STT ile sesli okurken kelime belirme (reveal-on-recite)
- Çevrimdışı Veritabanı: WatermelonDB / Yerel SQLite

## Geliştirme

```bash
cd tafsil-ios-app
npm install
npx expo start
# 'i' iOS Simulator, 'a' Android Emulator, 'w' web önizleme
```

Doğrulama:
```bash
npx tsc --noEmit      # tip kontrolü
npx expo-doctor       # yapılandırma sağlık kontrolü
```

## Durum (Phase 1)

- ✅ Expo SDK 57 + TypeScript, React Navigation (native-stack + bottom-tabs)
- ✅ Tasarım token sistemi (`src/theme/`) — 3 renk teması (ceviz/lacivert/mor) × açık/koyu, Newsreader/Instrument Sans/Amiri
- ✅ Zustand store'ları + MMKV kalıcılık (`src/store/`)
- ✅ 3-Kademeli Mod Motoru — Keşif/Öğrenme/Odak (`src/hooks/useReadingMode.ts`)
- ✅ Onboarding akışı (3 tanıtım + mod seçimi)
- ✅ Sure listesi ve okuma ekranı — **mock veriyle** (`src/api/client.ts`), gerçek API `docs/agent-signals/agent-02.status.json`'da BE-001/BE-010/BE-004/BE-007 tamamlandığında bağlanacak
- ⏳ Sırada: MOB-011 (Apple/Google Sign-In), ardından P1 kapsamı (offline DB, ses senkron, ezber stüdyosu, DAG)

Ajanlar arası durum: [`docs/agent-signals/agent-03.status.json`](file:///Users/alperaydin/Projects/kuran-tafsil-net/docs/agent-signals/agent-03.status.json)
