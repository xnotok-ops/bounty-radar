/**
 * Bounty Radar v3.2 - Git Intel Scanner
 * 
 * Inspired by Nicholas Carlini's methodology (Anthropic):
 * - Scan git history for security-related commits
 * - Find partial fixes that may have variant bugs elsewhere
 * - Identify hot files with frequent security changes
 * - Extract past CVE/vulnerability patterns
 * 
 * Source: Nicholas Carlini - "Black-hat LLMs" @ [un]prompted 2026
 * https://www.youtube.com/watch?v=1sd26pWhfmg
 * 
 * Related:
 * - Anthropic Blog: https://red.anthropic.com/2026/zero-days/
 * - SCW Podcast: https://securitycryptographywhatever.com/2026/03/25/ai-bug-finding/
 */

const simpleGit = require("simple-git");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execSync } = require("child_process");

// Security-related keywords to search in commit messages
const SECURITY_KEYWORDS = [
  // Fix indicators
  "fix", "patch", "vuln", "vulnerability", "security",
  "cve", "exploit", "attack", "bypass", "leak",
  
  // Memory safety
  "overflow", "underflow", "buffer", "bounds", "oob",
  "use-after-free", "uaf", "double-free",
  "memory corruption", "heap", "stack",
  
  // Web security
  "xss", "csrf", "sqli", "sql injection", "idor",
  "ssrf", "rce", "lfi", "rfi", "xxe", "ssti",
  "auth bypass", "privilege escalation", "access control",
  
  // Crypto/blockchain
  "reentrancy", "flash loan", "price manipulation",
  "oracle", "slippage", "frontrun", "sandwich",
  "drain", "theft", "steal", "unauthorized",
  
  // Input validation
  "sanitize", "validate", "check", "verify",
  "input", "escape", "encode", "filter",
  
  // Access control
  "permission", "authorization", "authentication",
  "rbac", "acl", "role", "admin", "owner"
];

// File patterns that are often security-relevant
const HOT_FILE_PATTERNS = [
  /\.sol$/i,
  /contract/i,
  /vault/i,
  /token/i,
  /stake/i,
  /pool/i,
  /swap/i,
  /bridge/i,
  /auth/i,
  /login/i,
  /session/i,
  /password/i,
  /crypto/i,
  /sign/i,
  /verify/i,
  /validate/i,
  /api/i,
  /handler/i,
  /controller/i,
  /middleware/i,
  /router/i
];

/**
 * Clone a repo (shallow) to temp directory
 */
async function cloneRepo(repoUrl, depth = 100) {
  const tempDir = path.join(os.tmpdir(), `git-intel-${Date.now()}`);
  
  console.log(`📥 Cloning ${repoUrl} (depth=${depth})...`);
  
  const git = simpleGit();
  await git.clone(repoUrl, tempDir, [
    "--depth", String(depth),
    "--single-branch"
  ]);
  
  return { git: simpleGit(tempDir), tempDir };
}

/**
 * Scan git log for security-related commits using shell exec
 * (more reliable than simple-git's grep)
 */
async function scanSecurityCommits(tempDir, keywords = SECURITY_KEYWORDS) {
  console.log(`🔍 Scanning for security-related commits...`);
  
  const results = [];
  const seen = new Set();
  
  // Build grep pattern - escape special chars and join with \|
  const pattern = keywords.slice(0, 20).join("\\|");
  
  try {
    // Use shell exec for more reliable grep
    const cmd = `git log --all --oneline --grep="${pattern}" -i -n 100`;
    const output = execSync(cmd, { 
      cwd: tempDir, 
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024
    });
    
    const lines = output.trim().split("\n").filter(Boolean);
    
    for (const line of lines) {
      const match = line.match(/^([a-f0-9]+)\s+(.+)$/i);
      if (match && !seen.has(match[1])) {
        seen.add(match[1]);
        
        // Find which keyword matched
        const msg = match[2].toLowerCase();
        const matchedKeyword = keywords.find(k => msg.includes(k.toLowerCase())) || "security";
        
        results.push({
          hash: match[1],
          message: match[2],
          matchedKeyword
        });
      }
    }
  } catch (err) {
    // Git grep might fail if no matches
    if (!err.message.includes("fatal") && err.status !== 1) {
      console.error(`   Warning: ${err.message}`);
    }
  }
  
  // Also search for additional patterns separately
  const extraPatterns = ["CVE-", "security", "vulnerab", "exploit"];
  for (const pat of extraPatterns) {
    try {
      const cmd = `git log --all --oneline --grep="${pat}" -i -n 50`;
      const output = execSync(cmd, { 
        cwd: tempDir, 
        encoding: "utf-8",
        maxBuffer: 10 * 1024 * 1024
      });
      
      const lines = output.trim().split("\n").filter(Boolean);
      
      for (const line of lines) {
        const match = line.match(/^([a-f0-9]+)\s+(.+)$/i);
        if (match && !seen.has(match[1])) {
          seen.add(match[1]);
          results.push({
            hash: match[1],
            message: match[2],
            matchedKeyword: pat
          });
        }
      }
    } catch (err) {
      // Ignore - no matches is fine
    }
  }
  
  console.log(`   Found ${results.length} security-related commits`);
  
  return results;
}

