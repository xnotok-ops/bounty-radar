/**
 * Bounty Radar v2 - Build Searchable Web UI with CVE Hunting
 */

const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "..", "data", "bounty-data.json");
const docsDir = path.join(__dirname, "..", "docs");

function buildHtml() {
  var data = { 
    hackerone: { reports: [] }, 
    immunefi: { programs: [] }, 
    github: { repos: [] }, 
    cve_hunting: { opportunities: [], stats: { critical: 0, high: 0, medium: 0, low: 0 } },
    all_programs: { programs: [], total: 0, active: 0 },
    updated_at: "" 
  };

  if (fs.existsSync(dataPath)) {
    data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  }

  var updatedAt = data.updated_at ? new Date(data.updated_at).toLocaleDateString() : "Never";
  var h1Count = (data.hackerone?.reports?.length || 0).toLocaleString();
  var imCount = data.immunefi?.programs?.length || 0;
  var ghCount = data.github?.repos?.length || 0;
  var cveCount = data.cve_hunting?.total_opportunities || 0;
  var cveStats = data.cve_hunting?.stats || { critical: 0, high: 0, medium: 0, low: 0 };
  var programCount = data.all_programs?.total || 0;
  var activePrograms = data.all_programs?.active || 0;
  var jsonData = JSON.stringify(data);

  var html = '';
  html += '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">';
  html += '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
  html += '<title>Bounty Radar v2</title>';
  html += '<style>';
  html += '*{margin:0;padding:0;box-sizing:border-box}';
  html += 'body{font-family:system-ui,sans-serif;background:#0a0f1a;color:#e2e8f0;min-height:100vh}';
  html += '.header{background:#0d1117;border-bottom:1px solid #1e2130;padding:20px 24px}';
  html += '.header h1{font-family:monospace;font-size:20px;color:#f8fafc}';
  html += '.header p{font-size:12px;color:#475569;margin-top:4px}';
  html += '.stats{display:flex;gap:12px;margin-top:12px;flex-wrap:wrap}';
  html += '.stat{background:#12141a;border:1px solid #1e2130;border-radius:8px;padding:10px 14px;font-size:11px}';
  html += '.stat span{color:#fbbf24;font-weight:700;font-size:15px}';
  html += '.stat.cve{border-color:#ef4444}';
  html += '.tabs{display:flex;gap:0;border-bottom:1px solid #1e2130;background:#0d1117;padding:0 24px;overflow-x:auto}';
  html += '.tab{padding:12px 16px;cursor:pointer;color:#64748b;font-size:12px;font-weight:600;border-bottom:2px solid transparent;white-space:nowrap}';
  html += '.tab.active{color:#fbbf24;border-bottom-color:#fbbf24}.tab:hover{color:#fbbf24}';
  html += '.controls{padding:16px 24px;display:flex;gap:10px;flex-wrap:wrap;align-items:center}';
  html += '.search{background:#12141a;border:1px solid #1e2130;border-radius:6px;padding:8px 14px;color:#e2e8f0;font-size:13px;width:280px;outline:none}';
  html += '.search:focus{border-color:#fbbf24}';
  html += 'select{background:#12141a;border:1px solid #1e2130;border-radius:6px;padding:8px 10px;color:#e2e8f0;font-size:11px;outline:none}';
  html += '.content{padding:0 24px 40px}';
  html += 'table{width:100%;border-collapse:collapse;font-size:12px;margin-top:8px}';
  html += 'th{text-align:left;padding:8px 10px;background:#12141a;color:#94a3b8;font-weight:600;border-bottom:1px solid #1e2130;cursor:pointer;white-space:nowrap}';
  html += 'th:hover{color:#fbbf24}';
  html += 'td{padding:8px 10px;border-bottom:1px solid #0d1117;color:#cbd5e1;max-width:350px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}';
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
  // Severity badges
  html += '.badge.critical{background:#dc262640;color:#fca5a5}';
  html += '.badge.high{background:#f97316;color:#fff}';
  html += '.badge.medium{background:#eab308;color:#000}';
  html += '.badge.low{background:#22c55e40;color:#86efac}';
  // Status badges
  html += '.badge.active{background:#22c55e30;color:#86efac}';
  html += '.badge.paused{background:#eab30830;color:#fde047}';
  html += '.badge.closed{background:#64748b30;color:#94a3b8}';
  html += '.count{color:#64748b;font-size:11px;margin-left:8px}';
  html += '.empty{text-align:center;padding:60px 20px;color:#475569}';
  html += '.date{color:#64748b;font-size:11px}';
  html += '.programs-list{font-size:10px;color:#94a3b8}';
  html += '.cve-card{background:#12141a;border:1px solid #1e2130;border-radius:8px;padding:16px;margin-bottom:12px}';
  html += '.cve-card h3{font-size:14px;color:#f8fafc;margin-bottom:8px}';
  html += '.cve-card p{font-size:12px;color:#94a3b8;margin-bottom:8px}';
  html += '.cve-programs{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}';
  html += '.cve-program{background:#1e293b;padding:4px 8px;border-radius:4px;font-size:10px}';
  html += '@media(max-width:768px){.search{width:100%}.stats{flex-direction:column}.controls{flex-direction:column}td,th{padding:6px 8px;font-size:11px}}';
  html += '</style></head><body>';

  // Header
  html += '<div class="header">';
  html += '<h1>&#128274; Bounty Radar v2</h1>';
  html += '<p>Bug bounty research tool — search reports, programs, CVE hunting opportunities</p>';
  html += '<p style="margin-top:4px;font-size:11px;color:#334155">Last updated: ' + updatedAt + '</p>';
  html += '<div class="stats">';
  html += '<div class="stat cve">&#127919; CVE Hunting<br><span>' + cveCount + '</span> opportunities</div>';
  html += '<div class="stat">&#128203; HackerOne<br><span>' + h1Count + '</span> reports</div>';
  html += '<div class="stat">&#128737; Immunefi<br><span>' + imCount + '</span> programs</div>';
  html += '<div class="stat">&#128025; GitHub<br><span>' + ghCount + '</span> repos</div>';
  html += '<div class="stat">&#128279; Programs<br><span>' + activePrograms + '</span> active</div>';
  html += '</div></div>';

  // Tabs
  html += '<div class="tabs">';
  html += '<div class="tab active" onclick="showTab(\'cve\',this)">&#127919; CVE Hunting</div>';
  html += '<div class="tab" onclick="showTab(\'h1\',this)">&#128203; HackerOne</div>';
  html += '<div class="tab" onclick="showTab(\'immunefi\',this)">&#128737; Immunefi</div>';
  html += '<div class="tab" onclick="showTab(\'programs\',this)">&#128279; All Programs</div>';
  html += '<div class="tab" onclick="showTab(\'github\',this)">&#128025; GitHub</div>';
  html += '</div>';

  // Controls
  html += '<div class="controls">';
  html += '<input class="search" type="text" id="searchInput" placeholder="Search CVEs, reports, programs..." oninput="filterData()">';
  html += '<select id="severityFilter" onchange="filterData()"><option value="">All Severity</option><option value="CRITICAL">🔴 Critical</option><option value="HIGH">🟠 High</option><option value="MEDIUM">🟡 Medium</option><option value="LOW">🟢 Low</option></select>';
  html += '<select id="statusFilter" onchange="filterData()"><option value="">All Status</option><option value="active">🟢 Active</option><option value="paused">🟡 Paused</option><option value="closed">🔴 Closed</option></select>';
  html += '<select id="ecosystemFilter" onchange="filterData()"><option value="">All Ecosystems</option><option value="npm">npm</option><option value="pip">pip</option><option value="go">go</option><option value="maven">maven</option><option value="rubygems">rubygems</option><option value="solidity">solidity</option></select>';
  html += '<select id="bugTypeFilter" onchange="filterData()"><option value="">All Bug Types</option></select>';
  html += '<select id="sortBy" onchange="filterData()">';
  html += '<option value="newest">Sort: Newest &#8595;</option>';
  html += '<option value="bounty">Sort: Bounty &#8595;</option>';
  html += '<option value="severity">Sort: Severity &#8595;</option>';
  html += '<option value="upvotes">Sort: Upvotes &#8595;</option>';
  html += '</select>';
  html += '<span class="count" id="resultCount"></span>';
  html += '</div>';

  // Content
  html += '<div class="content">';
  html += '<div id="cveTable"></div>';
  html += '<div id="h1Table" style="display:none"></div>';
  html += '<div id="immunefiTable" style="display:none"></div>';
  html += '<div id="programsTable" style="display:none"></div>';
  html += '<div id="githubTable" style="display:none"></div>';
  html += '</div>';

  // Script
  html += '<script>';
  html += 'var DATA=' + jsonData + ';';
  html += 'var currentTab="cve";';

  // Populate bug type filter
  html += 'var bugTypes=[],seen={};DATA.hackerone.reports.forEach(function(r){if(!seen[r.bug_type]){seen[r.bug_type]=1;bugTypes.push(r.bug_type)}});bugTypes.sort();';
  html += 'var sel=document.getElementById("bugTypeFilter");bugTypes.forEach(function(t){var o=document.createElement("option");o.value=t;o.textContent=t;sel.appendChild(o)});';

  // showTab
  html += 'function showTab(tab,el){currentTab=tab;document.querySelectorAll(".tab").forEach(function(t){t.classList.remove("active")});el.classList.add("active");';
  html += 'document.getElementById("cveTable").style.display=tab==="cve"?"":"none";';
  html += 'document.getElementById("h1Table").style.display=tab==="h1"?"":"none";';
  html += 'document.getElementById("immunefiTable").style.display=tab==="immunefi"?"":"none";';
  html += 'document.getElementById("programsTable").style.display=tab==="programs"?"":"none";';
  html += 'document.getElementById("githubTable").style.display=tab==="github"?"":"none";';
  // Show/hide relevant filters
  html += 'document.getElementById("severityFilter").style.display=(tab==="cve")?"":"none";';
  html += 'document.getElementById("ecosystemFilter").style.display=(tab==="cve")?"":"none";';
  html += 'document.getElementById("statusFilter").style.display=(tab==="cve"||tab==="programs")?"":"none";';
  html += 'document.getElementById("bugTypeFilter").style.display=(tab==="h1")?"":"none";';
  html += 'filterData()}';

  // filterData
  html += 'function filterData(){var q=document.getElementById("searchInput").value.toLowerCase();var severity=document.getElementById("severityFilter").value;var status=document.getElementById("statusFilter").value;var ecosystem=document.getElementById("ecosystemFilter").value;var bugType=document.getElementById("bugTypeFilter").value;var sortBy=document.getElementById("sortBy").value;';
  html += 'if(currentTab==="cve")renderCVE(q,severity,status,ecosystem,sortBy);';
  html += 'else if(currentTab==="h1")renderH1(q,bugType,sortBy);';
  html += 'else if(currentTab==="immunefi")renderImmunefi(q,sortBy);';
  html += 'else if(currentTab==="programs")renderPrograms(q,status,sortBy);';
  html += 'else renderGithub(q)}';

  // Helper functions
  html += 'function badgeClass(type){var t=type.toLowerCase();if(t.indexOf("xss")>=0)return"xss";if(t.indexOf("idor")>=0)return"idor";if(t.indexOf("ssrf")>=0)return"ssrf";if(t.indexOf("rce")>=0)return"rce";if(t.indexOf("sqli")>=0||t.indexOf("sql")>=0)return"sqli";if(t.indexOf("csrf")>=0)return"csrf";return""}';
  html += 'function severityClass(s){return(s||"").toLowerCase()}';
  html += 'function statusClass(s){return(s||"active").toLowerCase()}';
  html += 'function fmtDate(d){if(!d)return"-";try{return new Date(d).toLocaleDateString()}catch(e){return"-"}}';
  html += 'function severityOrder(s){var o={CRITICAL:0,HIGH:1,MEDIUM:2,LOW:3};return o[s]||4}';

  // renderCVE
  html += 'function renderCVE(q,severity,status,ecosystem,sortBy){';
  html += 'var opps=(DATA.cve_hunting&&DATA.cve_hunting.opportunities)||[];';
  html += 'opps=opps.filter(function(o){';
  html += 'if(severity&&o.severity!==severity)return false;';
  html += 'if(ecosystem&&o.ecosystem!==ecosystem)return false;';
  html += 'if(status){var hasStatus=o.affected_programs&&o.affected_programs.some(function(p){return p.status===status});if(!hasStatus)return false}';
  html += 'if(q&&o.id.toLowerCase().indexOf(q)<0&&o.description.toLowerCase().indexOf(q)<0&&o.bug_type.toLowerCase().indexOf(q)<0)return false;';
  html += 'return true});';
  // Sort
  html += 'if(sortBy==="severity")opps.sort(function(a,b){return severityOrder(a.severity)-severityOrder(b.severity)});';
  html += 'else if(sortBy==="bounty")opps.sort(function(a,b){return(b.max_potential_bounty||0)-(a.max_potential_bounty||0)});';
  html += 'else opps.sort(function(a,b){return(b.published||"").localeCompare(a.published||"")});';
  html += 'document.getElementById("resultCount").textContent=opps.length+" opportunities";';
  // Render table
  html += 'var h="<table><tr><th>CVE ID</th><th>Severity</th><th>Bug Type</th><th>Ecosystem</th><th>Published</th><th>Affected Programs</th><th>Max Bounty</th></tr>";';
  html += 'opps.slice(0,100).forEach(function(o){';
  html += 'var programs=o.affected_programs||[];';
  html += 'var progList=programs.slice(0,3).map(function(p){return"<span class=\\"badge "+statusClass(p.status)+"\\">"+p.name+"</span>"}).join(" ");';
  html += 'if(programs.length>3)progList+=" <span class=\\"badge\\">+"+(programs.length-3)+" more</span>";';
  html += 'if(programs.length===0)progList="<span class=\\"programs-list\\">Match by tech stack</span>";';
  html += 'h+="<tr>";';
  html += 'h+="<td><a href=\\""+o.url+"\\" target=\\"_blank\\">"+o.id+"</a></td>";';
  html += 'h+="<td><span class=\\"badge "+severityClass(o.severity)+"\\">"+o.severity+"</span></td>";';
  html += 'h+="<td><span class=\\"badge "+badgeClass(o.bug_type)+"\\">"+o.bug_type+"</span></td>";';
  html += 'h+="<td>"+o.ecosystem+"</td>";';
  html += 'h+="<td class=\\"date\\">"+o.published+"</td>";';
  html += 'h+="<td>"+progList+"</td>";';
  html += 'h+="<td class=\\"bounty\\">"+(o.max_potential_bounty>0?"$"+o.max_potential_bounty.toLocaleString():"-")+"</td>";';
  html += 'h+="</tr>"});';
  html += 'h+="</table>";if(opps.length===0)h="<div class=\\"empty\\">No CVE hunting opportunities found. Try adjusting filters.</div>";';
  html += 'document.getElementById("cveTable").innerHTML=h}';

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

  // renderPrograms (NEW - All Programs tab)
  html += 'function renderPrograms(q,status,sortBy){';
  html += 'var programs=(DATA.all_programs&&DATA.all_programs.programs)||[];';
  html += 'programs=programs.filter(function(p){';
  html += 'if(status&&p.status!==status)return false;';
  html += 'if(q&&p.name.toLowerCase().indexOf(q)<0&&(p.technologies||"").toLowerCase().indexOf(q)<0&&(p.platform||"").toLowerCase().indexOf(q)<0)return false;';
  html += 'return true});';
  html += 'if(sortBy==="bounty")programs.sort(function(a,b){return(b.bounty_max||0)-(a.bounty_max||0)});';
  html += 'else programs.sort(function(a,b){return a.name.localeCompare(b.name)});';
  html += 'document.getElementById("resultCount").textContent=programs.length+" programs";';
  html += 'var h="<table><tr><th>#</th><th>Program</th><th>Platform</th><th>Status</th><th>Technologies</th><th>Max Bounty</th><th>Link</th></tr>";';
  html += 'programs.slice(0,200).forEach(function(p,i){';
  html += 'h+="<tr><td>"+(i+1)+"</td>";';
  html += 'h+="<td>"+p.name+"</td>";';
  html += 'h+="<td>"+(p.platform||"unknown")+"</td>";';
  html += 'h+="<td><span class=\\"badge "+statusClass(p.status)+"\\">"+(p.status||"active")+"</span></td>";';
  html += 'h+="<td>"+(p.technologies||"-")+"</td>";';
  html += 'h+="<td class=\\"bounty\\">"+(p.bounty_max?"$"+p.bounty_max.toLocaleString():"-")+"</td>";';
  html += 'h+="<td><a href=\\""+p.url+"\\" target=\\"_blank\\">View &#8594;</a></td></tr>"});';
  html += 'h+="</table>";if(programs.length===0)h="<div class=\\"empty\\">No programs found</div>";';
  html += 'document.getElementById("programsTable").innerHTML=h}';

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