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