/**
 * Get files changed in security commits (hot files)
 */
async function getHotFiles(tempDir, securityCommits) {
  console.log(`📁 Analyzing hot files from security commits...`);
  
  const fileChanges = {};
  
  for (const commit of securityCommits.slice(0, 30)) {
    try {
      const cmd = `git show --name-only --format="" ${commit.hash}`;
      const output = execSync(cmd, { 
        cwd: tempDir, 
        encoding: "utf-8" 
      });
      
      const files = output.trim().split("\n").filter(f => f.trim());
      
      for (const file of files) {
        if (!fileChanges[file]) {
          fileChanges[file] = {
            file,
            securityCommits: [],
            isHotPattern: HOT_FILE_PATTERNS.some(p => p.test(file))
          };
        }
        fileChanges[file].securityCommits.push({
          hash: commit.hash.substring(0, 7),
          message: commit.message.substring(0, 80),
          keyword: commit.matchedKeyword
        });
      }
    } catch (err) {
      // Skip problematic commits
    }
  }
  
  // Score and sort files
  const hotFiles = Object.values(fileChanges)
    .map(f => ({
      ...f,
      score: f.securityCommits.length * (f.isHotPattern ? 2 : 1)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 30);
  
  console.log(`   Found ${hotFiles.length} hot files`);
  
  return hotFiles;
}

/**
 * Extract CVE references from commits
 */
async function extractCVEs(tempDir) {
  console.log(`🔒 Extracting CVE references...`);
  
  const cvePattern = /CVE-\d{4}-\d+/gi;
  const cves = [];
  
  try {
    const cmd = `git log --all --oneline -500`;
    const output = execSync(cmd, { 
      cwd: tempDir, 
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024
    });
    
    const lines = output.trim().split("\n");
    
    for (const line of lines) {
      const matches = line.match(cvePattern);
      if (matches) {
        const hashMatch = line.match(/^([a-f0-9]+)/i);
        for (const cve of matches) {
          if (!cves.find(c => c.cve === cve.toUpperCase())) {
            cves.push({
              cve: cve.toUpperCase(),
              commit: hashMatch ? hashMatch[1].substring(0, 7) : "unknown",
              message: line.substring(8, 100)
            });
          }
        }
      }
    }
  } catch (err) {
    console.error(`   Error: ${err.message}`);
  }
  
  console.log(`   Found ${cves.length} CVE references`);
  
  return cves;
}

/**
 * Find potential variant bugs
 */
async function findVariantCandidates(securityCommits) {
  console.log(`🎯 Finding potential variant bug candidates...`);
  
  const variantCandidates = [];
  
  const partialFixPatterns = [
    /fix(ed)?\s+(part|partial|one|some|this)/i,
    /todo|fixme|hack|workaround/i,
    /similar\s+(bug|issue|problem)/i,
    /also\s+(affects?|in|at)/i
  ];
  
  for (const commit of securityCommits) {
    for (const pattern of partialFixPatterns) {
      if (pattern.test(commit.message)) {
        variantCandidates.push({
          hash: commit.hash.substring(0, 7),
          message: commit.message.substring(0, 100),
          reason: "Partial fix indicator",
          pattern: pattern.toString()
        });
        break;
      }
    }
  }
  
  console.log(`   Found ${variantCandidates.length} variant candidates`);
  
  return variantCandidates;
}

/**
 * Analyze contributor security expertise
 */
async function analyzeSecurityContributors(tempDir, securityCommits) {
  console.log(`👥 Analyzing security contributors...`);
  
  const contributors = {};
  
  for (const commit of securityCommits.slice(0, 50)) {
    try {
      const cmd = `git show -s --format="%an" ${commit.hash}`;
      const author = execSync(cmd, { 
        cwd: tempDir, 
        encoding: "utf-8" 
      }).trim();
      
      if (!contributors[author]) {
        contributors[author] = {
          name: author,
          securityCommits: 0,
          keywords: new Set()
        };
      }
      contributors[author].securityCommits++;
      contributors[author].keywords.add(commit.matchedKeyword);
    } catch (err) {
      // Skip
    }
  }
  
  const ranked = Object.values(contributors)
    .map(c => ({
      ...c,
      keywords: Array.from(c.keywords)
    }))
    .sort((a, b) => b.securityCommits - a.securityCommits)
    .slice(0, 10);
  
  console.log(`   Found ${ranked.length} security-focused contributors`);
  
  return ranked;
}

/**
 * Main scan function
 */
async function scanRepo(repoUrl, options = {}) {
  const { depth = 100, cleanup = true } = options;
  
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🔐 Git Intel Scanner v3.2`);
  console.log(`📦 Target: ${repoUrl}`);
  console.log(`${"=".repeat(60)}\n`);
  
  const startTime = Date.now();
  let tempDir = null;
  
  try {
    // Clone
    const { tempDir: dir } = await cloneRepo(repoUrl, depth);
    tempDir = dir;
    
    // Scan using shell exec
    const securityCommits = await scanSecurityCommits(tempDir);
    const hotFiles = await getHotFiles(tempDir, securityCommits);
    const cves = await extractCVEs(tempDir);
    const variantCandidates = await findVariantCandidates(securityCommits);
    const contributors = await analyzeSecurityContributors(tempDir, securityCommits);
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    
    const result = {
      repo: repoUrl,
      scannedAt: new Date().toISOString(),
      elapsedSeconds: parseFloat(elapsed),
      summary: {
        securityCommits: securityCommits.length,
        hotFiles: hotFiles.length,
        cves: cves.length,
        variantCandidates: variantCandidates.length,
        securityContributors: contributors.length
      },
      data: {
        securityCommits: securityCommits.slice(0, 50),
        hotFiles,
        cves,
        variantCandidates,
        contributors
      }
    };
    
    console.log(`\n✅ Scan complete in ${elapsed}s`);
    console.log(`   Security commits: ${securityCommits.length}`);
    console.log(`   Hot files: ${hotFiles.length}`);
    console.log(`   CVEs found: ${cves.length}`);
    console.log(`   Variant candidates: ${variantCandidates.length}`);
    
    return result;
    
  } finally {
    // Cleanup temp directory
    if (cleanup && tempDir && fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
        console.log(`🧹 Cleaned up temp directory`);
      } catch (err) {
        console.log(`⚠️ Could not cleanup temp dir: ${err.message}`);
      }
    }
  }
}

/**
 * Generate prioritized audit targets from scan results
 */
function generateAuditTargets(scanResult) {
  const targets = [];
  
  // Priority 1: Files with many security commits + hot patterns
  for (const file of (scanResult.data?.hotFiles || []).slice(0, 10)) {
    targets.push({
      priority: 1,
      type: "hot_file",
      target: file.file,
      reason: `${file.securityCommits.length} security commits, score=${file.score}`,
      commits: file.securityCommits.slice(0, 3)
    });
  }
  
  // Priority 2: Variant candidates
  for (const variant of (scanResult.data?.variantCandidates || [])) {
    targets.push({
      priority: 2,
      type: "variant_candidate",
      target: variant.hash,
      reason: variant.reason,
      message: variant.message
    });
  }
  
  // Priority 3: Recent security commits
  for (const commit of (scanResult.data?.securityCommits || []).slice(0, 5)) {
    targets.push({
      priority: 3,
      type: "recent_security_fix",
      target: commit.hash.substring(0, 7),
      reason: `Recent fix: ${commit.matchedKeyword}`,
      message: commit.message.substring(0, 80)
    });
  }
  
  return targets;
}

// Export functions
module.exports = {
  scanRepo,
  generateAuditTargets,
  SECURITY_KEYWORDS,
  HOT_FILE_PATTERNS
};

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
Usage: node git-intel.js <repo-url> [--depth=100] [--output=json]

Examples:
  node git-intel.js https://github.com/OpenZeppelin/openzeppelin-contracts
  node git-intel.js https://github.com/aave/aave-v3-core --depth=200
  node git-intel.js https://github.com/example/repo --output=intel-report.json

Windows env variable (untuk daily scan):
  set GIT_INTEL_TARGETS=https://github.com/repo1,https://github.com/repo2
`);
    process.exit(1);
  }
  
  const repoUrl = args[0];
  const depthArg = args.find(a => a.startsWith("--depth="));
  const outputArg = args.find(a => a.startsWith("--output="));
  
  const depth = depthArg ? parseInt(depthArg.split("=")[1]) : 100;
  const output = outputArg ? outputArg.split("=")[1] : null;
  
  scanRepo(repoUrl, { depth })
    .then(result => {
      if (output) {
        fs.writeFileSync(output, JSON.stringify(result, null, 2));
        console.log(`\n📄 Report saved to: ${output}`);
      } else {
        console.log("\n📊 Audit Targets:");
        const targets = generateAuditTargets(result);
        if (targets.length === 0) {
          console.log("   No high-priority targets found");
        } else {
          targets.slice(0, 10).forEach((t, i) => {
            console.log(`${i + 1}. [P${t.priority}] ${t.type}: ${t.target}`);
            console.log(`   ${t.reason}`);
          });
        }
      }
    })
    .catch(err => {
      console.error("Fatal error:", err.message);
      process.exit(1);
    });
}
