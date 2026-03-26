/**
 * Bounty Radar v3 - Fetch DeFiHackLabs Exploits (Fixed)
 * Source: github.com/SunWeb3Sec/DeFiHackLabs
 */

const README_URL = "https://raw.githubusercontent.com/SunWeb3Sec/DeFiHackLabs/main/README.md";

const CATEGORY_PATTERNS = [
  { pattern: /reentrancy/i, category: "Reentrancy" },
  { pattern: /flash\s*loan/i, category: "Flash Loan" },
  { pattern: /oracle|price\s*manipul/i, category: "Oracle Manipulation" },
  { pattern: /access\s*control|privilege|admin/i, category: "Access Control" },
  { pattern: /overflow|underflow/i, category: "Integer Overflow" },
  { pattern: /signature|replay/i, category: "Signature Issue" },
  { pattern: /front\s*run|sandwich|mev/i, category: "MEV/Frontrun" },
  { pattern: /logic|business/i, category: "Business Logic" },
  { pattern: /rugpull|rug\s*pull|exit\s*scam/i, category: "Rug Pull" },
  { pattern: /phishing/i, category: "Phishing" },
  { pattern: /bridge/i, category: "Bridge Exploit" },
  { pattern: /governance|voting/i, category: "Governance" },
  { pattern: /token|erc20|erc721/i, category: "Token Issue" },
  { pattern: /lending|borrow/i, category: "Lending" },
  { pattern: /dex|swap|amm/i, category: "DEX" },
];

function detectCategory(text) {
  for (const { pattern, category } of CATEGORY_PATTERNS) {
    if (pattern.test(text)) {
      return category;
    }
  }
  return "Other";
}

function parseLossAmount(raw) {
  if (!raw) return 0;
  
  const cleaned = raw.replace(/[$,~\s]/g, "").trim().toUpperCase();
  
  let multiplier = 1;
  let numStr = cleaned;
  
  if (cleaned.endsWith("B")) {
    multiplier = 1000000000;
    numStr = cleaned.slice(0, -1);
  } else if (cleaned.endsWith("M")) {
    multiplier = 1000000;
    numStr = cleaned.slice(0, -1);
  } else if (cleaned.endsWith("K")) {
    multiplier = 1000;
    numStr = cleaned.slice(0, -1);
  }
  
  const num = parseFloat(numStr);
  return isNaN(num) ? 0 : Math.round(num * multiplier);
}

