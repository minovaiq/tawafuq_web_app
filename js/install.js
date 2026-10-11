(()=>{'use strict';
let deferredPrompt=null;
const button=document.getElementById('installBtn');
const isiOS=/iPhone|iPad|iPod/.test(navigator.userAgent);
const standaloneQuery=window.matchMedia('(display-mode: standalone)');
const isInstalledContext=()=>standaloneQuery.matches||navigator.standalone===true||document.referrer.startsWith('android-app://');
const refreshInstallButton=()=>{button.hidden=isInstalledContext();};
refreshInstallButton();
standaloneQuery.addEventListener?.('change',refreshInstallButton);
if(isInstalledContext()){
 if('serviceWorker' in navigator && (location.protocol==='https:'||location.hostname==='localhost'))navigator.serviceWorker.register('./sw.js').catch(()=>{});
 return;
}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;});
window.addEventListener('appinstalled',()=>{deferredPrompt=null;button.hidden=true;});
window.addEventListener('pageshow',refreshInstallButton);
button.addEventListener('click',async()=>{
 if(deferredPrompt){const prompt=deferredPrompt;deferredPrompt=null;await prompt.prompt();return;}
 const old=document.getElementById('installHelp');if(old){old.remove();return;}
 const overlay=document.createElement('div');overlay.id='installHelp';overlay.className='install-help';
 const msg=isiOS?'على الآيفون: افتح الموقع بمتصفح Safari، اضغط زر المشاركة (المربع والسهم للأعلى)، ثم اختر «إضافة إلى الشاشة الرئيسية» واضغط «إضافة».':'من قائمة المتصفح (⋮) اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية». إذا لم يظهر الخيار، افتح الموقع عبر HTTPS.';
 overlay.innerHTML='<div class="install-help-card" role="dialog" aria-modal="true" aria-label="طريقة تثبيت التطبيق"><button type="button" class="install-help-close" aria-label="إغلاق">×</button><h3>تثبيت توافقات</h3><p></p><button type="button" class="primary install-help-ok">حسناً</button></div>';
 overlay.querySelector('p').textContent=msg;
 overlay.addEventListener('click',e=>{if(e.target===overlay||e.target.closest('.install-help-close,.install-help-ok'))overlay.remove()});
 document.body.append(overlay);
});
if('serviceWorker' in navigator && (location.protocol==='https:'||location.hostname==='localhost'))navigator.serviceWorker.register('./sw.js').catch(()=>{});
})();
