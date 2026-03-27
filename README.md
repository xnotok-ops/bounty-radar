# 🔐 Bounty Radar

[![GitHub stars](https://img.shields.io/github/stars/xnotok-ops/bounty-radar?style=social)](https://github.com/xnotok-ops/bounty-radar/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://xnotok-ops.github.io/bounty-radar)

**Interactive bug bounty research dashboard** — CVE hunting, DeFi exploits, audit findings, and vulnerability patterns in one place.

🌐 **Live Demo:** [https://xnotok-ops.github.io/bounty-radar](https://xnotok-ops.github.io/bounty-radar)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎯 **CVE Hunting** | Match recent CVEs to bug bounty programs by tech stack |
| 💀 **DeFi Exploits** | Real exploits from DeFiHackLabs ($3.76B+ total loss) |
| 📚 **Audit Findings** | Curated findings from top auditors (Trail of Bits, OpenZeppelin, etc.) |
| 📋 **Vuln Patterns** | 25 vulnerability patterns with code examples |
| 📊 **HackerOne** | 4,700+ disclosed reports with bounty amounts |
| 🛡️ **Immunefi** | 279 Web3 bug bounty programs |
| 🔗 **All Programs** | 518 merged programs from multiple platforms |

---

## 🚀 Quick Start
```bash
# Clone the repo
git clone https://github.com/xnotok-ops/bounty-radar.git
cd bounty-radar

# Install dependencies
npm install

# Fetch latest data
npm start

# Build the UI
node src/build-ui.js

# Open docs/index.html in browser
```

---

## 📊 Data Sources

| Source | Type | Update |
|--------|------|--------|
| [NVD](https://nvd.nist.gov/) | CVE database | Daily |
| [HackerOne](https://hackerone.com/hacktivity) | Disclosed reports | Daily |
| [Immunefi](https://immunefi.com/) | Web3 programs | Daily |
| [DeFiHackLabs](https://github.com/SunWeb3Sec/DeFiHackLabs) | Real exploits + PoC | Daily |
| [Solodit](https://solodit.xyz/) | Audit findings | Daily |

---

## 🔍 Use Cases

### For Bug Hunters
```
1. Check CVE Hunting tab → Find CVEs affecting target's tech stack
2. Browse Exploits → Learn attack patterns from real hacks
3. Study Vuln Patterns → Checklist for code review
4. Submit to HackerOne/Immunefi → Get paid 💰
```

### For Security Researchers
```
1. Track DeFi exploits → $3.76B+ in losses documented
2. Study audit findings → Learn from pro auditors
3. Cross-reference patterns → Find similar bugs
```

---

## 📁 Project Structure
```
bounty-radar/
├── src/
│   ├── index.js              # Main data fetcher
│   ├── build-ui.js           # Web UI generator
│   ├── fetch-hackerone.js    # HackerOne reports
│   ├── fetch-immunefi.js     # Immunefi programs
│   ├── fetch-cve-hunting.js  # CVE → Program matching
│   ├── fetch-defihacklabs.js # DeFi exploits
│   └── fetch-solodit.js      # Audit findings
├── data/
│   ├── bounty-data.json      # All fetched data
│   ├── vuln-patterns.json    # 25 vulnerability patterns
│   └── program-tech-map.json # Tech stack mapping
├── docs/
│   ├── index.html            # Web UI
│   └── data.js               # UI data
└── .github/
    └── workflows/
        └── daily-sync.yml    # Auto-update daily
```

---

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Data:** JSON, REST APIs
- **UI:** Vanilla HTML/CSS/JS
- **Hosting:** GitHub Pages
- **CI/CD:** GitHub Actions

---

## 📈 Stats

| Metric | Count |
|--------|-------|
| CVE Opportunities | 50+ |
| DeFi Exploits | 20 ($3.76B) |
| Audit Findings | 30 |
| Vuln Patterns | 25 |
| HackerOne Reports | 4,705 |
| Immunefi Programs | 279 |
| Total Programs | 518 |

---

## 🤝 Contributing

Contributions welcome! Feel free to:
- Add new data sources
- Improve vulnerability patterns
- Enhance the UI
- Fix bugs

---

## 📄 License

MIT License - feel free to use for your own research!

---

## ⭐ Star History

If this tool helps your bug hunting, consider giving it a star! ⭐

---

**Built with ☕ by [@xnotok](https://twitter.com/xnotok)**