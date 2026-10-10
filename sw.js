const CACHE='tawafuq-pwa-v5';
const ASSETS=['./','./index.html','./css/style.css','./js/app.js','./js/install.js','./images/logo.svg','./images/icon-192.png','./images/icon-512.png','./manifest.webmanifest',
'./images/brands/apple.svg','./images/brands/asus.svg','./images/brands/htc.svg','./images/brands/huawei.svg','./images/brands/lenovo.svg','./images/brands/lg.svg','./images/brands/motorola.svg','./images/brands/nokia.svg','./images/brands/samsung.svg','./images/brands/sony.svg'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('tawafuq-pwa-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);if(url.origin!==self.location.origin)return;
 // App shell: immediate cache response, update in background; no offline network timeout.
 const isShell=ASSETS.some(path=>new URL(path,self.registration.scope).pathname===url.pathname);
 if(req.mode==='navigate'||isShell){event.respondWith((async()=>{const cache=await caches.open(CACHE);const cached=await cache.match(req,{ignoreSearch:true});const updating=fetch(req).then(res=>{if(res.ok)cache.put(req,res.clone());return res;}).catch(()=>null);if(cached){event.waitUntil(updating);return cached;}return (await updating)|| (await cache.match('./index.html'))||Response.error();})());return;}
 event.respondWith((async()=>{const hit=await caches.match(req);if(hit)return hit;return fetch(req);})());
});
