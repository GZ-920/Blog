import { loadConfig, initTheme, applyThemeMode, escapeHtml, toStringArray } from "./shared.js";
import { applyDynamicTheme } from "./theme-engine.js";
import { renderMarkdown } from "./markdown.js";

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
let config=null, posts=[], postBodies=new Map(), currentIndex=-1, backgroundFile=null;
let gh={owner:"",repo:"",branch:"main",token:"",connected:false};

function toast(msg,duration=2600){ const t=$("[data-toast]"); if(!t)return; t.textContent=msg; t.classList.add("is-visible"); clearTimeout(toast._timer); toast._timer=setTimeout(()=>t.classList.remove("is-visible"),duration); }
function clone(v){ return JSON.parse(JSON.stringify(v)); }
function getPath(obj,path){ return path.split(".").reduce((a,k)=>a?.[k],obj); }
function setPath(obj,path,value){ const keys=path.split("."); let cur=obj; keys.slice(0,-1).forEach(k=>{cur[k]??={};cur=cur[k];});cur[keys.at(-1)]=value; }
function download(name,content,type="text/plain;charset=utf-8"){ const blob=new Blob([content],{type}); const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500); }
function utf8Base64(text){ const bytes=new TextEncoder().encode(text); let bin=""; for(const b of bytes) bin+=String.fromCharCode(b); return btoa(bin); }
function arrayBufferBase64(buf){ const bytes=new Uint8Array(buf); let out=""; const chunk=0x8000; for(let i=0;i<bytes.length;i+=chunk) out+=String.fromCharCode(...bytes.subarray(i,i+chunk)); return btoa(out); }

function initTabs(){ $$('[data-admin-tab]').forEach(btn=>btn.onclick=()=>{ $$('[data-admin-tab]').forEach(b=>b.classList.toggle('is-active',b===btn)); $$('[data-admin-panel]').forEach(p=>p.classList.toggle('is-active',p.dataset.adminPanel===btn.dataset.adminTab)); }); }

function fillConfigForm(){
  $$('#config-form [name]').forEach(input=>{
    const v=getPath(config,input.name);
    if(input.type==='checkbox') input.checked=!!v;
    else if(input.name==='home.chips') input.value=toStringArray(v).join(', ');
    else input.value=v??'';
  });
  $('[data-giscus-enabled]').checked=!!config.comments?.enabled;
  $('[data-giscus-repo]').value=config.comments?.repo||'';
  $('[data-giscus-repo-id]').value=config.comments?.repoId||'';
  $('[data-giscus-category]').value=config.comments?.category||'';
  $('[data-giscus-category-id]').value=config.comments?.categoryId||'';
  $('[data-gh-owner]').value=config.admin?.githubOwner||'GZ-920';
  $('[data-gh-repo]').value=config.admin?.githubRepo||'Blog';
  $('[data-gh-branch]').value=config.admin?.githubBranch||'main';
  gh.owner=$('[data-gh-owner]').value; gh.repo=$('[data-gh-repo]').value; gh.branch=$('[data-gh-branch]').value;
}
function readConfigForm(){
  $$('#config-form [name]').forEach(input=>{
    let v=input.type==='checkbox'?input.checked:input.value;
    if(input.type==='number') v=Number(v||0);
    if(input.name==='home.chips') v=toStringArray(v);
    setPath(config,input.name,v);
  });
  config.comments??={};
  config.comments.enabled=$('[data-giscus-enabled]').checked;
  config.comments.repo=$('[data-giscus-repo]').value.trim();
  config.comments.repoId=$('[data-giscus-repo-id]').value.trim();
  config.comments.category=$('[data-giscus-category]').value.trim();
  config.comments.categoryId=$('[data-giscus-category-id]').value.trim();
  config.admin??={};
  config.admin.githubOwner=$('[data-gh-owner]').value.trim(); config.admin.githubRepo=$('[data-gh-repo]').value.trim(); config.admin.githubBranch=$('[data-gh-branch]').value.trim()||'main';
  return config;
}
function bindConfig(){
  $('[data-preview-config]').onclick=async()=>{readConfigForm(); await applyDynamicTheme(config); applyThemeMode(document.documentElement.dataset.themeMode||config.theme?.defaultMode||'system',config);toast('已在当前页面应用配置');};
  $('[data-download-config]').onclick=()=>{readConfigForm();download('site.config.json',JSON.stringify(config,null,2),'application/json;charset=utf-8');};
  $('[data-reset-config]').onclick=async()=>{config=await loadConfig(true);fillConfigForm();await applyDynamicTheme(config);toast('已重新载入仓库配置');};
}

