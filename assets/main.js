import { loadConfig, bootCommon, escapeHtml, escapeAttr } from "./shared.js";

let allPosts=[];
let activeCat="all";
let query="";

function asList(value){
  if(Array.isArray(value)) return value.map(x=>String(x).trim()).filter(Boolean);
  if(value==null) return [];
  return String(value).split(/[,，\n]/).map(x=>x.trim()).filter(Boolean);
}

function renderHome(config){
  const eyebrow=document.querySelector("[data-home-eyebrow]"); if(eyebrow) eyebrow.textContent=config.home?.eyebrow||"个人博客";
  const title=document.querySelector("[data-home-title]"); if(title) title.innerHTML=escapeHtml(config.home?.title||"").replace(/\n/g,"<br>");
  const intro=document.querySelector("[data-home-intro]"); if(intro) intro.textContent=config.home?.intro||"";
  const chips=document.querySelector("[data-home-chips]"); if(chips) chips.innerHTML=asList(config.home?.chips).map(x=>`<span class="chip">#${escapeHtml(x)}#</span>`).join("");
}
function renderHomeNotice(config){
  const shell=document.querySelector("[data-home-notice]");
  if(!shell) return;
  const notice=config.home?.notice||{};
  const text=String(notice.text||"").trim();
  if(!notice.enabled||!text){ shell.hidden=true; return; }

  const dismissKey=`home-notice:${text}|${String(notice.url||"")}`;
  if(notice.dismissible&&sessionStorage.getItem(dismissKey)==="1"){ shell.hidden=true; return; }

  const textEl=shell.querySelector("[data-home-notice-text]");
  const link=shell.querySelector("[data-home-notice-link]");
  const close=shell.querySelector("[data-home-notice-close]");
  textEl.textContent=text;

  const url=String(notice.url||"").trim();
  const linkText=String(notice.linkText||"查看详情").trim()||"查看详情";
  if(url){
    link.href=url; link.textContent=linkText; link.hidden=false;
    if(/^https?:\/\//i.test(url)){link.target="_blank";link.rel="noopener noreferrer";}
    else{link.removeAttribute("target");link.removeAttribute("rel");}
  }else{ link.hidden=true; link.removeAttribute("href"); }

  close.hidden=!notice.dismissible;
  close.onclick=()=>{ sessionStorage.setItem(dismissKey,"1"); shell.hidden=true; };
  shell.hidden=false;
}
function categories(posts){
  const map=new Map(); posts.forEach(p=>{ const key=p.cat||"essay"; if(!map.has(key)) map.set(key,p.category||key); }); return map;
}
function renderTabs(posts){
  const tabs=document.querySelector("[data-category-tabs]"); if(!tabs) return;
  const cats=categories(posts);
  tabs.innerHTML=`<button class="is-active" data-cat="all">全部</button>`+[...cats].map(([k,v])=>`<button data-cat="${escapeAttr(k)}">${escapeHtml(v)}</button>`).join("");
  tabs.querySelectorAll("button").forEach(btn=>btn.addEventListener("click",()=>{ activeCat=btn.dataset.cat; tabs.querySelectorAll("button").forEach(x=>x.classList.toggle("is-active",x===btn)); renderPosts(); }));
}
function postMatches(p){
  const catOk=activeCat==="all" || (p.cat||"essay")===activeCat;
  if(!catOk) return false;
  if(!query) return true;
  const hay=[p.title,p.desc,p.category,p.log,...asList(p.tags)].join(" ").toLowerCase(); return hay.includes(query);
}
function renderPosts(){
  const c=document.getElementById("post-container"); if(!c) return;
  const posts=allPosts.filter(postMatches);
  const count=document.querySelector("[data-post-count]"); if(count) count.textContent=String(posts.length);
  const empty=document.querySelector("[data-empty]"); if(empty) empty.hidden=posts.length!==0;
  c.innerHTML=posts.map(p=>{
    const href=`article.html?post=${encodeURIComponent(p.file)}`;
    return `<a class="post-card ${p.featured?"featured":""}" href="${href}" data-reveal>
      ${p.cover?`<div class="post-cover-wrap"><img class="post-cover" src="${escapeAttr(p.cover)}" alt="" loading="lazy"></div>`:""}
      <div class="post-inner">
        <div class="post-topline"><span class="cat-pill">${escapeHtml(p.category||p.cat||"随笔")}</span><span>${escapeHtml(p.log||"")}</span></div>
        <h3>${escapeHtml(p.title||"无标题")}</h3><p>${escapeHtml(p.desc||"")}</p>
        <div class="post-footer"><span>${escapeHtml(p.date||"")} · ${escapeHtml(p.time||"")}</span><span class="tag-mini">${asList(p.tags).slice(0,2).map(t=>`<span>${escapeHtml(t)}</span>`).join("")}</span></div>
      </div></a>`;
  }).join("");
  requestAnimationFrame(()=>document.querySelectorAll(".post-card[data-reveal]").forEach((el,i)=>setTimeout(()=>el.classList.add("is-visible"),Math.min(i*45,220))));
}
async function loadPosts(){
  const c=document.getElementById("post-container"); if(!c) return;
  try{
    const r=await fetch("posts/posts.json",{cache:"no-store"}); if(!r.ok) throw new Error(`HTTP ${r.status}`); allPosts=await r.json();
    renderTabs(allPosts); renderPosts();
  }catch(e){ c.innerHTML=`<div class="empty-state" style="grid-column:1/-1"><strong>文章列表加载失败</strong><p>${escapeHtml(e.message)}</p></div>`; }
}
function initSearch(config){
  const input=document.getElementById("post-search"); const wrap=document.querySelector("[data-search-wrap]"); if(!input) return;
  if(config.features?.search===false){ wrap.hidden=true; return; }
  input.addEventListener("input",()=>{query=input.value.trim().toLowerCase();renderPosts();});
  addEventListener("keydown",e=>{ if(e.key==="/" && !/input|textarea|select/i.test(document.activeElement?.tagName||"")){ e.preventDefault(); input.focus(); } });
}

(async()=>{
  try{
    const config=await loadConfig(); renderHome(config); renderHomeNotice(config); await bootCommon(config); initSearch(config); await loadPosts();
  }catch(e){ console.error(e); document.body.insertAdjacentHTML("afterbegin",`<div style="padding:12px;text-align:center;background:#ba1a1a;color:white">配置加载失败：${escapeHtml(e.message)}</div>`); }
})();
