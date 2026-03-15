/**
 * Bounty Radar - Build Searchable Web UI (v3 fixed)
 */

const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "..", "data", "bounty-data.json");
const docsDir = path.join(__dirname, "..", "docs");

function buildHtml() {
  var data = { hackerone: { reports: [] }, immunefi: { programs: [] }, github: { repos: [] }, updated_at: "" };

  if (fs.existsSync(dataPath)) {
    data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  }

  var updatedAt = data.updated_at ? new Date(data.updated_at).toLocaleDateString() : "Never";
  var h1Count = data.hackerone.reports.length.toLocaleString();
  var imCount = data.immunefi.programs.length;
  var ghCount = data.github.repos.length;
  var jsonData = JSON.stringify(data);

  var html = '';
  html += '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">';
  html += '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
  html += '<title>Bounty Radar</title>';
  html += '<style>';
  html += '*{margin:0;padding:0;box-sizing:border-box}';
  html += 'body{font-family:system-ui,sans-serif;background:#0a0f1a;color:#e2e8f0;min-height:100vh}';
  html += '.header{background:#0d1117;border-bottom:1px solid #1e2130;padding:20px 24px}';
  html += '.header h1{font-family:monospace;font-size:20px;color:#f8fafc}';
  html += '.header p{font-size:12px;color:#475569;margin-top:4px}';
  html += '.stats{display:flex;gap:16px;margin-top:12px;flex-wrap:wrap}';
  html += '.stat{background:#12141a;border:1px solid #1e2130;border-radius:8px;padding:10px 16px;font-size:12px}';
  html += '.stat span{color:#fbbf24;font-weight:700;font-size:16px}';
  html += '.tabs{display:flex;gap:0;border-bottom:1px solid #1e2130;background:#0d1117;padding:0 24px}';
  html += '.tab{padding:12px 20px;cursor:pointer;color:#64748b;font-size:13px;font-weight:600;border-bottom:2px solid transparent}';
  html += '.tab.active{color:#fbbf24;border-bottom-color:#fbbf24}.tab:hover{color:#fbbf24}';
  html += '.controls{padding:16px 24px;display:flex;gap:12px;flex-wrap:wrap;align-items:center}';
  html += '.search{background:#12141a;border:1px solid #1e2130;border-radius:6px;padding:8px 14px;color:#e2e8f0;font-size:13px;width:300px;outline:none}';
  html += '.search:focus{border-color:#fbbf24}';
  html += 'select{background:#12141a;border:1px solid #1e2130;border-radius:6px;padding:8px 12px;color:#e2e8f0;font-size:12px;outline:none}';
  html += '.content{padding:0 24px 40px}';
  html += 'table{width:100%;border-collapse:collapse;font-size:12px;margin-top:8px}';
  html += 'th{text-align:left;padding:8px 10px;background:#12141a;color:#94a3b8;font-weight:600;border-bottom:1px solid #1e2130;cursor:pointer;white-space:nowrap}';
  html += 'th:hover{color:#fbbf24}';
  html += 'td{padding:8px 10px;border-bottom:1px solid #0d1117;color:#cbd5e1;max-width:400px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}';
  html += 'tr:hover td{background:#12141a}';
  html += 'a{color:#fbbf24;text-decoration:none}a:hover{text-decoration:underline}';
  html += '.bounty{color:#22c55e;font-weight:700}';
  html += '.badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:600;background:#1e293b;color:#94a3b8;margin-right:4px}';
  html += '.badge.xss{background:#7c3aed20;color:#a78bfa}';
  html += '.badge.idor{background:#f59e0b20;color:#fbbf24}';
  html += '.badge.ssrf{background:#ef444420;color:#f87171}';
  html += '.badge.rce{background:#dc262620;color:#fca5a5}';
  html += '.badge.sqli{background:#06b6d420;color:#67e8f9}';
  html += '.badge.csrf{background:#8b5cf620;color:#c4b5fd}';
  html += '.count{color:#64748b;font-size:11px;margin-left:8px}';
  html += '.empty{text-align:center;padding:60px 20px;color:#475569}';
  html += '.date{color:#64748b;font-size:11px}';
  html += '@media(max-width:768px){.search{width:100%}.stats{flex-direction:column}.controls{flex-direction:column}td,th{padding:6px 8px;font-size:11px}}';
  html += '</style></head><body>';

  // Header
  html += '<div class="header">';
  html += '<h1>&#128274; Bounty Radar</h1>';
  html += '<p>Bug bounty research tool — search disclosed reports, active programs, and resources</p>';
  html += '<p style="margin-top:4px;font-size:11px;color:#334155">Last updated: ' + updatedAt + '</p>';
  html += '<div class="stats">';
  html += '<div class="stat">&#128203; HackerOne<br><span>' + h1Count + '</span> reports</div>';
  html += '<div class="stat">&#128737; Immunefi<br><span>' + imCount + '</span> programs</div>';
  html += '<div class="stat">&#128025; GitHub<br><span>' + ghCount + '</span> repos</div>';
  html += '</div></div>';

  // Tabs
  html += '<div class="tabs">';
  html += '<div class="tab active" onclick="showTab(\'h1\',this)">&#128203; HackerOne Reports</div>';
  html += '<div class="tab" onclick="showTab(\'immunefi\',this)">&#128737; Immunefi Programs</div>';
  html += '<div class="tab" onclick="showTab(\'github\',this)">&#128025; GitHub Resources</div>';
  html += '</div>';

  // Controls
  html += '<div class="controls">';
  html += '<input class="search" type="text" id="searchInput" placeholder="Search reports, programs, repos..." oninput="filterData()">';
  html += '<select id="bugTypeFilter" onchange="filterData()"><option value="">All Bug Types</option></select>';
  html += '<select id="sortBy" onchange="filterData()">';
  html += '<option value="bounty">Sort: Bounty &#8595;</option>';
  html += '<option value="upvotes">Sort: Upvotes &#8595;</option>';
  html += '<option value="program">Sort: Program A-Z</option>';
  html += '<option value="newest">Sort: Newest &#8595;</option>';
  html += '</select>';
  html += '<span class="count" id="resultCount"></span>';
  html += '</div>';

  // Content
  html += '<div class="content">';
  html += '<div id="h1Table"></div>';
  html += '<div id="immunefiTable" style="display:none"></div>';
  html += '<div id="githubTable" style="display:none"></div>';
  html += '</div>';

  // Script
  html += '<script>';
  html += 'var DATA=' + jsonData + ';';
  html += 'var currentTab="h1";';

  // Populate bug type filter
  html += 'var bugTypes=[],seen={};DATA.hackerone.reports.forEach(function(r){if(!seen[r.bug_type]){seen[r.bug_type]=1;bugTypes.push(r.bug_type)}});bugTypes.sort();';
  html += 'var sel=document.getElementById("bugTypeFilter");bugTypes.forEach(function(t){var o=document.createElement("option");o.value=t;o.textContent=t;sel.appendChild(o)});';

  // showTab
  html += 'function showTab(tab,el){currentTab=tab;document.querySelectorAll(".tab").forEach(function(t){t.classList.remove("active")});el.classList.add("active");';
  html += 'document.getElementById("h1Table").style.display=tab==="h1"?"":"none";';
  html += 'document.getElementById("immunefiTable").style.display=tab==="immunefi"?"":"none";';
  html += 'document.getElementById("githubTable").style.display=tab==="github"?"":"none";';
  html += 'document.getElementById("bugTypeFilter").style.display=tab==="h1"?"":"none";';
  html += 'filterData()}';

  // filterData
  html += 'function filterData(){var q=document.getElementById("searchInput").value.toLowerCase();var bugType=document.getElementById("bugTypeFilter").value;var sortBy=document.getElementById("sortBy").value;';
  html += 'if(currentTab==="h1")renderH1(q,bugType,sortBy);else if(currentTab==="immunefi")renderImmunefi(q,sortBy);else renderGithub(q)}';

  // badgeClass
  html += 'function badgeClass(type){var t=type.toLowerCase();if(t.indexOf("xss")>=0)return"xss";if(t.indexOf("idor")>=0)return"idor";if(t.indexOf("ssrf")>=0)return"ssrf";if(t.indexOf("rce")>=0)return"rce";if(t.indexOf("sqli")>=0||t.indexOf("sql")>=0)return"sqli";if(t.indexOf("csrf")>=0)return"csrf";return""}';

  // fmtDate
  html += 'function fmtDate(d){if(!d)return"-";try{return new Date(d).toLocaleDateString()}catch(e){return"-"}}';

  // renderH1
  html += 'function renderH1(q,bugType,sortBy){';
  html += 'var reports=DATA.hackerone.reports.filter(function(r){if(bugType&&r.bug_type!==bugType)return false;if(q&&r.title.toLowerCase().indexOf(q)<0&&r.program.toLowerCase().indexOf(q)<0&&r.bug_type.toLowerCase().indexOf(q)<0)return false;return true});';
  html += 'if(sortBy==="bounty")reports.sort(function(a,b){return b.bounty-a.bounty});';
  html += 'else if(sortBy==="upvotes")reports.sort(function(a,b){return b.upvotes-a.upvotes});';
  html += 'else if(sortBy==="program")reports.sort(function(a,b){return a.program.localeCompare(b.program)});';
  html += 'document.getElementById("resultCount").textContent=reports.length+" results";';
  html += 'var h="<table><tr><th>#</th><th>Title</th><th>Bug Type</th><th>Program</th><th>Bounty</th><th>Upvotes</th></tr>";';
  html += 'reports.slice(0,500).forEach(function(r,i){';
  html += 'h+="<tr><td>"+(i+1)+"</td>";';
  html += 'h+="<td><a href=\\""+r.url+"\\" target=\\"_blank\\">"+r.title.substring(0,80)+"</a></td>";';
  html += 'h+="<td><span class=\\"badge "+badgeClass(r.bug_type)+"\\">"+r.bug_type+"</span></td>";';
  html += 'h+="<td>"+r.program+"</td>";';
  html += 'h+="<td class=\\"bounty\\">"+(r.bounty>0?"$"+r.bounty.toLocaleString():"-")+"</td>";';
  html += 'h+="<td>"+r.upvotes+"</td></tr>"});';
  html += 'h+="</table>";if(reports.length===0)h="<div class=\\"empty\\">No reports found</div>";';
  html += 'document.getElementById("h1Table").innerHTML=h}';

  // renderImmunefi
  html += 'function renderImmunefi(q,sortBy){';
  html += 'var programs=DATA.immunefi.programs.filter(function(p){if(q&&p.name.toLowerCase().indexOf(q)<0&&p.id.toLowerCase().indexOf(q)<0&&(p.technologies||"").toLowerCase().indexOf(q)<0)return false;return true});';
  html += 'if(sortBy==="newest")programs.sort(function(a,b){return(b.updated_at||"").localeCompare(a.updated_at||"")});';
  html += 'else programs.sort(function(a,b){return b.max_bounty-a.max_bounty});';
  html += 'document.getElementById("resultCount").textContent=programs.length+" programs";';
  html += 'var h="<table><tr><th>#</th><th>Program</th><th>Max Bounty</th><th>Tech</th><th>Updated</th><th>Link</th></tr>";';
  html += 'programs.forEach(function(p,i){';
  html += 'h+="<tr><td>"+(i+1)+"</td>";';
  html += 'h+="<td>"+p.name+"</td>";';
  html += 'h+="<td class=\\"bounty\\">"+(p.max_bounty?"$"+p.max_bounty.toLocaleString():"N/A")+"</td>";';
  html += 'h+="<td>"+(p.technologies||"N/A")+"</td>";';
  html += 'h+="<td class=\\"date\\">"+fmtDate(p.updated_at)+"</td>";';
  html += 'h+="<td><a href=\\""+p.url+"\\" target=\\"_blank\\">View &#8594;</a></td></tr>"});';
  html += 'h+="</table>";if(programs.length===0)h="<div class=\\"empty\\">No programs found</div>";';
  html += 'document.getElementById("immunefiTable").innerHTML=h}';

  // renderGithub
  html += 'function renderGithub(q){';
  html += 'var repos=DATA.github.repos.filter(function(r){if(q&&r.full_name.toLowerCase().indexOf(q)<0&&r.description.toLowerCase().indexOf(q)<0)return false;return true});';
  html += 'document.getElementById("resultCount").textContent=repos.length+" repos";';
  html += 'var h="<table><tr><th>#</th><th>Repo</th><th>Stars</th><th>Language</th><th>Description</th></tr>";';
  html += 'repos.forEach(function(r,i){';
  html += 'h+="<tr><td>"+(i+1)+"</td>";';
  html += 'h+="<td><a href=\\""+r.url+"\\" target=\\"_blank\\">"+r.full_name+"</a></td>";';
  html += 'h+="<td>&#11088; "+r.stars+"</td>";';
  html += 'h+="<td>"+r.language+"</td>";';
  html += 'h+="<td>"+r.description.substring(0,80)+"</td></tr>"});';
  html += 'h+="</table>";if(repos.length===0)h="<div class=\\"empty\\">No repos found</div>";';
  html += 'document.getElementById("githubTable").innerHTML=h}';

  // Init
  html += 'filterData();';
  html += '</script></body></html>';

  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(path.join(docsDir, "index.html"), html, "utf-8");
  console.log("Web UI built: docs/index.html");
}

buildHtml();
