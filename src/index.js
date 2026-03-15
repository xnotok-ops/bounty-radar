/**
 * Bounty Radar - Main Entry Point
 * Collects bug bounty data from HackerOne, Immunefi, and GitHub
 */

const fs = require("fs");
const path = require("path");
const { fetchHackerOneReports } = require("./fetch-hackerone");
const { fetchImmunefiPrograms } = require("./fetch-immunefi");
const { fetchGitHubBountyRepos } = require("./fetch-github");
const { sendTelegram } = require("./telegram");

async function main() {
  console.log("🔐 Bounty Radar — Starting daily scan...\n");
  const startTime = Date.now();

  const token = process.env.GITHUB_TOKEN || null;

  // 1. Fetch HackerOne disclosed reports
  console.log("📋 Fetching HackerOne disclosed reports...");
  const h1Reports = await fetchHackerOneReports();

  // 2. Fetch Immunefi active programs
  console.log("\n🛡️ Fetching Immunefi active programs...");
  const immunefiPrograms = await fetchImmunefiPrograms();

  // 3. Fetch GitHub bounty repos
  console.log("\n🐙 Fetching GitHub bounty repos...");
  const githubRepos = await fetchGitHubBountyRepos(token);

  // 4. Save data
  const dataDir = path.join(__dirname, "..", "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const data = {
    updated_at: new Date().toISOString(),
    hackerone: {
      total: h1Reports.length,
      reports: h1Reports,
    },
    immunefi: {
      total: immunefiPrograms.length,
      programs: immunefiPrograms,
    },
    github: {
      total: githubRepos.length,
      repos: githubRepos,
    },
  };

  const dataPath = path.join(dataDir, "bounty-data.json");
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf-8");
  console.log(`\n💾 Data saved: ${dataPath}`);

  // 5. Stats
  const stats = {
    h1: h1Reports.length,
    immunefi: immunefiPrograms.length,
    github: githubRepos.length,
    topPaid: h1Reports.filter(r => r.bounty > 0).sort((a, b) => b.bounty - a.bounty).slice(0, 5),
    topImmunefi: immunefiPrograms.sort((a, b) => b.max_bounty - a.max_bounty).slice(0, 5),
  };

  console.log(`\n📊 Stats:`);
  console.log(`  HackerOne reports: ${stats.h1}`);
  console.log(`  Immunefi programs: ${stats.immunefi}`);
  console.log(`  GitHub repos: ${stats.github}`);

  // 6. Telegram notification
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (botToken && chatId) {
    const msg = generateTelegramMsg(stats);
    await sendTelegram(msg, botToken, chatId);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n🏁 Done in ${elapsed}s`);
}

function generateTelegramMsg(stats) {
  let msg = `🔐 <b>Bounty Radar — Daily Update</b>\n\n`;

  msg += `📋 <b>HackerOne:</b> ${stats.h1} disclosed reports\n`;
  msg += `🛡️ <b>Immunefi:</b> ${stats.immunefi} active Web3 programs\n`;
  msg += `🐙 <b>GitHub:</b> ${stats.github} bounty repos\n\n`;

  if (stats.topPaid.length > 0) {
    msg += `💰 <b>Top Paid Reports:</b>\n`;
    stats.topPaid.forEach((r, i) => {
      msg += `${i + 1}. $${r.bounty.toLocaleString()} — ${r.bug_type} @ ${r.program}\n`;
    });
    msg += `\n`;
  }

  if (stats.topImmunefi.length > 0) {
    msg += `🛡️ <b>Top Immunefi Bounties:</b>\n`;
    stats.topImmunefi.forEach((p, i) => {
      const bounty = p.max_bounty ? `$${p.max_bounty.toLocaleString()}` : "N/A";
      msg += `${i + 1}. ${bounty} — ${p.name}\n`;
    });
    msg += `\n`;
  }

  msg += `📄 Full: https://xnotok-ops.github.io/bounty-radar`;
  msg += `\n\n<i>by @xnotok</i>`;
  return msg;
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
