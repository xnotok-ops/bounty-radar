/**
 * Bounty Radar - Exa Intel Enrichment
 * 
 * Adds related writeups, Twitter mentions, and GitHub PoCs to bounty programs
 * Uses Exa semantic search API (1,000 free requests/month)
 * 
 * Source: https://exa.ai
 * API Docs: https://docs.exa.ai
 * Pricing: https://exa.ai/pricing (free tier: 1,000/month)
 * 
 * Inspired by: https://github.com/Panniantong/Agent-Reach
 */

const fs = require("fs");
const path = require("path");

const EXA_API_URL = "https://api.exa.ai/search";
const CACHE_FILE = path.join(__dirname, "..", "data", "exa-cache.json");
const MAX_QUERIES_PER_RUN = 30; // Stay within free tier limits

/**
 * Search Exa API
 * @param {string} query - Search query
 * @param {string} apiKey - Exa API key
 * @param {object} options - Search options
 */
async function searchExa(query, apiKey, options = {}) {
  const {
    numResults = 5,
    type = "neural", // "neural" for semantic, "keyword" for exact
    useAutoprompt = true,
    category = null, // "research paper", "tweet", "github", etc.
    includeDomains = [],
    excludeDomains = [],
    startPublishedDate = null,
  } = options;

  const body = {
    query,
    numResults,
    type,
    useAutoprompt,
    contents: {
      text: { maxCharacters: 500 },
      highlights: { numSentences: 2 },
    },
  };

  if (category) body.category = category;
  if (includeDomains.length > 0) body.includeDomains = includeDomains;
  if (excludeDomains.length > 0) body.excludeDomains = excludeDomains;
  if (startPublishedDate) body.startPublishedDate = startPublishedDate;

  try {
    const response = await fetch(EXA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error(`  ⚠️ Exa API error: ${response.status} - ${err}`);
      return { results: [] };
    }

    return await response.json();
  } catch (error) {
    console.error(`  ⚠️ Exa fetch error: ${error.message}`);
    return { results: [] };
  }
}

/**
 * Load cache to avoid redundant API calls
 */
function loadCache() {
  if (fs.existsSync(CACHE_FILE)) {
    return JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
  }
  return { enriched: {}, lastRun: null };
}

/**
 * Save cache
 */
function saveCache(cache) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), "utf-8");
}

/**
 * Check if program needs enrichment
 * - New program (not in cache)
 * - Cache older than 7 days
 */
function needsEnrichment(programKey, cache) {
  const cached = cache.enriched[programKey];
  if (!cached) return true;

  const cacheAge = Date.now() - new Date(cached.timestamp).getTime();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  return cacheAge > sevenDays;
}

/**
 * Generate search queries for a program
 */
function generateQueries(program) {
  const name = program.name || program.handle || "unknown";
  const tech = program.technologies || "";

  const queries = [];

  // 1. Bug bounty writeups
  queries.push({
    type: "writeups",
    query: `${name} bug bounty writeup vulnerability`,
    options: {
      numResults: 3,
      excludeDomains: ["linkedin.com", "facebook.com"],
    },
  });

  // 2. Security researcher tweets
  queries.push({
    type: "twitter",
    query: `${name} vulnerability exploit security`,
    options: {
      numResults: 3,
      includeDomains: ["twitter.com", "x.com"],
    },
  });

  // 3. GitHub PoCs
  queries.push({
    type: "github",
    query: `${name} exploit proof of concept`,
    options: {
      numResults: 3,
      includeDomains: ["github.com"],
    },
  });

  // 4. If DeFi/Web3 - specific searches
  if (tech.toLowerCase().includes("solidity") || 
      tech.toLowerCase().includes("smart contract") ||
      program.platform === "immunefi") {
    queries.push({
      type: "defi_audit",
      query: `${name} smart contract audit vulnerability findings`,
      options: {
        numResults: 3,
        includeDomains: ["medium.com", "mirror.xyz", "rekt.news", "code4rena.com"],
      },
    });
  }

  return queries;
}

/**
 * Enrich a single program with Exa intel
 */
