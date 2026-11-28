const CACHE='md-overlay-v2.2';
const BASE=['./overlay.html','./overlay.css?v=2.0','./overlay.js?v=2.0','./overlay-store.js?v=1.0','./overlay-knowledge.js?v=2.0','./overlay-manifest.json','./overlay-icon-192.png','./video-guides.js','./gift-audit.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(BASE)).then(()=>self.skipWaiting()).catch(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('md-overlay-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(u.origin!==location.origin||e.request.method!=='GET'||!u.pathname.includes('overlay'))return;e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy))}return r}).catch(()=>caches.match(e.request)))});
