const CACHE_NAME='move-journal-v3';
const APP_SHELL=new URL('./',self.registration.scope).toString();
const CORE=[APP_SHELL,new URL('manifest.webmanifest',APP_SHELL).toString(),new URL('icon.svg',APP_SHELL).toString()];
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE_NAME);
 const response=await fetch(APP_SHELL,{cache:'no-store'});
 const html=await response.clone().text();
 await cache.put(APP_SHELL,response);
 const assets=[...html.matchAll(/(?:src|href)="([^"#]+)"/g)].map(match=>new URL(match[1],APP_SHELL).toString()).filter(url=>url.startsWith(APP_SHELL));
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
  event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{caches.open(CACHE_NAME).then(cache=>cache.put(APP_SHELL,response.clone()));return response}).catch(()=>caches.match(APP_SHELL)));
  return;
 }
 event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{if(response.ok)caches.open(CACHE_NAME).then(cache=>cache.put(event.request,response.clone()));return response})));
});
