# 🔐 Bounty Radar

Bug bounty research tool — search HackerOne disclosed reports, Immunefi Web3 programs, and GitHub security resources. Searchable web UI with daily auto-updates via GitHub Actions.

## Features

- **Searchable Web UI** — Search and filter disclosed bug reports by keyword, bug type, program, bounty amount
- **3 Data Sources** — HackerOne, Immunefi (Web3/DeFi), GitHub security repos
- **Daily Auto-Sync** — GitHub Actions updates data every day
- **Telegram Notifications** — Get daily summary of top bounties
- **Bug Type Filtering** — XSS, IDOR, SSRF, RCE, SQLi, CSRF, XXE, and more
- **Sort & Browse** — Sort by bounty amount, upvotes, or program name

## Data Sources

| Source | What | Data |
|--------|------|------|
| 📋 HackerOne | Disclosed bug reports | Bug type, program, bounty, upvotes |
| 🛡️ Immunefi | Active Web3/DeFi bounty programs | Max bounty, assets in scope |
| 🐙 GitHub | Bug bounty tools, writeups, resources | Stars, language, description |

## Project Structure

    bounty-radar/
    ├── .github/workflows/
    │   └── daily-sync.yml
    ├── src/
    │   ├── index.js
    │   ├── fetch-hackerone.js
    │   ├── fetch-immunefi.js
    │   ├── fetch-github.js
    │   ├── build-ui.js
    │   └── telegram.js
    ├── data/
    │   └── bounty-data.json
    ├── docs/
    │   └── index.html
    ├── package.json
    ├── .gitignore
    └── README.md

## Related

- [GitHub Radar](https://github.com/xnotok-ops/github-radar) — Daily trending repos digest
- [HF Radar](https://github.com/xnotok-ops/hf-radar) — Daily trending AI models digest

---

**Built by [@xnotok](https://x.com/xnotok)** | [github.com/xnotok-ops](https://github.com/xnotok-ops)
