import { loadConfig, bootCommon, applyThemeMode, escapeHtml } from "./shared.js";
import { applyDynamicTheme } from "./theme-engine.js";
import { renderMarkdown } from "./markdown.js";

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
let config={},posts=[],current=null,currentMd="",pendingHeroFiles=[],gh={owner:"",repo:"",branch:"main",token:""};
const GH_STORAGE_KEY="chuyuan-gh-credentials",GH_REMEMBER_KEY="chuyuan-gh-remember";
function toast(msg,duration=2200){const el=$("[data-toast]");if(!el)return;el.textContent=msg;el.classList.add("show");clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove("show"),duration);}
function download(name,text,type="text/plain"){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
function deepGet(obj,path){return path.split(".").reduce((v,k)=>v?.[k],obj);}
function deepSet(obj,path,value){const parts=path.split("."),last=parts.pop();let cur=obj;for(const p of parts)cur=cur[p]??={};cur[last]=value;}
function clone(v){return JSON.parse(JSON.stringify(v));}
function asList(value){if(Array.isArray(value))return value.map(x=>String(x).trim()).filter(Boolean);if(value==null)return[];return String(value).split(/[,，\n]/).map(x=>x.trim()).filter(Boolean);}
function bindTabs(){
  $$("[data-admin-tab]").forEach(btn=>btn.addEventListener("click",()=>{
    $$("[data-admin-tab]").forEach(x=>x.classList.toggle("is-active",x===btn));
    $$("[data-admin-panel]").forEach(p=>p.classList.toggle("is-active",p.dataset.adminPanel===btn.dataset.adminTab));
  }));
}
function populateConfig(){
  const panel=$("[data-admin-panel='appearance']");
  panel.querySelectorAll("[name]").forEach(el=>{const v=deepGet(config,el.name);if(el.type==="checkbox")el.checked=!!v;else if(Array.isArray(v))el.value=v.join(", ");else if(v!=null)el.value=v;});
  const c=config.comments||{};$("[data-giscus-enabled]").checked=!!c.enabled;$("[data-giscus-repo]").value=c.repo||"";$("[data-giscus-repo-id]").value=c.repoId||"";$("[data-giscus-category]").value=c.category||"";$("[data-giscus-category-id]").value=c.categoryId||"";
  gh.owner=config.admin?.githubOwner||"";gh.repo=config.admin?.githubRepo||"";gh.branch=config.admin?.githubBranch||"main";
  $("[data-gh-owner]").value=gh.owner;$("[data-gh-repo]").value=gh.repo;$("[data-gh-branch]").value=gh.branch;
  const bn=config.banner||{};
  $("[data-banner-enabled]").checked=bn.enabled!==false;$("[data-banner-variant]").value=bn.variant==="danger"?"danger":"theme";$("[data-banner-show-close]").checked=bn.showClose!==false;$("[data-banner-label]").value=bn.label||"公告";$("[data-banner-title]").value=bn.title||"";$("[data-banner-text]").value=bn.message||"";$("[data-banner-link]").value=bn.link||"";$("[data-banner-link-label]").value=bn.linkLabel||"";
  const hc=config.theme?.heroCarousel||{};$("[data-hero-enabled]").checked=hc.enabled!==false;$("[data-hero-autoplay]").checked=hc.autoplay!==false;$("[data-hero-interval]").value=Number(hc.interval||3000);renderHeroList(hc.images||[],hc.colors||{});autoFillHeroColors(hc.images||[],hc.colors||{});
}
function collectConfig(){
  const out=clone(config);
  const panel=$("[data-admin-panel='appearance']");
  panel.querySelectorAll("[name]").forEach(el=>{let v=el.type==="checkbox"?el.checked:el.value;if(el.type==="number")v=Number(v);if(el.name==="home.chips")v=asList(v);deepSet(out,el.name,v);});
  out.comments={...(out.comments||{}),enabled:$("[data-giscus-enabled]").checked,repo:$("[data-giscus-repo]").value.trim(),repoId:$("[data-giscus-repo-id]").value.trim(),category:$("[data-giscus-category]").value.trim(),categoryId:$("[data-giscus-category-id]").value.trim()};
  out.banner={enabled:$("[data-banner-enabled]").checked,variant:$("[data-banner-variant]").value,showClose:$("[data-banner-show-close]").checked,label:$("[data-banner-label]").value.trim()||"公告",title:$("[data-banner-title]").value.trim(),message:$("[data-banner-text]").value.trim(),link:$("[data-banner-link]").value.trim(),linkLabel:$("[data-banner-link-label]").value.trim()};
  out.admin={...(out.admin||{}),githubOwner:$("[data-gh-owner]").value.trim(),githubRepo:$("[data-gh-repo]").value.trim(),githubBranch:$("[data-gh-branch]").value.trim()||"main"};
  const hero=readHeroData();
  out.theme={...(out.theme||{}),heroCarousel:{enabled:$("[data-hero-enabled]").checked,autoplay:$("[data-hero-autoplay]").checked,interval:Math.max(1000,Number($("[data-hero-interval]").value)||3000),images:hero.images,colors:hero.colors}};
  const pw=$("[data-admin-password]").value.trim();if(pw)out.admin.password=pw;
  return out;
}
async function previewConfig(){config=collectConfig();let override=null;if(pendingBgFile)override=URL.createObjectURL(pendingBgFile);await applyDynamicTheme(config,override);applyThemeMode(document.documentElement.dataset.themeMode||config.theme?.defaultMode||"system",config);if(override)setTimeout(()=>URL.revokeObjectURL(override),2000);toast("已应用预览");}
function bindConfig(){
  $("[data-reset-config]").onclick=async()=>{try{config=await loadConfig(true);populateConfig();toast("已重新载入");}catch(e){toast(e.message,9000);}};
  $("[data-preview-config]").onclick=previewConfig;
  $("[data-download-config]").onclick=()=>{try{config=collectConfig();download("site.config.json",JSON.stringify(config,null,2),"application/json");toast("配置已生成");}catch(e){toast(e.message,9000);}};
  $("[data-hero-add]").onclick=()=>{$("[data-hero-file]")?.click();};
  $("[data-hero-file]").onchange=()=>{pendingHeroFiles=[...($("[data-hero-file]")?.files||[])];updateHeroUploadState();if(pendingHeroFiles.length)toast(`已选择 ${pendingHeroFiles.length} 张图片`);};
  $("[data-hero-upload]").onclick=uploadHeroFiles;
}
function updateHeroUploadState(){
  const btn=$("[data-hero-upload]"),file=$("[data-hero-file]"),name=$("[data-hero-file-name]");
  if(name)name.textContent=pendingHeroFiles.length?`已选择 ${pendingHeroFiles.length} 张图片`:"未选择图片";
  if(btn)btn.disabled=!pendingHeroFiles.length||!gh.token;
  if(file&&pendingHeroFiles.length===0)file.value="";
}
function rgbHex(r,g,b){return `#${[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,"0")).join("").toUpperCase()}`;}
async function extractImageColor(source){
  return new Promise(resolve=>{
    const img=new Image();img.crossOrigin="anonymous";img.onload=()=>{try{const size=48,c=document.createElement("canvas");c.width=c.height=size;const ctx=c.getContext("2d",{willReadFrequently:true});ctx.drawImage(img,0,0,size,size);const d=ctx.getImageData(0,0,size,size).data;let r=0,g=0,b=0,w=0;for(let i=0;i<d.length;i+=16){const a=d[i+3]/255;if(a<.4)continue;const rr=d[i],gg=d[i+1],bb=d[i+2],lum=(rr+gg+bb)/3;if(lum<18||lum>245)continue;const chroma=Math.max(rr,gg,bb)-Math.min(rr,gg,bb);const ww=a*(1+chroma/100);r+=rr*ww;g+=gg*ww;b+=bb*ww;w+=ww;}resolve(w?rgbHex(r/w,g/w,b/w):null);}catch{resolve(null);}};img.onerror=()=>resolve(null);img.src=typeof source==="string"?source:URL.createObjectURL(source);
  });
}
async function nextHeadNames(count){
  readGh();
  const url=api("images");
  const r=await fetch(`${url}?ref=${encodeURIComponent(gh.branch)}`,{headers:authHeaders()});
  if(!r.ok){if(r.status===404)return Array.from({length:count},(_,i)=>`head${String(i+1).padStart(2,"0")}.jpeg`);throw new Error(await githubError(r,"读取 images 目录"));}
  const items=await r.json(),used=new Set();
  (Array.isArray(items)?items:[]).forEach(x=>{const m=String(x.name||"").match(/^head(\d+)\.[^.]+$/i);if(m)used.add(Number(m[1]));});
  const out=[];let n=1;while(out.length<count){if(!used.has(n)){out.push(`head${String(n).padStart(2,"0")}.jpeg`);used.add(n);}n++;}return out;
}
function readHeroData(){
  const images=[...document.querySelectorAll("[data-hero-url]")].map(i=>i.value.trim()).filter(Boolean);
  const colors={};document.querySelectorAll("[data-hero-color]").forEach(i=>{const src=i.closest(".hero-image-item")?.querySelector("[data-hero-url]")?.value.trim();if(src&&/^#[0-9a-f]{6}$/i.test(i.value))colors[src]=i.value.toUpperCase();});
  return {images,colors};
}
function readHeroList(){return readHeroData().images;}
async function autoFillHeroColors(images,colors){
  const data={...colors};let changed=false;
  for(const src of images){if(data[src])continue;const color=await extractImageColor(src);if(color){data[src]=color;changed=true;const row=[...document.querySelectorAll("[data-hero-url]")].find(x=>x.value.trim()===src)?.closest(".hero-image-item");const input=row?.querySelector("[data-hero-color]");if(input)input.value=color;}}
  if(changed){const current=readHeroData();current.images.forEach(src=>{if(data[src])current.colors[src]=data[src];});}
}
function renderHeroList(images,colors={}){
  const box=$("[data-hero-list]");if(!box)return;
  const normalized=images.map((x,i)=>typeof x==="string"?{src:x,color:colors[x]||""}:x).filter(x=>x.src);
  if(!normalized.length){box.innerHTML=`<div class="hero-image-item-empty">尚未配置头图。</div>`;return;}
  box.innerHTML=normalized.map((x,i)=>`<div class="hero-image-item" data-hero-index="${i}" draggable="true"><span class="hero-drag" title="拖动排序">☰</span><img src="${escapeHtml(x.src)}" alt="" onerror="this.style.opacity=.35"><input type="text" data-hero-url value="${escapeHtml(x.src)}" placeholder="images/head01.jpeg"><input type="color" data-hero-color value="${/^#[0-9a-f]{6}$/i.test(x.color)?x.color:"#6750A4"}" title="编辑取色"><button class="icon-button" type="button" data-hero-remove="${i}" title="删除" aria-label="删除"><span class="symbol symbol--close" aria-hidden="true"></span></button></div>`).join("");
  let dragIndex=-1;
  box.querySelectorAll(".hero-image-item").forEach(item=>{item.addEventListener("dragstart",()=>{dragIndex=Number(item.dataset.heroIndex);item.classList.add("is-dragging");});item.addEventListener("dragend",()=>item.classList.remove("is-dragging"));item.addEventListener("dragover",e=>e.preventDefault());item.addEventListener("drop",e=>{e.preventDefault();const to=Number(item.dataset.heroIndex);if(dragIndex<0||dragIndex===to)return;const data=readHeroData();const src=data.images.splice(dragIndex,1)[0];data.images.splice(to,0,src);const nextColors=data.colors;renderHeroList(data.images,nextColors);toast("排序已更新，请保存");});});
  box.querySelectorAll("[data-hero-remove]").forEach(btn=>btn.onclick=()=>{const data=readHeroData();data.images.splice(Number(btn.dataset.heroRemove),1);renderHeroList(data.images,data.colors);});
  box.querySelectorAll("[data-hero-url]").forEach(inp=>inp.oninput=()=>{const data=readHeroData();const i=Number(inp.closest(".hero-image-item").dataset.heroIndex);const old=normalized[i].src;const val=inp.value.trim();if(old&&data.colors[old]&&!data.colors[val])data.colors[val]=data.colors[old];});
  box.querySelectorAll("[data-hero-color]").forEach(inp=>inp.onchange=()=>toast("取色已修改，请保存"));
}
async function uploadHeroFiles(){
  if(!pendingHeroFiles.length){toast("请先选择头图");return;}
  if(!gh.token){toast("请先在 GitHub 页面测试连接");return;}
  const btn=$("[data-hero-upload]"),old=btn?.textContent;if(btn){btn.disabled=true;btn.textContent="上传中…";}
  try{
    const names=await nextHeadNames(pendingHeroFiles.length),data=readHeroData();
    for(let i=0;i<pendingHeroFiles.length;i++){
      const file=pendingHeroFiles[i],name=names[i],path=`images/${name}`;
      await githubWriteBinary(path,file,`Add hero image: ${name}`);
      const color=await extractImageColor(file);data.images.push(path);if(color)data.colors[path]=color;
    }
    renderHeroList(data.images,data.colors);pendingHeroFiles=[];$("[data-hero-file]").value="";updateHeroUploadState();config=collectConfig();await githubWrite("assets/site.config.json",JSON.stringify(config,null,2),"Update hero carousel");toast(`成功上传 ${names.length} 张头图`);
  }catch(e){toast(`头图上传失败：${e.message}`,9000);}
  finally{if(btn){btn.textContent=old||"上传并保存";updateHeroUploadState();}}
}
async function loadPosts(){const r=await fetch(`posts/posts.json?t=${Date.now()}`,{cache:"no-store"});if(!r.ok)throw new Error(`posts.json HTTP ${r.status}`);const data=await r.json();posts=Array.isArray(data)?data:[];renderPostList();if(posts[0])await openPost(posts[0].file);}
function renderPostList(){const box=$("[data-admin-post-list]");box.innerHTML=posts.map(p=>`<button data-open-post="${escapeHtml(p.file)}" class="${current?.file===p.file?"is-active":""}"><strong>${escapeHtml(p.title||p.file)}</strong><br><small>${escapeHtml(p.date||"")} · ${escapeHtml(p.category||p.cat||"")}</small></button>`).join("");box.querySelectorAll("[data-open-post]").forEach(b=>b.onclick=()=>openPost(b.dataset.openPost));}
async function openPost(file){current=clone(posts.find(p=>p.file===file)||{});const r=await fetch(`posts/${encodeURIComponent(file)}.md?t=${Date.now()}`,{cache:"no-store"});currentMd=r.ok?await r.text():`# ${current.title||"新文章"}\n`;fillEditor();renderPostList();$("[data-delete-post]").disabled=false;}
function fillEditor(){if(!current)return;$("[data-editor-heading]").textContent=current.title||"新文章";$("[data-post-file]").value=current.file||"";$("[data-post-cat]").value=current.cat||"essay";$("[data-post-title]").value=current.title||"";$("[data-post-desc]").value=current.desc||"";$("[data-post-category]").value=current.category||"";$("[data-post-date]").value=current.date||new Date().toISOString().slice(0,10);$("[data-post-time]").value=current.time||"5 min";$("[data-post-cover]").value=current.cover||"";$("[data-post-featured]").checked=!!current.featured;$("[data-post-tags]").value=asList(current.tags).join(", ");$("[data-markdown]").value=currentMd;renderPreview();}
function collectPost(){return{file:$("[data-post-file]").value.trim(),cat:$("[data-post-cat]").value,category:$("[data-post-category]").value.trim(),log:current?.log||"POST",title:$("[data-post-title]").value.trim(),desc:$("[data-post-desc]").value.trim(),date:$("[data-post-date]").value,time:$("[data-post-time]").value.trim(),cover:$("[data-post-cover]").value.trim(),featured:$("[data-post-featured]").checked,tags:asList($("[data-post-tags]").value)};}
function renderPreview(){const md=$("[data-markdown]").value;$("[data-markdown-preview]").innerHTML=renderMarkdown(md).html;}
function saveSession(){const p=collectPost();if(!p.file||!p.title){toast("请填写文件名和标题");return false;}current=p;currentMd=$("[data-markdown]").value;const i=posts.findIndex(x=>x.file===p.file);if(i>=0)posts[i]=clone(p);else posts.unshift(clone(p));renderPostList();$("[data-save-state]").textContent="已保存到当前编辑会话";toast("已保存");return true;}
function bindPosts(){
  $("[data-markdown]").addEventListener("input",renderPreview);
  $("[data-new-post]").onclick=()=>{current={file:"new-post",cat:"essay",category:"随笔",log:"POST",title:"新文章",desc:"",date:new Date().toISOString().slice(0,10),time:"5 min",cover:"",featured:false,tags:[]};currentMd="# 新文章\n\n开始写作。";fillEditor();renderPostList();$("[data-delete-post]").disabled=true;};
  $("[data-save-post-local]").onclick=saveSession;
  $("[data-download-post]").onclick=()=>{if(saveSession())download(`${current.file}.md`,currentMd,"text/markdown");};
  $("[data-download-posts-json]").onclick=()=>{saveSession();download("posts.json",JSON.stringify(posts,null,2),"application/json");};
  $("[data-delete-post]").onclick=async()=>{
    if(!current||!current.file){toast("请先选择文章");return;}
    const file=current.file;
    if(!posts.some(p=>p.file===file)){toast("当前文章尚未保存，无法删除");return;}
    if(!confirm(`确定删除文章「${current.title||file}」？\n将从 GitHub 删除 ${file}.md，并从索引中移除。`))return;
    try{
      const idx=posts.findIndex(p=>p.file===file);
      if(idx>=0)posts.splice(idx,1);
      if(gh.token||$("[data-gh-token]").value.trim()){
        await githubDelete(`posts/${file}.md`,`Delete post: ${file}`);
        await githubWrite("posts/posts.json",JSON.stringify(posts,null,2),"Remove deleted post from index");
        toast("文章已删除并提交到 GitHub");
      }else{
        toast("已从本地会话删除（未连接 GitHub，未提交）");
      }
      current=null;currentMd="";
      $("[data-editor-heading]").textContent="选择一篇文章";
      $("[data-delete-post]").disabled=true;
      renderPostList();
    }catch(e){toast(e.message,9000);}
  };
}
function readGh(){gh={owner:$("[data-gh-owner]").value.trim(),repo:$("[data-gh-repo]").value.trim(),branch:$("[data-gh-branch]").value.trim()||"main",token:$("[data-gh-token]").value.trim()};return gh;}
function api(path){const g=readGh();return `https://api.github.com/repos/${encodeURIComponent(g.owner)}/${encodeURIComponent(g.repo)}/contents/${path.split("/").map(encodeURIComponent).join("/")}`;}
function authHeaders(){return{Accept:"application/vnd.github+json",Authorization:`Bearer ${gh.token}`,"X-GitHub-Api-Version":"2022-11-28"};}
async function githubError(res,action){
  let detail="";
  try{const data=await res.clone().json();detail=data?.message||JSON.stringify(data);}catch{try{detail=(await res.text()).trim();}catch{}}
  const requestId=res.headers.get("x-github-request-id");
  const suffix=requestId?` · Request ID ${requestId}`:"";
  return `${action}失败 ${res.status}${detail?`: ${detail}`:""}${suffix}`;
}
function b64utf8(text){const bytes=new TextEncoder().encode(text);let bin="";bytes.forEach(b=>bin+=String.fromCharCode(b));return btoa(bin);}
async function githubWrite(path,content,message){
  readGh();if(!gh.token)throw new Error("请先填写 GitHub PAT");
  const url=api(path);
  for(let attempt=0;attempt<2;attempt++){
    let sha;const get=await fetch(`${url}?ref=${encodeURIComponent(gh.branch)}`,{headers:authHeaders()});
    if(get.ok)sha=(await get.json()).sha;else if(get.status!==404)throw new Error(await githubError(get,`读取 ${path}`));
    const put=await fetch(url,{method:"PUT",headers:{...authHeaders(),"Content-Type":"application/json"},body:JSON.stringify({message,content:b64utf8(content),branch:gh.branch,...(sha?{sha}:{})})});
    if(put.ok)return put.json();
    if(put.status===409&&attempt===0)continue;
    throw new Error(await githubError(put,`提交 ${path}`));
  }
}
async function githubWriteBinary(path,file,message){
  const bytes=new Uint8Array(await file.arrayBuffer());let bin="";for(let i=0;i<bytes.length;i+=0x8000)bin+=String.fromCharCode(...bytes.subarray(i,i+0x8000));
  readGh();if(!gh.token)throw new Error("请先填写 GitHub PAT");
  const url=api(path);
  for(let attempt=0;attempt<2;attempt++){
    let sha;const get=await fetch(`${url}?ref=${encodeURIComponent(gh.branch)}`,{headers:authHeaders()});
    if(get.ok)sha=(await get.json()).sha;else if(get.status!==404)throw new Error(await githubError(get,`读取 ${path}`));
    const put=await fetch(url,{method:"PUT",headers:{...authHeaders(),"Content-Type":"application/json"},body:JSON.stringify({message,content:btoa(bin),branch:gh.branch,...(sha?{sha}:{})})});
    if(put.ok)return put.json();
    if(put.status===409&&attempt===0)continue;
    throw new Error(await githubError(put,`上传 ${path}`));
  }
}
async function githubDelete(path,message){readGh();if(!gh.token)throw new Error("请先填写 GitHub PAT");const url=api(path);const get=await fetch(`${url}?ref=${encodeURIComponent(gh.branch)}`,{headers:authHeaders()});if(get.status===404)return;if(!get.ok)throw new Error(await githubError(get,`读取 ${path}`));const sha=(await get.json()).sha;const del=await fetch(url,{method:"DELETE",headers:{...authHeaders(),"Content-Type":"application/json"},body:JSON.stringify({message,branch:gh.branch,sha})});if(!del.ok)throw new Error(await githubError(del,`删除 ${path}`));return del.json();}
function restoreGh(){let saved=null;try{saved=JSON.parse(localStorage.getItem(GH_STORAGE_KEY)||"null");}catch{}if(!saved||typeof saved!=="object")return false;gh={...gh,...saved};$("[data-gh-owner]").value=gh.owner||"";$("[data-gh-repo]").value=gh.repo||"";$("[data-gh-branch]").value=gh.branch||"main";if(gh.token)$("[data-gh-token]").value=gh.token;$("[data-gh-remember]").checked=localStorage.getItem(GH_REMEMBER_KEY)==="1";return !!gh.token;}
async function testGithub(silent=false){readGh();if(!gh.owner||!gh.repo||!gh.token){toast("请填写仓库和 PAT");return;}const user=await fetch("https://api.github.com/user",{headers:authHeaders()});if(!user.ok){toast(await githubError(user,"PAT 认证"),9000);return;}const me=await user.json();const r=await fetch(`https://api.github.com/repos/${encodeURIComponent(gh.owner)}/${encodeURIComponent(gh.repo)}`,{headers:authHeaders()});if(!r.ok){toast(await githubError(r,"访问仓库"),9000);return;}$("[data-admin-status]").textContent=`已认证：${me.login}`;$("[data-push-config]").disabled=false;$("[data-push-post]").disabled=false;$("[data-save-giscus]").disabled=false;$("[data-save-password]").disabled=false;$("[data-save-hero]").disabled=false;$("[data-save-site]").disabled=false;$("[data-save-theme]").disabled=false;$("[data-save-banner]").disabled=false;if($("[data-gh-remember]").checked){localStorage.setItem(GH_STORAGE_KEY,JSON.stringify({owner:gh.owner,repo:gh.repo,branch:gh.branch,token:gh.token}));localStorage.setItem(GH_REMEMBER_KEY,"1");}else{localStorage.removeItem(GH_STORAGE_KEY);localStorage.removeItem(GH_REMEMBER_KEY);}if(!silent)toast(`PAT 认证成功：${me.login}。注意：公开仓库读取成功不代表该 PAT 已获写权限。`,6500);}
function bindGithub(){
  $("[data-gh-test]").onclick=()=>testGithub(false);
  const saveBy=(label,commitMsg,stateEl)=>()=>{
    try{
      config=collectConfig();
      githubWrite("assets/site.config.json",JSON.stringify(config,null,2),commitMsg)
        .then(()=>{if(stateEl)stateEl.textContent="已保存";toast(`${label}已保存`);})
        .catch(e=>{if(stateEl)stateEl.textContent="保存失败";toast(e.message,9000);});
    }catch(e){toast(e.message,9000);}
  };
  $("[data-save-site]").onclick=saveBy("站点配置","Update site settings",$("[data-site-state]"));
  $("[data-save-theme]").onclick=saveBy("主题外观","Update theme settings",$("[data-theme-state]"));
  $("[data-save-banner]").onclick=saveBy("公告","Update banner",$("[data-banner-state]"));
  $("[data-save-giscus]").onclick=saveBy("Giscus 配置","Update Giscus config",$("[data-giscus-state]"));
  $("[data-save-hero]").onclick=saveBy("头图轮播","Update hero carousel",null);
  $("[data-push-config]").onclick=async()=>{try{config=collectConfig();await githubWrite("assets/site.config.json",JSON.stringify(config,null,2),"Update site config");toast("配置已提交");}catch(e){toast(e.message,9000);}};
  $("[data-save-password]").onclick=async()=>{try{const v=$("[data-admin-password]").value.trim();if(!v){toast("请输入新的管理密码");return;}if(v.length<4){toast("密码至少 4 位");return;}config=collectConfig();config.admin=config.admin||{};config.admin.password=v;await githubWrite("assets/site.config.json",JSON.stringify(config,null,2),"Update admin password");$("[data-admin-password]").value="";$("[data-password-state]").textContent="已保存";toast("管理密码已保存，下次进入需验证");}catch(e){toast(e.message,9000);}};
  $("[data-push-post]").onclick=async()=>{try{if(!saveSession())return;await githubWrite(`posts/${current.file}.md`,currentMd,`Update post: ${current.title}`);await githubWrite("posts/posts.json",JSON.stringify(posts,null,2),"Update posts index");toast("文章已提交");}catch(e){toast(e.message,9000);}};
}
async function runDiagnostics(){const box=$("[data-diagnostics]");box.innerHTML="";const checks=[];const probe=async(label,url)=>{try{const r=await fetch(`${url}${url.includes("?")?"&":"?"}t=${Date.now()}`,{cache:"no-store"});checks.push([label,r.ok,`HTTP ${r.status}`]);}catch(e){checks.push([label,false,e.message]);}};await probe("站点配置","assets/site.config.json");await probe("文章索引","posts/posts.json");if(config.theme?.background?.image)await probe("背景图片",config.theme.background.image);const comments=config.comments?.enabled?!!(config.comments.repo&&config.comments.repoId&&config.comments.category&&config.comments.categoryId):true;checks.push(["Giscus 配置",comments,config.comments?.enabled?"已启用":"未启用（可选）"]);checks.push(["横幅公告",true,config.banner?.enabled===false?"已停用":"已启用"]);try{const r=await fetch(`/api/likes?post=healthcheck&client=00000000-0000-4000-8000-000000000000`);checks.push(["全站点赞 API",r.ok,r.ok?"可用":`HTTP ${r.status}（可选）`]);}catch{checks.push(["全站点赞 API",false,"不可用（可选）"]);}checks.push(["动态配色",true,document.documentElement.dataset.colorEngine||"fallback"]);box.innerHTML=checks.map(([label,ok,detail])=>`<div class="diagnostic-item ${ok?"ok":"bad"}"><strong>${escapeHtml(label)}</strong><span>${escapeHtml(detail)}</span></div>`).join("");}
const ADMIN_UNLOCK_KEY="chuyuan-admin-unlocked";
function initAdmin(){
  const restored=restoreGh();
  bindConfig();
  bindPosts();
  bindGithub();
  loadPosts().catch(e=>toast(e.message,9000));
  $("[data-run-diagnostics]").onclick=runDiagnostics;
  if(restored)testGithub(true);
}
function initLock(){
  const lock=$("[data-admin-lock]");if(!lock)return;
  lock.hidden=true;
  const needs=!!config.admin?.password;
  if(!needs)return;
  if(sessionStorage.getItem(ADMIN_UNLOCK_KEY)==="1")return;
  const shell=document.querySelector(".admin-shell"),appbar=document.querySelector(".top-app-bar");
  lock.hidden=false;if(shell)shell.hidden=true;if(appbar)appbar.hidden=true;
  const input=$("[data-lock-password]"),err=$("[data-lock-error]"),btn=$("[data-lock-unlock]");
  const tryUnlock=()=>{
    if((input.value||"")===config.admin.password){
      sessionStorage.setItem(ADMIN_UNLOCK_KEY,"1");
      lock.hidden=true;if(shell)shell.hidden=false;if(appbar)appbar.hidden=false;
      input.value="";
      initAdmin();toast("已解锁");
    }else{input.value="";err.textContent="密码不正确";input.focus();}
  };
  btn.onclick=tryUnlock;
  input.addEventListener("keydown",e=>{if(e.key==="Enter")tryUnlock();});
  input.focus();
}
(async()=>{try{config=await loadConfig(true);await bootCommon(config);bindTabs();populateConfig();initLock();if(!config.admin?.password||sessionStorage.getItem(ADMIN_UNLOCK_KEY)==="1")initAdmin();}catch(e){console.error(e);toast(e.message,9000);}})();
