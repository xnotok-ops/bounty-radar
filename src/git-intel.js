/**
 * Bounty Radar - Git Intelligence Module
 * Analyze target repo's git history to identify hot files, security commits, and risk indicators
 */

const SECURITY_KEYWORDS = [
  "fix", "patch", "vuln", "vulnerability", "security",
  "reentrancy", "overflow", "underflow", "exploit", "bug",
  "cve", "audit", "critical", "highrisk", "bypass"
];

const CONTRACT_EXTENSIONS = [".sol", ".rs", ".move", ".cairo", ".vy"];

/**
 * Analyze a GitHub repo for security-relevant git history
 * @param {string} repoUrl - Full GitHub URL (e.g., https://github.com/owner/repo)
 * @param {string} token - GitHub API token (optional but recommended)
 * @param {number} days - How many days of history to analyze (default: 30)
 */
async function analyzeRepoGitHistory(repoUrl, token, days = 30) {
  const headers = { Accept: "application/vnd.github.v3+json" };
  if (token) headers.Authorization = `token ${token}`;

  // Parse repo from URL
  const match = repoUrl.match(/github\.com\/([^\/]+\/[^\/]+)/);
  if (!match) {
    console.error("  Invalid GitHub URL");
    return null;
  }
  const repo = match[1].replace(/\.git$/, "");
  console.log(`  Analyzing: ${repo}`);

  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceISO = since.toISOString();

  const result = {
    repo,
    analyzed_at: new Date().toISOString(),
    days_analyzed: days,
    hot_files: [],
    security_commits: [],
    recent_additions: [],
    risk_indicators: {
      recent_security_fixes: 0,
      new_contracts_30d: 0,
      high_churn_files: 0
    }
  };

  try {
    // 1. Fetch recent commits
    console.log(`  Fetching commits since ${sinceISO.split("T")[0]}...`);
    const commits = await fetchCommits(repo, sinceISO, headers);
    console.log(`  Found ${commits.length} commits`);

    // 2. Analyze commits for security keywords
    const securityCommits = commits.filter(c => 
      SECURITY_KEYWORDS.some(kw => 
        c.message.toLowerCase().includes(kw)
      )
    );
    result.security_commits = securityCommits.slice(0, 20);
    result.risk_indicators.recent_security_fixes = securityCommits.length;
    console.log(`  Security-related commits: ${securityCommits.length}`);

    await sleep(500);

    // 3. Count file changes to find hot files
    console.log(`  Analyzing file change frequency...`);
    const fileChanges = {};
    
    for (const commit of commits.slice(0, 50)) { // Limit to avoid rate limits
      const files = await fetchCommitFiles(repo, commit.sha, headers);
      for (const file of files) {
        if (!fileChanges[file.filename]) {
          fileChanges[file.filename] = { 
            path: file.filename, 
            changes: 0, 
            last_modified: commit.date,
            additions: 0,
            deletions: 0
          };
        }
        fileChanges[file.filename].changes++;
        fileChanges[file.filename].additions += file.additions || 0;
        fileChanges[file.filename].deletions += file.deletions || 0;
      }
      await sleep(200); // Rate limit protection
    }

    // 4. Sort by change frequency (hot files)
    const hotFiles = Object.values(fileChanges)
      .filter(f => isContractFile(f.path))
      .sort((a, b) => b.changes - a.changes)
      .slice(0, 15);
    
    result.hot_files = hotFiles;
    result.risk_indicators.high_churn_files = hotFiles.filter(f => f.changes >= 3).length;
    console.log(`  Hot contract files: ${hotFiles.length}`);

    await sleep(500);

    // 5. Find recently added files (new contracts)
    console.log(`  Looking for new contracts...`);
    const recentAdditions = await findRecentAdditions(repo, sinceISO, headers);
    result.recent_additions = recentAdditions.filter(f => isContractFile(f.path)).slice(0, 10);
    result.risk_indicators.new_contracts_30d = result.recent_additions.length;
    console.log(`  New contracts added: ${result.recent_additions.length}`);

  } catch (err) {
    console.error(`  Error analyzing ${repo}: ${err.message}`);
  }

  return result;
}

