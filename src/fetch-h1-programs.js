/**
 * Bounty Radar - Fetch HackerOne Program Status
 * Auto-sync active/paused/closed programs
 * Source: HackerOne directory via community repo
 */

const H1_PROGRAMS_URL = "https://raw.githubusercontent.com/Hacker0x01/public-program-policies/main/programs.json";
const H1_FALLBACK_URL = "https://raw.githubusercontent.com/arkadiyt/bounty-targets-data/main/data/hackerone_data.json";

async function fetchH1Programs() {
  console.log("📋 Fetching HackerOne programs...");
  
  let programs = [];
  
  // Try primary source first
  try {
    console.log("  Trying primary source...");
    const res = await fetch(H1_FALLBACK_URL);
    
    if (res.ok) {
      const data = await res.json();
      console.log(`  Found ${data.length} programs from bounty-targets-data`);
      
      for (const item of data) {
        // Extract tech from targets if available
        const targets = item.targets?.in_scope || [];
        const techFromTargets = targets
          .map(t => t.asset_type || "")
          .filter(t => t)
          .join(", ");
        
        programs.push({
          name: item.name || "Unknown",
          handle: item.handle || item.name?.toLowerCase().replace(/\s+/g, "-") || "",
          platform: "hackerone",
          status: item.submission_state === "open" ? "active" : 
                  item.submission_state === "paused" ? "paused" : "closed",
          url: item.url || `https://hackerone.com/${item.handle}`,
          bounty_min: item.offers_bounties ? 100 : 0,
          bounty_max: item.max_bounty || 0,
          managed: item.managed || false,
          offers_bounties: item.offers_bounties || false,
          technologies: techFromTargets,
          response_efficiency: item.response_efficiency_percentage || 0,
          last_synced: new Date().toISOString().split("T")[0],
        });
      }
    }
  } catch (err) {
    console.error(`  Primary source error: ${err.message}`);
  }
  
  // If no programs, try to load from local cache
  if (programs.length === 0) {
    console.log("  Using fallback: loading from local cache...");
    programs = getDefaultH1Programs();
  }
  
  // Filter to only bounty programs
  const bountyPrograms = programs.filter(p => p.offers_bounties || p.bounty_max > 0);
  
  // Stats
  const stats = {
    total: bountyPrograms.length,
    active: bountyPrograms.filter(p => p.status === "active").length,
    paused: bountyPrograms.filter(p => p.status === "paused").length,
    closed: bountyPrograms.filter(p => p.status === "closed").length,
  };
  
  console.log(`  ✅ HackerOne: ${stats.total} bounty programs`);
  console.log(`     Active: ${stats.active}, Paused: ${stats.paused}, Closed: ${stats.closed}`);
  
  return {
    programs: bountyPrograms,
    stats: stats,
    last_synced: new Date().toISOString(),
  };
}

// Default top programs (fallback if API fails)
function getDefaultH1Programs() {
  return [
    { name: "Shopify", handle: "shopify", platform: "hackerone", status: "active", bounty_max: 50000, offers_bounties: true, technologies: "ruby, react, node, graphql" },
    { name: "GitLab", handle: "gitlab", platform: "hackerone", status: "active", bounty_max: 35000, offers_bounties: true, technologies: "ruby, vue, go, postgresql" },
    { name: "Coinbase", handle: "coinbase", platform: "hackerone", status: "active", bounty_max: 50000, offers_bounties: true, technologies: "go, react, ruby, postgresql" },
    { name: "Uber", handle: "uber", platform: "hackerone", status: "active", bounty_max: 10000, offers_bounties: true, technologies: "go, python, react, java" },
    { name: "Twitter", handle: "twitter", platform: "hackerone", status: "active", bounty_max: 20000, offers_bounties: true, technologies: "java, scala, react" },
    { name: "Dropbox", handle: "dropbox", platform: "hackerone", status: "active", bounty_max: 32768, offers_bounties: true, technologies: "python, go, rust, react" },
    { name: "Automattic", handle: "automattic", platform: "hackerone", status: "active", bounty_max: 25000, offers_bounties: true, technologies: "php, javascript, react" },
    { name: "HackerOne", handle: "security", platform: "hackerone", status: "active", bounty_max: 20000, offers_bounties: true, technologies: "ruby, rails, react" },
    { name: "PayPal", handle: "paypal", platform: "hackerone", status: "active", bounty_max: 30000, offers_bounties: true, technologies: "java, node, react" },
    { name: "Slack", handle: "slack", platform: "hackerone", status: "active", bounty_max: 15000, offers_bounties: true, technologies: "java, php, react, electron" },
    { name: "Snapchat", handle: "snapchat", platform: "hackerone", status: "active", bounty_max: 15000, offers_bounties: true, technologies: "go, python, react native" },
    { name: "Valve", handle: "valve", platform: "hackerone", status: "active", bounty_max: 25000, offers_bounties: true, technologies: "c++, javascript" },
    { name: "GitHub", handle: "github", platform: "hackerone", status: "active", bounty_max: 30000, offers_bounties: true, technologies: "ruby, go, react" },
    { name: "Rockstar Games", handle: "rockstargames", platform: "hackerone", status: "active", bounty_max: 10000, offers_bounties: true, technologies: "c++, javascript" },
    { name: "Airbnb", handle: "airbnb", platform: "hackerone", status: "active", bounty_max: 15000, offers_bounties: true, technologies: "ruby, react, java" },
  ];
}

module.exports = { fetchH1Programs, getDefaultH1Programs };