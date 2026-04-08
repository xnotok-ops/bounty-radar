/**
 * Bounty Radar v3.2 - With Intel Tab
 * Sources:
 * - Exa API: https://exa.ai
 * - Agent-Reach: https://github.com/Panniantong/Agent-Reach
 */

const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "..", "data", "bounty-data.json");
const docsDir = path.join(__dirname, "..", "docs");

function buildHtml() {
  let data = {};
  if (fs.existsSync(dataPath)) {
    data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  }

  // Transform data to match what index.html expects
  const uiData = { ...data };

  // hackerone: array -> {reports: [...]}
  if (Array.isArray(uiData.hackerone)) {
    uiData.hackerone = { reports: uiData.hackerone };
  }
  // immunefi: array -> {programs: [...]}
  if (Array.isArray(uiData.immunefi)) {
    uiData.immunefi = { programs: uiData.immunefi };
  }
  // exploits: set .data alias
  if (uiData.exploits && uiData.exploits.exploits && !uiData.exploits.data) {
    uiData.exploits.data = uiData.exploits.exploits;
  }
  // github: array -> {repos: [...]}
  if (Array.isArray(uiData.github)) {
    uiData.github = { repos: uiData.github };
  }
  // all_programs: fallback to h1_programs
  if (!uiData.all_programs && uiData.h1_programs) {
    uiData.all_programs = uiData.h1_programs;
  }
  // audit_findings: fallback to solodit
  if (!uiData.audit_findings && uiData.solodit && uiData.solodit.findings) {
    uiData.audit_findings = { data: uiData.solodit.findings, total: uiData.solodit.total || 0 };
  }
  // intel: intel.intel -> intel.programs
  if (uiData.intel && uiData.intel.intel && !uiData.intel.programs) {
    uiData.intel.programs = uiData.intel.intel;
  }

  // Write data as separate JS file (index.html is manually maintained)
  fs.writeFileSync(
    path.join(docsDir, "data.js"),
    "var DATA = " + JSON.stringify(uiData) + ";",
    "utf-8"
  );

  console.log("✅ docs/data.js updated");
  console.log("   hackerone.reports:", (uiData.hackerone?.reports?.length || 0));
  console.log("   immunefi.programs:", (uiData.immunefi?.programs?.length || 0));
  console.log("   exploits.data:", (uiData.exploits?.data?.length || 0));
  console.log("   all_programs.programs:", (uiData.all_programs?.programs?.length || 0));
  console.log("   intel.programs:", Object.keys(uiData.intel?.programs || {}).length);
  console.log("   ℹ️  index.html is manually maintained — not overwritten");
}

buildHtml();
