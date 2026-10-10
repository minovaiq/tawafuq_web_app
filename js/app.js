'use strict';
const SUPABASE_URL='https://widumqqttdcnttnmuipa.supabase.co', KEY='sb_publishable_un0NqaWv9gxZp7qOgXwMWQ__HspuorJ';
const kinds=[['screens','الشاشات','▣'],['protectors','حمايات الشاشة','▤'],['batteries','البطاريات','▥'],['charging_ports','منافذ الشحن','⌁'],['charging_flex','فلاتات الشحن','⇄'],['connectors','الكونكترات','⊞']];
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
function brandTile(company,click){
 const b=tile('brands',company.name,'',click);
 b.classList.add('brand-tile');
 const icon=b.querySelector('.ico');
 const url=company.logo_url;
 if(url && (/^https:\/\//i.test(url) || /^images\/brands\/[a-z0-9_-]+\.svg$/i.test(url))){
  const img=document.createElement('img');
  img.className='brand-logo';img.alt='';img.loading='lazy';img.decoding='async';
  img.referrerPolicy='no-referrer';img.src=url;
  img.onerror=()=>{img.remove();icon.classList.add('brand-fallback');};
  icon.prepend(img);
 }else icon.classList.add('brand-fallback');
 return b;
}
function tile(icon,title,sub,click){const b=document.createElement('button');b.className='tile';b.innerHTML=`<span class="ico">${svgIcon(icon)}</span><span class="info"><strong>${esc(title)}</strong><small>${esc(sub)}</small></span><span class="arrow">‹</span>`;b.onclick=click;return b;}
function goto(route,extra={}){Object.assign(state,extra,{route});state.search='';$('#search').value='';render();window.scrollTo({top:0,behavior:'smooth'});}
function filteredDevices(){return state.devices.filter(d=>!state.brand||d.company===state.brand);}
function render(){const box=$('#content');box.classList.toggle('two-col',state.route==='home'||state.route==='brands');box.replaceChildren();const add=(node)=>box.append(node);const crumb=$('#breadcrumbs');crumb.replaceChildren();const crumbs=[['الرئيسية',()=>goto('home')]];if(state.kind)crumbs.push([kinds.find(k=>k[0]===state.kind)?.[1]||state.kind,()=>goto('brands')]);if(state.brand)crumbs.push([state.brand,()=>goto('models')]);if(state.device)crumbs.push([state.device.name,()=>goto('detail')]);crumbs.forEach(([name,fn],i)=>{if(i)crumb.append(' / ');const b=document.createElement('button');b.textContent=name;b.onclick=fn;crumb.append(b)});
 const title=t=>$('#sectionTitle').textContent=t;let n=0;
 if(state.route==='home'){title('أقسام قطع الغيار');kinds.forEach(([key,name,ico])=>add(tile(categoryIcons[key],name,'',()=>goto('brands',{kind:key,brand:null,device:null}))));n=kinds.length;}
 else if(state.route==='brands'){title('اختر الشركة');const list=state.companies.filter(c=>c.name.toLowerCase().includes(state.search.toLowerCase()));list.forEach(c=>add(brandTile(c,()=>goto('models',{brand:c.name,device:null}))));n=list.length;}
 else if(state.route==='models'){title('موديلات '+(state.brand||''));const list=filteredDevices().filter(d=>d.name.toLowerCase().includes(state.search.toLowerCase()));list.forEach(d=>add(tile('phone',d.name,d.year||'',()=>goto('detail',{device:d}))));n=list.length;}
 else if(state.route==='detail'){const d=state.device;title('توافقات '+d.name);const matches=state.pairs.filter(p=>(!state.kind||p.kind===state.kind)&&(p.device===d.id||p.device===d.name||p.compatible===d.id||p.compatible===d.name));const el=document.createElement('div');el.className='detail';const names=new Map(state.devices.flatMap(x=>[[x.id,x.name],[x.name,x.name]]));el.innerHTML=`<h3>${esc(d.name)}</h3><p class="muted">${esc(d.company)} · ${esc(d.year||'')}</p><h3>الأجهزة المتوافقة (${matches.length})</h3>`;if(matches.length){matches.forEach(p=>{const other=(p.device===d.id||p.device===d.name)?p.compatible:p.device;const div=document.createElement('div');div.className='pill';div.textContent=(kinds.find(k=>k[0]===p.kind)?.[1]||p.kind)+' — '+(names.get(other)||other);el.append(div);});}else{const t=document.createElement('p');t.className='muted';t.textContent='ماكو توافقات معتمدة لهذا الجهاز حالياً.';el.append(t)}const suggest=document.createElement('button');suggest.className='primary';suggest.textContent='إرسال توافق';suggest.onclick=()=>openSubmit(d);el.append(suggest);add(el);n=matches.length;}
 else if(state.route==='search'){title('البحث في جميع الأجهزة');const q=state.search.toLowerCase();const list=state.devices.filter(d=>q&&(`${d.name} ${d.company} ${d.year}`).toLowerCase().includes(q)).slice(0,120);list.forEach(d=>add(tile('search',d.name,d.company+' · '+(d.year||''),()=>goto('detail',{device:d,brand:d.company}))));if(!q)add(empty('اكتب اسم جهاز أو شركة للبحث'));n=list.length;}
 else if(state.route==='submit'){title('إرسال توافق');add(tile('send','إرسال توافق','',()=>openSubmit()));n=1;openSubmit();}
 if(!box.children.length)add(empty('ماكو نتائج حالياً'));$('#count').textContent=n+' نتيجة';document.querySelectorAll('.bottom button').forEach(b=>b.classList.toggle('active',b.dataset.route===state.route||(state.route==='models'||state.route==='detail')&&b.dataset.route==='brands'));
}
function empty(msg){const e=document.createElement('div');e.className='empty';e.innerHTML='<b>لا توجد نتائج</b><span>'+esc(msg)+'</span>';return e}
const pickers=['submitDevice','submitCompatible'];
function closePickers(except){pickers.forEach(id=>{if(id===except)return;const list=$('#'+id+'Results');list.hidden=true;$('#'+id+'Search').setAttribute('aria-expanded','false');});}
function showPicker(id){const input=$('#'+id+'Search'),list=$('#'+id+'Results');closePickers(id);const query=input.value.trim().toLocaleLowerCase();const results=state.devices.filter(d=>(d.name+' '+d.company+' '+(d.year||'')).toLocaleLowerCase().includes(query)).slice(0,65);list.replaceChildren();if(!results.length){const empty=document.createElement('div');empty.className='picker-empty';empty.textContent='ماكو أجهزة مطابقة';list.append(empty);}results.forEach(d=>{const item=document.createElement('button');item.type='button';item.className='device-option';const name=document.createElement('strong');name.textContent=d.name;const meta=document.createElement('small');meta.textContent=d.company+(d.year?' · '+d.year:'');item.append(name,meta);item.onclick=()=>{selectDevice(id,d);closePickers();};list.append(item);});list.hidden=false;input.setAttribute('aria-expanded','true');}
function selectDevice(id,device){$('#'+id).value=device?.id||'';$('#'+id+'Search').value=device?device.name:'';$('#'+id+'Search').classList.toggle('selected',!!device);}
function openSubmit(d){const m=$('#submitModal');m.hidden=false;document.body.classList.add('modal-open');$('#submitStatus').textContent='';$('#submitBtn').disabled=false;$('#submitNote').value='';pickers.forEach(id=>selectDevice(id,null));closePickers();$('#submitKind').innerHTML=kinds.map(k=>`<option value="${esc(k[0])}">${esc(k[1])}</option>`).join('');$('#submitKind').value=state.kind||'screens';if(d)selectDevice('submitDevice',d);}
function closeSubmit(){const m=$('#submitModal');m.hidden=true;document.body.classList.remove('modal-open');closePickers();if(state.route==='submit')goto('home',{kind:null,brand:null,device:null});}
async function sendSubmission(e){e.preventDefault();const btn=$('#submitBtn'),status=$('#submitStatus');const device=$('#submitDevice').value,compatible=$('#submitCompatible').value;if(!device||!compatible||device===compatible){status.textContent='اختر جهازين مختلفين';return}btn.disabled=true;status.textContent='جاري الإرسال...';try{if(!navigator.onLine)throw Error('لا يوجد اتصال بالإنترنت');await loadSupabaseSDK();if(!client)client=window.supabase.createClient(SUPABASE_URL,KEY);const {error}=await client.rpc('tawafuq_submit_public',{p_kind:$('#submitKind').value,p_device:device,p_compatible:compatible,p_note:$('#submitNote').value.trim()});if(error)throw error;status.textContent='تم إرسال التوافق للمراجعة';$('#submitNote').value='';closeSubmit();}catch(err){console.error(err);status.textContent='تعذر إرسال التوافق. حاول مرة أخرى.'}finally{btn.disabled=false}}
async function fetchAll(table,columns='*'){const out=[];for(let start=0;start<10000;start+=1000){const {data,error}=await client.from(table).select(columns).range(start,start+999);if(error)throw error;out.push(...data);if(data.length<1000)break;}return out;}
const OFFLINE_DB='tawafuq-catalog-v1', OFFLINE_STORE='snapshots';
function offlineDatabase(){return new Promise((resolve,reject)=>{if(!('indexedDB' in window))return reject(Error('Offline storage unavailable'));const request=indexedDB.open(OFFLINE_DB,1);request.onupgradeneeded=()=>request.result.createObjectStore(OFFLINE_STORE);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
async function loadOffline(){const db=await offlineDatabase();return new Promise((resolve,reject)=>{const tx=db.transaction(OFFLINE_STORE,'readonly');const request=tx.objectStore(OFFLINE_STORE).get('catalog');request.onsuccess=()=>resolve(request.result||null);request.onerror=()=>reject(request.error);tx.oncomplete=()=>db.close();});}
async function saveOffline(snapshot){const db=await offlineDatabase();return new Promise((resolve,reject)=>{const tx=db.transaction(OFFLINE_STORE,'readwrite');tx.objectStore(OFFLINE_STORE).put(snapshot,'catalog');tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>{db.close();reject(tx.error);};});}
function applyCatalog(data){state.companies=data.companies;state.devices=data.devices;state.pairs=data.pairs;render();}
function offlineNotice(message){let node=document.getElementById('offlineNotice');if(!node){node=document.createElement('div');node.id='offlineNotice';node.setAttribute('role','status');node.style.cssText='margin:8px 14px;padding:9px 12px;border-radius:10px;background:#f1eaff;color:#4c2484;font-size:13px;text-align:center';document.querySelector('main').prepend(node);}node.textContent=message;}

async function syncCatalog(){if(!window.supabase?.createClient)throw Error('مكتبة Supabase غير متوفرة');if(!client)client=window.supabase.createClient(SUPABASE_URL,KEY);
 const [companies,devices,pairs]=await Promise.all([fetchAll('tawafuq_companies','id,name,status,logo_url'),fetchAll('tawafuq_devices','id,name,company,year'),fetchAll('tawafuq_compatibilities','id,kind,device,compatible,status')]);
 const snapshot={companies:companies.filter(x=>x.status!=='غير نشط').sort((a,b)=>a.name.localeCompare(b.name)),devices:devices.sort((a,b)=>a.name.localeCompare(b.name)),pairs:pairs.filter(p=>['معتمد','مؤكد','نشط','approved','verified'].includes((p.status||'').toLowerCase())),updatedAt:Date.now()};
 let stored=false;try{await saveOffline(snapshot);stored=true;}catch(e){console.warn('تعذر حفظ بيانات البحث محلياً',e);}
 applyCatalog(snapshot);offlineNotice(stored?'تم تحديث البيانات وحفظها على الجهاز للاستخدام بدون إنترنت':'تم تحديث البيانات، لكن تعذر حفظها على الجهاز');
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
 try{const saved=await loadOffline();if(saved&&Array.isArray(saved.companies)&&Array.isArray(saved.devices)&&Array.isArray(saved.pairs)){applyCatalog(saved);hasCache=true;offlineNotice('البيانات محفوظة على الجهاز ويمكن البحث بدون إنترنت');}}catch(e){console.warn('تعذر فتح البيانات المحفوظة',e);}
 if(!hasCache){render();offlineNotice(navigator.onLine?'جاري تحميل البيانات لأول مرة...':'لا توجد بيانات محفوظة؛ اتصل بالإنترنت مرة واحدة لتنزيلها');}
 if(navigator.onLine){refreshInBackground();}
}
window.addEventListener('online',refreshInBackground);
$('#search').addEventListener('input',e=>{state.search=e.target.value.trim();if(state.route==='home')state.route='search';render()});$('#clearSearch').onclick=()=>{$('#search').value='';state.search='';render()};document.querySelectorAll('.bottom button').forEach(b=>b.onclick=()=>goto(b.dataset.route,{brand:null,device:null,kind:b.dataset.route==='home'?null:state.kind}));$('#closeModal').onclick=closeSubmit;$('#submitModal').onclick=e=>{if(e.target.id==='submitModal')closeSubmit()};$('#submitForm').onsubmit=sendSubmission;pickers.forEach(id=>{const input=$('#'+id+'Search');input.addEventListener('focus',()=>showPicker(id));input.addEventListener('input',()=>{ $('#'+id).value='';input.classList.remove('selected');showPicker(id);});input.addEventListener('keydown',e=>{if(e.key==='Escape')closePickers();if(e.key==='Enter'&&!$('#'+id+'Results').hidden){e.preventDefault();const first=$('#'+id+'Results .device-option');if(first)first.click();}});});document.addEventListener('click',e=>{if(!e.target.closest('.device-picker'))closePickers();});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#submitModal').hidden)closeSubmit();});document.querySelectorAll('[data-icon]').forEach(el=>{el.innerHTML=svgIcon(el.dataset.icon)});init();
