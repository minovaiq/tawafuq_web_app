'use strict';
const SUPABASE_URL='https://widumqqttdcnttnmuipa.supabase.co', KEY='sb_publishable_un0NqaWv9gxZp7qOgXwMWQ__HspuorJ';
const kinds=[['screens','الشاشات','▣'],['protectors','حمايات الشاشة','▤'],['batteries','البطاريات','▥'],['charging_boards','بورد الشحن الكامل','▦'],['charging_sockets','سوكت الشحن المنفصل','⌁'],['charging_flex','فلاتات الشحن','⇄'],['connectors','الكونكترات','⊞']];
const iconPaths={
grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
brands:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 10v10M8 7h2"/>',
search:'<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/>',
send:'<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
screen:'<rect x="5" y="2" width="14" height="20" rx="2.5"/><path d="M10 18h4"/>',
shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
battery:'<rect x="3" y="7" width="17" height="10" rx="2"/><path d="M23 10v4M11 9l-3 4h4l-1 3 5-5h-4l1-2"/>',
plug:'<path d="M8 3v6M16 3v6M7 9h10v3a5 5 0 0 1-10 0V9ZM12 17v5"/>',
cable:'<path d="M5 4v5a5 5 0 0 0 5 5h4a5 5 0 0 1 5 5v1M2 4h6M16 20h6"/>',
chip:'<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 9h6v6H9zM9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
phone:'<rect x="5" y="2" width="14" height="20" rx="2.5"/><path d="M10 18h4"/>'
};
function svgIcon(name){return '<svg class="ui-icon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(iconPaths[name]||iconPaths.grid)+'</svg>';}
const categoryIcons={screens:'screen',protectors:'shield',batteries:'battery',charging_ports:'plug',charging_flex:'cable',connectors:'chip'};
const $=s=>document.querySelector(s);const state={route:'home',kind:null,brand:null,device:null,search:'',companies:[],devices:[],pairs:[]};let client;
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
// All available company marks are served locally; no third-party image roundtrips.
const localBrandLogos=new Set(["apple", "asus", "htc", "huawei", "lenovo", "lg", "motorola", "nokia", "samsung", "sony"]);
const brandLogoAliases={ 'redmi':'xiaomi','iphone':'apple','google pixel':'google','motorola mobility':'motorola' };
function brandLogoUrl(company){
 const key=String(company.name||'').toLowerCase().trim();
 const normalized=brandLogoAliases[key]||key;
 return localBrandLogos.has(normalized)?'./images/brands/'+normalized+'.svg':(company.logo_url||null);
}
// Save external original logos for offline use, without replacing them with text SVGs.
function cacheBrandLogos(companies){
 const urls=[...new Set(companies.map(c=>brandLogoUrl(c)).filter(Boolean))];
 if(!urls.length||!('serviceWorker' in navigator))return;
 navigator.serviceWorker.ready.then(reg=>{
  const worker=reg.active||navigator.serviceWorker.controller;
  if(worker)worker.postMessage({type:'CACHE_BRAND_LOGOS',urls});
 }).catch(()=>{});
}
function brandTile(company,click){
 const b=tile('brands',company.name,'',click);
 b.classList.add('brand-tile');
 const icon=b.querySelector('.ico');
 const url=brandLogoUrl(company);
 if(url){
  const img=document.createElement('img');
  img.className='brand-logo';img.alt='';img.loading='eager';img.decoding='sync';
  img.src=url;
  img.onerror=()=>{img.remove();icon.classList.add('brand-fallback');};
  icon.prepend(img);
 }else icon.classList.add('brand-fallback');
 return b;
}
function tile(icon,title,sub,click){const b=document.createElement('button');b.className='tile';b.innerHTML=`<span class="ico">${svgIcon(icon)}</span><span class="info"><strong>${esc(title)}</strong><small>${esc(sub)}</small></span><span class="arrow">‹</span>`;b.onclick=click;return b;}
function goto(route,extra={}){Object.assign(state,extra,{route});state.search='';$('#search').value='';render();window.scrollTo({top:0,behavior:'smooth'});}
// Fast bilingual offline search index. No network requests during typing.
const brandAliases={tecno:['تكنو','تيكنو'],infinix:['انفنكس','انفنيكس','انفينكس','انفينيكس'],samsung:['سامسونج','سامسونك','سامسونغ'],apple:['ابل','ايفون','ايفـون'],xiaomi:['شاومي'],poco:['بوكو'],realme:['ريلمي'],oppo:['اوبو'],vivo:['فيفو'],honor:['هونر'],huawei:['هواوي'],nokia:['نوكيا'],motorola:['موتورولا']};
const wordAliases={كامون:'camon',كامن:'camon',كومون:'camon',كاميون:'camon',سبارك:'spark',هوت:'hot',نوت:'note',نوتس:'note',بوفا:'pova',بوفا:'pova',بوفا:'pova',بوفا:'pova',ايفون:'iphone',ايفـون:'iphone',ايفن:'iphone',بلس:'plus',بلاس:'plus',برو:'pro',بريمير:'premier',ماكس:'max',لايت:'lite',لايتت:'lite',جالكسي:'galaxy',جلاكسي:'galaxy',كالكسي:'galaxy',ريدمي:'redmi',بوكو:'poco',تكنو:'tecno',تيكنو:'tecno',انفنكس:'infinix',انفنيكس:'infinix',انفينكس:'infinix',انفينيكس:'infinix',سامسونج:'samsung',سامسونك:'samsung',سامسونغ:'samsung',شاومي:'xiaomi',ابل:'apple',ريلمي:'realme',اوبو:'oppo',فيفو:'vivo',هونر:'honor',هواوي:'huawei',نوكيا:'nokia',موتورولا:'motorola',فورجي:'4g',فايفجي:'5g'};
function normalizeText(value){let v=String(value??'').toLowerCase().normalize('NFKC').replace(/[\u064b-\u065f\u0670]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/ـ/g,'').replace(/[٠-٩۰-۹]/g,c=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(c)>=0?'٠١٢٣٤٥٦٧٨٩'.indexOf(c):'۰۱۲۳۴۵۶۷۸۹'.indexOf(c))).replace(/([\p{L}])([0-9])/gu,'$1 $2').replace(/([0-9])([\p{L}])/gu,'$1 $2').replace(/[^\p{L}\p{N}]+/gu,' ').trim();return v.split(/\s+/).map(w=>wordAliases[w]||w).join(' ');}
function compactText(value){return normalizeText(value).replace(/ /g,'');}
function deviceKeys(d){const name=normalizeText(d.name),company=normalizeText(d.company),keys=new Set([name,normalizeText(company+' '+name)]);const prefixes=[company,...(brandAliases[company]||[]).map(normalizeText)];for(const prefix of prefixes){if(name.startsWith(prefix+' '))keys.add(name.slice(prefix.length+1));}return keys;}
let searchIndex=[],searchMap=new Map();
function rebuildSearchIndex(){searchIndex=state.devices.map((d,i)=>{const keys=[...deviceKeys(d)];const company=normalizeText(d.company);const all=[...new Set([...keys,...keys.map(k=>company+' '+k),...(brandAliases[company]||[]).flatMap(a=>keys.map(k=>normalizeText(a)+' '+k))])];return {d,i,keys:all,compact:all.map(k=>k.replace(/ /g,'')),company};});searchMap=new Map(searchIndex.map(x=>[x.d.id,x]));}
function searchScore(entry,query){const q=normalizeText(query);if(!q)return -1;const qc=q.replace(/ /g,''),words=q.split(' ');let best=-1;for(let i=0;i<entry.keys.length;i++){const k=entry.keys[i],kc=entry.compact[i];if(k===q||kc===qc)best=Math.max(best,1000);else if(k.startsWith(q)||kc.startsWith(qc))best=Math.max(best,800);else if(k.includes(q)||kc.includes(qc))best=Math.max(best,650);else if(words.every(w=>k.includes(w)))best=Math.max(best,450);}return best;}
function searchDevices(query,limit=120,company=null){if(!normalizeText(query))return [];return searchIndex.filter(e=>(!company||e.d.company===company)).map(e=>({e,score:searchScore(e,query)})).filter(x=>x.score>=0).sort((a,b)=>b.score-a.score||a.e.d.name.length-b.e.d.name.length||a.e.i-b.e.i).slice(0,limit).map(x=>x.e.d);}
function deviceMatchesQuery(d,q){const entry=searchMap.get(d.id);return entry?searchScore(entry,q)>=0:deviceKeys(d).some(k=>k.includes(normalizeText(q)));}
function matchingDeviceIds(value){const raw=String(value||'');const found=state.devices.find(d=>d.id===raw);if(found)return new Set([found.id]);const key=normalizeText(raw);return new Set(state.devices.filter(d=>deviceKeys(d).has(key)).map(d=>d.id));}
function compatibleFor(d){const ids=new Set([d.id]);const keys=deviceKeys(d);const all=state.devices.filter(x=>x.id===d.id||(x.company===d.company&&[...deviceKeys(x)].some(k=>keys.has(k))));for(const x of all)ids.add(x.id);const refs=new Set([...ids,...all.map(x=>x.name)]);for(const x of all)refs.add(x.company+' '+x.name);const matches=[];const seen=new Set();for(const p of state.pairs){if(state.kind&&p.kind!==state.kind)continue;const left=refs.has(p.device)||[...keys].includes(normalizeText(p.device));const right=refs.has(p.compatible)||[...keys].includes(normalizeText(p.compatible));if(!left&&!right)continue;const other=left?p.compatible:p.device;const target=state.devices.find(x=>x.id===other||x.name===other||(normalizeText(x.company+' '+x.name)===normalizeText(other)));const label=target?(target.name.toLowerCase().startsWith(target.company.toLowerCase()+' ')?target.name:target.company+' '+target.name):other;const unique=p.kind+':'+normalizeText(label);if(seen.has(unique)||normalizeText(label)===normalizeText(d.company+' '+d.name))continue;seen.add(unique);matches.push({id:p.id,kind:p.kind,label,image_url:p.image_url||null});}return matches;}

