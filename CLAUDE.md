# CLAUDE.md

See [AGENTS.md](file:///Users/alperaydin/Projects/kuran-tafsil-net/AGENTS.md) for master architecture, agent roles, conventions, and operational guidelines.

## Quick Reference for Claude:
- **Project Goal:** Quran reading, lexical concept analysis, and memorization app (tafsil.net).
- **Master Guidelines:** Read [AGENTS.md](file:///Users/alperaydin/Projects/kuran-tafsil-net/AGENTS.md) first.
- **Detailed Agent Recipes:** See [docs/agents/](file:///Users/alperaydin/Projects/kuran-tafsil-net/docs/agents/)
  - `00-MASTER-BLUEPRINT.md`: Full architecture, data contracts & DB schema
  - `01-DATA-PIPELINE-AGENT.md`: Data normalization, roots, lexicon, Tanzil
  - `02-BACKEND-AGENT.md`: Node.js/Fastify, PostgreSQL 16+, pgvector, Redis, OpenRouter
  - `03-MOBILE-APP-AGENT.md`: Expo/React Native, iOS-first, Tafsil.dc.html design, Audio sync, STT
  - `04-WEB-APP-AGENT.md`: Next.js / Web reader & OG share cards
  - `05-CONTENT-EDITORIAL-AGENT.md`: Editorial research, tafsir verification
- **Design Source of Truth:** `tafsil-ios-app/design/project/Tafsil.dc.html`
