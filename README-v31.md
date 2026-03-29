# Bounty Radar v3.1

Bug bounty research tool dengan CVE hunting, exploits, audit findings, vulnerability patterns, dan **Intel Enrichment**.

## 🆕 New in v3.1: Exa Intel Enrichment

Setiap program bounty sekarang di-enrich dengan intel dari berbagai sumber:

| Intel Type | Source | Example |
|------------|--------|---------|
| 📚 **Writeups** | Medium, Mirror, blogs | "Uniswap vulnerability writeup" |
| 🐦 **Twitter** | Security researchers | @samczsun mentions |
| 📦 **GitHub PoCs** | Exploit repos | Proof of concept code |
| 📖 **DeFi Audits** | Code4rena, rekt.news | Audit findings |

### How it works

```
Daily Cron
    │
    ├── 1. Fetch HackerOne programs
    ├── 2. Fetch Immunefi programs
    ├── 3. Fetch CVEs, Exploits, Audits
    │
    ├── 4. 🔍 Exa Intel Enrichment   ← NEW
    │       ↓
    │   For each new program:
    │   • Search writeups
    │   • Search Twitter intel
    │   • Search GitHub PoCs
    │   • Search DeFi audits
    │
    └── 5. Generate digest & notify
```

### Sample Output

```json
{
  "intel": {
    "uniswap": {
      "writeups": [
        {
          "title": "Uniswap V3 Flash Loan Analysis",
          "url": "https://medium.com/...",
          "snippet": "Deep dive into..."
        }
      ],
      "twitter": [
        {
          "title": "@samczsun on Uniswap",
          "url": "https://twitter.com/..."
        }
      ],
      "github": [
        {
          "title": "uniswap-exploit-poc",
          "url": "https://github.com/..."
        }
      ],
      "total_results": 7,
      "enriched_at": "2026-03-29T..."
    }
  }
}
```

### Telegram Notification (Enhanced)

```
🔍 Bounty Radar v3.1 — Daily Update

📋 HackerOne: 150 reports
🛡️ Immunefi: 200 programs
🐙 GitHub: 50 repos

🎯 CVE Hunting: 25 opportunities
💀 Exploits: 10 ($2.5B loss)
📖 Audit Findings: 100
🔍 Intel: 30 enriched        ← NEW

💰 Top Bounties:
1. $50,000 — IDOR @ Company
2. $25,000 — RCE @ Startup

📊 https://xnotok-ops.github.io/bounty-radar
```

---

## Setup Exa API Key

1. **Get free API key**: https://exa.ai (1,000 requests/month free)

2. **Add to GitHub Secrets**:
   - Go to repo → Settings → Secrets → Actions
   - Add `EXA_API_KEY` with your key

3. **Done!** Intel enrichment will run automatically on next daily scan.

---

## Sources & Credits

| Component | Source | License |
|-----------|--------|---------|
| Exa Search API | https://exa.ai | Commercial (free tier) |
| Integration idea | [Agent-Reach](https://github.com/Panniantong/Agent-Reach) | MIT |
| Exa Docs | https://docs.exa.ai | - |
| Exa Pricing | https://exa.ai/pricing | - |

---

## Files Changed in v3.1

```
bounty-radar/
├── src/
│   ├── enrich-with-exa.js    # NEW - Intel enrichment
│   └── index.js              # UPDATED - Added step 11
├── .github/workflows/
│   └── daily.yml             # UPDATED - Added EXA_API_KEY
├── .env.example              # UPDATED - Added EXA_API_KEY
└── data/
    ├── bounty-data.json      # Now includes intel field
    └── exa-cache.json        # NEW - Cache to avoid redundant API calls
```

---

## Quota Management

| Scenario | Queries/Day | Monthly |
|----------|-------------|---------|
| 10 programs × 3 queries | 30 | ~900 |
| With cache (7-day TTL) | ~5-10 | ~150-300 |
| **Free tier limit** | — | **1,000** ✅ |

Cache ensures you stay within free tier even with 200+ programs.

---

by @xnotok
