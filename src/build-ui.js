/**
 * Bounty Radar v3 - Build Web UI with Exploits, Findings, Patterns
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
    cve_hunting: { opportunities: [], stats: {} },
    exploits: { data: [], stats: {} },
    audit_findings: { data: [], stats: {} },
    vuln_patterns: { data: [] },
    all_programs: { programs: [] },
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
  var exploitCount = data.exploits?.total || 0;
  var exploitLoss = data.exploits?.stats?.total_loss_usd || 0;
  var findingsCount = data.audit_findings?.total || 0;
  var patternsCount = data.vuln_patterns?.total || 0;
  var programCount = data.all_programs?.total || 0;
  var jsonData = JSON.stringify(data);

  var html = '';
  html += '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">';
  html += '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
  html += '<title>Bounty Radar v3</title>';
  html += '<style>';
  html += '*{margin:0;padding:0;box-sizing:border-box}';
  html += 'body{font-family:system-ui,sans-serif;background:#0a0f1a;color:#e2e8f0;min-height:100vh}';
  html += '.header{background:#0d1117;border-bottom:1px solid #1e2130;padding:20px 24px}';
  html += '.header h1{font-family:monospace;font-size:20px;color:#f8fafc}';
  html += '.header p{font-size:12px;color:#475569;margin-top:4px}';
  html += '.stats{display:flex;gap:10px;margin-top:12px;flex-wrap:wrap}';
  html += '.stat{background:#12141a;border:1px solid #1e2130;border-radius:8px;padding:8px 12px;font-size:10px}';
  html += '.stat span{color:#fbbf24;font-weight:700;font-size:14px}';
  html += '.stat.highlight{border-color:#ef4444;background:#1a1214}';
  html += '.tabs{display:flex;gap:0;border-bottom:1px solid #1e2130;background:#0d1117;padding:0 16px;overflow-x:auto}';
  html += '.tab{padding:10px 14px;cursor:pointer;color:#64748b;font-size:11px;font-weight:600;border-bottom:2px solid transparent;white-space:nowrap}';
  html += '.tab.active{color:#fbbf24;border-bottom-color:#fbbf24}.tab:hover{color:#fbbf24}';
  html += '.controls{padding:12px 24px;display:flex;gap:8px;flex-wrap:wrap;align-items:center}';
  html += '.search{background:#12141a;border:1px solid #1e2130;border-radius:6px;padding:8px 12px;color:#e2e8f0;font-size:12px;width:240px;outline:none}';
  html += '.search:focus{border-color:#fbbf24}';
  html += 'select{background:#12141a;border:1px solid #1e2130;border-radius:6px;padding:6px 10px;color:#e2e8f0;font-size:11px;outline:none}';
  html += '.content{padding:0 24px 40px}';
  html += 'table{width:100%;border-collapse:collapse;font-size:11px;margin-top:8px}';
  html += 'th{text-align:left;padding:8px;background:#12141a;color:#94a3b8;font-weight:600;border-bottom:1px solid #1e2130;white-space:nowrap}';
  html += 'td{padding:8px;border-bottom:1px solid #0d1117;color:#cbd5e1;max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}';
  html += 'tr:hover td{background:#12141a}';
  html += 'a{color:#fbbf24;text-decoration:none}a:hover{text-decoration:underline}';
  html += '.money{color:#22c55e;font-weight:700}';
  html += '.loss{color:#ef4444;font-weight:700}';
  html += '.badge{display:inline-block;padding:2px 6px;border-radius:4px;font-size:9px;font-weight:600;margin-right:3px}';
  html += '.badge.critical{background:#dc262640;color:#fca5a5}';
  html += '.badge.high{background:#f9731640;color:#fdba74}';
  html += '.badge.medium{background:#eab30840;color:#fde047}';
  html += '.badge.low{background:#22c55e40;color:#86efac}';
  html += '.badge.info{background:#3b82f640;color:#93c5fd}';
  html += '.badge.active{background:#22c55e30;color:#86efac}';
  html += '.badge.paused{background:#eab30830;color:#fde047}';
  html += '.badge.closed{background:#64748b30;color:#94a3b8}';
  // Bug type badges
  html += '.badge.reentrancy{background:#dc262630;color:#fca5a5}';
  html += '.badge.flashloan{background:#f9731630;color:#fdba74}';
  html += '.badge.oracle{background:#8b5cf630;color:#c4b5fd}';
  html += '.badge.access{background:#ef444430;color:#f87171}';
  html += '.badge.logic{background:#06b6d430;color:#67e8f9}';
  html += '.badge.bridge{background:#ec489930;color:#f9a8d4}';
  html += '.count{color:#64748b;font-size:11px;margin-left:8px}';
  html += '.empty{text-align:center;padding:60px 20px;color:#475569}';
  html += '.pattern-card{background:#12141a;border:1px solid #1e2130;border-radius:8px;padding:16px;margin-bottom:12px}';
  html += '.pattern-card h3{font-size:14px;color:#f8fafc;margin-bottom:8px}';
  html += '.pattern-card p{font-size:12px;color:#94a3b8;margin-bottom:6px;line-height:1.5}';
  html += '.pattern-card code{background:#1e293b;padding:2px 6px;border-radius:4px;font-size:11px;color:#fbbf24}';
  html += '.keywords{display:flex;flex-wrap:wrap;gap:4px;margin-top:8px}';
  html += '.keyword{background:#1e293b;padding:2px 6px;border-radius:4px;font-size:10px;color:#94a3b8}';
  html += '@media(max-width:768px){.search{width:100%}.stats{flex-direction:column}.controls{flex-direction:column}td,th{padding:6px;font-size:10px}}';
  html += '</style></head><body>';

  // Header
  html += '<div class="header">';
  html += '<h1>&#128274; Bounty Radar v3</h1>';
  html += '<p>Bug bounty research — CVE hunting, exploits, audit findings, vulnerability patterns</p>';
  html += '<p style="font-size:10px;color:#334155;margin-top:4px">Updated: ' + updatedAt + '</p>';
  html += '<div class="stats">';
  html += '<div class="stat highlight">&#127919; CVE<br><span>' + cveCount + '</span></div>';
  html += '<div class="stat highlight">&#128128; Exploits<br><span>' + exploitCount + '</span></div>';
  html += '<div class="stat">&#128218; Findings<br><span>' + findingsCount + '</span></div>';
  html += '<div class="stat">&#128203; H1<br><span>' + h1Count + '</span></div>';
  html += '<div class="stat">&#128737; Immunefi<br><span>' + imCount + '</span></div>';
  html += '<div class="stat">&#128279; Programs<br><span>' + programCount + '</span></div>';
  html += '</div></div>';

  // Tabs
  html += '<div class="tabs">';
  html += '<div class="tab active" onclick="showTab(\'cve\',this)">&#127919; CVE Hunting</div>';
  html += '<div class="tab" onclick="showTab(\'exploits\',this)">&#128128; Exploits</div>';
  html += '<div class="tab" onclick="showTab(\'findings\',this)">&#128218; Audit Findings</div>';
  html += '<div class="tab" onclick="showTab(\'patterns\',this)">&#128203; Vuln Patterns</div>';
  html += '<div class="tab" onclick="showTab(\'h1\',this)">&#128203; HackerOne</div>';
  html += '<div class="tab" onclick="showTab(\'immunefi\',this)">&#128737; Immunefi</div>';
  html += '<div class="tab" onclick="showTab(\'programs\',this)">&#128279; Programs</div>';
  html += '<div class="tab" onclick="showTab(\'github\',this)">&#128025; GitHub</div>';
  html += '</div>';

  // Controls
  html += '<div class="controls">';
  html += '<input class="search" type="text" id="searchInput" placeholder="Search..." oninput="filterData()">';
  html += '<select id="severityFilter" onchange="filterData()"><option value="">All Severity</option><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select>';
  html += '<select id="categoryFilter" onchange="filterData()"><option value="">All Categories</option></select>';
  html += '<select id="sortBy" onchange="filterData()"><option value="newest">Newest</option><option value="loss">Biggest Loss</option><option value="bounty">Bounty</option></select>';
  html += '<span class="count" id="resultCount"></span>';
  html += '</div>';

  // Content divs
  html += '<div class="content">';
  html += '<div id="cveTable"></div>';
  html += '<div id="exploitsTable" style="display:none"></div>';
  html += '<div id="findingsTable" style="display:none"></div>';
  html += '<div id="patternsTable" style="display:none"></div>';
  html += '<div id="h1Table" style="display:none"></div>';
  html += '<div id="immunefiTable" style="display:none"></div>';
  html += '<div id="programsTable" style="display:none"></div>';
  html += '<div id="githubTable" style="display:none"></div>';
  html += '</div>';

  // Script
  html += '<script>';
  html += 'var DATA=' + jsonData + ';';
  html += 'var currentTab="cve";';

  // Populate category filter dynamically
  html += 'function populateCategories(){var cats=new Set();';
  html += '(DATA.exploits?.data||[]).forEach(function(e){if(e.category)cats.add(e.category)});';
  html += '(DATA.vuln_patterns?.data||[]).forEach(function(p){if(p.category)cats.add(p.category)});';
  html += 'var sel=document.getElementById("categoryFilter");';
  html += 'Array.from(cats).sort().forEach(function(c){var o=document.createElement("option");o.value=c;o.textContent=c;sel.appendChild(o)});}';
  html += 'populateCategories();';

  // Show tab
  html += 'function showTab(tab,el){currentTab=tab;';
  html += 'document.querySelectorAll(".tab").forEach(function(t){t.classList.remove("active")});el.classList.add("active");';
  html += '["cve","exploits","findings","patterns","h1","immunefi","programs","github"].forEach(function(t){';
  html += 'document.getElementById(t+"Table").style.display=t===tab?"":"none"});';
  html += 'filterData();}';

  // Filter
  html += 'function filterData(){';
  html += 'var q=document.getElementById("searchInput").value.toLowerCase();';
  html += 'var sev=document.getElementById("severityFilter").value.toLowerCase();';
  html += 'var cat=document.getElementById("categoryFilter").value;';
  html += 'var sort=document.getElementById("sortBy").value;';
  html += 'if(currentTab==="cve")renderCVE(q,sev,cat,sort);';
  html += 'else if(currentTab==="exploits")renderExploits(q,cat,sort);';
  html += 'else if(currentTab==="findings")renderFindings(q,sev,cat,sort);';
  html += 'else if(currentTab==="patterns")renderPatterns(q,sev,cat);';
  html += 'else if(currentTab==="h1")renderH1(q,sev,sort);';
  html += 'else if(currentTab==="immunefi")renderImmunefi(q,sort);';
  html += 'else if(currentTab==="programs")renderPrograms(q,sort);';
  html += 'else renderGithub(q);}';

  // Helpers
  html += 'function catBadge(c){var cls="";var cl=c.toLowerCase();';
  html += 'if(cl.indexOf("reentr")>=0)cls="reentrancy";';
  html += 'else if(cl.indexOf("flash")>=0)cls="flashloan";';
  html += 'else if(cl.indexOf("oracle")>=0)cls="oracle";';
  html += 'else if(cl.indexOf("access")>=0)cls="access";';
  html += 'else if(cl.indexOf("logic")>=0)cls="logic";';
  html += 'else if(cl.indexOf("bridge")>=0)cls="bridge";';
  html += 'return"<span class=\\"badge "+cls+"\\">"+c+"</span>";}';
  
  html += 'function sevBadge(s){return"<span class=\\"badge "+(s||"medium").toLowerCase()+"\\">"+((s||"medium").toUpperCase())+"</span>";}';
  html += 'function fmtMoney(n){if(!n)return"-";if(n>=1e9)return"$"+(n/1e9).toFixed(2)+"B";if(n>=1e6)return"$"+(n/1e6).toFixed(1)+"M";if(n>=1e3)return"$"+(n/1e3).toFixed(0)+"K";return"$"+n;}';

  // Render CVE
  html += 'function renderCVE(q,sev,cat,sort){';
  html += 'var items=(DATA.cve_hunting?.opportunities||[]).filter(function(o){';
  html += 'if(sev&&o.severity.toLowerCase()!==sev)return false;';
  html += 'if(q&&(o.id+" "+o.description+" "+o.bug_type).toLowerCase().indexOf(q)<0)return false;return true});';
  html += 'if(sort==="newest")items.sort(function(a,b){return(b.published||"").localeCompare(a.published||"")});';
  html += 'document.getElementById("resultCount").textContent=items.length+" opportunities";';
  html += 'var h="<table><tr><th>CVE</th><th>Severity</th><th>Type</th><th>Ecosystem</th><th>Published</th><th>Programs</th><th>Max Bounty</th></tr>";';
  html += 'items.slice(0,100).forEach(function(o){';
  html += 'var progs=(o.affected_programs||[]).slice(0,2).map(function(p){return p.name}).join(", ");';
  html += 'if((o.affected_programs||[]).length>2)progs+=" +"+((o.affected_programs||[]).length-2);';
  html += 'h+="<tr><td><a href=\\""+o.url+"\\" target=\\"_blank\\">"+o.id+"</a></td>";';
  html += 'h+="<td>"+sevBadge(o.severity)+"</td>";';
  html += 'h+="<td>"+catBadge(o.bug_type||"Other")+"</td>";';
  html += 'h+="<td>"+(o.ecosystem||"-")+"</td>";';
  html += 'h+="<td>"+(o.published||"-")+"</td>";';
  html += 'h+="<td>"+(progs||"-")+"</td>";';
  html += 'h+="<td class=\\"money\\">"+fmtMoney(o.max_potential_bounty)+"</td></tr>"});';
  html += 'h+="</table>";if(items.length===0)h="<div class=\\"empty\\">No CVE opportunities found</div>";';
  html += 'document.getElementById("cveTable").innerHTML=h}';

  // Render Exploits
  html += 'function renderExploits(q,cat,sort){';
  html += 'var items=(DATA.exploits?.data||[]).filter(function(e){';
  html += 'if(cat&&e.category!==cat)return false;';
  html += 'if(q&&(e.protocol+" "+e.description+" "+e.category).toLowerCase().indexOf(q)<0)return false;return true});';
  html += 'if(sort==="loss")items.sort(function(a,b){return(b.loss_usd||0)-(a.loss_usd||0)});';
  html += 'else items.sort(function(a,b){return(b.date||"").localeCompare(a.date||"")});';
  html += 'document.getElementById("resultCount").textContent=items.length+" exploits";';
  html += 'var h="<table><tr><th>Date</th><th>Protocol</th><th>Loss</th><th>Category</th><th>Description</th></tr>";';
  html += 'items.slice(0,100).forEach(function(e){';
  html += 'h+="<tr><td>"+(e.date||"-")+"</td>";';
  html += 'h+="<td><b>"+e.protocol+"</b></td>";';
  html += 'h+="<td class=\\"loss\\">"+fmtMoney(e.loss_usd)+"</td>";';
  html += 'h+="<td>"+catBadge(e.category||"Other")+"</td>";';
  html += 'h+="<td>"+(e.description||"").substring(0,80)+"</td></tr>"});';
  html += 'h+="</table>";if(items.length===0)h="<div class=\\"empty\\">No exploits found</div>";';
  html += 'document.getElementById("exploitsTable").innerHTML=h}';

  // Render Findings
  html += 'function renderFindings(q,sev,cat,sort){';
  html += 'var items=(DATA.audit_findings?.data||[]).filter(function(f){';
  html += 'if(sev&&(f.severity||"").toLowerCase()!==sev)return false;';
  html += 'if(cat&&f.category!==cat)return false;';
  html += 'if(q&&(f.title+" "+f.protocol+" "+f.description).toLowerCase().indexOf(q)<0)return false;return true});';
  html += 'items.sort(function(a,b){return(b.date||"").localeCompare(a.date||"")});';
  html += 'document.getElementById("resultCount").textContent=items.length+" findings";';
  html += 'var h="<table><tr><th>Severity</th><th>Title</th><th>Protocol</th><th>Category</th><th>Auditor</th></tr>";';
  html += 'items.slice(0,100).forEach(function(f){';
  html += 'h+="<tr><td>"+sevBadge(f.severity)+"</td>";';
  html += 'h+="<td>"+(f.url?"<a href=\\""+f.url+"\\" target=\\"_blank\\">":"")+((f.title||"").substring(0,60))+(f.url?"</a>":"")+"</td>";';
  html += 'h+="<td>"+(f.protocol||"-")+"</td>";';
  html += 'h+="<td>"+catBadge(f.category||"Other")+"</td>";';
  html += 'h+="<td>"+(f.auditor||"-")+"</td></tr>"});';
  html += 'h+="</table>";if(items.length===0)h="<div class=\\"empty\\">No findings found</div>";';
  html += 'document.getElementById("findingsTable").innerHTML=h}';

  // Render Patterns (cards)
  html += 'function renderPatterns(q,sev,cat){';
  html += 'var items=(DATA.vuln_patterns?.data||[]).filter(function(p){';
  html += 'if(sev&&p.severity!==sev)return false;';
  html += 'if(cat&&p.category!==cat)return false;';
  html += 'if(q&&(p.name+" "+p.description+" "+p.how_to_find).toLowerCase().indexOf(q)<0)return false;return true});';
  html += 'document.getElementById("resultCount").textContent=items.length+" patterns";';
  html += 'var h="";items.forEach(function(p){';
  html += 'h+="<div class=\\"pattern-card\\">";';
  html += 'h+="<h3>"+sevBadge(p.severity)+" "+p.name+"</h3>";';
  html += 'h+="<p><b>Category:</b> "+catBadge(p.category)+"</p>";';
  html += 'h+="<p>"+p.description+"</p>";';
  html += 'h+="<p><b>How to find:</b> "+p.how_to_find+"</p>";';
  html += 'if(p.example_vulnerable)h+="<p><b>Vulnerable:</b> <code>"+p.example_vulnerable.substring(0,100)+"</code></p>";';
  html += 'if(p.keywords&&p.keywords.length){h+="<div class=\\"keywords\\">Keywords: ";p.keywords.forEach(function(k){h+="<span class=\\"keyword\\">"+k+"</span>"});h+="</div>"}';
  html += 'h+="</div>"});';
  html += 'if(items.length===0)h="<div class=\\"empty\\">No patterns found</div>";';
  html += 'document.getElementById("patternsTable").innerHTML=h}';

  // Render H1
  html += 'function renderH1(q,sev,sort){';
  html += 'var items=(DATA.hackerone?.reports||[]).filter(function(r){';
  html += 'if(q&&(r.title+" "+r.program+" "+r.bug_type).toLowerCase().indexOf(q)<0)return false;return true});';
  html += 'if(sort==="bounty")items.sort(function(a,b){return(b.bounty||0)-(a.bounty||0)});';
  html += 'document.getElementById("resultCount").textContent=items.length+" reports";';
  html += 'var h="<table><tr><th>#</th><th>Title</th><th>Bug Type</th><th>Program</th><th>Bounty</th><th>Upvotes</th></tr>";';
  html += 'items.slice(0,200).forEach(function(r,i){';
  html += 'h+="<tr><td>"+(i+1)+"</td>";';
  html += 'h+="<td><a href=\\""+r.url+"\\" target=\\"_blank\\">"+r.title.substring(0,60)+"</a></td>";';
  html += 'h+="<td>"+catBadge(r.bug_type)+"</td>";';
  html += 'h+="<td>"+r.program+"</td>";';
  html += 'h+="<td class=\\"money\\">"+(r.bounty?"$"+r.bounty.toLocaleString():"-")+"</td>";';
  html += 'h+="<td>"+r.upvotes+"</td></tr>"});';
  html += 'h+="</table>";document.getElementById("h1Table").innerHTML=h}';

  // Render Immunefi
  html += 'function renderImmunefi(q,sort){';
  html += 'var items=(DATA.immunefi?.programs||[]).filter(function(p){';
  html += 'if(q&&(p.name+" "+p.technologies).toLowerCase().indexOf(q)<0)return false;return true});';
  html += 'if(sort==="bounty")items.sort(function(a,b){return(b.max_bounty||0)-(a.max_bounty||0)});';
  html += 'document.getElementById("resultCount").textContent=items.length+" programs";';
  html += 'var h="<table><tr><th>#</th><th>Program</th><th>Max Bounty</th><th>Technologies</th><th>Link</th></tr>";';
  html += 'items.slice(0,100).forEach(function(p,i){';
  html += 'h+="<tr><td>"+(i+1)+"</td>";';
  html += 'h+="<td><b>"+p.name+"</b></td>";';
  html += 'h+="<td class=\\"money\\">"+fmtMoney(p.max_bounty)+"</td>";';
  html += 'h+="<td>"+(p.technologies||"-")+"</td>";';
  html += 'h+="<td><a href=\\""+p.url+"\\" target=\\"_blank\\">View</a></td></tr>"});';
  html += 'h+="</table>";document.getElementById("immunefiTable").innerHTML=h}';

  // Render Programs
  html += 'function renderPrograms(q,sort){';
  html += 'var items=(DATA.all_programs?.programs||[]).filter(function(p){';
  html += 'if(q&&(p.name+" "+(p.technologies||"")+" "+(p.platform||"")).toLowerCase().indexOf(q)<0)return false;return true});';
  html += 'if(sort==="bounty")items.sort(function(a,b){return(b.bounty_max||0)-(a.bounty_max||0)});';
  html += 'document.getElementById("resultCount").textContent=items.length+" programs";';
  html += 'var h="<table><tr><th>Program</th><th>Platform</th><th>Status</th><th>Tech</th><th>Max Bounty</th></tr>";';
  html += 'items.slice(0,150).forEach(function(p){';
  html += 'var statusCls=(p.status||"active").toLowerCase();';
  html += 'h+="<tr><td><b>"+p.name+"</b></td>";';
  html += 'h+="<td>"+(p.platform||"-")+"</td>";';
  html += 'h+="<td><span class=\\"badge "+statusCls+"\\">"+statusCls+"</span></td>";';
  html += 'h+="<td>"+(p.technologies||"-")+"</td>";';
  html += 'h+="<td class=\\"money\\">"+fmtMoney(p.bounty_max)+"</td></tr>"});';
  html += 'h+="</table>";document.getElementById("programsTable").innerHTML=h}';

  // Render GitHub
  html += 'function renderGithub(q){';
  html += 'var items=(DATA.github?.repos||[]).filter(function(r){';
  html += 'if(q&&(r.full_name+" "+r.description).toLowerCase().indexOf(q)<0)return false;return true});';
  html += 'document.getElementById("resultCount").textContent=items.length+" repos";';
  html += 'var h="<table><tr><th>Repo</th><th>Stars</th><th>Language</th><th>Description</th></tr>";';
  html += 'items.forEach(function(r){';
  html += 'h+="<tr><td><a href=\\""+r.url+"\\" target=\\"_blank\\">"+r.full_name+"</a></td>";';
  html += 'h+="<td>⭐ "+r.stars+"</td>";';
  html += 'h+="<td>"+(r.language||"-")+"</td>";';
  html += 'h+="<td>"+(r.description||"").substring(0,60)+"</td></tr>"});';
  html += 'h+="</table>";document.getElementById("githubTable").innerHTML=h}';

  // Init
  html += 'filterData();';
  html += '</script></body></html>';

  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(path.join(docsDir, "index.html"), html, "utf-8");
  console.log("Web UI built: docs/index.html");
}

buildHtml();