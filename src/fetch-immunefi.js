/**
 * Bounty Radar - Fetch Immunefi Active Programs (v3 fixed)
 * Source: projects.json already contains all data
 */

const PROGRAMS_URL = "https://raw.githubusercontent.com/pratraut/Immunefi-Bug-Bounty-Programs-Snapshots/main/projects.json";

async function fetchImmunefiPrograms() {
  const programs = [];

  try {
    console.log("  Fetching Immunefi programs...");
    const res = await fetch(PROGRAMS_URL);
    if (!res.ok) {
      console.error("  Immunefi error: " + res.status);
      return programs;
    }

    const data = await res.json();
    console.log("  Found " + data.length + " Immunefi programs");

    for (var item of data) {
      programs.push({
        id: item.id || "unknown",
        name: item.project || item.id || "Unknown",
        url: "https://immunefi.com/bug-bounty/" + (item.id || "") + "/",
        max_bounty: item.maximum_reward || 0,
        technologies: (item.technologies || []).join(", "),
        kyc: item.kyc || false,
        launch_date: item.launchDate || "",
        updated_at: item.updatedDate || "",
      });
    }

    console.log("  Total Immunefi programs: " + programs.length);
  } catch (err) {
    console.error("  Immunefi fetch error: " + err.message);
  }

  return programs;
}

module.exports = { fetchImmunefiPrograms };
