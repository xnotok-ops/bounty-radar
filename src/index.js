/**
 * Bounty Radar v3.2 - Main Entry Point
 * Bug bounty research tool with CVE hunting, exploits, audit findings, vuln patterns
 * 
 * NEW in v3.2: Git Intel Scanner (Carlini-inspired)
 * - Scan target repos for security-related commits
 * - Find partial fixes and variant bugs
 * - Identify hot files with frequent security changes
 * - Extract past CVE patterns
 * 
 * Source: Nicholas Carlini - "Black-hat LLMs" @ [un]prompted 2026
 * https://red.anthropic.com/2026/zero-days/
 * 
 * v3.1: Exa Intel Enrichment
 * - Writeups related to each program
 * - Twitter mentions from security researchers
 * - GitHub PoCs
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
const { enrichWithExa } = require("./enrich-with-exa");
const { scanRepo, generateAuditTargets } = require("./git-intel");
const { sendTelegram } = require("./telegram");

const DATA_FILE = path.join(__dirname, "..", "data", "bounty-data.json");
const GIT_INTEL_FILE = path.join(__dirname, "..", "data", "git-intel.json");

async function main() {
  console.log("🔍 Bounty Radar v3.2 — Starting daily scan...\n");
  const startTime = Date.now();

  const token = process.env.GITHUB_TOKEN || null;
  const soloditKey = process.env.SOLODIT_API_KEY || null;
  const exaKey = process.env.EXA_API_KEY || null;
  const gitIntelTargets = process.env.GIT_INTEL_TARGETS || null; // Comma-separated repo URLs

  // ============================================
  // PHASE 1: Fetch Data Sources
  // ============================================

  // 1. Fetch HackerOne disclosed reports
  console.log("📋 [1/12] Fetching HackerOne disclosed reports...");
  const h1Reports = await fetchHackerOneReports();

  // 2. Fetch HackerOne program status
  console.log("\n📋 [2/12] Fetching HackerOne program status...");
  const h1Programs = await fetchH1Programs();

  // 3. Fetch Immunefi active programs
  console.log("\n🛡️ [3/12] Fetching Immunefi active programs...");
  const immunefiPrograms = await fetchImmunefiPrograms();

  // 4. Fetch GitHub bounty repos
  console.log("\n🐙 [4/12] Fetching GitHub bounty repos...");
  const githubRepos = await fetchGitHubBountyRepos(token);

  // 5. Fetch CVE hunting opportunities
  console.log("\n🎯 [5/12] Fetching CVE hunting opportunities...");
  const cveHunting = await fetchCVEHuntingFeed();

  // 6. Fetch DeFiHackLabs exploits
  console.log("\n💀 [6/12] Fetching DeFiHackLabs exploits...");
  const exploits = await fetchDeFiHackLabsExploits(token);

  // 7. Fetch Solodit audit findings
  console.log("\n📖 [7/12] Fetching Solodit audit findings...");
  const soloditFindings = soloditKey ? await fetchSoloditFindings(soloditKey) : { findings: [], total: 0 };

  // ============================================
  // PHASE 2: Intel Enrichment
  // ============================================

  // 8. Exa Intel Enrichment (v3.1)
  let intelData = null;
  if (exaKey) {
    console.log("\n🔍 [8/12] Running Exa intel enrichment...");
    const allPrograms = [
      ...(h1Programs?.programs || []),
      ...(immunefiPrograms?.programs || []),
    ];
    intelData = await enrichWithExa(allPrograms, exaKey);
  } else {
    console.log("\n⏭️ [8/12] Skipping Exa enrichment (no API key)");
  }

  // ============================================
  // PHASE 3: Git Intel Scanner (v3.2 - NEW)
  // ============================================

  // 9. Git Intel Scanner
  let gitIntelData = null;
  if (gitIntelTargets) {
    console.log("\n🔐 [9/12] Running Git Intel Scanner...");
    const repos = gitIntelTargets.split(",").map(r => r.trim()).filter(Boolean);
    
    gitIntelData = {
      scannedAt: new Date().toISOString(),
      repos: []
    };
    
    for (const repoUrl of repos) {
      try {
        console.log(`\n   Scanning: ${repoUrl}`);
        const result = await scanRepo(repoUrl, { depth: 100, cleanup: true });
        const targets = generateAuditTargets(result);
        
        gitIntelData.repos.push({
          ...result,
          auditTargets: targets.slice(0, 15) // Top 15 targets per repo
        });
      } catch (err) {
        console.error(`   ❌ Failed: ${err.message}`);
        gitIntelData.repos.push({
          repo: repoUrl,
          error: err.message,
          scannedAt: new Date().toISOString()
        });
      }
    }
    
    // Save git-intel results separately
    fs.writeFileSync(GIT_INTEL_FILE, JSON.stringify(gitIntelData, null, 2));
    console.log(`\n   📄 Git Intel saved to: data/git-intel.json`);
  } else {
    console.log("\n⏭️ [9/12] Skipping Git Intel (no targets set)");
  }

  // ============================================
  // PHASE 4: Aggregate & Save
  // ============================================

  // 10. Aggregate all data
  console.log("\n📊 [10/12] Aggregating data...");
  
  const data = {
    generated_at: new Date().toISOString(),
    version: "3.2",
    
    // Core data
    hackerone: h1Reports,
    h1_programs: h1Programs,
    immunefi: immunefiPrograms,
    github: githubRepos,
    
    // Research feeds
    cve_hunting: cveHunting,
    exploits: exploits,
    solodit: soloditFindings,
    
    // Intel (v3.1)
    intel: intelData,
    
    // Git Intel summary (v3.2)
    git_intel: gitIntelData ? {
      total_repos: gitIntelData.repos.length,
      total_security_commits: gitIntelData.repos.reduce((sum, r) => sum + (r.summary?.securityCommits || 0), 0),
      total_hot_files: gitIntelData.repos.reduce((sum, r) => sum + (r.summary?.hotFiles || 0), 0),
      total_cves: gitIntelData.repos.reduce((sum, r) => sum + (r.summary?.cves || 0), 0),
      last_scan: gitIntelData.scannedAt
    } : null
  };

  // 11. Save main data file
  console.log("\n💾 [11/12] Saving bounty-data.json...");
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

  // ============================================
  // PHASE 5: Notify
  // ============================================

  // 12. Send Telegram notification
  console.log("\n📱 [12/12] Sending Telegram notification...");
  const stats = computeStats(data);
  const message = formatTelegramMessage(stats);
  await sendTelegram(message);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n✅ Done in ${elapsed}s`);
}

function computeStats(data) {
  return {
    h1Reports: data.hackerone?.reports?.length || 0,
    h1Programs: data.h1_programs?.programs?.length || 0,
    immunefi: data.immunefi?.programs?.length || 0,
    github: data.github?.repos?.length || 0,
    cveHunting: data.cve_hunting?.opportunities?.length || 0,
    exploits: data.exploits?.exploits?.length || 0,
    exploitLoss: data.exploits?.total_loss_usd || 0,
    solodit: data.solodit?.findings?.length || 0,
    intel: data.intel?.total_enriched || 0,
    gitIntel: data.git_intel || null,
    topPaid: (data.hackerone?.reports || [])
      .filter(r => r.bounty > 0)
      .sort((a, b) => b.bounty - a.bounty)
      .slice(0, 5),
    topExploits: (data.exploits?.exploits || [])
      .sort((a, b) => (b.loss_usd || 0) - (a.loss_usd || 0))
      .slice(0, 3)
  };
}

function formatTelegramMessage(stats) {
  let msg = `🔍 <b>Bounty Radar v3.2</b> — Daily Update\n\n`;
  
  msg += `📋 HackerOne: ${stats.h1Reports} reports, ${stats.h1Programs} programs\n`;
  msg += `🛡️ Immunefi: ${stats.immunefi} programs\n`;
  msg += `🐙 GitHub: ${stats.github} repos\n\n`;
  
  msg += `🎯 CVE Hunting: ${stats.cveHunting} opportunities\n`;
  
  if (stats.exploits > 0) {
    const lossM = (stats.exploitLoss / 1e6).toFixed(1);
    msg += `💀 Exploits: ${stats.exploits} ($${lossM}M loss)\n`;
  }
  
  msg += `📖 Audit Findings: ${stats.solodit}\n`;
  
  if (stats.intel > 0) {
    msg += `🔍 Intel: ${stats.intel} enriched\n`;
  }
  
  // Git Intel stats (v3.2)
  if (stats.gitIntel) {
    msg += `\n🔐 <b>Git Intel:</b>\n`;
    msg += `   Repos scanned: ${stats.gitIntel.total_repos}\n`;
    msg += `   Security commits: ${stats.gitIntel.total_security_commits}\n`;
    msg += `   Hot files: ${stats.gitIntel.total_hot_files}\n`;
    if (stats.gitIntel.total_cves > 0) {
      msg += `   CVEs found: ${stats.gitIntel.total_cves}\n`;
    }
  }
  
  if (stats.topExploits && stats.topExploits.length > 0) {
    msg += `\n💀 <b>Recent Exploits:</b>\n`;
    stats.topExploits.forEach((e, i) => {
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

  msg += `📊 https://xnotok-ops.github.io/bounty-radar`;
  msg += `\n\n<i>by @xnotok</i>`;
  return msg;
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
