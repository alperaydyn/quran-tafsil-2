# 04: CI/CD Pipeline Tasarımı (GitHub Actions)

GitHub Actions tabanlı sürekli entegrasyon ve dağıtım pipeline'larının tasarımı, branch stratejisi ve otomasyon akışları.

---

## 1. Branch Stratejisi

```
main ────────────────────────────────────── Prodüksiyon (canlı)
  │
  └── develop ───────────────────────────── Geliştirme (staging'e deploy)
        │
        ├── feature/reading-screen ──────── Özellik dalı
        ├── feature/memorization-studio ─── Özellik dalı
        ├── fix/audio-sync-bug ──────────── Hata düzeltme dalı
        └── hotfix/critical-api-fix ─────── Acil düzeltme (main'den dallanır)
```

| Branch | Tetikleyici | Deploy Hedefi | Otomatik? |
|---|---|---|---|
| `main` | Push / Merge | Prodüksiyon (VPS + EAS) | ✅ Evet |
| `develop` | Push / Merge | Staging (VPS) | ✅ Evet |
| `feature/*` | Pull Request | Yalnızca CI (lint + test) | ✅ Evet |
| `hotfix/*` | Pull Request → main | Prodüksiyon (acil) | ✅ Evet |

---

## 2. Pipeline Akışları

### 2.1 Backend CI/CD

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌───────────┐    ┌──────────┐
│  Push /   │───▶│   Lint   │───▶│   Test   │───▶│  SSH      │───▶│  Health  │
│  Merge    │    │ (ESLint) │    │ (Vitest) │    │  Deploy   │    │  Check   │
└──────────┘    └──────────┘    └──────────┘    └───────────┘    └──────────┘
                                                      │
                                              ┌───────┴───────┐
                                              │ git pull       │
                                              │ npm ci         │
                                              │ npm run migrate│
                                              │ pm2 reload     │
                                              └───────────────┘
```

**Workflow dosyası:** [.github/workflows/backend-deploy.yml](file:///Users/alperaydin/Projects/kuran-tafsil-net/.github/workflows/backend-deploy.yml)

**Tetikleyiciler:**
- `main` branch'e push → Prodüksiyon deploy
- `develop` branch'e push → Staging deploy
- Pull request → Yalnızca lint + test

---

### 2.2 Web CI/CD

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌───────────┐    ┌──────────┐
│  Push /   │───▶│   Lint   │───▶│   Test   │───▶│  SSH      │───▶│  Status  │
│  Merge    │    │ (ESLint) │    │ (Vitest) │    │  Deploy   │    │  Check   │
└──────────┘    └──────────┘    └──────────┘    └───────────┘    └──────────┘
                                                      │
                                              ┌───────┴───────┐
                                              │ git pull       │
                                              │ npm ci         │
                                              │ npm run build  │
                                              │ pm2 reload     │
                                              └───────────────┘
```

**Workflow dosyası:** [.github/workflows/web-deploy.yml](file:///Users/alperaydin/Projects/kuran-tafsil-net/.github/workflows/web-deploy.yml)

---

### 2.3 Mobile CI/CD

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌───────────┐    ┌──────────┐
│  Push /   │───▶│   Lint   │───▶│   Test   │───▶│ EAS Build │───▶│   EAS    │
│  Merge    │    │ (ESLint) │    │ (Jest)   │    │ (Cloud)   │    │  Submit  │
└──────────┘    └──────────┘    └──────────┘    └───────────┘    └──────────┘
```

**Workflow dosyası:** [.github/workflows/mobile-build.yml](file:///Users/alperaydin/Projects/kuran-tafsil-net/.github/workflows/mobile-build.yml)

**Tetikleyiciler:**
- `main` branch'e push (`tafsil-ios-app/` değişiklikleri) → Production build + submit
- `develop` branch'e push → Preview build
- Manuel tetikleme (workflow_dispatch) → İstenilen profil ile derleme

---

## 3. GitHub Secrets

Tüm hassas bilgiler GitHub repository secrets olarak saklanır:

| Secret Adı | Kullanım | Hangi Workflow |
|---|---|---|
| `VPS_HOST` | VPS IP adresi | Backend, Web |
| `VPS_USER` | SSH kullanıcı adı | Backend, Web |
| `VPS_SSH_KEY` | SSH özel anahtarı (PEM) | Backend, Web |
| `VPS_SSH_PORT` | SSH portu (22 veya özel) | Backend, Web |
| `EXPO_TOKEN` | EAS CLI kimlik doğrulama | Mobile |
| `SLACK_WEBHOOK_URL` | Deployment bildirim | Hepsi |
| `SENTRY_AUTH_TOKEN` | Sentry release tracking | Hepsi |

### Secret Ekleme (GitHub CLI)

```bash
# VPS SSH Key ekleme
gh secret set VPS_SSH_KEY < ~/.ssh/hostinger_deploy_key

# Expo Token ekleme
gh secret set EXPO_TOKEN --body "expo_token_value"

# Slack Webhook ekleme
gh secret set SLACK_WEBHOOK_URL --body "https://hooks.slack.com/services/..."
```

---

## 4. Deployment Bildirimleri

Her başarılı veya başarısız deployment sonrası Slack/Discord webhook ile bildirim gönderilir:

### Başarılı Deployment Bildirimi

```json
{
  "text": "✅ *Backend Deploy Başarılı*",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "✅ *Backend Deploy Başarılı*\n• Branch: `main`\n• Commit: `abc1234` - feat: add health check endpoint\n• Ortam: Prodüksiyon\n• Süre: 45s"
      }
    }
  ]
}
```

### Başarısız Deployment Bildirimi

```json
{
  "text": "❌ *Backend Deploy Başarısız*",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "❌ *Backend Deploy Başarısız*\n• Branch: `main`\n• Commit: `def5678`\n• Hata: Test aşamasında başarısız\n• <https://github.com/.../actions/runs/123|Detay>"
      }
    }
  ]
}
```

---

## 5. Path-Based Tetikleme (Monorepo Filtreleme)

Tüm bileşenler aynı repository'de olduğundan, her workflow yalnızca ilgili dizin değiştiğinde çalışır:

```yaml
# Backend workflow tetikleyicisi
on:
  push:
    paths:
      - 'backend/**'
      - '.github/workflows/backend-deploy.yml'

# Web workflow tetikleyicisi
on:
  push:
    paths:
      - 'tafsil-web-app/**'
      - '.github/workflows/web-deploy.yml'

# Mobile workflow tetikleyicisi
on:
  push:
    paths:
      - 'tafsil-ios-app/**'
      - '.github/workflows/mobile-build.yml'
```

---

## 6. Güvenlik Önlemleri

1. **Environment Protection Rules:** GitHub'da `production` environment tanımlanır; `main` branch'e deploy öncesi manuel onay (opsiyonel) gerektirebilir.
2. **Branch Protection:** `main` branch'e doğrudan push yasağı, PR zorunluluğu (opsiyonel, ekip büyüdüğünde aktifleştirilir).
3. **Secret Rotasyonu:** SSH anahtarları ve API token'ları 6 ayda bir yenilenir.
4. **Audit Log:** GitHub Actions çalıştırma geçmişi otomatik olarak saklanır.
