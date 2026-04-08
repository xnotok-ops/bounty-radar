#!/usr/bin/env python3
"""
sync-cves.py — Pull filtered CVEs from GitHub Advisory Database (REST API)
Fetches all recent advisories, then categorizes by CWE into 16 categories.

Usage:
    python scripts/sync-cves.py                    # uses config defaults
    python scripts/sync-cves.py --days 7           # last 7 days
    python scripts/sync-cves.py --days 90          # last 90 days
    python scripts/sync-cves.py --min-cvss 9.0     # critical only
    python scripts/sync-cves.py --category ssrf    # single category
    python scripts/sync-cves.py --dry-run          # preview without saving

Requires: gh CLI (auto-detects token) or GITHUB_TOKEN env var
"""

import json
import os
import sys
import argparse
import subprocess
import time
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

REST_URL = "https://api.github.com/advisories"


def load_config():
    if CONFIG_PATH.exists():
        with open(CONFIG_PATH) as f:
            return json.load(f)
    print(f"[!] Config not found: {CONFIG_PATH}")
    sys.exit(1)


def get_token():
    token = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    if token:
        return token
    try:
        result = subprocess.run(
            ["gh", "auth", "token"], capture_output=True, text=True, timeout=5
        )
        if result.returncode == 0 and result.stdout.strip():
            print("[*] Using token from gh CLI")
            return result.stdout.strip()
    except (FileNotFoundError, subprocess.TimeoutExpired):
        pass
    print("[!] No token found. Set GITHUB_TOKEN or login with: gh auth login")
    sys.exit(1)


def fetch_all_advisories(token, published_since, severities, max_pages=20):
    """Fetch all recent advisories with pagination, pre-filtered by severity."""
    headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {token}",
        "X-GitHub-Api-Version": "2022-11-28"
    }

    all_advisories = []

    for sev in severities:
        cursor = None
        page = 0

        while page < max_pages:
            params = {
                "type": "reviewed",
                "severity": sev,
                "sort": "published",
                "direction": "desc",
                "per_page": 100,
                "published": f">={published_since}"
            }
            if cursor:
                params["after"] = cursor

            try:
                resp = requests.get(REST_URL, headers=headers, params=params, timeout=30)
            except requests.RequestException as e:
                print(f"    [!] Request failed: {e}")
                break

            if resp.status_code == 403:
                reset = resp.headers.get("x-ratelimit-reset")
                if reset:
                    wait = int(reset) - int(time.time()) + 1
                    print(f"    [!] Rate limited. Waiting {wait}s...")
                    time.sleep(max(wait, 1))
                    continue
                break
            if resp.status_code != 200:
                print(f"    [!] API error {resp.status_code}: {resp.text[:150]}")
                break

            batch = resp.json()
            if not batch:
                break

            all_advisories.extend(batch)
            print(f"    [{sev}] page {page+1}: {len(batch)} advisories (total: {len(all_advisories)})")

            if len(batch) < 100:
                break

            # Use last GHSA ID as cursor
            cursor = batch[-1].get("ghsa_id")
            if not cursor:
                break
            page += 1
            time.sleep(0.3)

    return all_advisories


def get_advisory_cwes(adv):
    """Extract CWE IDs from advisory."""
    raw = adv.get("cwes") or []
    return [c.get("cwe_id", "") if isinstance(c, dict) else str(c) for c in raw]


def categorize(adv, categories):
    """Return list of matching category keys for this advisory."""
    adv_cwes = set(get_advisory_cwes(adv))
    matches = []
    for cat_key, cat_info in categories.items():
        if adv_cwes & set(cat_info["cwes"]):
            matches.append(cat_key)
    return matches


def format_advisory(adv, category, category_label):
    """Format REST API advisory into clean object."""
    cve_id = adv.get("cve_id") or adv.get("ghsa_id", "UNKNOWN")
    cvss = adv.get("cvss", {}) or {}
    raw_cwes = adv.get("cwes") or []
    cwes = [c.get("cwe_id", "") if isinstance(c, dict) else str(c) for c in raw_cwes]

    packages = []
    for vuln in (adv.get("vulnerabilities") or [])[:5]:
        pkg = vuln.get("package", {}) or {}
        patched = vuln.get("first_patched_version")
        packages.append({
            "ecosystem": pkg.get("ecosystem", ""),
            "name": pkg.get("name", ""),
            "vulnerable_range": vuln.get("vulnerable_version_range", ""),
            "patched_version": patched if patched else ""
        })

    raw_refs = adv.get("references") or []
    refs = [r if isinstance(r, str) else r.get("url", "") for r in raw_refs[:5]]

    return {
        "id": cve_id,
        "ghsa": adv.get("ghsa_id", ""),
        "summary": adv.get("summary", ""),
        "severity": adv.get("severity", ""),
        "cvss_score": cvss.get("score", 0) if cvss else 0,
        "cvss_vector": cvss.get("vector_string", "") if cvss else "",
        "cwes": cwes,
        "category": category,
        "category_label": category_label,
        "published": adv.get("published_at", ""),
        "updated": adv.get("updated_at", ""),
        "packages": packages,
        "references": refs,
        "permalink": adv.get("html_url", "")
    }


