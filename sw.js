const CACHE='chuyuan-blog-v4-home-notice';
const CORE=['./','./assets/style.css','./assets/main.js','./assets/article.js','./assets/shared.js','./assets/theme-engine.js','./assets/markdown.js','./assets/site.config.json','./assets/icon.png','./posts/posts.json'];

self.addEventListener('install',e=>e.waitUntil((async()=>{
  const c=await caches.open(CACHE);
  await Promise.all(CORE.map(async u=>{
    try{const r=await fetch(u,{cache:'reload'});if(r.ok&&!r.redirected)await c.put(u,r.clone());}catch{}
  }));
  await self.skipWaiting();
})()));

self.addEventListener('activate',e=>e.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
  await self.clients.claim();
})()));

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  if(url.origin!==location.origin||url.pathname.startsWith('/api/'))return;

  // 后台始终走网络，避免旧 admin 页面或重定向响应进入 SW 缓存。
  if(url.pathname==='/admin'||url.pathname==='/admin.html'){e.respondWith(fetch(e.request));return;}

  const putSafe=async(r)=>{if(r&&r.ok&&!r.redirected){const c=await caches.open(CACHE);await c.put(e.request,r.clone());}return r;};

  if(e.request.mode==='navigate'){
    e.respondWith(fetch(e.request).then(putSafe).catch(async()=>await caches.match(e.request)||await caches.match('./')));
    return;
  }

  const networkFirst=url.pathname.includes('/posts/')||url.pathname.endsWith('/assets/site.config.json')||url.pathname.endsWith('site.config.json');
  if(networkFirst){
    e.respondWith(fetch(e.request).then(putSafe).catch(()=>caches.match(e.request)));
    return;
  }

  e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(putSafe)));
});
