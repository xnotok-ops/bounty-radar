/**
 * Bounty Radar v3.1 - Interactive Research Tool (Fixed)
 */

const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "..", "data", "bounty-data.json");
const docsDir = path.join(__dirname, "..", "docs");

function buildHtml() {
  let data = { 
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

  const updatedAt = data.updated_at ? new Date(data.updated_at).toLocaleDateString() : "Never";
  const h1Count = (data.hackerone?.reports?.length || 0).toLocaleString();
  const imCount = data.immunefi?.programs?.length || 0;
  const cveCount = data.cve_hunting?.total_opportunities || 0;
  const exploitCount = data.exploits?.total || 0;
  const findingsCount = data.audit_findings?.total || 0;
  const patternsCount = data.vuln_patterns?.total || 0;
  const programCount = data.all_programs?.total || 0;
  
  // Escape JSON for embedding
  const jsonData = JSON.stringify(data).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
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
.tab.active{color:#fbbf24;border-bottom-color:#fbbf24}
.tab:hover{color:#fbbf24}
.controls{padding:12px 24px;display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.search{background:#12141a;border:1px solid #1e2130;border-radius:6px;padding:8px 12px;color:#e2e8f0;font-size:12px;width:240px;outline:none}
.search:focus{border-color:#fbbf24}
select{background:#12141a;border:1px solid #1e2130;border-radius:6px;padding:6px 10px;color:#e2e8f0;font-size:11px;outline:none}
.content{padding:0 24px 40px}
table{width:100%;border-collapse:collapse;font-size:11px;margin-top:8px}
th{text-align:left;padding:8px;background:#12141a;color:#94a3b8;font-weight:600;border-bottom:1px solid #1e2130}
td{padding:8px;border-bottom:1px solid #0d1117;color:#cbd5e1}
tr.clickable{cursor:pointer;transition:background 0.15s}
tr.clickable:hover td{background:#1a1f2e}
a{color:#fbbf24;text-decoration:none}
a:hover{text-decoration:underline}
.money{color:#22c55e;font-weight:700}
.loss{color:#ef4444;font-weight:700}
.badge{display:inline-block;padding:2px 6px;border-radius:4px;font-size:9px;font-weight:600;margin-right:3px}
.badge.critical{background:#dc262640;color:#fca5a5}
.badge.high{background:#f9731640;color:#fdba74}
.badge.medium{background:#eab30840;color:#fde047}
.badge.low{background:#22c55e40;color:#86efac}
.badge.info{background:#3b82f640;color:#93c5fd}
.badge.active{background:#22c55e30;color:#86efac}
.count{color:#64748b;font-size:11px;margin-left:8px}
.empty{text-align:center;padding:60px 20px;color:#475569}
.detail{background:#12141a;border-left:3px solid #fbbf24;padding:16px;margin:8px 0;border-radius:0 8px 8px 0;display:none}
.detail.show{display:block}
.detail h4{color:#f8fafc;font-size:13px;margin-bottom:8px}
.detail p{color:#94a3b8;font-size:12px;line-height:1.5;margin-bottom:6px}
.detail code{display:block;background:#1e293b;padding:10px;border-radius:6px;font-size:11px;color:#fbbf24;margin:8px 0;white-space:pre-wrap;font-family:monospace}
.detail-actions{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}
.btn{padding:6px 12px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;border:none}
.btn-primary{background:#fbbf24;color:#0a0f1a}
.btn-secondary{background:#1e293b;color:#e2e8f0}
.keywords{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}
.keyword{background:#1e293b;padding:2px 6px;border-radius:4px;font-size:10px;color:#94a3b8;cursor:pointer}
.toast{position:fixed;bottom:20px;right:20px;background:#22c55e;color:#fff;padding:12px 20px;border-radius:8px;font-size:12px;opacity:0;transition:opacity 0.3s;z-index:1000}
.toast.show{opacity:1}
</style>
</head>
<body>

<div class="header">
<h1>🔐 Bounty Radar v3.1</h1>
<p>Interactive bug bounty research — CVE hunting, exploits, audit findings, vulnerability patterns</p>
<p style="font-size:10px;color:#334155;margin-top:4px">Updated: ${updatedAt}</p>
<div class="stats">
<div class="stat highlight">🎯 CVE<br><span>${cveCount}</span></div>
<div class="stat highlight">💀 Exploits<br><span>${exploitCount}</span></div>
<div class="stat">📚 Findings<br><span>${findingsCount}</span></div>
<div class="stat">📋 H1<br><span>${h1Count}</span></div>
<div class="stat">🛡 Immunefi<br><span>${imCount}</span></div>
<div class="stat">🔗 Programs<br><span>${programCount}</span></div>
</div>
</div>

<div class="tabs">
<div class="tab active" data-tab="cve">🎯 CVE Hunting</div>
<div class="tab" data-tab="exploits">💀 Exploits</div>
<div class="tab" data-tab="findings">📚 Audit Findings</div>
<div class="tab" data-tab="patterns">📋 Vuln Patterns</div>
<div class="tab" data-tab="h1">📋 HackerOne</div>
<div class="tab" data-tab="immunefi">🛡 Immunefi</div>
<div class="tab" data-tab="programs">🔗 Programs</div>
<div class="tab" data-tab="github">🐙 GitHub</div>
</div>

<div class="controls">
<input class="search" type="text" id="searchInput" placeholder="Search...">
<select id="severityFilter"><option value="">All Severity</option><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select>
<select id="categoryFilter"><option value="">All Categories</option></select>
<select id="sortBy"><option value="newest">Newest</option><option value="loss">Biggest Loss</option><option value="bounty">Bounty</option></select>
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

<div class="toast" id="toast">Copied!</div>

<script>
var DATA = ${jsonData};
var currentTab = "cve";

// Populate categories
(function(){
  var cats = new Set();
  (DATA.exploits?.data||[]).forEach(function(e){if(e.category)cats.add(e.category)});
  (DATA.vuln_patterns?.data||[]).forEach(function(p){if(p.category)cats.add(p.category)});
  (DATA.audit_findings?.data||[]).forEach(function(f){if(f.category)cats.add(f.category)});
  var sel = document.getElementById("categoryFilter");
  Array.from(cats).sort().forEach(function(c){
    var o = document.createElement("option");
    o.value = c;
    o.textContent = c;
    sel.appendChild(o);
  });
})();

// Tab clicks
document.querySelectorAll(".tab").forEach(function(t){
  t.addEventListener("click", function(){
    document.querySelectorAll(".tab").forEach(function(x){x.classList.remove("active")});
    t.classList.add("active");
    currentTab = t.getAttribute("data-tab");
    ["cve","exploits","findings","patterns","h1","immunefi","programs","github"].forEach(function(x){
      document.getElementById(x+"Table").style.display = x===currentTab ? "" : "none";
    });
    render();
  });
});

// Filter inputs
document.getElementById("searchInput").addEventListener("input", render);
document.getElementById("severityFilter").addEventListener("change", render);
document.getElementById("categoryFilter").addEventListener("change", render);
document.getElementById("sortBy").addEventListener("change", render);

function esc(s){ return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
function sevBadge(s){ var v=(s||"medium").toLowerCase(); return '<span class="badge '+v+'">'+v.toUpperCase()+'</span>'; }
function catBadge(c){ if(!c)return""; return '<span class="badge">'+esc(c)+'</span>'; }
function fmtMoney(n){ if(!n)return"-"; if(n>=1e9)return"$"+(n/1e9).toFixed(2)+"B"; if(n>=1e6)return"$"+(n/1e6).toFixed(1)+"M"; if(n>=1e3)return"$"+(n/1e3).toFixed(0)+"K"; return"$"+n; }

function showToast(msg){
  var t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(function(){t.classList.remove("show")},1500);
}

function copyText(text){
  navigator.clipboard.writeText(text).then(function(){ showToast("Copied!"); });
}

function toggleDetail(id){
  var el = document.getElementById(id);
  if(el) el.classList.toggle("show");
}

function render(){
  var q = document.getElementById("searchInput").value.toLowerCase();
  var sev = document.getElementById("severityFilter").value.toLowerCase();
  var cat = document.getElementById("categoryFilter").value;
  var sort = document.getElementById("sortBy").value;
  
  if(currentTab==="cve") renderCVE(q,sev,sort);
  else if(currentTab==="exploits") renderExploits(q,cat,sort);
  else if(currentTab==="findings") renderFindings(q,sev,cat);
  else if(currentTab==="patterns") renderPatterns(q,sev,cat);
  else if(currentTab==="h1") renderH1(q,sort);
  else if(currentTab==="immunefi") renderImmunefi(q,sort);
  else if(currentTab==="programs") renderPrograms(q,sort);
  else if(currentTab==="github") renderGithub(q);
}

function renderCVE(q,sev,sort){
  var items = (DATA.cve_hunting?.opportunities||[]).filter(function(o){
    if(sev && o.severity.toLowerCase()!==sev) return false;
    if(q && (o.id+" "+o.description).toLowerCase().indexOf(q)<0) return false;
    return true;
  });
  document.getElementById("resultCount").textContent = items.length+" opportunities";
  var h = '<table><tr><th>CVE</th><th>Severity</th><th>Ecosystem</th><th>Published</th><th>Programs</th><th>Max Bounty</th></tr>';
  items.slice(0,100).forEach(function(o){
    var progs = (o.affected_programs||[]).slice(0,2).map(function(p){return p.name}).join(", ");
    h += '<tr><td><a href="'+esc(o.url)+'" target="_blank">'+esc(o.id)+'</a></td>';
    h += '<td>'+sevBadge(o.severity)+'</td>';
    h += '<td>'+esc(o.ecosystem||"-")+'</td>';
    h += '<td>'+esc(o.published||"-")+'</td>';
    h += '<td>'+esc(progs||"-")+'</td>';
    h += '<td class="money">'+fmtMoney(o.max_potential_bounty)+'</td></tr>';
  });
  h += '</table>';
  if(items.length===0) h = '<div class="empty">No CVE opportunities found</div>';
  document.getElementById("cveTable").innerHTML = h;
}

function renderExploits(q,cat,sort){
  var items = (DATA.exploits?.data||[]).filter(function(e){
    if(cat && e.category!==cat) return false;
    if(q && (e.protocol+" "+e.description+" "+e.category).toLowerCase().indexOf(q)<0) return false;
    return true;
  });
  if(sort==="loss") items.sort(function(a,b){return(b.loss_usd||0)-(a.loss_usd||0)});
  else items.sort(function(a,b){return(b.date||"").localeCompare(a.date||"")});
  
  document.getElementById("resultCount").textContent = items.length+" exploits";
  var h = '';
  items.forEach(function(e,i){
    var id = "exp"+i;
    h += '<div class="clickable" style="padding:10px;border-bottom:1px solid #1e2130" onclick="toggleDetail(\\''+id+'\\')">';
    h += '<span style="margin-right:12px">'+esc(e.date||"-")+'</span>';
    h += '<b>'+esc(e.protocol)+'</b> ';
    h += '<span class="loss">'+fmtMoney(e.loss_usd)+'</span> ';
    h += catBadge(e.category);
    h += '</div>';
    h += '<div id="'+id+'" class="detail">';
    h += '<h4>'+esc(e.protocol)+' Exploit</h4>';
    h += '<p><b>Date:</b> '+esc(e.date)+' | <b>Loss:</b> <span class="loss">'+fmtMoney(e.loss_usd)+'</span> | <b>Category:</b> '+esc(e.category)+'</p>';
    h += '<p>'+esc(e.description)+'</p>';
    if(e.poc_url) h += '<p><a href="'+esc(e.poc_url)+'" target="_blank">View PoC →</a></p>';
    h += '<div class="detail-actions">';
    h += '<button class="btn btn-secondary" onclick="event.stopPropagation();copyText(\\''+esc(e.protocol)+": "+esc((e.description||"").replace(/'/g,""))+'\\')">Copy Details</button>';
    h += '</div></div>';
  });
  if(items.length===0) h = '<div class="empty">No exploits found</div>';
  document.getElementById("exploitsTable").innerHTML = h;
}

function renderFindings(q,sev,cat){
  var items = (DATA.audit_findings?.data||[]).filter(function(f){
    if(sev && (f.severity||"").toLowerCase()!==sev) return false;
    if(cat && f.category!==cat) return false;
    if(q && (f.title+" "+f.protocol+" "+f.description).toLowerCase().indexOf(q)<0) return false;
    return true;
  });
  var sevOrder = {critical:0,high:1,medium:2,low:3,info:4};
  items.sort(function(a,b){return(sevOrder[a.severity]||5)-(sevOrder[b.severity]||5)});
  
  document.getElementById("resultCount").textContent = items.length+" findings";
  var h = '';
  items.forEach(function(f,i){
    var id = "find"+i;
    h += '<div class="clickable" style="padding:10px;border-bottom:1px solid #1e2130" onclick="toggleDetail(\\''+id+'\\')">';
    h += sevBadge(f.severity)+' ';
    h += '<b>'+esc((f.title||"").substring(0,60))+'</b> ';
    h += '<span style="color:#64748b">'+esc(f.protocol||"")+'</span> ';
    h += catBadge(f.category);
    h += '</div>';
    h += '<div id="'+id+'" class="detail">';
    h += '<h4>'+esc(f.title)+'</h4>';
    h += '<p>'+sevBadge(f.severity)+' | <b>Protocol:</b> '+esc(f.protocol)+' | <b>Auditor:</b> '+esc(f.auditor)+'</p>';
    h += '<p>'+esc(f.description||f.title)+'</p>';
    if(f.url) h += '<p><a href="'+esc(f.url)+'" target="_blank">View Report →</a></p>';
    h += '<div class="detail-actions">';
    h += '<button class="btn btn-secondary" onclick="event.stopPropagation();copyText(\\''+esc((f.title||"").replace(/'/g,""))+'\\')">Copy Title</button>';
    h += '</div></div>';
  });
  if(items.length===0) h = '<div class="empty">No findings found</div>';
  document.getElementById("findingsTable").innerHTML = h;
}

function renderPatterns(q,sev,cat){
  var items = (DATA.vuln_patterns?.data||[]).filter(function(p){
    if(sev && p.severity!==sev) return false;
    if(cat && p.category!==cat) return false;
    if(q && (p.name+" "+p.description+" "+p.how_to_find).toLowerCase().indexOf(q)<0) return false;
    return true;
  });
  
  document.getElementById("resultCount").textContent = items.length+" patterns";
  var h = '';
  items.forEach(function(p,i){
    var id = "pat"+i;
    h += '<div class="clickable" style="padding:10px;border-bottom:1px solid #1e2130" onclick="toggleDetail(\\''+id+'\\')">';
    h += sevBadge(p.severity)+' ';
    h += '<b>'+esc(p.name)+'</b> ';
    h += catBadge(p.category);
    h += '</div>';
    h += '<div id="'+id+'" class="detail">';
    h += '<h4>'+esc(p.name)+'</h4>';
    h += '<p>'+sevBadge(p.severity)+' '+catBadge(p.category)+'</p>';
    h += '<p><b>Description:</b> '+esc(p.description)+'</p>';
    h += '<p><b>How to Find:</b> '+esc(p.how_to_find)+'</p>';
    if(p.example_vulnerable){
      h += '<p><b>❌ Vulnerable:</b></p><code>'+esc(p.example_vulnerable)+'</code>';
      h += '<button class="btn btn-secondary" onclick="event.stopPropagation();copyText(\\''+esc(p.example_vulnerable).replace(/'/g,"\\\\'").replace(/\\n/g,"\\\\n")+'\\')">Copy</button>';
    }
    if(p.example_fix){
      h += '<p><b>✅ Fixed:</b></p><code>'+esc(p.example_fix)+'</code>';
      h += '<button class="btn btn-primary" onclick="event.stopPropagation();copyText(\\''+esc(p.example_fix).replace(/'/g,"\\\\'").replace(/\\n/g,"\\\\n")+'\\')">Copy Fix</button>';
    }
    if(p.keywords && p.keywords.length){
      h += '<p><b>Keywords:</b></p><div class="keywords">';
      p.keywords.forEach(function(k){ h += '<span class="keyword" onclick="event.stopPropagation();copyText(\\''+esc(k)+'\\')">'+esc(k)+'</span>'; });
      h += '</div>';
    }
    h += '</div>';
  });
  if(items.length===0) h = '<div class="empty">No patterns found</div>';
  document.getElementById("patternsTable").innerHTML = h;
}

function renderH1(q,sort){
  var items = (DATA.hackerone?.reports||[]).filter(function(r){
    if(q && (r.title+" "+r.program).toLowerCase().indexOf(q)<0) return false;
    return true;
  });
  if(sort==="bounty") items.sort(function(a,b){return(b.bounty||0)-(a.bounty||0)});
  document.getElementById("resultCount").textContent = items.length+" reports";
  var h = '<table><tr><th>#</th><th>Title</th><th>Program</th><th>Bounty</th><th>Upvotes</th></tr>';
  items.slice(0,200).forEach(function(r,i){
    h += '<tr><td>'+(i+1)+'</td>';
    h += '<td><a href="'+esc(r.url)+'" target="_blank">'+esc((r.title||"").substring(0,60))+'</a></td>';
    h += '<td>'+esc(r.program)+'</td>';
    h += '<td class="money">'+(r.bounty?"$"+r.bounty.toLocaleString():"-")+'</td>';
    h += '<td>'+r.upvotes+'</td></tr>';
  });
  h += '</table>';
  document.getElementById("h1Table").innerHTML = h;
}

function renderImmunefi(q,sort){
  var items = (DATA.immunefi?.programs||[]).filter(function(p){
    if(q && (p.name+" "+p.technologies).toLowerCase().indexOf(q)<0) return false;
    return true;
  });
  if(sort==="bounty") items.sort(function(a,b){return(b.max_bounty||0)-(a.max_bounty||0)});
  document.getElementById("resultCount").textContent = items.length+" programs";
  var h = '<table><tr><th>#</th><th>Program</th><th>Max Bounty</th><th>Technologies</th><th>Link</th></tr>';
  items.slice(0,100).forEach(function(p,i){
    h += '<tr><td>'+(i+1)+'</td>';
    h += '<td><b>'+esc(p.name)+'</b></td>';
    h += '<td class="money">'+fmtMoney(p.max_bounty)+'</td>';
    h += '<td>'+esc(p.technologies||"-")+'</td>';
    h += '<td><a href="'+esc(p.url)+'" target="_blank">View</a></td></tr>';
  });
  h += '</table>';
  document.getElementById("immunefiTable").innerHTML = h;
}

function renderPrograms(q,sort){
  var items = (DATA.all_programs?.programs||[]).filter(function(p){
    if(q && (p.name+" "+(p.technologies||"")).toLowerCase().indexOf(q)<0) return false;
    return true;
  });
  if(sort==="bounty") items.sort(function(a,b){return(b.bounty_max||0)-(a.bounty_max||0)});
  document.getElementById("resultCount").textContent = items.length+" programs";
  var h = '<table><tr><th>Program</th><th>Platform</th><th>Status</th><th>Max Bounty</th></tr>';
  items.slice(0,150).forEach(function(p){
    h += '<tr><td><b>'+esc(p.name)+'</b></td>';
    h += '<td>'+esc(p.platform||"-")+'</td>';
    h += '<td><span class="badge active">'+(p.status||"active")+'</span></td>';
    h += '<td class="money">'+fmtMoney(p.bounty_max)+'</td></tr>';
  });
  h += '</table>';
  document.getElementById("programsTable").innerHTML = h;
}

function renderGithub(q){
  var items = (DATA.github?.repos||[]).filter(function(r){
    if(q && (r.full_name+" "+r.description).toLowerCase().indexOf(q)<0) return false;
    return true;
  });
  document.getElementById("resultCount").textContent = items.length+" repos";
  var h = '<table><tr><th>Repo</th><th>Stars</th><th>Language</th><th>Description</th></tr>';
  items.forEach(function(r){
    h += '<tr><td><a href="'+esc(r.url)+'" target="_blank">'+esc(r.full_name)+'</a></td>';
    h += '<td>⭐ '+r.stars+'</td>';
    h += '<td>'+esc(r.language||"-")+'</td>';
    h += '<td>'+esc((r.description||"").substring(0,50))+'</td></tr>';
  });
  h += '</table>';
  document.getElementById("githubTable").innerHTML = h;
}

// Initial render
render();
</script>
</body>
</html>`;

  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(path.join(docsDir, "index.html"), html, "utf-8");
  console.log("✅ Web UI built: docs/index.html (v3.1 Fixed)");
}

buildHtml();