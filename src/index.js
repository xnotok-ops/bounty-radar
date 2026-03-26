/**
 * Bounty Radar v3 - Main Entry Point
 * Bug bounty research tool with CVE hunting, exploits, audit findings, vuln patterns
 */

const fs = require("fs");
const path = require("path");
const { fetchHackerOneReports } = require("./fetch-hackerone");
const { fetchImmunefiPrograms } = require("./fetch-immunefi");
const { fetchGitHubBountyRepos } = require("./fetch-github");
const { fetchH1Programs } = require("./fetch-h1-programs");
const { fetchCVEHuntingFeed } = require("./fetch-cve-hunting");
const { fetchDeFiHackLabsExploits } = require("./fetch-defihacklabs");
const { fetchSoloditFindings } = require("./fetch-solodit");
const { sendTelegram } = require("./telegram");

async function main() {
  console.log("🔐 Bounty Radar v3 — Starting daily scan...\n");
  const startTime = Date.now();

  const token = process.env.GITHUB_TOKEN || null;
  const soloditKey = process.env.SOLODIT_API_KEY || null;

  // 1. Fetch HackerOne disclosed reports
  console.log("📋 Fetching HackerOne disclosed reports...");
  const h1Reports = await fetchHackerOneReports();

  // 2. Fetch HackerOne program status
  console.log("\n📋 Fetching HackerOne program status...");
  const h1Programs = await fetchH1Programs();

  // 3. Fetch Immunefi active programs
  console.log("\n🛡️ Fetching Immunefi active programs...");
  const immunefiPrograms = await fetchImmunefiPrograms();

  // 4. Fetch GitHub bounty repos
  console.log("\n🐙 Fetching GitHub bounty repos...");
  const githubRepos = await fetchGitHubBountyRepos(token);

  // 5. Load manual tech mapping
  const techMapPath = path.join(__dirname, "..", "data", "program-tech-map.json");
  let manualTechMap = { programs: [] };
  if (fs.existsSync(techMapPath)) {
    manualTechMap = JSON.parse(fs.readFileSync(techMapPath, "utf-8"));
    console.log(`\n📁 Loaded ${manualTechMap.programs.length} programs from tech map`);
  }

  // 6. Merge programs for CVE matching
  const allPrograms = mergePrograms(h1Programs.programs, immunefiPrograms, manualTechMap.programs);
  console.log(`🔗 Merged ${allPrograms.length} total programs`);

  // 7. Fetch CVE Hunting Feed
  console.log("\n🎯 Fetching CVE Hunting Feed...");
  const cveHunting = await fetchCVEHuntingFeed(allPrograms, 7);

  // 8. Fetch DeFiHackLabs Exploits (NEW)
  console.log("\n💀 Fetching DeFiHackLabs exploits...");
  const exploits = await fetchDeFiHackLabsExploits();

  // 9. Fetch Solodit Audit Findings (NEW)
  console.log("\n📚 Fetching Solodit audit findings...");
  const auditFindings = await fetchSoloditFindings(soloditKey, 3);

  // 10. Load Vulnerability Patterns (NEW)
  const patternsPath = path.join(__dirname, "..", "data", "vuln-patterns.json");
  let vulnPatterns = { patterns: [] };
  if (fs.existsSync(patternsPath)) {
    vulnPatterns = JSON.parse(fs.readFileSync(patternsPath, "utf-8"));
    console.log(`\n📋 Loaded ${vulnPatterns.patterns.length} vulnerability patterns`);
  }

  // 11. Save data
  const dataDir = path.join(__dirname, "..", "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const data = {
    version: 3,
    updated_at: new Date().toISOString(),
    hackerone: {
      total: h1Reports.length,
      reports: h1Reports,
    },
    h1_programs: {
      total: h1Programs.programs.length,
      stats: h1Programs.stats,
      programs: h1Programs.programs,
    },
    immunefi: {
      total: immunefiPrograms.length,
      programs: immunefiPrograms,
    },
    github: {
      total: githubRepos.length,
      repos: githubRepos,
    },
    cve_hunting: cveHunting,
    exploits: {
      total: exploits.exploits?.length || 0,
      stats: exploits.stats || {},
      data: exploits.exploits || [],
    },
    audit_findings: {
      total: auditFindings.findings?.length || 0,
      stats: auditFindings.stats || {},
      data: auditFindings.findings || [],
    },
    vuln_patterns: {
      total: vulnPatterns.patterns?.length || 0,
      data: vulnPatterns.patterns || [],
    },
    all_programs: {
      total: allPrograms.length,
      active: allPrograms.filter(p => p.status === "active").length,
      paused: allPrograms.filter(p => p.status === "paused").length,
      closed: allPrograms.filter(p => p.status === "closed").length,
      programs: allPrograms,
    },
  };

  const dataPath = path.join(dataDir, "bounty-data.json");
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf-8");
  console.log(`\n💾 Data saved: ${dataPath}`);

  // 12. Stats
  const stats = {
    h1Reports: h1Reports.length,
    h1Programs: h1Programs.stats,
    immunefi: immunefiPrograms.length,
    github: githubRepos.length,
    cveHunting: cveHunting.stats,
    totalOpportunities: cveHunting.total_opportunities,
    exploits: exploits.exploits?.length || 0,
    exploitLoss: exploits.stats?.total_loss_usd || 0,
    auditFindings: auditFindings.findings?.length || 0,
    vulnPatterns: vulnPatterns.patterns?.length || 0,
    topPaid: h1Reports.filter(r => r.bounty > 0).sort((a, b) => b.bounty - a.bounty).slice(0, 5),
    topImmunefi: immunefiPrograms.sort((a, b) => b.max_bounty - a.max_bounty).slice(0, 5),
    topExploits: (exploits.exploits || []).slice(0, 5),
  };

  console.log(`\n📊 Stats:`);
  console.log(`  HackerOne reports: ${stats.h1Reports}`);
  console.log(`  HackerOne programs: ${stats.h1Programs.total} (Active: ${stats.h1Programs.active})`);
  console.log(`  Immunefi programs: ${stats.immunefi}`);
  console.log(`  GitHub repos: ${stats.github}`);
  console.log(`  CVE Hunting: ${stats.totalOpportunities} opportunities`);
  console.log(`  DeFiHackLabs: ${stats.exploits} exploits ($${(stats.exploitLoss / 1e9).toFixed(2)}B total loss)`);
  console.log(`  Audit Findings: ${stats.auditFindings}`);
  console.log(`  Vuln Patterns: ${stats.vulnPatterns}`);

  // 13. Telegram notification
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (botToken && chatId) {
    const msg = generateTelegramMsg(stats);
    await sendTelegram(msg, botToken, chatId);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n🏁 Done in ${elapsed}s`);
}

function mergePrograms(h1Programs, immunefiPrograms, manualPrograms) {
  const programMap = new Map();

  // Add manual programs first (highest priority for tech data)
  for (const p of manualPrograms) {
    const key = p.handle || p.name.toLowerCase().replace(/\s+/g, "-");
    programMap.set(key, {
      ...p,
      technologies: Array.isArray(p.technologies) ? p.technologies.join(", ") : p.technologies,
    });
  }

  // Add H1 programs
  for (const p of h1Programs) {
    const key = p.handle || p.name.toLowerCase().replace(/\s+/g, "-");
    if (!programMap.has(key)) {
      programMap.set(key, p);
    } else {
      const existing = programMap.get(key);
      programMap.set(key, {
        ...existing,
        status: p.status || existing.status,
        last_synced: p.last_synced || existing.last_synced,
      });
    }
  }

  // Add Immunefi programs
  for (const p of immunefiPrograms) {
    const key = p.id || p.name.toLowerCase().replace(/\s+/g, "-");
    if (!programMap.has(key)) {
      programMap.set(key, {
        name: p.name,
        handle: p.id,
        platform: "immunefi",
        status: "active",
        technologies: p.technologies || "",
        bounty_max: p.max_bounty || 0,
        url: p.url,
      });
    }
  }

  return Array.from(programMap.values());
}

function generateTelegramMsg(stats) {
  let msg = `🔐 <b>Bounty Radar v3 — Daily Update</b>\n\n`;

  msg += `📋 <b>HackerOne:</b> ${stats.h1Reports} reports\n`;
  msg += `🛡️ <b>Immunefi:</b> ${stats.immunefi} programs\n`;
  msg += `🐙 <b>GitHub:</b> ${stats.github} repos\n\n`;

  // New sections
  msg += `🎯 <b>CVE Hunting:</b> ${stats.totalOpportunities} opportunities\n`;
  msg += `💀 <b>Exploits:</b> ${stats.exploits} ($${(stats.exploitLoss / 1e9).toFixed(2)}B loss)\n`;
  msg += `📚 <b>Audit Findings:</b> ${stats.auditFindings}\n`;
  msg += `📋 <b>Patterns:</b> ${stats.vulnPatterns}\n\n`;

  if (stats.topExploits && stats.topExploits.length > 0) {
    msg += `💀 <b>Recent Exploits:</b>\n`;
    stats.topExploits.slice(0, 3).forEach((e, i) => {
      const loss = e.loss_usd ? `$${(e.loss_usd / 1e6).toFixed(1)}M` : e.loss_raw || "?";
      msg += `${i + 1}. ${loss} — ${e.protocol} (${e.category})\n`;
    });
    msg += `\n`;
  }

  if (stats.topPaid && stats.topPaid.length > 0) {
    msg += `💰 <b>Top Bounties:</b>\n`;
    stats.topPaid.slice(0, 3).forEach((r, i) => {
      msg += `${i + 1}. $${r.bounty.toLocaleString()} — ${r.bug_type} @ ${r.program}\n`;
    });
    msg += `\n`;
  }

  msg += `📄 https://xnotok-ops.github.io/bounty-radar`;
  msg += `\n\n<i>by @xnotok</i>`;
  return msg;
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});