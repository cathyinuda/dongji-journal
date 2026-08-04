const CACHE_NAME='move-journal-v1';
const CORE=['/','/manifest.webmanifest','/icon.svg'];
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE_NAME);
 const response=await fetch('/');
 const html=await response.clone().text();
 await cache.put('/',response);
 const assets=[...html.matchAll(/(?:src|href)="([^"#]+)"/g)].map(match=>match[1]).filter(url=>url.startsWith('/'));
 await cache.addAll([...new Set([...CORE.slice(1),...assets])]);
 await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const names=await caches.keys();
 await Promise.all(names.filter(name=>name!==CACHE_NAME).map(name=>caches.delete(name)));
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||new URL(event.request.url).origin!==location.origin)return;
 if(event.request.mode==='navigate'){
  event.respondWith(fetch(event.request).then(response=>{caches.open(CACHE_NAME).then(cache=>cache.put('/',response.clone()));return response}).catch(()=>caches.match('/')));
  return;
 }
 event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{if(response.ok)caches.open(CACHE_NAME).then(cache=>cache.put(event.request,response.clone()));return response})));
});
