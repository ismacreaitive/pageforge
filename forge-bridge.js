// forge-bridge.js: a tool bar on every video tool, and passing your edited video between tools.
const DB='forge-bridge', STORE='files', KEY='current';
export const TOOLS=[
  { id:'video',    page:'video.html',    icon:'✨', label:'Watermark',        takesVideo:true },
  { id:'toolkit',  page:'toolkit.html',  icon:'✂️', label:'Trim & resize',    takesVideo:true },
  { id:'upscale',  page:'upscale.html',  icon:'🔭', label:'Upscale',          takesVideo:true },
  { id:'bgvideo',  page:'bgvideo.html',  icon:'🧍', label:'Video background', takesVideo:true },
  { id:'broll',    page:'broll.html',    icon:'🎬', label:'B-roll',           takesVideo:true },
  { id:'captions', page:'captions.html', icon:'🎙️', label:'Captions',         takesVideo:true },
  { id:'thumbs',   page:'thumbs.html',   icon:'🖼️', label:'Thumbnail & SEO',  takesVideo:true },
  { id:'maker',    page:'maker.html',    icon:'🎞️', label:'Photos → video',   takesVideo:false }
];
const nameOf=id=>{ const t=TOOLS.find(t=>t.id===id); return t ? t.icon+' '+t.label : id; };
let steps=[], result=null, here='', bar=null;

function db(){ return new Promise((res,rej)=>{ const r=indexedDB.open(DB,1); r.onupgradeneeded=()=>r.result.createObjectStore(STORE); r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error); }); }
async function tx(mode,fn){
  const d=await db();
  try{
    return await new Promise((res,rej)=>{
      const t=d.transaction(STORE,mode), r=fn(t.objectStore(STORE));
      t.oncomplete=()=>res(r && r.result);
      t.onerror=()=>rej(t.error);
      t.onabort=()=>rej(t.error || new Error('browser storage is full'));
    });
  }finally{ d.close(); }
}
function css(){
  if(document.getElementById('bridge-css')) return;
  const s=document.createElement('style'); s.id='bridge-css';
  s.textContent=
    '.dock{display:flex;align-items:center;gap:6px;padding:8px 18px;border-bottom:1px solid var(--line);background:var(--panel-2);overflow-x:auto;white-space:nowrap;flex:none}'
   +'.dock-title{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.6px;margin-right:4px}'
   +'.dock button{padding:6px 11px;font-size:12.5px;flex:none}'
   +'.dock button.here{border-color:var(--accent);color:var(--accent);background:#1f2633;cursor:default}'
   +'.dock-carry{margin-left:auto;display:flex;align-items:center;gap:6px;font-size:12px;color:var(--ok);cursor:pointer;flex:none}'
   +'.dock-carry.hidden{display:none}'
   +'.dock.ready{box-shadow:inset 0 -2px 0 var(--ok)}'
   +'.bridge-banner{font-size:13px;line-height:1.5;padding:10px 12px;border-radius:10px;background:#1a2233;border:1px solid var(--accent)}';
  document.head.appendChild(s);
}
export function dock(current){
  here=current; css();
  bar=document.createElement('nav'); bar.className='dock';
  bar.innerHTML='<span class="dock-title">Video tools</span>'
    +TOOLS.map(t=>'<button data-id="'+t.id+'"'+(t.id===current?' class="here" title="You are here"':'')+'>'+t.icon+' '+t.label+'</button>').join('')
    +'<label class="dock-carry hidden" id="dockCarry"><input type="checkbox" checked> <span>Bring my edited video</span></label>';
  bar.addEventListener('click',async e=>{
    const b=e.target.closest('button[data-id]'); if(!b || b.dataset.id===here) return;
    const t=TOOLS.find(x=>x.id===b.dataset.id);
    const carry=result && t.takesVideo && bar.querySelector('#dockCarry input').checked;
    if(!carry){ location.href=t.page; return; }
    bar.querySelectorAll('button').forEach(x=>x.disabled=true); b.textContent='Moving your video…';
    try{
      await tx('readwrite',s=>s.put({ blob:result.blob, name:result.name, type:result.blob.type||'video/mp4', steps:[...steps,here] },KEY));
      location.href=t.page+'?continue=1';
    }catch(err){
      alert('Could not bring the video along ('+(err.message||err)+'). Download it and open it in the next tool instead.');
      location.href=t.page;
    }
  });
  const header=document.querySelector('header');
  header ? header.after(bar) : document.body.prepend(bar);
}
export function setResult(blob,name){
  result={ blob, name };
  if(!bar) return;
  const c=bar.querySelector('#dockCarry');
  c.classList.remove('hidden');
  c.querySelector('span').textContent='Bring my edited video ('+name+')';
  c.title='Done so far: '+[...steps,here].map(nameOf).join(' → ');
  bar.classList.add('ready');
}
export async function take(bannerParent){
  if(!new URLSearchParams(location.search).has('continue')) return null;
  history.replaceState(null,'',location.pathname);
  let rec=null; try{ rec=await tx('readonly',s=>s.get(KEY)); }catch{}
  if(!rec || !rec.blob) return null;
  steps=rec.steps||[];
  if(bannerParent){
    css(); const d=document.createElement('div'); d.className='bridge-banner';
    d.textContent='📦 Your edited video is loaded · done so far: '+steps.map(nameOf).join(' → ');
    bannerParent.prepend(d);
  }
  return new File([rec.blob],rec.name,{ type:rec.type });
}