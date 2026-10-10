const CACHE='tawafuq-pwa-v4';
const ASSETS=['./','./index.html','./css/style.css','./js/app.js','./js/install.js','./images/logo.svg','./images/icon-192.png','./images/icon-512.png','./manifest.webmanifest',
'./images/brands/apple.svg','./images/brands/asus.svg','./images/brands/htc.svg','./images/brands/huawei.svg','./images/brands/lenovo.svg','./images/brands/lg.svg','./images/brands/motorola.svg','./images/brands/nokia.svg','./images/brands/samsung.svg','./images/brands/sony.svg'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('tawafuq-pwa-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
const SUPABASE_CDN='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);if(url.origin!==self.location.origin && url.href!==SUPABASE_CDN)return;
 event.respondWith(fetch(req).then(res=>{if(res.ok||res.type==='opaque'){const copy=res.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(req,copy)));}return res;}).catch(()=>caches.match(req).then(hit=>hit||(req.mode==='navigate'?caches.match('./index.html'):Response.error()))));});