async function fetchDeFiHackLabsExploits() {
  console.log("💀 Fetching DeFiHackLabs exploits...");
  
  const exploits = [];
  
  try {
    const res = await fetch(README_URL);
    if (!res.ok) {
      console.error(`  DeFiHackLabs error: ${res.status}`);
      return { exploits: [], stats: {} };
    }
    
    const markdown = await res.text();
    const lines = markdown.split("\n");
    
    for (const line of lines) {
      // Multiple patterns to catch different formats
      
      // Pattern 1: [20230313] [Protocol] - $XXM - Description
      // Pattern 2: **20230313** Protocol ...
      // Pattern 3: Table row with | separators
      
      let exploit = null;
      
      // Try: [YYYYMMDD] [Protocol Name] ... $XXX
      const bracketMatch = line.match(/\[(\d{8})\]\s*\[([^\]]+)\][^\$]*\$\s*([\d,.]+\s*[KMB]?)/i);
      if (bracketMatch) {
        const dateStr = bracketMatch[1];
        exploit = {
          date: `${dateStr.slice(0,4)}-${dateStr.slice(4,6)}-${dateStr.slice(6,8)}`,
          year: parseInt(dateStr.slice(0,4)),
          protocol: bracketMatch[2].trim(),
          loss_raw: `$${bracketMatch[3].trim()}`,
          loss_usd: parseLossAmount(bracketMatch[3]),
          description: line,
          category: detectCategory(line),
        };
      }
      
      // Try: **YYYYMMDD** or ### YYYYMMDD with protocol and loss
      if (!exploit) {
        const boldMatch = line.match(/\*{0,2}(\d{8})\*{0,2}[^\$]*([A-Za-z][A-Za-z0-9\s]+)[^\$]*\$\s*([\d,.]+\s*[KMB]?)/i);
        if (boldMatch) {
          const dateStr = boldMatch[1];
          exploit = {
            date: `${dateStr.slice(0,4)}-${dateStr.slice(4,6)}-${dateStr.slice(6,8)}`,
            year: parseInt(dateStr.slice(0,4)),
            protocol: boldMatch[2].trim().split(/\s+/).slice(0,3).join(" "),
            loss_raw: `$${boldMatch[3].trim()}`,
            loss_usd: parseLossAmount(boldMatch[3]),
            description: line,
            category: detectCategory(line),
          };
        }
      }
      
      // Try: Table format | Date | Protocol | Loss | ... |
      if (!exploit && line.includes("|") && /\d{8}/.test(line)) {
        const parts = line.split("|").map(p => p.trim()).filter(p => p);
        if (parts.length >= 3) {
          const dateMatch = parts[0].match(/(\d{8})/);
          const lossMatch = line.match(/\$\s*([\d,.]+\s*[KMB]?)/i);
          if (dateMatch && lossMatch) {
            const dateStr = dateMatch[1];
            exploit = {
              date: `${dateStr.slice(0,4)}-${dateStr.slice(4,6)}-${dateStr.slice(6,8)}`,
              year: parseInt(dateStr.slice(0,4)),
              protocol: parts[1] || "Unknown",
              loss_raw: `$${lossMatch[1].trim()}`,
              loss_usd: parseLossAmount(lossMatch[1]),
              description: parts.slice(2).join(" - "),
              category: detectCategory(line),
            };
          }
        }
      }
      
      // Try: Simple line with date and dollar amount
      if (!exploit) {
        const simpleMatch = line.match(/(\d{4})[-\/]?(\d{2})[-\/]?(\d{2})[^\$]+([A-Za-z][A-Za-z0-9\s]{2,30})[^\$]*\$\s*([\d,.]+\s*[KMB]?)/i);
        if (simpleMatch) {
          exploit = {
            date: `${simpleMatch[1]}-${simpleMatch[2]}-${simpleMatch[3]}`,
            year: parseInt(simpleMatch[1]),
            protocol: simpleMatch[4].trim(),
            loss_raw: `$${simpleMatch[5].trim()}`,
            loss_usd: parseLossAmount(simpleMatch[5]),
            description: line,
            category: detectCategory(line),
          };
        }
      }
      
      // Add if valid
      if (exploit && exploit.protocol && exploit.protocol.length > 1 && exploit.loss_usd > 0) {
        // Extract PoC link if present
        const pocMatch = line.match(/\[.*?\]\((https?:\/\/[^\)]+)\)/);
        if (pocMatch) {
          exploit.poc_url = pocMatch[1];
        }
        exploits.push(exploit);
      }
    }
    
    // Also try to get from the curated list
    if (exploits.length < 10) {
      exploits.push(...getCuratedExploits());
    }
    
    // Deduplicate by protocol+date
    const seen = new Set();
    const unique = exploits.filter(e => {
      const key = `${e.protocol}-${e.date}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    
    // Sort by date (newest first)
    unique.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    
    // Stats
    const totalLoss = unique.reduce((sum, e) => sum + e.loss_usd, 0);
    const categories = {};
    unique.forEach(e => {
      categories[e.category] = (categories[e.category] || 0) + 1;
    });
    
    const byYear = {};
    unique.forEach(e => {
      const y = e.year || "Unknown";
      if (!byYear[y]) byYear[y] = { count: 0, loss: 0 };
      byYear[y].count++;
      byYear[y].loss += e.loss_usd;
    });
    
    console.log(`  ✅ Found ${unique.length} exploits`);
    console.log(`  💰 Total loss: $${(totalLoss / 1e9).toFixed(2)}B`);
    
    return {
      exploits: unique,
      stats: {
        total: unique.length,
        total_loss_usd: totalLoss,
        by_category: categories,
        by_year: byYear,
      },
    };
    
  } catch (err) {
    console.error(`  DeFiHackLabs fetch error: ${err.message}`);
    // Return curated as fallback
    const curated = getCuratedExploits();
    const totalLoss = curated.reduce((sum, e) => sum + e.loss_usd, 0);
    return { 
      exploits: curated, 
      stats: { 
        total: curated.length, 
        total_loss_usd: totalLoss,
        by_category: {},
        by_year: {},
      } 
    };
  }
}

function getCuratedExploits() {
  // High-profile exploits as fallback/bootstrap
  return [
    { date: "2024-02-09", year: 2024, protocol: "PlayDapp", loss_raw: "$290M", loss_usd: 290000000, category: "Access Control", description: "Private key compromise, minted tokens" },
    { date: "2024-01-30", year: 2024, protocol: "Abracadabra", loss_raw: "$6.5M", loss_usd: 6500000, category: "Oracle Manipulation", description: "MIM stablecoin depegging exploit" },
    { date: "2023-11-22", year: 2023, protocol: "KyberSwap", loss_raw: "$48M", loss_usd: 48000000, category: "Business Logic", description: "Elastic pool tick manipulation" },
    { date: "2023-10-11", year: 2023, protocol: "Stars Arena", loss_raw: "$3M", loss_usd: 3000000, category: "Reentrancy", description: "Reentrancy in sell shares" },
    { date: "2023-09-12", year: 2023, protocol: "CoinEx", loss_raw: "$70M", loss_usd: 70000000, category: "Access Control", description: "Hot wallet compromise" },
    { date: "2023-07-30", year: 2023, protocol: "Curve Finance", loss_raw: "$70M", loss_usd: 70000000, category: "Reentrancy", description: "Vyper compiler reentrancy bug" },
    { date: "2023-06-03", year: 2023, protocol: "Atomic Wallet", loss_raw: "$100M", loss_usd: 100000000, category: "Access Control", description: "Private key compromise" },
    { date: "2023-04-13", year: 2023, protocol: "Yearn Finance", loss_raw: "$11M", loss_usd: 11000000, category: "Business Logic", description: "yUSDT misconfiguration" },
    { date: "2023-03-13", year: 2023, protocol: "Euler Finance", loss_raw: "$197M", loss_usd: 197000000, category: "Flash Loan", description: "Donate function + flash loan" },
    { date: "2023-02-03", year: 2023, protocol: "Orion Protocol", loss_raw: "$3M", loss_usd: 3000000, category: "Reentrancy", description: "depositAsset reentrancy" },
    { date: "2022-10-11", year: 2022, protocol: "Mango Markets", loss_raw: "$114M", loss_usd: 114000000, category: "Oracle Manipulation", description: "Price oracle manipulation" },
    { date: "2022-10-06", year: 2022, protocol: "BNB Bridge", loss_raw: "$570M", loss_usd: 570000000, category: "Bridge Exploit", description: "Proof verification bypass" },
    { date: "2022-08-02", year: 2022, protocol: "Nomad Bridge", loss_raw: "$190M", loss_usd: 190000000, category: "Bridge Exploit", description: "Message verification flaw" },
    { date: "2022-06-24", year: 2022, protocol: "Harmony Bridge", loss_raw: "$100M", loss_usd: 100000000, category: "Bridge Exploit", description: "Multisig key compromise" },
    { date: "2022-04-17", year: 2022, protocol: "Beanstalk", loss_raw: "$182M", loss_usd: 182000000, category: "Governance", description: "Flash loan governance attack" },
    { date: "2022-03-29", year: 2022, protocol: "Ronin Bridge", loss_raw: "$624M", loss_usd: 624000000, category: "Access Control", description: "Validator key compromise" },
    { date: "2022-02-02", year: 2022, protocol: "Wormhole", loss_raw: "$320M", loss_usd: 320000000, category: "Bridge Exploit", description: "Signature verification bypass" },
    { date: "2021-12-02", year: 2021, protocol: "BadgerDAO", loss_raw: "$120M", loss_usd: 120000000, category: "Access Control", description: "Frontend compromise, approval drain" },
    { date: "2021-10-27", year: 2021, protocol: "Cream Finance", loss_raw: "$130M", loss_usd: 130000000, category: "Flash Loan", description: "Oracle manipulation + flash loan" },
    { date: "2021-08-10", year: 2021, protocol: "Poly Network", loss_raw: "$611M", loss_usd: 611000000, category: "Access Control", description: "Cross-chain message spoofing" },
  ];
}

module.exports = { fetchDeFiHackLabsExploits, detectCategory };