async function enrichProgram(program, apiKey) {
  const name = program.name || program.handle || "unknown";
  const queries = generateQueries(program);
  
  const intel = {
    writeups: [],
    twitter: [],
    github: [],
    defi_audit: [],
    total_results: 0,
    enriched_at: new Date().toISOString(),
  };

  for (const q of queries) {
    const result = await searchExa(q.query, apiKey, q.options);
    
    if (result.results && result.results.length > 0) {
      const formatted = result.results.map(r => ({
        title: r.title || "Untitled",
        url: r.url,
        snippet: r.text?.substring(0, 200) || r.highlights?.[0] || "",
        published: r.publishedDate || null,
        score: r.score || 0,
      }));

      intel[q.type] = formatted;
      intel.total_results += formatted.length;
    }

    // Small delay to be nice to API
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return intel;
}

/**
 * Main enrichment function
 */
async function enrichWithExa(programs, apiKey) {
  console.log("🔍 Exa Intel Enrichment starting...\n");

  if (!apiKey) {
    console.log("⚠️ EXA_API_KEY not set. Skipping enrichment.");
    console.log("   Get free key: https://exa.ai\n");
    return { enriched: 0, skipped: programs.length, intel: {} };
  }

  const cache = loadCache();
  const results = { enriched: 0, skipped: 0, intel: {} };
  let queriesUsed = 0;

  // Prioritize new programs and high-bounty ones
  const sortedPrograms = [...programs].sort((a, b) => {
    const aMax = a.bounty_max || a.max_bounty || 0;
    const bMax = b.bounty_max || b.max_bounty || 0;
    return bMax - aMax;
  });

  for (const program of sortedPrograms) {
    const key = program.handle || program.name?.toLowerCase().replace(/\s+/g, "-") || "unknown";

    // Check cache
    if (!needsEnrichment(key, cache)) {
      results.intel[key] = cache.enriched[key].intel;
      results.skipped++;
      continue;
    }

    // Check query budget
    const estimatedQueries = generateQueries(program).length;
    if (queriesUsed + estimatedQueries > MAX_QUERIES_PER_RUN) {
      console.log(`  ⏸️ Query budget reached (${queriesUsed}/${MAX_QUERIES_PER_RUN}). Stopping.`);
      break;
    }

    console.log(`  📡 Enriching: ${program.name || key}`);
    
    try {
      const intel = await enrichProgram(program, apiKey);
      
      // Update cache
      cache.enriched[key] = {
        intel,
        timestamp: new Date().toISOString(),
      };

      results.intel[key] = intel;
      results.enriched++;
      queriesUsed += estimatedQueries;

      console.log(`     ✅ Found ${intel.total_results} results`);
    } catch (error) {
      console.error(`     ❌ Error: ${error.message}`);
    }
  }

  // Save cache
  cache.lastRun = new Date().toISOString();
  saveCache(cache);

  console.log(`\n📊 Enrichment complete:`);
  console.log(`   Enriched: ${results.enriched}`);
  console.log(`   Cached/Skipped: ${results.skipped}`);
  console.log(`   Queries used: ${queriesUsed}`);

  return results;
}

/**
 * Standalone runner (for testing)
 */
async function main() {
  const dataPath = path.join(__dirname, "..", "data", "bounty-data.json");
  
  if (!fs.existsSync(dataPath)) {
    console.error("❌ bounty-data.json not found. Run main index.js first.");
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  const apiKey = process.env.EXA_API_KEY;

  // Combine all programs
  const allPrograms = [
    ...(data.h1_programs?.programs || []),
    ...(data.immunefi?.programs || []),
  ];

  const results = await enrichWithExa(allPrograms, apiKey);

  // Merge intel back to data
  if (results.enriched > 0) {
    data.intel = {
      total_enriched: results.enriched,
      last_updated: new Date().toISOString(),
      programs: results.intel,
    };

    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf-8");
    console.log("\n💾 Updated bounty-data.json with intel");
  }
}

// Export for use in index.js
module.exports = { enrichWithExa, searchExa };

// Run standalone if called directly
if (require.main === module) {
  main().catch(console.error);
}
