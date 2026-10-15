// Aggregate-only analytics. No IP addresses, visitor IDs, referrers, query
// strings, uploaded images, drawings, or browser fingerprints are stored.
export const PAGES = Object.freeze({orbit:'Orbit Studio',story:'Orbit Story',lab:'Interactive Lab'});
export const ORIGIN = 'https://sjskoko.github.io';
export const SQL = `INSERT INTO page_views (minute, day, page, views) VALUES (?, ?, ?, 1)
ON CONFLICT(minute, page) DO UPDATE SET views = MIN(page_views.views + 1, 600)`;
export const dayKey = (date = new Date()) => new Date(date.getTime() + 9*3600000).toISOString().slice(0,10);
const esc = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const noCache = {'Cache-Control':'no-store, max-age=0','X-Content-Type-Options':'nosniff'};
const json = (data,status=200,headers={}) => new Response(JSON.stringify(data),{status,headers:{...noCache,'Content-Type':'application/json; charset=utf-8',...headers}});
export function selection(url){return ['all','orbit','lab'].includes(url.searchParams.get('site'))?url.searchParams.get('site'):'all';}
export function validateVisit(request,body){
 if(request.headers.get('origin')!==ORIGIN)return false;
 if(request.headers.get('DNT')==='1'||request.headers.get('Sec-GPC')==='1')return false;
 return body && typeof body==='object' && !Array.isArray(body) && Object.keys(body).length===1 && Object.hasOwn(PAGES,body.page);
}
async function collect(request,env){
 const cors={'Access-Control-Allow-Origin':ORIGIN,'Vary':'Origin'};
 if(request.headers.get('origin')!==ORIGIN)return json({error:'Origin not allowed'},403);
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...cors,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'600'}});
 if(request.method!=='POST')return json({error:'POST required'},405,{'Allow':'POST, OPTIONS'});
 if(request.headers.get('DNT')==='1'||request.headers.get('Sec-GPC')==='1')return new Response(null,{status:204,headers:cors});
 if(!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'JSON required'},415,cors);
 if(Number(request.headers.get('content-length')||0)>128)return json({error:'Payload too large'},413,cors);
 const reader=request.body?.getReader();if(!reader)return json({error:'Missing body'},400,cors);
 let bytes=0,parts=[];while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>128){await reader.cancel();return json({error:'Payload too large'},413,cors);}parts.push(value);}
 const joined=new Uint8Array(bytes);let offset=0;for(const p of parts){joined.set(p,offset);offset+=p.length;}
 let body;try{body=JSON.parse(new TextDecoder().decode(joined));}catch{return json({error:'Invalid JSON'},400,cors);}
 if(!validateVisit(request,body))return json({error:'Invalid event'},400,cors);
 const now=new Date();await env.DB.prepare(SQL).bind(now.toISOString().slice(0,16),dayKey(now),body.page).run();
 return new Response(null,{status:204,headers:{...cors,...noCache}});
}
export async function stats(env,site='all',now=new Date()){
 const end=dayKey(now),start=dayKey(new Date(now.getTime()-29*86400000));
 const pages=site==='orbit'?['orbit','story']:site==='lab'?['lab']:Object.keys(PAGES);
 const marks=pages.map(()=>'?').join(',');
 const rows=await env.DB.prepare(`SELECT day, page, SUM(views) AS views FROM page_views WHERE day>=? AND day<=? AND page IN (${marks}) GROUP BY day,page ORDER BY day`).bind(start,end,...pages).all();
 const aggregate=await env.DB.prepare(`SELECT COALESCE(SUM(views),0) AS views, MIN(minute) AS first, MAX(minute) AS last FROM page_views WHERE page IN (${marks})`).bind(...pages).first();
 const daily=Array.from({length:30},(_,i)=>({day:dayKey(new Date(now.getTime()-(29-i)*86400000)),views:0,orbit:0,story:0,lab:0}));
 for(const row of rows.results){const d=daily.find(x=>x.day===row.day);if(d){d[row.page]=Number(row.views);d.views+=Number(row.views);}}
 return {site,timezone:'Asia/Seoul',metric:'Page views (not unique visitors)',generatedAt:now.toISOString(),firstVisit:aggregate.first?aggregate.first+':00Z':null,lastVisit:aggregate.last?aggregate.last+':00Z':null,total:Number(aggregate.views),last30Days:daily.reduce((s,d)=>s+d.views,0),today:daily.at(-1).views,pages:pages.map(id=>({id,label:PAGES[id]})),daily};
}
export function chart(data){
 const width=900,height=380,left=56,right=28,top=120,bottom=310,plot=width-left-right,step=plot/30,max=Math.max(1,...data.daily.map(d=>d.views));
 const title=data.site==='orbit'?'Orbit demo traffic':data.site==='lab'?'Interactive Lab traffic':'Interactive Lab · All demos';
 const colors={orbit:'#a7d9c4',story:'#ff9a80',lab:'#d1c489'};
 let bars='';data.daily.forEach((d,i)=>{let sum=0;for(const p of data.pages){const n=d[p.id],h=n/max*(bottom-top);if(n)bars+=`<rect x="${(left+i*step+3).toFixed(2)}" y="${(bottom-(sum+n)/max*(bottom-top)).toFixed(2)}" width="${(step-6).toFixed(2)}" height="${h.toFixed(2)}" rx="2" fill="${colors[p.id]}"><title>${esc(d.day+' '+p.label+': '+n+' views')}</title></rect>`;sum+=n;}});
 const labels=[0,7,14,21,29].map(i=>`<text x="${left+i*step+step/2}" y="332" text-anchor="middle">${data.daily[i].day.slice(5)}</text>`).join('');
 const legend=data.pages.map((p,i)=>`<circle cx="${56+i*180}" cy="358" r="4" fill="${colors[p.id]}"/><text x="${68+i*180}" y="362">${esc(p.label)}</text>`).join('');
 return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="380" viewBox="0 0 900 380" role="img" aria-label="${esc(title)}: ${data.last30Days} page views over 30 days"><title>${esc(title)}</title><rect width="900" height="380" rx="18" fill="#111918"/><g font-family="Arial,Helvetica,sans-serif" fill="#b0bfb8" font-size="11"><text x="28" y="34" font-size="20" fill="#edf2e9">${esc(title)}</text><text x="28" y="58">Last 30 days · Asia/Seoul · Aggregate page views</text><text x="28" y="92" font-size="20" fill="#a7d9c4">${data.last30Days.toLocaleString()} views</text><text x="220" y="92">Today: ${data.today} · All time: ${data.total}</text><text x="872" y="33" text-anchor="end">Updated ${esc(new Date(data.generatedAt).toLocaleString('en-GB',{timeZone:'Asia/Seoul',hour12:false}))} KST</text><path d="M56 120V310H872" fill="none" stroke="#46514c"/><path d="M56 120H872M56 215H872" fill="none" stroke="#263730" stroke-dasharray="3 5"/><text x="45" y="124" text-anchor="end">${max}</text><text x="45" y="314" text-anchor="end">0</text>${bars}${labels}${legend}${!data.total?'<text x="464" y="215" text-anchor="middle" font-size="16">Awaiting the first counted page view</text>':''}<text x="872" y="362" text-anchor="end">Counts begin at activation; no historical backfill.</text></g></svg>`;
}
const dashboard=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Interactive Lab · Traffic</title><style>body{margin:0;background:#101715;color:#e9efe7;font:16px system-ui,sans-serif}main{max-width:1100px;margin:auto;padding:48px 24px}h1{font-size:42px;letter-spacing:-2px}.muted{color:#a9b9ad;line-height:1.6}.bar{display:flex;gap:16px;flex-wrap:wrap;align-items:center;margin:25px 0}select,button,a{color:#c5f5a4}select,button{padding:12px;background:#1d2c23;border:1px solid #526557;border-radius:9px;font:inherit;cursor:pointer}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.card{padding:20px;border:1px solid #354c3e;border-radius:12px}.card strong{display:block;font-size:36px;margin-top:8px}img{width:100%;margin:28px 0;border-radius:12px}table{width:100%;border-collapse:collapse}td,th{text-align:left;padding:12px;border-bottom:1px solid #304136}details{margin-top:30px}.error{color:#ffac98}footer{font-size:13px;margin-top:35px}a:focus-visible,button:focus-visible,select:focus-visible{outline:3px solid #ffac98;outline-offset:3px}@media(max-width:500px){.cards{grid-template-columns:1fr}h1{font-size:32px}}</style></head><body><main><p class="muted">INTERACTIVE LAB / PUBLIC AGGREGATE STATISTICS</p><h1>See the experiments travel.</h1><p class="muted">Views of the GitHub Pages demos. Refreshes every 15 seconds while this tab is visible.</p><div class="bar"><label for="site">Collection</label><select id="site"><option value="all">All demos</option><option value="orbit">Orbit + Story</option><option value="lab">Link hub</option></select><button id="refresh">Refresh now</button><a href="https://sjskoko.github.io/lab/">Open the experiments ↗</a></div><p id="status" role="status" class="muted">Loading measured traffic…</p><div class="cards"><div class="card">Today · KST<strong id="today">—</strong></div><div class="card">Last 30 days<strong id="month">—</strong></div><div class="card">Since activation<strong id="total">—</strong></div></div><img id="chart" alt="Daily page views for the last 30 days" hidden><details><summary>Daily counts</summary><table><thead><tr><th>Date (KST)</th><th>Page views</th></tr></thead><tbody id="days"></tbody></table></details><footer class="muted">These are page views, not unique people. Reloads count again. No cookies, IP addresses, visitor identifiers, full referrers, or uploaded content are stored by this application. DNT/GPC and the opt-out setting are respected. Browser blockers, network errors, bots and the per-page cap of 600 views/minute can affect totals. The public endpoint cannot prove a request came from a human. Hosting providers receive normal network requests. README images may lag because of GitHub caching.</footer></main><script>const $=id=>document.getElementById(id);const q=new URLSearchParams(location.search);if(['all','orbit','lab'].includes(q.get('site'))) $('site').value=q.get('site');let busy=false;async function refresh(){if(busy||document.hidden)return;busy=true;try{const site=$('site').value,r=await fetch('/api/stats?site='+site,{cache:'no-store'});if(!r.ok)throw Error('Statistics unavailable');const d=await r.json();for(const [id,key]of [['today','today'],['month','last30Days'],['total','total']])$(id).textContent=d[key].toLocaleString();$('days').replaceChildren();for(const row of [...d.daily].reverse()){const tr=document.createElement('tr');for(const v of [row.day,row.views]){const td=document.createElement('td');td.textContent=v;tr.append(td)}$('days').append(tr)}$('chart').src='/chart.svg?site='+site+'&t='+Date.now();$('chart').hidden=false;$('status').className='muted';$('status').textContent='Updated '+new Date(d.generatedAt).toLocaleString()+' · First count: '+(d.firstVisit?new Date(d.firstVisit).toLocaleString():'none yet');}catch(e){$('status').textContent='Statistics temporarily unavailable. The last displayed values may be stale.';$('status').className='error'}finally{busy=false}}$('site').onchange=refresh;$('refresh').onclick=refresh;document.addEventListener('visibilitychange',refresh);setInterval(refresh,15000);refresh();</script></body></html>`;
export async function handle(request,env){
 const url=new URL(request.url);
 try{
  if(url.pathname==='/api/collect')return await collect(request,env);
  if(!['GET','HEAD'].includes(request.method))return json({error:'Method not allowed'},405);
  if(url.pathname==='/health')return json({ok:true});
  if(url.pathname==='/api/stats')return json(await stats(env,selection(url)));
  if(url.pathname==='/chart.svg')return new Response(chart(await stats(env,selection(url))),{headers:{...noCache,'Content-Type':'image/svg+xml; charset=utf-8','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'"}});
  if(url.pathname==='/')return new Response(dashboard,{headers:{...noCache,'Content-Type':'text/html; charset=utf-8','Referrer-Policy':'no-referrer'}});
  return json({error:'Not found'},404);
 }catch{return json({error:'Statistics temporarily unavailable'},503,request.headers.get('origin')===ORIGIN?{'Access-Control-Allow-Origin':ORIGIN}:{});}
}
export default {fetch:handle};
