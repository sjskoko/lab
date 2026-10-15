(function(){
 'use strict';
 const config=window.LabAnalyticsConfig;
 if(!config||!config.endpoint||location.protocol!=='https:'||location.hostname!=='sjskoko.github.io')return;
 if(navigator.doNotTrack==='1'||window.doNotTrack==='1'||navigator.globalPrivacyControl===true)return;
 try{if(localStorage.getItem('lab-analytics-optout')==='1')return;}catch{}
 let endpoint;try{endpoint=new URL(config.endpoint);if(endpoint.protocol!=='https:'||endpoint.username||endpoint.password)return;}catch{return;}
 const pages={'/orbit-fourier-studio/':'orbit','/orbit-fourier-studio/index.html':'orbit','/orbit-fourier-studio/story/':'story','/orbit-fourier-studio/story/index.html':'story','/lab/':'lab','/lab/index.html':'lab'};
 const page=pages[location.pathname];if(!page)return;
 let sent=false;
 function count(){if(sent||document.visibilityState!=='visible')return;sent=true;document.removeEventListener('visibilitychange',count);fetch(endpoint.href,{method:'POST',mode:'cors',credentials:'omit',referrerPolicy:'no-referrer',headers:{'Content-Type':'application/json'},body:JSON.stringify({page}),keepalive:true}).catch(()=>{});}
 document.addEventListener('visibilitychange',count);count();
})();