function partGroupKey(p){
 const id=String(p.id||'');
 if(id.startsWith('socket-list3-'))return 'socket-18pin-20261012';
 if(id.startsWith('socket-micro-usb-20261012-'))return 'socket-micro-20261012';
 if(id.startsWith('socket-s10'))return 'socket-s10';
 return p.kind+':'+(id.split('-').slice(0,3).join('-')||'other');
}
function partImageUrl(group){
 if(group.key==='socket-micro-20261012')return 'images/parts/micro-usb-5pin.svg';
 if(group.key==='socket-18pin-20261012')return 'https://i29.psgsm.net/all-spares.com/p/911338/480/charge-connector-18-pin-type-1-usb-type-c.jpg';
 return '';
}
function renderChargingPartDetails(el,d,matches){
 const groups=new Map();
 for(const p of matches){const key=partGroupKey(p);if(!groups.has(key))groups.set(key,{key,items:[]});groups.get(key).items.push(p)}
 const partTitle=kinds.find(k=>k[0]===state.kind)?.[1]||'قطعة الشحن';
 const top=document.createElement('div');top.className='part-detail-top';
 const back=document.createElement('button');back.type='button';back.className='part-back';back.textContent='‹';back.setAttribute('aria-label','رجوع');back.onclick=()=>goto('models',{device:null});
 const heading=document.createElement('strong');heading.textContent='تفاصيل القطعة';
 const fav=document.createElement('span');fav.className='part-heart';fav.textContent='♡';fav.setAttribute('aria-hidden','true');
 top.append(back,heading,fav);el.append(top);
 const selected=document.createElement('div');selected.className='part-selected-device';selected.innerHTML='<strong>'+esc(d.name)+'</strong><span>'+esc(d.company)+(d.year?' · '+esc(d.year):'')+'</span>';el.append(selected);
 for(const group of groups.values()){
  const card=document.createElement('section');card.className='part-card';
  const frame=document.createElement('div');frame.className='part-photo-frame';
  const img=document.createElement('img');img.alt='صورة '+partTitle;img.loading='eager';img.decoding='async';
  const status=document.createElement('p');status.className='part-photo-status';status.textContent='جاري تحميل صورة القطعة...';
  frame.append(status);card.append(frame);
  const imageSource=partImageUrl(group);
  const setImage=url=>{
   if(!url||!(/^(https:\/\/|images\/parts\/[a-z0-9-]+\.svg$|data:image\/(?:jpeg|webp|png);base64,)/i.test(url)))return;
   img.src=url;img.onload=()=>{status.remove();frame.replaceChildren(img);const expand=document.createElement('button');expand.type='button';expand.className='part-expand';expand.textContent='⛶';expand.setAttribute('aria-label','تكبير الصورة');expand.onclick=()=>img.click();frame.append(expand);};
   img.onerror=()=>{status.textContent='تعذر عرض صورة القطعة';};
   img.onclick=()=>{const overlay=document.createElement('div');overlay.className='part-photo-overlay';const bar=document.createElement('div');bar.className='part-photo-overlay-bar';const close=document.createElement('button');close.type='button';close.textContent='×';close.setAttribute('aria-label','إغلاق');close.onclick=()=>overlay.remove();const ttl=document.createElement('strong');ttl.textContent='صورة القطعة';const download=document.createElement('a');download.href=img.src;download.download='charging-socket.svg';download.textContent='↓';download.setAttribute('aria-label','حفظ الصورة');bar.append(close,ttl,download);const full=document.createElement('img');full.src=img.src;full.alt=img.alt;overlay.append(bar,full);overlay.onclick=e=>{if(e.target===overlay)overlay.remove()};document.body.append(overlay)};
  };
  if(imageSource)setImage(imageSource);
  else if(group.items[0]?.id)(async()=>{try{if(!client&&window.supabase?.createClient)client=window.supabase.createClient(SUPABASE_URL,KEY);if(!client){await loadSupabaseSDK();client=window.supabase.createClient(SUPABASE_URL,KEY)}const {data,error}=await client.from('tawafuq_compatibilities').select('image_url').eq('id',group.items[0].id).maybeSingle();if(error)throw error;if(!frame.isConnected)return;if(data?.image_url)setImage(data.image_url);else status.textContent='صورة القطعة غير متوفرة';}catch(e){status.textContent='تعذر تحميل الصورة';console.warn('Part image',e)}})();
  else status.textContent='صورة القطعة غير متوفرة';
  const heading=document.createElement('div');heading.className='part-photo-caption';
  const name=document.createElement('h3');name.textContent=partTitle;
  const spec=document.createElement('p');spec.textContent=group.key==='socket-18pin-20261012'?'USB Type-C · 18 Pin':group.key==='socket-micro-20261012'?'Micro USB (5 Pin)':group.key==='socket-s10'?'USB Type-C · 26 Pin':'قطعة غيار متوافقة';
  heading.append(name,spec);card.append(heading);
  const hint=document.createElement('div');hint.className='part-info';hint.textContent='هذا سوكت شحن منفصل متوافق بحسب قائمة الموديلات المرفقة. تأكد من مطابقة شكل القطعة وعدد الأرجل قبل التركيب.';card.append(hint);
  const count=document.createElement('h3');count.className='part-compat-heading';count.textContent='الأجهزة المتوافقة ('+group.items.length+')';card.append(count);
  const brands=new Map();
  for(const p of group.items){
   const match=state.devices.find(x=>x.name===p.label||p.label===x.company+' '+x.name);
   const company=match?.company||p.label.split(' ')[0]||'أخرى';
   if(!brands.has(company))brands.set(company,new Map());
   const modelName=(match?.name||p.label).replace(new RegExp('^'+company+' ','i'),'');
   const codes=Array.isArray(match?.model_codes)?match.model_codes.filter(Boolean):[];
   const display=modelName+(codes.length?' ('+codes.join(', ')+')':'');
   brands.get(company).set(modelName,display);
  }
  const order=['Infinix','Lenovo','Motorola','Tecno','Ulefone'];
  for(const [company,models] of [...brands].sort((a,b)=>{const ai=order.indexOf(a[0]),bi=order.indexOf(b[0]);return (ai<0?999:ai)-(bi<0?999:bi)||a[0].localeCompare(b[0])})){
   const section=document.createElement('details');section.className='part-brand';section.open=true;
   const summary=document.createElement('summary');const nameSpan=document.createElement('span');nameSpan.textContent=company+' ('+models.size+')';const badge=document.createElement('span');badge.className='part-brand-badge part-brand-'+company.toLowerCase().replace(/[^a-z0-9]+/g,'-');badge.textContent=company;summary.append(nameSpan,badge);section.append(summary);
   const grid=document.createElement('div');grid.className='part-model-grid';
   if(company==='Lenovo')grid.classList.add('part-model-grid-3');
   [...models.entries()].sort((a,b)=>a[0].localeCompare(b[0],undefined,{numeric:true})).forEach(([model,display])=>{
    const cell=document.createElement('span');cell.className='part-model';cell.textContent=display;grid.append(cell)
   });
   section.append(grid);card.append(section);
  }
  el.append(card);
 }
}
function filteredDevices(){return state.devices.filter(d=>!state.brand||d.company===state.brand);}
function render(){document.body.classList.toggle('part-view',state.route==='detail'&&['charging_sockets','charging_boards'].includes(state.kind));const searchWrap=document.querySelector('.search-wrap');searchWrap.hidden=state.route!=='models'&&state.route!=='search';const partName=kinds.find(k=>k[0]===state.kind)?.[1]||'القطعة';$('#search').placeholder=state.route==='models'?'ابحث عن موديل '+partName+' - '+(state.brand||''): 'ابحث في جميع الأجهزة';const box=$('#content');box.classList.toggle('two-col',state.route==='home'||state.route==='brands');box.replaceChildren();const add=(node)=>box.append(node);const crumb=$('#breadcrumbs');if(crumb)crumb.replaceChildren();
 const title=t=>$('#sectionTitle').textContent=t;let n=0;
 if(state.route==='home'){title('أقسام قطع الغيار');kinds.forEach(([key,name,ico])=>add(tile(categoryIcons[key],name,'',()=>goto('brands',{kind:key,brand:null,device:null}))));n=kinds.length;}
 else if(state.route==='brands'){title('اختر الشركة');const list=state.companies;list.forEach(c=>add(brandTile(c,()=>goto('models',{brand:c.name,device:null}))));n=list.length;}
 else if(state.route==='models'){title('موديلات '+(state.brand||'')+' - '+partName);const list=state.search?searchDevices(state.search,250,state.brand):filteredDevices();list.forEach(d=>add(tile('phone',d.name,d.year||'',()=>goto('detail',{device:d}))));n=list.length;}

 else if(state.route==='detail'){
  const d=state.device;const matches=compatibleFor(d);
  const isPart=['charging_sockets','charging_boards'].includes(state.kind);
  document.body.classList.toggle('part-view',isPart);
  title(isPart?'تفاصيل القطعة':'توافقات '+d.name);
  const el=document.createElement('div');el.className=isPart?'part-detail':'detail';
  if(isPart&&matches.length){
   renderChargingPartDetails(el,d,matches);
  }else{
   el.innerHTML=`<h3>${esc(d.name)}</h3><p class="muted">${esc(d.company)} · ${esc(d.year||'')}</p><h3>الأجهزة المتوافقة (${matches.length})</h3>`;
   if(matches.length){const list=document.createElement('div');list.className='compat-simple-list';for(const p of matches){const div=document.createElement('div');div.className='pill';div.textContent=(kinds.find(k=>k[0]===p.kind)?.[1]||p.kind)+' — '+p.label;list.append(div)}el.append(list)}
   else{const t=document.createElement('p');t.className='muted';t.textContent='ماكو توافقات معتمدة لهذا الجهاز حالياً.';el.append(t)}
  }
  const suggest=document.createElement('button');suggest.className='primary suggest-compat';suggest.textContent='إرسال توافق';suggest.onclick=()=>openSubmit(d);el.append(suggest);add(el);n=matches.length;
 }
 else if(state.route==='search'){title('البحث في جميع الأجهزة');const q=state.search;const list=searchDevices(q,120);list.forEach(d=>add(tile('search',d.name,d.company+' · '+(d.year||''),()=>goto('detail',{device:d,brand:d.company}))));if(!q)add(empty('اكتب اسم جهاز أو شركة للبحث'));n=list.length;}
 else if(state.route==='submit'){title('إرسال توافق');add(tile('send','إرسال توافق','',()=>openSubmit()));n=1;openSubmit();}
 if(!box.children.length)add(empty('ماكو نتائج حالياً'));document.querySelectorAll('.bottom button').forEach(b=>b.classList.toggle('active',b.dataset.route===state.route||(state.route==='models'||state.route==='detail')&&b.dataset.route==='brands'));
}
function empty(msg){const e=document.createElement('div');e.className='empty';e.innerHTML='<b>لا توجد نتائج</b><span>'+esc(msg)+'</span>';return e}
const pickers=['submitDevice','submitCompatible'];
function closePickers(except){pickers.forEach(id=>{if(id===except)return;const list=$('#'+id+'Results');list.hidden=true;$('#'+id+'Search').setAttribute('aria-expanded','false');});}
function showPicker(id){const input=$('#'+id+'Search'),list=$('#'+id+'Results');closePickers(id);const query=input.value.trim().toLocaleLowerCase();const results=state.devices.filter(d=>deviceMatchesQuery(d,query)).slice(0,65);list.replaceChildren();if(!results.length){const empty=document.createElement('div');empty.className='picker-empty';empty.textContent='ماكو أجهزة مطابقة';list.append(empty);}results.forEach(d=>{const item=document.createElement('button');item.type='button';item.className='device-option';const name=document.createElement('strong');name.textContent=d.name;const meta=document.createElement('small');meta.textContent=d.company+(d.year?' · '+d.year:'');item.append(name,meta);item.onclick=()=>{selectDevice(id,d);closePickers();};list.append(item);});list.hidden=false;input.setAttribute('aria-expanded','true');}
function selectDevice(id,device){$('#'+id).value=device?.id||'';$('#'+id+'Search').value=device?device.name:'';$('#'+id+'Search').classList.toggle('selected',!!device);}
function openSubmit(d){const m=$('#submitModal');m.hidden=false;document.body.classList.add('modal-open');$('#submitStatus').textContent='';$('#submitBtn').disabled=false;$('#submitNote').value='';pickers.forEach(id=>selectDevice(id,null));closePickers();$('#submitKind').innerHTML=kinds.map(k=>`<option value="${esc(k[0])}">${esc(k[1])}</option>`).join('');$('#submitKind').value=state.kind||'screens';if(d)selectDevice('submitDevice',d);}
function closeSubmit(){const m=$('#submitModal');m.hidden=true;document.body.classList.remove('modal-open');closePickers();if(state.route==='submit')goto('home',{kind:null,brand:null,device:null});}
async function sendSubmission(e){e.preventDefault();const btn=$('#submitBtn'),status=$('#submitStatus');const device=$('#submitDevice').value,compatible=$('#submitCompatible').value;if(!device||!compatible||device===compatible){status.textContent='اختر جهازين مختلفين';return}btn.disabled=true;status.textContent='جاري الإرسال...';try{if(!navigator.onLine)throw Error('لا يوجد اتصال بالإنترنت');await loadSupabaseSDK();if(!client)client=window.supabase.createClient(SUPABASE_URL,KEY);const {error}=await client.rpc('tawafuq_submit_public',{p_kind:$('#submitKind').value,p_device:device,p_compatible:compatible,p_note:$('#submitNote').value.trim()});if(error)throw error;status.textContent='تم إرسال التوافق للمراجعة';$('#submitNote').value='';closeSubmit();}catch(err){console.error(err);status.textContent='تعذر إرسال التوافق. حاول مرة أخرى.'}finally{btn.disabled=false}}
async function fetchAll(table,columns='*'){const out=[];for(let start=0;start<10000;start+=1000){const {data,error}=await client.from(table).select(columns).range(start,start+999);if(error)throw error;out.push(...data);if(data.length<1000)break;}return out;}
const OFFLINE_DB='tawafuq-catalog-v1', OFFLINE_STORE='snapshots';
function offlineDatabase(){return new Promise((resolve,reject)=>{if(!('indexedDB' in window))return reject(Error('Offline storage unavailable'));const request=indexedDB.open(OFFLINE_DB,1);request.onupgradeneeded=()=>request.result.createObjectStore(OFFLINE_STORE);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
async function loadOffline(){const db=await offlineDatabase();return new Promise((resolve,reject)=>{const tx=db.transaction(OFFLINE_STORE,'readonly');const request=tx.objectStore(OFFLINE_STORE).get('catalog');request.onsuccess=()=>resolve(request.result||null);request.onerror=()=>reject(request.error);tx.oncomplete=()=>db.close();});}
async function saveOffline(snapshot){const db=await offlineDatabase();return new Promise((resolve,reject)=>{const tx=db.transaction(OFFLINE_STORE,'readwrite');tx.objectStore(OFFLINE_STORE).put(snapshot,'catalog');tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>{db.close();reject(tx.error);};});}
function applyCatalog(data){state.companies=data.companies;state.devices=data.devices;state.pairs=data.pairs;rebuildSearchIndex();render();}
// Status messages are kept in the console, not displayed in the app UI.
function offlineNotice(message){console.info('[توافقات]',message);}

async function syncCatalog(){if(!window.supabase?.createClient)throw Error('مكتبة Supabase غير متوفرة');if(!client)client=window.supabase.createClient(SUPABASE_URL,KEY);
 const [companies,devices,pairs]=await Promise.all([fetchAll('tawafuq_companies','id,name,status,logo_url'),fetchAll('tawafuq_devices','id,name,company,year,model_codes'),fetchAll('tawafuq_compatibilities','id,kind,device,compatible,status')]);
 const snapshot={companies:companies.filter(x=>x.status!=='غير نشط').sort((a,b)=>a.name.localeCompare(b.name)),devices:devices.sort((a,b)=>a.name.localeCompare(b.name)),pairs:pairs.filter(p=>['معتمد','مؤكد','نشط','approved','verified'].includes((p.status||'').toLowerCase())),updatedAt:Date.now()};
 let stored=false;try{await saveOffline(snapshot);stored=true;}catch(e){console.warn('تعذر حفظ بيانات البحث محلياً',e);}
 applyCatalog(snapshot);cacheBrandLogos(snapshot.companies);offlineNotice(stored?'تم تحديث البيانات وحفظها على الجهاز للاستخدام بدون إنترنت':'تم تحديث البيانات، لكن تعذر حفظها على الجهاز');
}
// Load the remote library only after the cached interface is usable.
let sdkPromise;
function loadSupabaseSDK(){if(window.supabase?.createClient)return Promise.resolve();if(sdkPromise)return sdkPromise;
 sdkPromise=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';script.async=true;script.onload=()=>window.supabase?.createClient?resolve():reject(Error('تعذر تشغيل مكتبة Supabase'));script.onerror=()=>reject(Error('تعذر تحميل مكتبة Supabase'));document.head.append(script);});return sdkPromise;}
let syncing=false;
async function refreshInBackground(){if(syncing||!navigator.onLine)return;syncing=true;try{await loadSupabaseSDK();await syncCatalog();}catch(e){console.warn('تعذر تحديث البيانات بالخلفية',e);}finally{syncing=false;}}
async function init(){let hasCache=false;
 // Never block the app shell or offline navigation on a network request.
 const loader=$('#loader');if(loader)loader.style.display='none';
 try{const saved=await loadOffline();if(saved&&Array.isArray(saved.companies)&&Array.isArray(saved.devices)&&Array.isArray(saved.pairs)){applyCatalog(saved);if(navigator.onLine)cacheBrandLogos(saved.companies);hasCache=true;offlineNotice('البيانات محفوظة على الجهاز ويمكن البحث بدون إنترنت');}}catch(e){console.warn('تعذر فتح البيانات المحفوظة',e);}
 if(!hasCache){render();offlineNotice(navigator.onLine?'جاري تحميل البيانات لأول مرة...':'لا توجد بيانات محفوظة؛ اتصل بالإنترنت مرة واحدة لتنزيلها');}
 if(navigator.onLine){refreshInBackground();}
}
window.addEventListener('online',refreshInBackground);
let searchFrame=0;$('#search').addEventListener('input',e=>{state.search=e.target.value.trim();cancelAnimationFrame(searchFrame);searchFrame=requestAnimationFrame(render)});$('#clearSearch').onclick=()=>{$('#search').value='';state.search='';render()};document.querySelectorAll('.bottom button').forEach(b=>b.onclick=()=>goto(b.dataset.route,{brand:null,device:null,kind:b.dataset.route==='home'?null:state.kind}));$('#closeModal').onclick=closeSubmit;$('#submitModal').onclick=e=>{if(e.target.id==='submitModal')closeSubmit()};$('#submitForm').onsubmit=sendSubmission;pickers.forEach(id=>{const input=$('#'+id+'Search');input.addEventListener('focus',()=>showPicker(id));input.addEventListener('input',()=>{ $('#'+id).value='';input.classList.remove('selected');showPicker(id);});input.addEventListener('keydown',e=>{if(e.key==='Escape')closePickers();if(e.key==='Enter'&&!$('#'+id+'Results').hidden){e.preventDefault();const first=$('#'+id+'Results .device-option');if(first)first.click();}});});document.addEventListener('click',e=>{if(!e.target.closest('.device-picker'))closePickers();});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#submitModal').hidden)closeSubmit();});document.querySelectorAll('[data-icon]').forEach(el=>{el.innerHTML=svgIcon(el.dataset.icon)});init();