def print_summary(results, by_category):
    """Print summary."""
    print(f"\n{'='*60}")
    print(f"  CVE Feed Summary — {len(results)} advisories")
    print(f"{'='*60}")

    print("\n  By Category:")
    for cat, items in sorted(by_category.items(), key=lambda x: -len(x[1])):
        if items:
            print(f"    {cat}: {len(items)}")

    sev_count = {}
    for r in results:
        s = r["severity"]
        sev_count[s] = sev_count.get(s, 0) + 1
    if sev_count:
        print("\n  By Severity:")
        for sev, count in sorted(sev_count.items()):
            print(f"    {sev}: {count}")

    top5 = sorted(results, key=lambda x: -(x["cvss_score"] or 0))[:5]
    if top5:
        print("\n  Top 5 by CVSS:")
        for r in top5:
            print(f"    [{r['cvss_score']}] {r['id']} — {r['summary'][:60]}")

    print(f"\n{'='*60}\n")


def main():
    parser = argparse.ArgumentParser(description="Sync CVEs from GitHub Advisory Database (REST)")
    parser.add_argument("--days", type=int, help="Override days_back")
    parser.add_argument("--min-cvss", type=float, help="Override min CVSS score")
    parser.add_argument("--category", type=str, help="Output single category only")
    parser.add_argument("--dry-run", action="store_true", help="Preview without saving")
    parser.add_argument("--verbose", "-v", action="store_true")
    args = parser.parse_args()

    config = load_config()
    token = get_token()

    days_back = args.days or config["days_back"]
    min_cvss = args.min_cvss or config["min_cvss"]
    severities = config["severities"]
    categories = config["categories"]

    since = datetime.now(timezone.utc) - timedelta(days=days_back)
    since_str = since.strftime("%Y-%m-%d")

    if args.category and args.category not in categories:
        print(f"[!] Unknown category: {args.category}")
        print(f"    Available: {', '.join(categories.keys())}")
        sys.exit(1)

    print(f"[*] Syncing CVEs via REST API (fetch-all + categorize)")
    print(f"[*] Date range: {since_str} to now ({days_back} days)")
    print(f"[*] Min CVSS: {min_cvss} | Severities: {', '.join(severities)}")
    print(f"[*] Categories: {len(categories)}")

    # Step 1: Fetch all recent high/critical advisories
    print(f"\n[*] Fetching all {'/'.join(severities)} advisories...")
    all_raw = fetch_all_advisories(token, since_str, severities)

    # Deduplicate by GHSA ID
    seen = set()
    unique = []
    for adv in all_raw:
        gid = adv.get("ghsa_id") or adv.get("cve_id", "")
        if gid not in seen:
            seen.add(gid)
            unique.append(adv)
    print(f"[*] Total unique: {len(unique)} (from {len(all_raw)} raw)")

    # Step 2: Categorize and filter
    all_results = []
    by_category = {k: [] for k in categories}
    seen_ids = set()

    for adv in unique:
        cvss = (adv.get("cvss") or {}).get("score", 0) or 0
        if cvss > 0 and cvss < min_cvss:
            continue

        cve_id = adv.get("cve_id") or adv.get("ghsa_id", "")
        cats = categorize(adv, categories)
        if not cats:
            continue

        # Use first matching category
        cat_key = cats[0]
        if args.category and cat_key != args.category:
            # Check if any match
            if args.category in cats:
                cat_key = args.category
            else:
                continue

        label = categories[cat_key]["label"]

        if cve_id not in seen_ids:
            seen_ids.add(cve_id)
            formatted = format_advisory(adv, cat_key, label)
            by_category[cat_key].append(formatted)
            all_results.append(formatted)

            if args.verbose:
                print(f"    [{cat_key}] {formatted['id']} [{cvss}] {formatted['summary'][:55]}")

    # Sort by CVSS descending
    all_results.sort(key=lambda x: -(x["cvss_score"] or 0))

    print_summary(all_results, by_category)

    if args.dry_run:
        print("[*] Dry run — not saving.")
        return

    # Save
    output_path = ROOT_DIR / config["output_file"]
    feed = {
        "last_sync": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "filters": {
            "days_back": days_back,
            "min_cvss": min_cvss,
            "severities": severities,
            "categories": len(categories)
        },
        "count": len(all_results),
        "by_category": {k: len(v) for k, v in by_category.items()},
        "advisories": all_results
    }
    with open(output_path, "w") as f:
        json.dump(feed, f, indent=2)
    print(f"[+] Saved {len(all_results)} advisories to {output_path}")

    docs_path = ROOT_DIR / "docs" / "cve-feed.json"
    with open(docs_path, "w") as f:
        json.dump(feed, f, indent=2)
    print(f"[+] Copied to {docs_path}")

    print(f"[*] Done. Next: git add -A && git commit -m 'sync: cve-feed' && git push")


if __name__ == "__main__":
    main()
