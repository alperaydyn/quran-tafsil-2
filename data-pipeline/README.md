# tafsil.net — Data Pipeline & Lexicon Engine

Kur'an metninin açık kaynaklardan (Tanzil, Quran.com, Quranic Arabic Corpus) çekilmesi, normalleştirilmesi, morfolojik köklerin ayrıştırılması, kavram etiketlemesi ve ses zaman damgalarının üretilmesini sağlayan veri hazırlık katmanı.

## Detaylı Geliştirici & Ajan Kılavuzu
Veri hazırlığı talimatları ve seed şemaları için bkz:
👉 **[docs/agents/01-DATA-PIPELINE-AGENT.md](file:///Users/alperaydin/Projects/kuran-tafsil-net/docs/agents/01-DATA-PIPELINE-AGENT.md)**
👉 **[docs/agents/00-MASTER-BLUEPRINT.md](file:///Users/alperaydin/Projects/kuran-tafsil-net/docs/agents/00-MASTER-BLUEPRINT.md)**

## Dizin Yapısı
- `scripts/`: ETL, kök haritalama, ses alignment ve seed betikleri
- `schema/`: JSON doğrulama şemaları
- `seed/`: PostgreSQL aktarımına hazır normalleştirilmiş veri setleri
