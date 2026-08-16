const CACHE='chuyuan-blog-m3-v17';
const CORE=[
  './assets/style.css',
  './assets/main.js',
  './assets/article.js',
  './assets/admin.js',
  './assets/shared.js',
  './assets/theme-engine.js',
  './assets/markdown.js',
  './assets/site.config.json',
  './assets/icon.png',
  './posts/posts.json'
];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE)
      .then(cache=>cache.addAll(CORE))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

async function fetchAndMaybeCache(request){
  const response=await fetch(request);
  if(response.ok && !response.redirected){
    const copy=response.clone();
    caches.open(CACHE).then(cache=>cache.put(request,copy));
  }
  return response;
}

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET') return;

  const url=new URL(request.url);
  if(url.origin!==self.location.origin || url.pathname.startsWith('/api/')) return;

  // Navigation must stay network-first. In particular, never cache Cloudflare's
  // automatic *.html -> extensionless redirects such as /admin.html -> /admin.
  if(request.mode==='navigate'){
    event.respondWith(
      fetch(request).catch(async()=>{
        const fallback=await caches.match('./');
        return fallback || Response.error();
      })
    );
    return;
  }

  const networkFirst=url.pathname.includes('/posts/') || url.pathname.endsWith('/site.config.json');
  if(networkFirst){
    event.respondWith(
      fetchAndMaybeCache(request).catch(()=>caches.match(request))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached=>cached || fetchAndMaybeCache(request))
  );
});
