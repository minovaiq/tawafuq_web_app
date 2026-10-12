// Public, read-only supplier photo resolver. Only All Spares connector pages are allowed.
// Redirects to the original supplier image; does not re-host copyrighted photo bytes.
const CATEGORY='https://all-spares.com/en/spares/connectors/charge-connectors/';
const validProduct=url=>{
 try{const u=new URL(url);return u.protocol==='https:'&&u.hostname==='all-spares.com'&&/^\/en\/charge-connector[-/]/.test(u.pathname)}catch{return false}
};
function attributes(tag){
 const o={};for(const m of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g))o[m[1].toLowerCase()]=m[2]??m[3];return o;
}
function photoFromHTML(html,base){
 const candidates=[];
 for(const m of html.matchAll(/<meta\b[^>]*>/gi)){const a=attributes(m[0]);if((a.property||a.name||'').toLowerCase()==='og:image'||(a.name||'').toLowerCase()==='twitter:image')candidates.push(a.content)}
 for(const m of html.matchAll(/<img\b[^>]*>/gi)){const a=attributes(m[0]);if(/charge connector/i.test(a.alt||''))candidates.push(a['data-zoom-image'],a['data-src'],a.src)}
 for(const raw of candidates.filter(Boolean)){
  try{const u=new URL(raw,base);if(u.protocol==='https:'&&(/(^|\.)all-spares\.com$/.test(u.hostname)||/(^|\.)psgsm\.net$/.test(u.hostname))&&!/logo|placeholder|no-image/i.test(u.pathname))return u.href}catch{}
 }
 return null;
}
function findProductURL(html,id){
 // Supplier's product cards contain their link and stock ID close to each other.
 const links=[...html.matchAll(/<a\b[^>]*href\s*=\s*(?:"([^"]+)"|'([^']+)')[^>]*>/gi)];
 for(const m of links){
  const url=new URL(m[1]||m[2],CATEGORY).href;
  if(!validProduct(url))continue;
  const nearby=html.slice(m.index,Math.min(html.length,m.index+7000));
  if(new RegExp('(?:ID|id)\\s*:?\\s*(?:<[^>]*>\\s*)*'+id+'\\b').test(nearby))return url;
 }
 return null;
}
module.exports=async function handler(req,res){
 const id=String(req.query.id||'');
 if(!/^\d{5,8}$/.test(id))return res.status(400).send('Invalid supplier ID');
 let url=String(req.query.source||'');
 if(!validProduct(url)){
  try{
   const page=await fetch(CATEGORY,{headers:{'User-Agent':'Mozilla/5.0 (compatible; TawafuqCatalog/1.0)'},signal:AbortSignal.timeout(10000)});
   if(!page.ok)throw Error('Category unavailable');
   url=findProductURL(await page.text(),id)||'';
  }catch(e){console.error('Supplier listing',e.message)}
 }
 if(!validProduct(url))return res.status(404).send('Product source unavailable');
 try{
  const response=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0 (compatible; TawafuqCatalog/1.0)'},signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw Error('Supplier response '+response.status);
  const photo=photoFromHTML(await response.text(),url);
  if(!photo)return res.status(404).send('No supplier photo');
  res.setHeader('Cache-Control','public, max-age=86400, s-maxage=604800');
  res.setHeader('Location',photo);
  return res.status(302).end();
 }catch(e){console.error('Supplier photo',e.message);return res.status(502).send('Supplier photo unavailable')}
};
