#!/usr/bin/env python3
"""
sync-cves.py — Pull filtered CVEs from GitHub Advisory Database (GraphQL API)
Filters by CWE, CVSS severity, and date range. Outputs to cve-feed.json.

Usage:
    python scripts/sync-cves.py                    # uses config defaults (30 days back)
    python scripts/sync-cves.py --days 7           # last 7 days only
    python scripts/sync-cves.py --days 90           # last 90 days
    python scripts/sync-cves.py --min-cvss 9.0     # critical only
    python scripts/sync-cves.py --cwe CWE-918      # single CWE filter
    python scripts/sync-cves.py --dry-run           # preview without saving

Requires: GITHUB_TOKEN env var (personal access token, no special scopes needed)
"""

import json
import os
import sys
import argparse
from datetime import datetime, timedelta, timezone
from pathlib import Path

try:
    import requests
except ImportError:
    print("[!] requests not installed. Run: pip install requests")
    sys.exit(1)

SCRIPT_DIR = Path(__file__).parent
ROOT_DIR = SCRIPT_DIR.parent
CONFIG_PATH = ROOT_DIR / "config" / "cve-filters.json"
OUTPUT_DIR = ROOT_DIR

GRAPHQL_URL = "https://api.github.com/graphql"

QUERY = """
query($after: String, $publishedSince: DateTime) {
  securityAdvisories(
    first: 100,
    after: $after,
    publishedSince: $publishedSince,
    orderBy: {field: PUBLISHED_AT, direction: DESC}
  ) {
    pageInfo {
      hasNextPage
      endCursor
    }
    nodes {
      ghsaId
      summary
      description
      severity
      publishedAt
      updatedAt
      permalink
      cvss {
        score
        vectorString
      }
      cwes(first: 10) {
        nodes {
          cweId
          name
        }
      }
      identifiers {
        type
        value
      }
      vulnerabilities(first: 5) {
        nodes {
          package {
            ecosystem
            name
          }
          vulnerableVersionRange
          firstPatchedVersion {
            identifier
          }
        }
      }
      references {
        url
      }
    }
  }
}
"""


def load_config():
    if CONFIG_PATH.exists():
        with open(CONFIG_PATH) as f:
            return json.load(f)
    return {
        "cwe_ids": [],
        "min_cvss": 7.0,
        "days_back": 30,
        "severities": ["CRITICAL", "HIGH"],
        "max_results": 100,
        "output_file": "cve-feed.json"
    }


def get_token():
    token = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    if not token:
        print("[!] GITHUB_TOKEN or GH_TOKEN env var required.")
        print("    Set it: export GITHUB_TOKEN=ghp_xxxxx")
        print("    Or on Windows: set GITHUB_TOKEN=ghp_xxxxx")
        sys.exit(1)
    return token