function initBackground(){
  const input=$('#background-file');
  input.onchange=()=>{ const file=input.files?.[0]; if(!file)return; backgroundFile=file; const url=URL.createObjectURL(file); const img=$('[data-bg-preview]');img.src=url;img.hidden=false;$('[data-upload-background]').disabled=!gh.connected; applyDynamicTheme(config,url);toast('已从所选图片重新取色'); };
  $('[data-upload-background]').onclick=async()=>{
    if(!backgroundFile||!gh.connected)return;
    try{
      const ext=(backgroundFile.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg'; const path=`images/background.${ext}`;
      await putGithubFile(path,arrayBufferBase64(await backgroundFile.arrayBuffer()),`chore: update blog background`);
      config.theme.background.image=path; fillConfigForm();
      await pushConfig(); toast(`背景已上传并更新配置：${path}`);
    }catch(e){toast(`上传失败：${e.message}`,9000);}
  };
}

async function loadPosts(){
  const r=await fetch(`posts/posts.json?t=${Date.now()}`,{cache:'no-store'}); if(!r.ok)throw new Error(`posts.json HTTP ${r.status}`);posts=await r.json();if(!Array.isArray(posts))throw new Error('posts.json 顶层必须是数组');renderPostList();if(posts.length)await selectPost(0);
}
function renderPostList(){ const box=$('[data-admin-post-list]'); box.innerHTML=posts.map((p,i)=>`<button class="admin-post-item ${i===currentIndex?'is-active':''}" data-i="${i}"><strong>${escapeHtml(p.title||'无标题')}</strong><small>${escapeHtml(p.file||'')} · ${escapeHtml(p.date||'')}</small></button>`).join(''); box.querySelectorAll('button').forEach(b=>b.onclick=()=>selectPost(Number(b.dataset.i))); }
async function selectPost(i){
  saveEditorToMemory(false); currentIndex=i; const p=posts[i]; if(!p)return; renderPostList(); $('[data-editor-heading]').textContent=p.title||'编辑文章';
  $('[data-post-file]').value=p.file||'';$('[data-post-cat]').value=p.cat||'essay';$('[data-post-title]').value=p.title||'';$('[data-post-desc]').value=p.desc||'';$('[data-post-category]').value=p.category||'';$('[data-post-date]').value=p.date||'';$('[data-post-time]').value=p.time||'';$('[data-post-cover]').value=p.cover||'';$('[data-post-featured]').checked=!!p.featured;$('[data-post-tags]').value=toStringArray(p.tags).join(', ');
  let md=postBodies.get(p.file); if(md==null){try{const r=await fetch(`posts/${encodeURIComponent(p.file)}.md?t=${Date.now()}`,{cache:'no-store'});md=r.ok?await r.text():'';}catch{md='';}postBodies.set(p.file,md);}
  $('[data-markdown]').value=md; renderPreview(); $('[data-save-state]').textContent='';
}
function editorMeta(){ if(currentIndex<0)return null; const old=posts[currentIndex]||{}; return {...old,file:$('[data-post-file]').value.trim().replace(/\.md$/i,'').replace(/[^\w\-\u4e00-\u9fff]/g,'-')||'untitled',cat:$('[data-post-cat]').value,title:$('[data-post-title]').value.trim()||'无标题',desc:$('[data-post-desc]').value.trim(),category:$('[data-post-category]').value.trim()||$('[data-post-cat]').value,date:$('[data-post-date]').value,time:$('[data-post-time]').value.trim(),cover:$('[data-post-cover]').value.trim(),featured:$('[data-post-featured]').checked,tags:toStringArray($('[data-post-tags]').value)}; }
function saveEditorToMemory(show=true){ if(currentIndex<0)return; const oldFile=posts[currentIndex]?.file; const p=editorMeta(); if(oldFile&&oldFile!==p.file&&postBodies.has(oldFile)){postBodies.set(p.file,postBodies.get(oldFile));postBodies.delete(oldFile);} posts[currentIndex]=p;postBodies.set(p.file,$('[data-markdown]').value);renderPostList();$('[data-editor-heading]').textContent=p.title;if(show){$('[data-save-state]').textContent='已保存到编辑会话';toast('已保存到当前编辑会话');} }
function renderPreview(){ const {html}=renderMarkdown($('[data-markdown]').value);$('[data-markdown-preview]').innerHTML=html||'<p class="placeholder-copy">预览会显示在这里。</p>'; }
function bindPostEditor(){
  $('[data-markdown]').addEventListener('input',()=>{renderPreview();$('[data-save-state]').textContent='有未保存修改';});
  $('[data-new-post]').onclick=async()=>{saveEditorToMemory(false);const today=new Date().toISOString().slice(0,10);posts.unshift({file:`new-post-${Date.now()}`,cat:'essay',category:'随笔',log:'NEW',title:'新文章',desc:'',date:today,time:'3 min',cover:'',featured:false,tags:[]});currentIndex=-1;renderPostList();await selectPost(0);$('[data-post-title]').select();};
  $('[data-save-post-local]').onclick=()=>saveEditorToMemory(true);
  $('[data-download-post]').onclick=()=>{saveEditorToMemory(false);const p=posts[currentIndex];download(`${p.file}.md`,postBodies.get(p.file)||'');};
  $('[data-download-posts-json]').onclick=()=>{saveEditorToMemory(false);download('posts.json',JSON.stringify(posts,null,2),'application/json;charset=utf-8');};
  $('[data-push-post]').onclick=pushCurrentPost;
}

function syncGhState(){ gh.owner=$('[data-gh-owner]').value.trim();gh.repo=$('[data-gh-repo]').value.trim();gh.branch=$('[data-gh-branch]').value.trim()||'main';gh.token=$('[data-gh-token]').value.trim(); }
function ghHeaders(){ return {Accept:'application/vnd.github+json',Authorization:`Bearer ${gh.token}`,'X-GitHub-Api-Version':'2022-11-28'}; }
function ghUrl(path){return `https://api.github.com/repos/${encodeURIComponent(gh.owner)}/${encodeURIComponent(gh.repo)}/${path}`;}
async function githubError(r,action){ let detail=''; try{const d=await r.clone().json();detail=d?.message||JSON.stringify(d);}catch{try{detail=(await r.text()).trim();}catch{}} const requestId=r.headers.get('x-github-request-id'); return `${action}失败：HTTP ${r.status}${detail?` · ${detail}`:''}${requestId?` · Request ID ${requestId}`:''}`; }
async function getGithubSha(path){ const r=await fetch(`${ghUrl(`contents/${path.split('/').map(encodeURIComponent).join('/')}`)}?ref=${encodeURIComponent(gh.branch)}`,{headers:ghHeaders()});if(r.status===404)return null;if(!r.ok)throw new Error(await githubError(r,`读取 ${path}`));return (await r.json()).sha; }
async function putGithubFile(path,base64,message){ const sha=await getGithubSha(path); const body={message,content:base64,branch:gh.branch};if(sha)body.sha=sha;const r=await fetch(ghUrl(`contents/${path.split('/').map(encodeURIComponent).join('/')}`),{method:'PUT',headers:{...ghHeaders(),'Content-Type':'application/json'},body:JSON.stringify(body)});if(!r.ok)throw new Error(await githubError(r,`写入 ${path}`));return r.json(); }
async function testGithub(){ syncGhState(); if(!gh.owner||!gh.repo||!gh.token){toast('请填写 Owner、Repository 和 PAT');return;}const b=$('[data-gh-test]');b.disabled=true;try{const user=await fetch('https://api.github.com/user',{headers:ghHeaders()});if(!user.ok)throw new Error(await githubError(user,'PAT 认证'));const me=await user.json();const r=await fetch(`https://api.github.com/repos/${encodeURIComponent(gh.owner)}/${encodeURIComponent(gh.repo)}`,{headers:ghHeaders()});if(!r.ok)throw new Error(await githubError(r,'访问仓库'));gh.connected=true;const status=$('[data-admin-status]');status.textContent=`已认证 ${me.login} · ${gh.owner}/${gh.repo}`;status.classList.add('is-ok');$('[data-push-config]').disabled=false;$('[data-push-post]').disabled=false;$('[data-upload-background]').disabled=!backgroundFile;toast(`PAT 认证成功：${me.login}。读取成功不代表写入一定成功；若写入失败将显示 GitHub 详细原因。`,6500);}catch(e){gh.connected=false;toast(`连接失败：${e.message}`,9000);}finally{b.disabled=false;} }
async function pushConfig(){ if(!gh.connected)throw new Error('尚未连接 GitHub');readConfigForm();await putGithubFile('assets/site.config.json',utf8Base64(JSON.stringify(config,null,2)+'\n'),'chore: update blog configuration'); }
async function pushCurrentPost(){ if(!gh.connected){toast('请先连接 GitHub');return;}saveEditorToMemory(false);const p=posts[currentIndex];const btn=$('[data-push-post]');btn.disabled=true;try{await putGithubFile(`posts/${p.file}.md`,utf8Base64(postBodies.get(p.file)||''),`content: update ${p.title}`);await putGithubFile('posts/posts.json',utf8Base64(JSON.stringify(posts,null,2)+'\n'),'content: update post index');toast('文章和 posts.json 已提交，Cloudflare Pages 会自动重新部署');}catch(e){toast(`提交失败：${e.message}`,9000);}finally{btn.disabled=false;} }
function bindGithub(){ $('[data-gh-test]').onclick=testGithub;$('[data-push-config]').onclick=async()=>{try{await pushConfig();toast('站点配置已提交到 GitHub');}catch(e){toast(`提交失败：${e.message}`,9000);}}; }

async function runDiagnostics(){ const box=$('[data-diagnostics]'); box.innerHTML='<div class="diagnostic-item"><span>…</span><div><b>正在检查</b><small>请稍候</small></div></div>'; const rows=[];
  async function check(name,fn,detail){try{const msg=await fn();rows.push({s:'ok',i:'✓',name,msg:msg||detail||'正常'});}catch(e){rows.push({s:'bad',i:'×',name,msg:e.message});}}
  await check('站点配置',async()=>{const r=await fetch(`assets/site.config.json?t=${Date.now()}`);if(!r.ok)throw new Error(`HTTP ${r.status}`);await r.json();return 'site.config.json 可读取';});
  await check('文章索引',async()=>{const r=await fetch(`posts/posts.json?t=${Date.now()}`);if(!r.ok)throw new Error(`HTTP ${r.status}`);const d=await r.json();return `${d.length} 篇文章`;});
  if(config.theme?.background?.enabled&&config.theme?.background?.image) await check('背景图片',async()=>{const r=await fetch(config.theme.background.image,{method:'HEAD'});if(!r.ok)throw new Error(`HTTP ${r.status}`);return config.theme.background.image;});
  const c=config.comments||{}; rows.push({s:c.enabled?(c.repoId&&c.categoryId?'ok':'warn'):'warn',i:c.enabled?(c.repoId&&c.categoryId?'✓':'!'):'!',name:'Giscus 评论',msg:c.enabled?(c.repoId&&c.categoryId?'配置完整':'已启用，但缺 repoId/categoryId'):'当前未启用'});
  try{const u=new URL(config.likes?.endpoint||'/api/likes',location.href);u.searchParams.set('post','__health__');u.searchParams.set('client','00000000-0000-4000-8000-000000000000');const r=await fetch(u);rows.push({s:r.ok?'ok':'warn',i:r.ok?'✓':'!',name:'全站点赞 API',msg:r.ok?'Pages Function + D1 已响应':'未启用 D1 时会自动回退到本地点赞'});}catch{rows.push({s:'warn',i:'!',name:'全站点赞 API',msg:'当前使用本地点赞回退'});}
  rows.push({s:'ok',i:'✓',name:'动态配色',msg:`种子色 ${document.documentElement.dataset.seedColor||config.theme?.seedColor} · ${document.documentElement.dataset.colorEngine||'fallback'}`});
  box.innerHTML=rows.map(r=>`<div class="diagnostic-item"><span class="${r.s}">${r.i}</span><div><b>${escapeHtml(r.name)}</b><small>${escapeHtml(r.msg)}</small></div></div>`).join('');
}

(async()=>{
  try{config=await loadConfig(true);await initTheme(config);initTabs();fillConfigForm();bindConfig();initBackground();bindGithub();await loadPosts();bindPostEditor();$('[data-run-diagnostics]').onclick=runDiagnostics;runDiagnostics();}
  catch(e){console.error(e);toast(`管理页初始化失败：${e.message}`);}
})();
