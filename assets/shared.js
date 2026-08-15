import { applyDynamicTheme, syncBackgroundForMode } from "./theme-engine.js";

export const CONFIG_URL = "assets/site.config.json";

export function toStringArray(value) {
  if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean);
  if (value == null) return [];
  return String(value).split(/[,，\n]/).map(v => v.trim()).filter(Boolean);
}
const THEME_KEY = "chuyuan-theme-mode";
const CLIENT_KEY = "chuyuan-like-client";

export async function loadConfig(cacheBust=false) {
  const url = cacheBust ? `${CONFIG_URL}?t=${Date.now()}` : CONFIG_URL;
  const res = await fetch(url, { cache: cacheBust ? "no-store" : "default" });
  if (!res.ok) throw new Error(`site.config.json 加载失败 (HTTP ${res.status})`);
  return res.json();
}

function setText(selector, value) { document.querySelectorAll(selector).forEach(el => el.textContent = value ?? ""); }
export function applySiteChrome(config) {
  setText("[data-site-name]", config.site?.name || "初源博文");
  setText("[data-site-tagline]", config.site?.tagline || "SEEKING THE TRUTH");
  setText("[data-copyright]", config.site?.copyright || "");
  const renderLinks = (container, buttonStyle=false) => {
    if (!container) return;
    container.innerHTML = (Array.isArray(config.social) ? config.social : []).map(x => `<a class="${buttonStyle ? "tonal-button" : ""}" href="${escapeAttr(x.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(x.label)}</a>`).join("");
  };
  document.querySelectorAll("[data-social-links]").forEach(el => renderLinks(el, el.closest(".info-card") != null));
  document.querySelectorAll("[data-footer-social]").forEach(el => renderLinks(el, false));
  document.documentElement.lang = config.site?.language || "zh-CN";
}

export function escapeHtml(s="") { return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
export function escapeAttr(s="") { return escapeHtml(s); }

function resolvedDark(mode) { return mode === "dark" || (mode === "system" && matchMedia("(prefers-color-scheme: dark)").matches); }
export function applyThemeMode(mode, config) {
  const dark=resolvedDark(mode);
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  document.documentElement.dataset.themeMode=mode;
  syncBackgroundForMode(config,dark);
  const icon = mode === "system" ? "◐" : dark ? "☾" : "☀";
  document.querySelectorAll("[data-theme-icon]").forEach(el=>el.textContent=icon);
  const meta=document.querySelector('meta[name="theme-color"]'); if(meta) meta.content=getComputedStyle(document.documentElement).getPropertyValue("--md-primary").trim() || config.theme?.seedColor || "#6750A4";
  window.dispatchEvent(new CustomEvent("blog-theme-change",{detail:{mode,dark}}));
  return dark;
}

export async function initTheme(config, imageOverride=null) {
  await applyDynamicTheme(config,imageOverride);
  const stored=localStorage.getItem(THEME_KEY);
  const mode=["system","light","dark"].includes(stored) ? stored : (config.theme?.defaultMode || "system");
  applyThemeMode(mode,config);
  const mq=matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener?.("change",()=>{ if((localStorage.getItem(THEME_KEY)||config.theme?.defaultMode||"system")==="system") applyThemeMode("system",config); });
  document.querySelectorAll("[data-theme-toggle]").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const current=localStorage.getItem(THEME_KEY)||config.theme?.defaultMode||"system";
      const next=current==="system"?"light":current==="light"?"dark":"system";
      localStorage.setItem(THEME_KEY,next); applyThemeMode(next,config);
    });
  });
}

export function initReveal() {
  const els=[...document.querySelectorAll("[data-reveal]")];
  if(!els.length) return;
  if(matchMedia("(prefers-reduced-motion: reduce)").matches){ els.forEach(x=>x.classList.add("is-visible")); return; }
  const io=new IntersectionObserver(entries=>entries.forEach(e=>{ if(e.isIntersecting){e.target.classList.add("is-visible");io.unobserve(e.target);} }),{threshold:.08,rootMargin:"0px 0px -30px"});
  els.forEach(el=>io.observe(el));
}

export function initBackToTop(enabled=true) {
  const btn=document.querySelector("[data-back-to-top]"); if(!btn||!enabled) return;
  const sync=()=>btn.hidden=scrollY<520; sync(); addEventListener("scroll",sync,{passive:true}); btn.addEventListener("click",()=>scrollTo({top:0,behavior:"smooth"}));
}

export function registerPwa(enabled=true) { if(enabled && "serviceWorker" in navigator && location.protocol.startsWith("http")) addEventListener("load",()=>navigator.serviceWorker.register("./sw.js",{updateViaCache:"none"}).catch(()=>{})); }

function clientId() {
  let id=localStorage.getItem(CLIENT_KEY); if(!id){ id=crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`; localStorage.setItem(CLIENT_KEY,id); } return id;
}
function localLikeKey(slug){ return `chuyuan-like:${slug}`; }
function localCountKey(slug){ return `chuyuan-like-count:${slug}`; }
export class LikeClient {
  constructor(config){ this.cfg=config?.likes||{}; this.mode=this.cfg.mode||"auto"; this.endpoint=this.cfg.endpoint||"/api/likes"; this.id=clientId(); this.cloudAvailable=null; }
  localGet(slug){ return {count:Number(localStorage.getItem(localCountKey(slug))||0), liked:localStorage.getItem(localLikeKey(slug))==="1", source:"local"}; }
  localToggle(slug){ const cur=this.localGet(slug); const liked=!cur.liked; let count=cur.count+(liked?1:-1); count=Math.max(0,count); localStorage.setItem(localLikeKey(slug),liked?"1":"0"); localStorage.setItem(localCountKey(slug),String(count)); return {count,liked,source:"local"}; }
  async get(slug){
    if(this.mode==="local") return this.localGet(slug);
    try{ const url=new URL(this.endpoint,location.href); url.searchParams.set("post",slug); url.searchParams.set("client",this.id); const r=await fetch(url,{headers:{Accept:"application/json"}}); if(!r.ok) throw new Error(String(r.status)); this.cloudAvailable=true; return {...await r.json(),source:"cloud"}; }
    catch(e){ this.cloudAvailable=false; if(this.mode==="global") throw e; return this.localGet(slug); }
  }
  async toggle(slug){
    if(this.mode==="local" || (this.mode==="auto" && this.cloudAvailable===false)) return this.localToggle(slug);
    try{ const cur=await this.get(slug); if(cur.source!=="cloud") return this.localToggle(slug); const r=await fetch(this.endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({post:slug,client:this.id,action:cur.liked?"unlike":"like"})}); if(!r.ok) throw new Error(String(r.status)); return {...await r.json(),source:"cloud"}; }
    catch(e){ if(this.mode==="global") throw e; this.cloudAvailable=false; return this.localToggle(slug); }
  }
}

export async function bootCommon(config, imageOverride=null) {
  applySiteChrome(config);
  await initTheme(config,imageOverride);
  initReveal();
  initBackToTop(config.features?.backToTop !== false);
  registerPwa(config.features?.pwa !== false);
}