def fetch_advisories(token, published_since, max_results=100):
    """Fetch advisories from GitHub GraphQL API with pagination."""
    headers = {
        "Authorization": f"bearer {token}",
        "Content-Type": "application/json"
    }

    all_nodes = []
    cursor = None
    pages = 0
    max_pages = (max_results // 100) + 1

    while pages < max_pages:
        variables = {
            "publishedSince": published_since,
            "after": cursor
        }

        resp = requests.post(
            GRAPHQL_URL,
            headers=headers,
            json={"query": QUERY, "variables": variables},
            timeout=30
        )

        if resp.status_code == 401:
            print("[!] Authentication failed. Check your GITHUB_TOKEN.")
            sys.exit(1)

        if resp.status_code != 200:
            print(f"[!] API error {resp.status_code}: {resp.text[:200]}")
            break

        data = resp.json()

        if "errors" in data:
            print(f"[!] GraphQL errors: {data['errors']}")
            break

        advisories = data.get("data", {}).get("securityAdvisories", {})
        nodes = advisories.get("nodes", [])
        all_nodes.extend(nodes)

        page_info = advisories.get("pageInfo", {})
        if page_info.get("hasNextPage") and len(all_nodes) < max_results:
            cursor = page_info["endCursor"]
            pages += 1
        else:
            break

    return all_nodes


def extract_cwe_ids(advisory):
    """Extract CWE IDs from advisory."""
    return [n["cweId"] for n in advisory.get("cwes", {}).get("nodes", [])]


def extract_cve_id(advisory):
    """Extract CVE ID from identifiers."""
    for ident in advisory.get("identifiers", []):
        if ident["type"] == "CVE":
            return ident["value"]
    return advisory.get("ghsaId", "UNKNOWN")


def matches_filters(advisory, config, cwe_override=None):
    """Check if advisory matches our CWE, CVSS, and severity filters."""
    # Severity filter
    target_sevs = [s.upper() for s in config.get("severities", [])]
    if target_sevs:
        adv_sev = (advisory.get("severity") or "").upper()
        if adv_sev not in target_sevs:
            return False

    # CVSS filter
    cvss_score = advisory.get("cvss", {}).get("score", 0) or 0
    if cvss_score < config["min_cvss"]:
        return False

    # CWE filter
    target_cwes = [cwe_override] if cwe_override else config.get("cwe_ids", [])
    if target_cwes:
        advisory_cwes = extract_cwe_ids(advisory)
        if not any(cwe in target_cwes for cwe in advisory_cwes):
            return False

    return True


def format_advisory(advisory):
    """Format advisory into clean JSON object."""
    cve_id = extract_cve_id(advisory)
    cwes = extract_cwe_ids(advisory)
    cvss = advisory.get("cvss", {})

    packages = []
    for vuln in advisory.get("vulnerabilities", {}).get("nodes", []):
        pkg = vuln.get("package", {})
        patched = vuln.get("firstPatchedVersion", {})
        packages.append({
            "ecosystem": pkg.get("ecosystem", ""),
            "name": pkg.get("name", ""),
            "vulnerable_range": vuln.get("vulnerableVersionRange", ""),
            "patched_version": patched.get("identifier", "") if patched else ""
        })

    refs = [r["url"] for r in advisory.get("references", [])[:5]]

    return {
        "id": cve_id,
        "ghsa": advisory.get("ghsaId", ""),
        "summary": advisory.get("summary", ""),
        "severity": advisory.get("severity", ""),
        "cvss_score": cvss.get("score", 0),
        "cvss_vector": cvss.get("vectorString", ""),
        "cwes": cwes,
        "published": advisory.get("publishedAt", ""),
        "updated": advisory.get("updatedAt", ""),
        "packages": packages,
        "references": refs,
        "permalink": advisory.get("permalink", "")
    }


def print_summary(results):
    """Print summary of fetched CVEs."""
    print(f"\n{'='*60}")
    print(f"  CVE Feed Summary — {len(results)} advisories matched")
    print(f"{'='*60}")

    # Count by CWE
    cwe_count = {}
    for r in results:
        for cwe in r["cwes"]:
            cwe_count[cwe] = cwe_count.get(cwe, 0) + 1

    if cwe_count:
        print("\n  By CWE:")
        for cwe, count in sorted(cwe_count.items(), key=lambda x: -x[1]):
            print(f"    {cwe}: {count}")

    # Count by severity
    sev_count = {}
    for r in results:
        s = r["severity"]
        sev_count[s] = sev_count.get(s, 0) + 1

    if sev_count:
        print("\n  By Severity:")
        for sev, count in sorted(sev_count.items()):
            print(f"    {sev}: {count}")

    # Top 5 highest CVSS
    top5 = sorted(results, key=lambda x: -(x["cvss_score"] or 0))[:5]
    if top5:
        print("\n  Top 5 by CVSS:")
        for r in top5:
            print(f"    [{r['cvss_score']}] {r['id']} — {r['summary'][:60]}")

    print(f"\n{'='*60}\n")


def main():
    parser = argparse.ArgumentParser(description="Sync CVEs from GitHub Advisory Database")
    parser.add_argument("--days", type=int, help="Override days_back from config")
    parser.add_argument("--min-cvss", type=float, help="Override min CVSS score")
    parser.add_argument("--cwe", type=str, help="Filter single CWE (e.g. CWE-918)")
    parser.add_argument("--dry-run", action="store_true", help="Preview without saving")
    parser.add_argument("--verbose", "-v", action="store_true", help="Show each matched advisory")
    args = parser.parse_args()

    config = load_config()
    token = get_token()

    # Apply overrides
    days_back = args.days or config["days_back"]
    if args.min_cvss:
        config["min_cvss"] = args.min_cvss

    since = datetime.now(timezone.utc) - timedelta(days=days_back)
    published_since = since.strftime("%Y-%m-%dT%H:%M:%SZ")

    print(f"[*] Syncing CVEs from GitHub Advisory Database")
    print(f"[*] Date range: {since.strftime('%Y-%m-%d')} to now ({days_back} days)")
    print(f"[*] Min CVSS: {config['min_cvss']}")
    print(f"[*] CWE filter: {args.cwe or ', '.join(config.get('cwe_ids', ['ALL']))}")
    print(f"[*] Severities: {', '.join(config['severities'])}")

    all_results = []

    print(f"\n[*] Fetching advisories...")
    advisories = fetch_advisories(
        token, published_since, config["max_results"]
    )
    print(f"    Raw results: {len(advisories)}")

    matched = 0
    for adv in advisories:
        if matches_filters(adv, config, args.cwe):
            formatted = format_advisory(adv)
            all_results.append(formatted)
            matched += 1

            if args.verbose:
                print(f"    [+] {formatted['id']} [{formatted['cvss_score']}] {formatted['summary'][:70]}")

    print(f"    After filter: {matched}")

    # Deduplicate by CVE ID
    seen = set()
    unique_results = []
    for r in all_results:
        if r["id"] not in seen:
            seen.add(r["id"])
            unique_results.append(r)

    # Sort by CVSS descending
    unique_results.sort(key=lambda x: -(x["cvss_score"] or 0))

    print_summary(unique_results)

    if args.dry_run:
        print("[*] Dry run — not saving.")
        return

    # Save output
    output_path = OUTPUT_DIR / config["output_file"]
    feed = {
        "last_sync": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "filters": {
            "days_back": days_back,
            "min_cvss": config["min_cvss"],
            "cwe_ids": [args.cwe] if args.cwe else config.get("cwe_ids", []),
            "severities": config["severities"]
        },
        "count": len(unique_results),
        "advisories": unique_results
    }

    with open(output_path, "w") as f:
        json.dump(feed, f, indent=2)

    print(f"[+] Saved {len(unique_results)} advisories to {output_path}")
    print(f"[*] Done. Next: git add cve-feed.json && git commit && git push")


if __name__ == "__main__":
    main()
