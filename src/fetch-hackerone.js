/**
 * Bounty Radar - Fetch HackerOne Disclosed Reports
 * Source: reddelexc/hackerone-reports (markdown files)
 */

const BUG_TYPES = [
  "TOPXSS", "TOPIDOR", "TOPSSRF", "TOPRCE", "TOPSQLI",
  "TOPCSRF", "TOPXXE", "TOPBUSINESSLOGIC", "TOPINFORMATIONDISCLOSURE",
  "TOPRACECONDITION", "TOPSUBDOMAINTAKEOVER", "TOPMEMORYLEAK",
  "TOPIMPROPERAUTHENTICATION", "TOPINSUFFICIENTSECURITYCONFIGURATORYISSUE",
  "TOPOPENREDIRECT", "TOPDENIALOFSERVICE",
];

const BASE_URL = "https://raw.githubusercontent.com/reddelexc/hackerone-reports/master";

function parseMarkdownReports(md, bugType) {
  const reports = [];
  const lines = md.split("\n");

  for (const line of lines) {
    const match = line.match(/^\d+\.\s+\[(.+?)\]\((.+?)\)\s+to\s+(.+?)\s+-\s+(\d+)\s+upvotes?,\s+\$(\d+)/);
    if (match) {
      reports.push({
        title: match[1],
        url: match[2],
        program: match[3],
        upvotes: parseInt(match[4]),
        bounty: parseInt(match[5]),
        bug_type: bugType.replace("TOP", ""),
      });
    }
  }
  return reports;
}

async function fetchHackerOneReports() {
  const allReports = [];
  const seen = new Set();

  for (const type of BUG_TYPES) {
    const url = `${BASE_URL}/tops_by_bug_type/${type}.md`;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`  H1 error: ${res.status} for ${type}`);
        continue;
      }
      const md = await res.text();
      const reports = parseMarkdownReports(md, type);

      for (const r of reports) {
        if (!seen.has(r.url)) {
          seen.add(r.url);
          allReports.push(r);
        }
      }
      console.log(`  ${type}: ${reports.length} reports`);
      await new Promise(r => setTimeout(r, 300));
    } catch (err) {
      console.error(`  H1 fetch error for ${type}: ${err.message}`);
    }
  }

  try {
    const res = await fetch(`${BASE_URL}/tops_100/TOP100PAID.md`);
    if (res.ok) {
      const md = await res.text();
      const lines = md.split("\n");
      for (const line of lines) {
        const match = line.match(/^\d+\.\s+\[(.+?)\]\((.+?)\)\s+to\s+(.+?)\s+-\s+(\d+)\s+upvotes?,\s+\$(\d+)/);
        if (match && !seen.has(match[2])) {
          seen.add(match[2]);
          allReports.push({
            title: match[1],
            url: match[2],
            program: match[3],
            upvotes: parseInt(match[4]),
            bounty: parseInt(match[5]),
            bug_type: "TOP_PAID",
          });
        }
      }
      console.log(`  TOP100PAID: loaded`);
    }
  } catch (err) {
    console.error(`  TOP100PAID error: ${err.message}`);
  }

  console.log(`  Total HackerOne reports: ${allReports.length}`);
  return allReports;
}

module.exports = { fetchHackerOneReports, BUG_TYPES };
