const CACHE='chuyuan-blog-v2';
const CORE=['./','./index.html','./about.html','./article.html','./assets/style.css','./assets/main.js','./assets/article.js','./assets/shared.js','./assets/theme-engine.js','./assets/markdown.js','./assets/site.config.json','./assets/icon.png','./posts/posts.json'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  if(url.origin!==location.origin)return;
  if(url.pathname.startsWith('/api/'))return;
  const networkFirst=url.pathname.includes('/posts/')||url.pathname.endsWith('site.config.json');
  if(networkFirst){e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r;}).catch(()=>caches.match(e.request)));return;}
  e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r;})));
});
