/**
 * Bounty Radar - Fetch Immunefi Active Programs (v2 fixed)
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
      console.error("  Immunefi list error: " + res.status);
      return programs;
    }

    const data = await res.json();
    console.log("  Found " + data.length + " Immunefi program IDs");

    let success = 0;
    let fail = 0;
    const toFetch = data.slice(0, 80);

    for (const projectId of toFetch) {
      try {
        const detailUrl = PROJECT_BASE + "/" + projectId + ".json";
        const detailRes = await fetch(detailUrl);

        if (!detailRes.ok) {
          fail++;
          continue;
        }

        const detail = await detailRes.json();

        var maxBounty = 0;
        if (detail.maxBounty) {
          maxBounty = parseInt(detail.maxBounty) || 0;
        } else if (detail.maximumReward) {
          maxBounty = parseInt(detail.maximumReward) || 0;
        } else if (detail.bounties && detail.bounties.length > 0) {
          for (var b of detail.bounties) {
            var amt = parseInt(b.maxPayout || b.maximum || b.reward || 0);
            if (amt > maxBounty) maxBounty = amt;
          }
        }

        programs.push({
          id: projectId,
          name: detail.project || detail.name || detail.title || projectId,
          url: "https://immunefi.com/bug-bounty/" + projectId + "/",
          max_bounty: maxBounty,
          assets: Array.isArray(detail.assets) ? detail.assets.length : 0,
          category: "web3",
          updated_at: detail.updatedDate || detail.launchDate || "",
        });

        success++;
        if (success % 20 === 0) {
          console.log("  Immunefi: " + success + " fetched, " + fail + " failed");
        }
        await new Promise(function(r) { setTimeout(r, 200) });
      } catch (err) {
        fail++;
      }
    }

    console.log("  Immunefi done: " + success + " success, " + fail + " failed");
    console.log("  Total Immunefi programs: " + programs.length);
  } catch (err) {
    console.error("  Immunefi fetch error: " + err.message);
  }

  return programs;
}

module.exports = { fetchImmunefiPrograms };
