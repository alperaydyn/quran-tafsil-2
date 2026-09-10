# tafsil.net — Backend API & AI Services

Fastify (Node.js v20 LTS) tabanlı yüksek performanslı REST API, PostgreSQL 16+ (pgvector), Redis önbellek ve OpenRouter Agentic RAG servisleri.

## Detaylı Geliştirici & Ajan Kılavuzu
Backend geliştirme talimatları ve mimari şartname için bkz:
👉 **[docs/agents/02-BACKEND-AGENT.md](file:///Users/alperaydin/Projects/kuran-tafsil-net/docs/agents/02-BACKEND-AGENT.md)**
👉 **[docs/agents/00-MASTER-BLUEPRINT.md](file:///Users/alperaydin/Projects/kuran-tafsil-net/docs/agents/00-MASTER-BLUEPRINT.md)**

## Hızlı Başlangıç
```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev
```

## Temel Sorumluluklar
- Kur'an ve meal REST endpoint'leri
- pgvector HNSW hibrit semantik arama
- OpenRouter LLM orkestrasyonu (Agentic RAG & Streaming)
- BullMQ + Redis ile SM-2 aralıklı tekrar kuyrukları ve APNs/FCM bildirimleri
