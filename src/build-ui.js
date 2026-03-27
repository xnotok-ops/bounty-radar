/**
 * Bounty Radar v3.1 - Interactive Research Tool
 * Features: Expandable rows, PoC links, Copy code
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
  var cveCount = data.cve_hunting?.total_opportunities || 0;
  var exploitCount = data.exploits?.total || 0;
  var findingsCount = data.audit_findings?.total || 0;
  var patternsCount = data.vuln_patterns?.total || 0;
  var programCount = data.all_programs?.total || 0;
  var jsonData = JSON.stringify(data);

  var html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Bounty Radar v3.1</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,sans-serif;background:#0a0f1a;color:#e2e8f0;min-height:100vh}
.header{background:#0d1117;border-bottom:1px solid #1e2130;padding:20px 24px}
.header h1{font-family:monospace;font-size:20px;color:#f8fafc}
.header p{font-size:12px;color:#475569;margin-top:4px}
.stats{display:flex;gap:10px;margin-top:12px;flex-wrap:wrap}
.stat{background:#12141a;border:1px solid #1e2130;border-radius:8px;padding:8px 12px;font-size:10px}
.stat span{color:#fbbf24;font-weight:700;font-size:14px}
.stat.highlight{border-color:#ef4444;background:#1a1214}
.tabs{display:flex;gap:0;border-bottom:1px solid #1e2130;background:#0d1117;padding:0 16px;overflow-x:auto}
.tab{padding:10px 14px;cursor:pointer;color:#64748b;font-size:11px;font-weight:600;border-bottom:2px solid transparent;white-space:nowrap}
.tab.active{color:#fbbf24;border-bottom-color:#fbbf24}.tab:hover{color:#fbbf24}
.controls{padding:12px 24px;display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.search{background:#12141a;border:1px solid #1e2130;border-radius:6px;padding:8px 12px;color:#e2e8f0;font-size:12px;width:240px;outline:none}
.search:focus{border-color:#fbbf24}
select{background:#12141a;border:1px solid #1e2130;border-radius:6px;padding:6px 10px;color:#e2e8f0;font-size:11px;outline:none}
.content{padding:0 24px 40px}
table{width:100%;border-collapse:collapse;font-size:11px;margin-top:8px}
th{text-align:left;padding:8px;background:#12141a;color:#94a3b8;font-weight:600;border-bottom:1px solid #1e2130;white-space:nowrap}
td{padding:8px;border-bottom:1px solid #0d1117;color:#cbd5e1;max-width:300px;overflow:hidden;text-overflow:ellipsis}
tr.clickable{cursor:pointer;transition:background 0.15s}
tr.clickable:hover td{background:#1a1f2e}
tr.expanded td{background:#12141a}
a{color:#fbbf24;text-decoration:none}a:hover{text-decoration:underline}
.money{color:#22c55e;font-weight:700}
.loss{color:#ef4444;font-weight:700}
.badge{display:inline-block;padding:2px 6px;border-radius:4px;font-size:9px;font-weight:600;margin-right:3px}
.badge.critical{background:#dc262640;color:#fca5a5}
.badge.high{background:#f9731640;color:#fdba74}
.badge.medium{background:#eab30840;color:#fde047}
.badge.low{background:#22c55e40;color:#86efac}
.badge.info{background:#3b82f640;color:#93c5fd}
.badge.active{background:#22c55e30;color:#86efac}
.badge.reentrancy{background:#dc262630;color:#fca5a5}
.badge.flashloan,.badge.flash{background:#f9731630;color:#fdba74}
.badge.oracle{background:#8b5cf630;color:#c4b5fd}
.badge.access{background:#ef444430;color:#f87171}
.badge.logic{background:#06b6d430;color:#67e8f9}
.badge.bridge{background:#ec489930;color:#f9a8d4}
.count{color:#64748b;font-size:11px;margin-left:8px}
.empty{text-align:center;padding:60px 20px;color:#475569}

/* Expandable detail row */
.detail-row{display:none}
.detail-row.show{display:table-row}
.detail-row td{padding:0;background:#0d1117}
.detail-content{padding:16px 20px;border-left:3px solid #fbbf24;margin:8px 0 8px 20px;background:#12141a;border-radius:0 8px 8px 0}
.detail-content h4{color:#f8fafc;font-size:13px;margin-bottom:10px}
.detail-content p{color:#94a3b8;font-size:12px;line-height:1.6;margin-bottom:8px}
.detail-content .label{color:#64748b;font-size:10px;text-transform:uppercase;margin-top:12px;margin-bottom:4px}
.detail-content code{display:block;background:#1e293b;padding:12px;border-radius:6px;font-size:11px;color:#fbbf24;overflow-x:auto;white-space:pre-wrap;margin-bottom:8px;font-family:monospace}
.detail-actions{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}
.btn{padding:6px 12px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;border:none;transition:all 0.15s}
.btn-primary{background:#fbbf24;color:#0a0f1a}.btn-primary:hover{background:#f59e0b}
.btn-secondary{background:#1e293b;color:#e2e8f0;border:1px solid #334155}.btn-secondary:hover{background:#334155}
.btn-success{background:#22c55e30;color:#86efac;border:1px solid #22c55e50}.btn-success:hover{background:#22c55e50}
.keywords{display:flex;flex-wrap:wrap;gap:4px;margin-top:8px}
.keyword{background:#1e293b;padding:2px 6px;border-radius:4px;font-size:10px;color:#94a3b8}
.related{margin-top:12px;padding-top:12px;border-top:1px solid #1e2130}
.related-title{font-size:10px;color:#64748b;margin-bottom:6px}
.related-item{font-size:11px;color:#fbbf24;cursor:pointer;margin-right:12px}
.related-item:hover{text-decoration:underline}

/* Toast notification */
.toast{position:fixed;bottom:20px;right:20px;background:#22c55e;color:#fff;padding:12px 20px;border-radius:8px;font-size:12px;font-weight:600;opacity:0;transition:opacity 0.3s;z-index:1000}
.toast.show{opacity:1}

@media(max-width:768px){.search{width:100%}.stats{flex-direction:column}.controls{flex-direction:column}td,th{padding:6px;font-size:10px}}
</style></head><body>

<div class="header">
<h1>&#128274; Bounty Radar v3.1</h1>
<p>Interactive bug bounty research — CVE hunting, exploits, audit findings, vulnerability patterns</p>
<p style="font-size:10px;color:#334155;margin-top:4px">Updated: ${updatedAt}</p>
<div class="stats">
<div class="stat highlight">&#127919; CVE<br><span>${cveCount}</span></div>
<div class="stat highlight">&#128128; Exploits<br><span>${exploitCount}</span></div>
<div class="stat">&#128218; Findings<br><span>${findingsCount}</span></div>
<div class="stat">&#128203; H1<br><span>${h1Count}</span></div>
<div class="stat">&#128737; Immunefi<br><span>${imCount}</span></div>
<div class="stat">&#128279; Programs<br><span>${programCount}</span></div>
</div></div>

<div class="tabs">
<div class="tab active" onclick="showTab('cve',this)">&#127919; CVE Hunting</div>
<div class="tab" onclick="showTab('exploits',this)">&#128128; Exploits</div>
<div class="tab" onclick="showTab('findings',this)">&#128218; Audit Findings</div>
<div class="tab" onclick="showTab('patterns',this)">&#128203; Vuln Patterns</div>
<div class="tab" onclick="showTab('h1',this)">&#128203; HackerOne</div>
<div class="tab" onclick="showTab('immunefi',this)">&#128737; Immunefi</div>
<div class="tab" onclick="showTab('programs',this)">&#128279; Programs</div>
<div class="tab" onclick="showTab('github',this)">&#128025; GitHub</div>
</div>

<div class="controls">
<input class="search" type="text" id="searchInput" placeholder="Search..." oninput="filterData()">
<select id="severityFilter" onchange="filterData()"><option value="">All Severity</option><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select>
<select id="categoryFilter" onchange="filterData()"><option value="">All Categories</option></select>
<select id="sortBy" onchange="filterData()"><option value="newest">Newest</option><option value="loss">Biggest Loss</option><option value="bounty">Bounty</option></select>
<span class="count" id="resultCount"></span>
</div>

<div class="content">
<div id="cveTable"></div>
<div id="exploitsTable" style="display:none"></div>
<div id="findingsTable" style="display:none"></div>
<div id="patternsTable" style="display:none"></div>
<div id="h1Table" style="display:none"></div>
<div id="immunefiTable" style="display:none"></div>
<div id="programsTable" style="display:none"></div>
<div id="githubTable" style="display:none"></div>
</div>

<div class="toast" id="toast">Copied to clipboard!</div>

<script>
var DATA=${jsonData};
var currentTab="cve";
var expandedRows={};

function populateCategories(){
  var cats=new Set();
  (DATA.exploits?.data||[]).forEach(function(e){if(e.category)cats.add(e.category)});
  (DATA.vuln_patterns?.data||[]).forEach(function(p){if(p.category)cats.add(p.category)});
  (DATA.audit_findings?.data||[]).forEach(function(f){if(f.category)cats.add(f.category)});
  var sel=document.getElementById("categoryFilter");
  Array.from(cats).sort().forEach(function(c){var o=document.createElement("option");o.value=c;o.textContent=c;sel.appendChild(o)});
}
populateCategories();

function showTab(tab,el){
  currentTab=tab;
  expandedRows={};
  document.querySelectorAll(".tab").forEach(function(t){t.classList.remove("active")});
  el.classList.add("active");
  ["cve","exploits","findings","patterns","h1","immunefi","programs","github"].forEach(function(t){
    document.getElementById(t+"Table").style.display=t===tab?"":"none"
  });
  filterData();
}

function filterData(){
  var q=document.getElementById("searchInput").value.toLowerCase();
  var sev=document.getElementById("severityFilter").value.toLowerCase();
  var cat=document.getElementById("categoryFilter").value;
  var sort=document.getElementById("sortBy").value;
  if(currentTab==="cve")renderCVE(q,sev,cat,sort);
  else if(currentTab==="exploits")renderExploits(q,cat,sort);
  else if(currentTab==="findings")renderFindings(q,sev,cat,sort);
  else if(currentTab==="patterns")renderPatterns(q,sev,cat);
  else if(currentTab==="h1")renderH1(q,sev,sort);
  else if(currentTab==="immunefi")renderImmunefi(q,sort);
  else if(currentTab==="programs")renderPrograms(q,sort);
  else renderGithub(q);
}

function toggleRow(id){
  expandedRows[id]=!expandedRows[id];
  var row=document.getElementById("detail-"+id);
  if(row)row.classList.toggle("show",expandedRows[id]);
  var mainRow=document.getElementById("row-"+id);
  if(mainRow)mainRow.classList.toggle("expanded",expandedRows[id]);
}

function copyToClipboard(text,btn){
  navigator.clipboard.writeText(text).then(function(){
    showToast("Copied to clipboard!");
    if(btn){btn.textContent="✓ Copied";setTimeout(function(){btn.textContent="Copy"},1500);}
  });
}

function showToast(msg){
  var t=document.getElementById("toast");
  t.textContent=msg;
  t.classList.add("show");
  setTimeout(function(){t.classList.remove("show")},2000);
}

function escHtml(s){
  if(!s)return"";
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function catBadge(c){
  if(!c)return"";
  var cls="";var cl=c.toLowerCase();
  if(cl.indexOf("reentr")>=0)cls="reentrancy";
  else if(cl.indexOf("flash")>=0)cls="flash";
  else if(cl.indexOf("oracle")>=0)cls="oracle";
  else if(cl.indexOf("access")>=0)cls="access";
  else if(cl.indexOf("logic")>=0)cls="logic";
  else if(cl.indexOf("bridge")>=0)cls="bridge";
  return'<span class="badge '+cls+'">'+escHtml(c)+'</span>';
}

function sevBadge(s){
  var sv=(s||"medium").toLowerCase();
  return'<span class="badge '+sv+'">'+sv.toUpperCase()+'</span>';
}

function fmtMoney(n){
  if(!n)return"-";
  if(n>=1e9)return"$"+(n/1e9).toFixed(2)+"B";
  if(n>=1e6)return"$"+(n/1e6).toFixed(1)+"M";
  if(n>=1e3)return"$"+(n/1e3).toFixed(0)+"K";
  return"$"+n;
}

// ========== EXPLOITS (Interactive) ==========
function renderExploits(q,cat,sort){
  var items=(DATA.exploits?.data||[]).filter(function(e){
    if(cat&&e.category!==cat)return false;
    if(q&&(e.protocol+" "+e.description+" "+e.category).toLowerCase().indexOf(q)<0)return false;
    return true;
  });
  if(sort==="loss")items.sort(function(a,b){return(b.loss_usd||0)-(a.loss_usd||0)});
  else items.sort(function(a,b){return(b.date||"").localeCompare(a.date||"")});
  
  document.getElementById("resultCount").textContent=items.length+" exploits";
  
  var h='<table><tr><th></th><th>Date</th><th>Protocol</th><th>Loss</th><th>Category</th><th>Description</th></tr>';
  items.forEach(function(e,i){
    var id="exp-"+i;
    var isExp=expandedRows[id];
    h+='<tr id="row-'+id+'" class="clickable'+(isExp?" expanded":"")+'" onclick="toggleRow(\\''+id+'\\')">';
    h+='<td style="width:20px">'+(isExp?"▼":"▶")+'</td>';
    h+='<td>'+(e.date||"-")+'</td>';
    h+='<td><b>'+escHtml(e.protocol)+'</b></td>';
    h+='<td class="loss">'+fmtMoney(e.loss_usd)+'</td>';
    h+='<td>'+catBadge(e.category)+'</td>';
    h+='<td>'+escHtml((e.description||"").substring(0,60))+'</td></tr>';
    
    // Detail row
    h+='<tr id="detail-'+id+'" class="detail-row'+(isExp?" show":"")+'"><td colspan="6">';
    h+='<div class="detail-content">';
    h+='<h4>'+escHtml(e.protocol)+' Exploit</h4>';
    h+='<p><b>Date:</b> '+escHtml(e.date)+' &nbsp; <b>Loss:</b> <span class="loss">'+fmtMoney(e.loss_usd)+'</span> &nbsp; <b>Category:</b> '+catBadge(e.category)+'</p>';
    h+='<p class="label">Description</p>';
    h+='<p>'+escHtml(e.description)+'</p>';
    if(e.poc_url){
      h+='<p class="label">Proof of Concept</p>';
      h+='<p><a href="'+escHtml(e.poc_url)+'" target="_blank">'+escHtml(e.poc_url)+'</a></p>';
    }
    h+='<div class="detail-actions">';
    if(e.poc_url)h+='<a href="'+escHtml(e.poc_url)+'" target="_blank" class="btn btn-primary">View PoC ↗</a>';
    h+='<button class="btn btn-secondary" onclick="event.stopPropagation();copyToClipboard(\\''+escHtml(e.protocol)+": "+escHtml(e.description)+"\\',this)">Copy Details</button>';
    h+='<button class="btn btn-secondary" onclick="event.stopPropagation();searchRelated(\\''+escHtml(e.category)+'\\')">Find Related</button>';
    h+='</div></div></td></tr>';
  });
  h+='</table>';
  if(items.length===0)h='<div class="empty">No exploits found</div>';
  document.getElementById("exploitsTable").innerHTML=h;
}

// ========== AUDIT FINDINGS (Interactive) ==========
function renderFindings(q,sev,cat,sort){
  var items=(DATA.audit_findings?.data||[]).filter(function(f){
    if(sev&&(f.severity||"").toLowerCase()!==sev)return false;
    if(cat&&f.category!==cat)return false;
    if(q&&(f.title+" "+f.protocol+" "+f.description+" "+f.category).toLowerCase().indexOf(q)<0)return false;
    return true;
  });
  var sevOrder={critical:0,high:1,medium:2,low:3,info:4};
  items.sort(function(a,b){return(sevOrder[a.severity]||5)-(sevOrder[b.severity]||5)});
  
  document.getElementById("resultCount").textContent=items.length+" findings";
  
  var h='<table><tr><th></th><th>Severity</th><th>Title</th><th>Protocol</th><th>Category</th><th>Auditor</th></tr>';
  items.forEach(function(f,i){
    var id="find-"+i;
    var isExp=expandedRows[id];
    h+='<tr id="row-'+id+'" class="clickable'+(isExp?" expanded":"")+'" onclick="toggleRow(\\''+id+'\\')">';
    h+='<td style="width:20px">'+(isExp?"▼":"▶")+'</td>';
    h+='<td>'+sevBadge(f.severity)+'</td>';
    h+='<td>'+escHtml((f.title||"").substring(0,50))+'</td>';
    h+='<td>'+escHtml(f.protocol||"-")+'</td>';
    h+='<td>'+catBadge(f.category)+'</td>';
    h+='<td>'+escHtml(f.auditor||"-")+'</td></tr>';
    
    // Detail row
    h+='<tr id="detail-'+id+'" class="detail-row'+(isExp?" show":"")+'"><td colspan="6">';
    h+='<div class="detail-content">';
    h+='<h4>'+escHtml(f.title)+'</h4>';
    h+='<p>'+sevBadge(f.severity)+' '+catBadge(f.category)+' &nbsp; <b>Protocol:</b> '+escHtml(f.protocol)+' &nbsp; <b>Auditor:</b> '+escHtml(f.auditor)+'</p>';
    h+='<p class="label">Description</p>';
    h+='<p>'+escHtml(f.description||f.title)+'</p>';
    if(f.url){
      h+='<p class="label">Source</p>';
      h+='<p><a href="'+escHtml(f.url)+'" target="_blank">View Report ↗</a></p>';
    }
    h+='<div class="detail-actions">';
    if(f.url)h+='<a href="'+escHtml(f.url)+'" target="_blank" class="btn btn-primary">View Report ↗</a>';
    h+='<button class="btn btn-secondary" onclick="event.stopPropagation();copyToClipboard(\\''+escHtml(f.title)+"\\',this)">Copy Title</button>';
    h+='<button class="btn btn-secondary" onclick="event.stopPropagation();searchRelated(\\''+escHtml(f.category)+'\\')">Find Related</button>';
    h+='</div></div></td></tr>';
  });
  h+='</table>';
  if(items.length===0)h='<div class="empty">No findings found</div>';
  document.getElementById("findingsTable").innerHTML=h;
}

// ========== VULN PATTERNS (Interactive with Code) ==========
function renderPatterns(q,sev,cat){
  var items=(DATA.vuln_patterns?.data||[]).filter(function(p){
    if(sev&&p.severity!==sev)return false;
    if(cat&&p.category!==cat)return false;
    if(q&&(p.name+" "+p.description+" "+p.how_to_find+" "+(p.keywords||[]).join(" ")).toLowerCase().indexOf(q)<0)return false;
    return true;
  });
  
  document.getElementById("resultCount").textContent=items.length+" patterns";
  
  var h='<table><tr><th></th><th>Severity</th><th>Pattern</th><th>Category</th><th>How to Find</th></tr>';
  items.forEach(function(p,i){
    var id="pat-"+i;
    var isExp=expandedRows[id];
    h+='<tr id="row-'+id+'" class="clickable'+(isExp?" expanded":"")+'" onclick="toggleRow(\\''+id+'\\')">';
    h+='<td style="width:20px">'+(isExp?"▼":"▶")+'</td>';
    h+='<td>'+sevBadge(p.severity)+'</td>';
    h+='<td><b>'+escHtml(p.name)+'</b></td>';
    h+='<td>'+catBadge(p.category)+'</td>';
    h+='<td>'+escHtml((p.how_to_find||"").substring(0,60))+'...</td></tr>';
    
    // Detail row
    h+='<tr id="detail-'+id+'" class="detail-row'+(isExp?" show":"")+'"><td colspan="5">';
    h+='<div class="detail-content">';
    h+='<h4>'+escHtml(p.name)+'</h4>';
    h+='<p>'+sevBadge(p.severity)+' '+catBadge(p.category)+'</p>';
    h+='<p class="label">Description</p>';
    h+='<p>'+escHtml(p.description)+'</p>';
    h+='<p class="label">How to Find</p>';
    h+='<p>'+escHtml(p.how_to_find)+'</p>';
    
    if(p.example_vulnerable){
      h+='<p class="label">❌ Vulnerable Code</p>';
      h+='<code>'+escHtml(p.example_vulnerable)+'</code>';
      h+='<button class="btn btn-secondary" style="margin-bottom:12px" onclick="event.stopPropagation();copyToClipboard(\\''+escHtml(p.example_vulnerable).replace(/'/g,"\\\\'")+'\\')">';
      h+='Copy Vulnerable</button>';
    }
    if(p.example_fix){
      h+='<p class="label">✅ Fixed Code</p>';
      h+='<code>'+escHtml(p.example_fix)+'</code>';
      h+='<button class="btn btn-success" style="margin-bottom:12px" onclick="event.stopPropagation();copyToClipboard(\\''+escHtml(p.example_fix).replace(/'/g,"\\\\'")+'\\')">';
      h+='Copy Fix</button>';
    }
    
    if(p.keywords&&p.keywords.length){
      h+='<p class="label">Keywords (grep these)</p>';
      h+='<div class="keywords">';
      p.keywords.forEach(function(k){h+='<span class="keyword" onclick="event.stopPropagation();copyToClipboard(\\''+escHtml(k)+'\\')">'+escHtml(k)+'</span>'});
      h+='</div>';
    }
    
    if(p.related_exploits&&p.related_exploits.length){
      h+='<div class="related"><span class="related-title">Related Exploits:</span> ';
      p.related_exploits.forEach(function(r){h+='<span class="related-item" onclick="event.stopPropagation();searchExploit(\\''+escHtml(r)+'\\')">'+escHtml(r)+'</span>'});
      h+='</div>';
    }
    
    h+='<div class="detail-actions">';
    h+='<button class="btn btn-primary" onclick="event.stopPropagation();copyToClipboard(\\''+escHtml(p.name)+": "+escHtml(p.how_to_find)+"\\')">Copy Checklist Item</button>";
    h+='<button class="btn btn-secondary" onclick="event.stopPropagation();searchRelated(\\''+escHtml(p.category)+'\\')">Find Related</button>';
    h+='</div></div></td></tr>';
  });
  h+='</table>';
  if(items.length===0)h='<div class="empty">No patterns found</div>';
  document.getElementById("patternsTable").innerHTML=h;
}

function searchRelated(category){
  document.getElementById("categoryFilter").value=category;
  filterData();
  showToast("Filtered by: "+category);
}

function searchExploit(term){
  document.getElementById("searchInput").value=term;
  document.querySelectorAll(".tab").forEach(function(t){t.classList.remove("active")});
  document.querySelectorAll(".tab")[1].classList.add("active");
  currentTab="exploits";
  ["cve","exploits","findings","patterns","h1","immunefi","programs","github"].forEach(function(t){
    document.getElementById(t+"Table").style.display=t==="exploits"?"":"none"
  });
  filterData();
}

// ========== OTHER TABS (Keep simple) ==========
function renderCVE(q,sev,cat,sort){
  var items=(DATA.cve_hunting?.opportunities||[]).filter(function(o){
    if(sev&&o.severity.toLowerCase()!==sev)return false;
    if(q&&(o.id+" "+o.description+" "+o.bug_type).toLowerCase().indexOf(q)<0)return false;
    return true;
  });
  if(sort==="newest")items.sort(function(a,b){return(b.published||"").localeCompare(a.published||"")});
  document.getElementById("resultCount").textContent=items.length+" opportunities";
  var h='<table><tr><th>CVE</th><th>Severity</th><th>Type</th><th>Ecosystem</th><th>Published</th><th>Programs</th><th>Max Bounty</th></tr>';
  items.slice(0,100).forEach(function(o){
    var progs=(o.affected_programs||[]).slice(0,2).map(function(p){return p.name}).join(", ");
    if((o.affected_programs||[]).length>2)progs+=" +"+(o.affected_programs.length-2);
    h+='<tr><td><a href="'+escHtml(o.url)+'" target="_blank">'+escHtml(o.id)+'</a></td>';
    h+='<td>'+sevBadge(o.severity)+'</td>';
    h+='<td>'+catBadge(o.bug_type||"Other")+'</td>';
    h+='<td>'+escHtml(o.ecosystem||"-")+'</td>';
    h+='<td>'+escHtml(o.published||"-")+'</td>';
    h+='<td>'+escHtml(progs||"-")+'</td>';
    h+='<td class="money">'+fmtMoney(o.max_potential_bounty)+'</td></tr>';
  });
  h+='</table>';
  if(items.length===0)h='<div class="empty">No CVE opportunities found</div>';
  document.getElementById("cveTable").innerHTML=h;
}

function renderH1(q,sev,sort){
  var items=(DATA.hackerone?.reports||[]).filter(function(r){
    if(q&&(r.title+" "+r.program+" "+r.bug_type).toLowerCase().indexOf(q)<0)return false;
    return true;
  });
  if(sort==="bounty")items.sort(function(a,b){return(b.bounty||0)-(a.bounty||0)});
  document.getElementById("resultCount").textContent=items.length+" reports";
  var h='<table><tr><th>#</th><th>Title</th><th>Bug Type</th><th>Program</th><th>Bounty</th><th>Upvotes</th></tr>';
  items.slice(0,200).forEach(function(r,i){
    h+='<tr><td>'+(i+1)+'</td>';
    h+='<td><a href="'+escHtml(r.url)+'" target="_blank">'+escHtml(r.title.substring(0,60))+'</a></td>';
    h+='<td>'+catBadge(r.bug_type)+'</td>';
    h+='<td>'+escHtml(r.program)+'</td>';
    h+='<td class="money">'+(r.bounty?"$"+r.bounty.toLocaleString():"-")+'</td>';
    h+='<td>'+r.upvotes+'</td></tr>';
  });
  h+='</table>';
  document.getElementById("h1Table").innerHTML=h;
}

function renderImmunefi(q,sort){
  var items=(DATA.immunefi?.programs||[]).filter(function(p){
    if(q&&(p.name+" "+p.technologies).toLowerCase().indexOf(q)<0)return false;
    return true;
  });
  if(sort==="bounty")items.sort(function(a,b){return(b.max_bounty||0)-(a.max_bounty||0)});
  document.getElementById("resultCount").textContent=items.length+" programs";
  var h='<table><tr><th>#</th><th>Program</th><th>Max Bounty</th><th>Technologies</th><th>Link</th></tr>';
  items.slice(0,100).forEach(function(p,i){
    h+='<tr><td>'+(i+1)+'</td>';
    h+='<td><b>'+escHtml(p.name)+'</b></td>';
    h+='<td class="money">'+fmtMoney(p.max_bounty)+'</td>';
    h+='<td>'+escHtml(p.technologies||"-")+'</td>';
    h+='<td><a href="'+escHtml(p.url)+'" target="_blank">View</a></td></tr>';
  });
  h+='</table>';
  document.getElementById("immunefiTable").innerHTML=h;
}

function renderPrograms(q,sort){
  var items=(DATA.all_programs?.programs||[]).filter(function(p){
    if(q&&(p.name+" "+(p.technologies||"")+" "+(p.platform||"")).toLowerCase().indexOf(q)<0)return false;
    return true;
  });
  if(sort==="bounty")items.sort(function(a,b){return(b.bounty_max||0)-(a.bounty_max||0)});
  document.getElementById("resultCount").textContent=items.length+" programs";
  var h='<table><tr><th>Program</th><th>Platform</th><th>Status</th><th>Tech</th><th>Max Bounty</th></tr>';
  items.slice(0,150).forEach(function(p){
    var statusCls=(p.status||"active").toLowerCase();
    h+='<tr><td><b>'+escHtml(p.name)+'</b></td>';
    h+='<td>'+escHtml(p.platform||"-")+'</td>';
    h+='<td><span class="badge '+statusCls+'">'+statusCls+'</span></td>';
    h+='<td>'+escHtml(p.technologies||"-")+'</td>';
    h+='<td class="money">'+fmtMoney(p.bounty_max)+'</td></tr>';
  });
  h+='</table>';
  document.getElementById("programsTable").innerHTML=h;
}

function renderGithub(q){
  var items=(DATA.github?.repos||[]).filter(function(r){
    if(q&&(r.full_name+" "+r.description).toLowerCase().indexOf(q)<0)return false;
    return true;
  });
  document.getElementById("resultCount").textContent=items.length+" repos";
  var h='<table><tr><th>Repo</th><th>Stars</th><th>Language</th><th>Description</th></tr>';
  items.forEach(function(r){
    h+='<tr><td><a href="'+escHtml(r.url)+'" target="_blank">'+escHtml(r.full_name)+'</a></td>';
    h+='<td>⭐ '+r.stars+'</td>';
    h+='<td>'+escHtml(r.language||"-")+'</td>';
    h+='<td>'+escHtml((r.description||"").substring(0,60))+'</td></tr>';
  });
  h+='</table>';
  document.getElementById("githubTable").innerHTML=h;
}

filterData();
</script></body></html>`;

  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(path.join(docsDir, "index.html"), html, "utf-8");
  console.log("✅ Web UI built: docs/index.html (Interactive v3.1)");
}

buildHtml();