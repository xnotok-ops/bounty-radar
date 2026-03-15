/**
 * Bounty Radar - Fetch Bug Bounty Resources from GitHub
 * Trending repos related to bug bounty, security research, writeups
 */

const QUERIES = [
  "bug+bounty+writeup",
  "bug+bounty+tools",
  "web3+security+audit",
  "smart+contract+vulnerability",
  "hackerone+writeup",
  "immunefi+writeup",
];

async function fetchGitHubBountyRepos(token) {
  const seen = new Set();
  const allRepos = [];
  const headers = { Accept: "application/vnd.github.v3+json" };
  if (token) headers.Authorization = `token ${token}`;

  for (const q of QUERIES) {
    const url = `https://api.github.com/search/repositories?q=${q}&sort=updated&order=desc&per_page=10`;
    try {
      const res = await fetch(url, { headers });
      if (!res.ok) {
        console.error(`  GitHub error: ${res.status} for "${q}"`);
        continue;
      }
      const data = await res.json();
      const items = data.items || [];

      for (const repo of items) {
        if (seen.has(repo.full_name)) continue;
        seen.add(repo.full_name);

        allRepos.push({
          full_name: repo.full_name,
          url: repo.html_url,
          description: (repo.description || "").slice(0, 150),
          stars: repo.stargazers_count,
          language: repo.language || "Unknown",
          updated_at: repo.updated_at,
          topics: (repo.topics || []).slice(0, 5),
        });
      }
      console.log(`  GitHub "${q}": ${items.length} repos`);
      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.error(`  GitHub error for "${q}": ${err.message}`);
    }
  }

  allRepos.sort((a, b) => b.stars - a.stars);
  console.log(`  Total GitHub bounty repos: ${allRepos.length}`);
  return allRepos.slice(0, 30);
}

module.exports = { fetchGitHubBountyRepos };
