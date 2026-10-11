const CACHE='tawafuq-pwa-v16';
const LOGO_CACHE='tawafuq-brand-originals-v1';
const ASSETS=['./','./index.html','./css/style.css','./js/app.js','./js/install.js','./images/logo.svg','./images/icon-192.png','./images/icon-512.png','./manifest.webmanifest','./images/brands/apple.svg','./images/brands/asus.svg','./images/brands/htc.svg','./images/brands/huawei.svg','./images/brands/lenovo.svg','./images/brands/lg.svg','./images/brands/motorola.svg','./images/brands/nokia.svg','./images/brands/samsung.svg','./images/brands/sony.svg'
];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('tawafuq-pwa-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);if(url.origin!==self.location.origin){
  // Preserve the same Google Cairo font stylesheet and font binaries for offline use.
  if((url.hostname==='fonts.googleapis.com' && req.destination==='style') ||
     (url.hostname==='fonts.gstatic.com' && req.destination==='font')){
    event.respondWith((async()=>{
      const cache=await caches.open('tawafuq-cairo-font-v1');
      const cached=await cache.match(req);
      if(cached)return cached;
      try{const response=await fetch(req);if(response.ok||response.type==='opaque')await cache.put(req,response.clone());return response;}
      catch(e){return Response.error();}
    })());
    return;
  }

  if(req.destination==='image')event.respondWith((async()=>{
   const cache=await caches.open(LOGO_CACHE);
   const hit=await cache.match(req);
   if(hit)return hit;
   try{const response=await fetch(req);if(response.ok||response.type==='opaque')await cache.put(req,response.clone());return response;}
   catch(e){return Response.error();}
  })());
  return;
 }
 // App shell: immediate cache response, update in background; no offline network timeout.
 const isShell=ASSETS.some(path=>new URL(path,self.registration.scope).pathname===url.pathname);
 if(req.mode==='navigate'||isShell){event.respondWith((async()=>{const cache=await caches.open(CACHE);const cached=await cache.match(req,{ignoreSearch:true});const updating=fetch(req).then(res=>{if(res.ok)cache.put(req,res.clone());return res;}).catch(()=>null);if(cached){event.waitUntil(updating);return cached;}return (await updating)|| (await cache.match('./index.html'))||Response.error();})());return;}
 event.respondWith((async()=>{const hit=await caches.match(req);if(hit)return hit;return fetch(req);})());
});

// Pre-download original logo URLs while online so even logos not opened yet work offline.
self.addEventListener('message',event=>{
 if(event.data?.type!=='CACHE_BRAND_LOGOS'||!Array.isArray(event.data.urls))return;
 const urls=event.data.urls.filter(u=>{try{const parsed=new URL(u,self.location.origin);return ['https:','http:'].includes(parsed.protocol)}catch(e){return false}}).slice(0,100);
 event.waitUntil((async()=>{
  const cache=await caches.open(LOGO_CACHE);
  await Promise.all(Array.from({length:Math.min(4,urls.length)},async(_,worker)=>{
   for(let i=worker;i<urls.length;i+=4){
    const url=urls[i];
    try{
     const req=new Request(url,{mode:new URL(url,self.location.origin).origin===self.location.origin?'same-origin':'no-cors'});
     if(await cache.match(req))continue;
     const response=await fetch(req);
     if(response.ok||response.type==='opaque')await cache.put(req,response);
    }catch(e){/* preserve existing logo; retry next online launch */}
   }
  }));
 })());
});
