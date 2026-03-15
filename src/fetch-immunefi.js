/**
 * Bounty Radar - Fetch Immunefi Active Programs
 * Source: Immunefi Bug Bounty Programs Snapshots (GitHub)
 */

const PROGRAMS_URL = "https://raw.githubusercontent.com/pratraut/Immunefi-Bug-Bounty-Programs-Snapshots/main/projects.json";
const PROJECT_BASE = "https://raw.githubusercontent.com/pratraut/Immunefi-Bug-Bounty-Programs-Snapshots/main/projects";

async function fetchImmunefiPrograms() {
  const programs = [];

  try {
    console.log("  Fetching Immunefi programs list...");
    const res = await fetch(PROGRAMS_URL);
    if (!res.ok) {
      console.error(`  Immunefi error: ${res.status}`);
      return programs;
    }

    const data = await res.json();
    console.log(`  Found ${data.length} Immunefi programs`);

    const toFetch = data.slice(0, 100);
    let fetched = 0;

    for (const projectId of toFetch) {
      try {
        const detailUrl = `${PROJECT_BASE}/${projectId}.json`;
        const detailRes = await fetch(detailUrl);
        if (!detailRes.ok) continue;

        const detail = await detailRes.json();

        const maxBounty = detail.maxBounty || detail.maximumReward || 0;

        programs.push({
          id: projectId,
          name: detail.project || projectId,
          url: `https://immunefi.com/bug-bounty/${projectId}/`,
          max_bounty: maxBounty,
          assets: (detail.assets || []).length,
          category: detail.programOverview ? "web3" : "unknown",
          updated_at: detail.updatedDate || "",
        });

        fetched++;
        if (fetched % 20 === 0) {
          console.log(`  Immunefi: ${fetched}/${toFetch.length} fetched`);
          await new Promise(r => setTimeout(r, 500));
        }
      } catch (err) {
        // skip individual errors
      }
    }

    console.log(`  Total Immunefi programs: ${programs.length}`);
  } catch (err) {
    console.error(`  Immunefi fetch error: ${err.message}`);
  }

  return programs;
}

module.exports = { fetchImmunefiPrograms };