/**
 * Fetch commits from repo
 */
async function fetchCommits(repo, since, headers) {
  const url = `https://api.github.com/repos/${repo}/commits?since=${since}&per_page=100`;
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      console.error(`  Commits fetch error: ${res.status}`);
      return [];
    }
    const data = await res.json();
    return data.map(c => ({
      sha: c.sha,
      message: c.commit?.message || "",
      date: c.commit?.author?.date || "",
      author: c.commit?.author?.name || "unknown"
    }));
  } catch (err) {
    console.error(`  Commits fetch error: ${err.message}`);
    return [];
  }
}

/**
 * Fetch files changed in a specific commit
 */
async function fetchCommitFiles(repo, sha, headers) {
  const url = `https://api.github.com/repos/${repo}/commits/${sha}`;
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.files || []).map(f => ({
      filename: f.filename,
      status: f.status,
      additions: f.additions,
      deletions: f.deletions
    }));
  } catch {
    return [];
  }
}

/**
 * Find recently added files by checking commit statuses
 */
async function findRecentAdditions(repo, since, headers) {
  const url = `https://api.github.com/repos/${repo}/commits?since=${since}&per_page=30`;
  const additions = [];
  const seen = new Set();

  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return [];
    const commits = await res.json();

    for (const commit of commits.slice(0, 15)) {
      const files = await fetchCommitFiles(repo, commit.sha, headers);
      for (const f of files) {
        if (f.status === "added" && !seen.has(f.filename)) {
          seen.add(f.filename);
          additions.push({
            path: f.filename,
            added_date: commit.commit?.author?.date || "",
            commit_sha: commit.sha
          });
        }
      }
      await sleep(200);
    }
  } catch (err) {
    console.error(`  Recent additions error: ${err.message}`);
  }

  return additions;
}

/**
 * Check if file is a smart contract
 */
function isContractFile(path) {
  return CONTRACT_EXTENSIONS.some(ext => path.toLowerCase().endsWith(ext));
}

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/**
 * Generate attack surface summary from analysis
 */
function generateAttackSummary(analysis) {
  if (!analysis) return "Analysis failed";

  const lines = [
    `## Git Intel: ${analysis.repo}`,
    `Analyzed: ${analysis.days_analyzed} days of history`,
    "",
    `### Risk Indicators`,
    `- Security-related commits: ${analysis.risk_indicators.recent_security_fixes}`,
    `- New contracts added: ${analysis.risk_indicators.new_contracts_30d}`,
    `- High-churn files: ${analysis.risk_indicators.high_churn_files}`,
    ""
  ];

  if (analysis.hot_files.length > 0) {
    lines.push("### Hot Files (prioritize review)");
    for (const f of analysis.hot_files.slice(0, 5)) {
      lines.push(`- \`${f.path}\` — ${f.changes} changes, +${f.additions}/-${f.deletions}`);
    }
    lines.push("");
  }

  if (analysis.security_commits.length > 0) {
    lines.push("### Recent Security Commits");
    for (const c of analysis.security_commits.slice(0, 5)) {
      const msg = c.message.split("\n")[0].slice(0, 60);
      lines.push(`- ${c.sha.slice(0, 7)}: ${msg}`);
    }
    lines.push("");
  }

  if (analysis.recent_additions.length > 0) {
    lines.push("### New Contracts (fresh code = fresh bugs)");
    for (const f of analysis.recent_additions.slice(0, 5)) {
      lines.push(`- \`${f.path}\` — added ${f.added_date.split("T")[0]}`);
    }
  }

  return lines.join("\n");
}

module.exports = { 
  analyzeRepoGitHistory, 
  generateAttackSummary,
  SECURITY_KEYWORDS,
  CONTRACT_EXTENSIONS
};
