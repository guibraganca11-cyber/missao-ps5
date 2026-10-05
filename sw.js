const CACHE='missao-ps5-journal-v8';
const ASSETS=['./','./index.html','./style.css','./app.js','./mission.css?v=5','./mission.js?v=5','./web-theme.css?v=5','./routine-model.js?v=6','./routine.js?v=6','./routine.css?v=6','./assets/web-journal.png','./manifest.json','./icons/icon.svg','./icons/icon-192.png','./icons/icon-512.png'];
ASSETS.push('./game.js?v=7','./game.css?v=7','./money-model.js?v=8','./routine.js?v=8');
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('missao-ps5-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(e.request,copy)));}return r;}).catch(()=>caches.match(e.request).then(r=>r||(e.request.mode==='navigate'?caches.match('./index.html'):Response.error()))));});
