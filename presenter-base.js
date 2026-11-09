// presenter-explainer.js — v15 — StoryForge: keep the video picture and add animated graphics
// v15: ✏️ WHITEBOARD: a hand draws simple faceless line pictures (Iconify Tabler/Lucide line icons, MIT/ISC) stroke by stroke,
//      writes labels and titles by hand, timed to your words; you shrink into a circle. Modes: off / some parts / whole video.
// v14: the hook headline always shows alone (no card can appear under it in the first 3.7 seconds).
// v13: 🔎 settings finder, colourful key words in titles, cleaner blending.
// v12: face finder keeps text off your face, smart zoom towards your face, light wrap, brightness matching.
// v11: channel profiles + logo, clean voice, sound effects, smart zoom, progress bar, hook headline, halal nature sounds.
// Used by autovideo.html (Video / audio mode). Must sit in the same folder as autovideo.html.

const THEMES={
  classic:{ bg:'#F3F0EA', card:'#FBFAF6', ink:'#1E1E1E', muted:'#6B6B6B', a1:'#0B5752', a2:'#EE6338', a2Text:'#FFFFFF', dark:'#1F1F1F', darkText:'#FFFFFF', band:'#0B5752', onBand:'#FFFFFF', chev:'#F3F0EA', chevText:'#1E1E1E', chevNum:'#0B5752' },
  white:{ bg:'#FFFFFF', card:'#F1F4F9', ink:'#111827', muted:'#6B7280', a1:'#2563EB', a2:'#F59E0B', a2Text:'#111827', dark:'#111827', darkText:'#FFFFFF', band:'#1E3A8A', onBand:'#FFFFFF', chev:'#FFFFFF', chevText:'#111827', chevNum:'#2563EB' },
  sand:{ bg:'#F4EBDD', card:'#FFF9F1', ink:'#2A211A', muted:'#7B6B5A', a1:'#3F6B4A', a2:'#C8553D', a2Text:'#FFFFFF', dark:'#2A211A', darkText:'#FFF9F1', band:'#3F6B4A', onBand:'#FFF9F1', chev:'#F4EBDD', chevText:'#2A211A', chevNum:'#3F6B4A' },
  forest:{ bg:'#EEF3EC', card:'#FFFFFF', ink:'#16231A', muted:'#5E6E62', a1:'#1F5E3B', a2:'#D4A017', a2Text:'#16231A', dark:'#16231A', darkText:'#F4F1E8', band:'#1F5E3B', onBand:'#F4F1E8', chev:'#EEF3EC', chevText:'#16231A', chevNum:'#1F5E3B' },
  rose:{ bg:'#FBF1F0', card:'#FFFFFF', ink:'#2B1B1F', muted:'#7A6266', a1:'#9B3B5A', a2:'#E07A5F', a2Text:'#FFFFFF', dark:'#2B1B1F', darkText:'#FFFFFF', band:'#9B3B5A', onBand:'#FFFFFF', chev:'#FBF1F0', chevText:'#2B1B1F', chevNum:'#9B3B5A' },
  ocean:{ bg:'#EAF4F8', card:'#FFFFFF', ink:'#0F2733', muted:'#5B7480', a1:'#0E7490', a2:'#F97316', a2Text:'#FFFFFF', dark:'#0F2733', darkText:'#FFFFFF', band:'#0E7490', onBand:'#FFFFFF', chev:'#EAF4F8', chevText:'#0F2733', chevNum:'#0E7490' },
  night:{ bg:'#0E1621', card:'#172333', ink:'#F4EFE6', muted:'#93A3B5', a1:'#2A9D8F', a2:'#E9C46A', a2Text:'#0E1621', dark:'#0B1118', darkText:'#F4EFE6', band:'#172333', onBand:'#F4EFE6', chev:'#22324A', chevText:'#F4EFE6', chevNum:'#E9C46A' }
};
const LIGHT=['classic','white','sand','forest','rose','ocean'];
const ROT=['classic','white','sand','forest','night','rose','ocean'];
const STUDIO_ROT=['blur','bubbles','rays','waves'];
let C=THEMES.classic;
const FONT='Rubik, "Segoe UI", Roboto, Arial, sans-serif';
const FONT_HAND='Caveat, "Segoe Print", "Comic Sans MS", cursive';
const EMOJI='"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
const LAYOUTS=['presenter','lower-third','top-third','side-card','split','split-left','stack','corner-list','list','steps','quote','stat','endcard','board'];
const ITEMISH=['side-card','split','split-left','stack','corner-list','list','steps'];
const TEXT_TYPES=['eyebrow','title','source','subtitle','quote','stat','cta'];
const HOOK_END=3.75;
const INK='#1F2A37', BOARD_BG='#FBFBF8', SKIN='#B97A4F', SLEEVE='#24364F';
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const easeOut=t=>1-Math.pow(1-t,3);
const easeIO=t=>t<0.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2;
const lerp=(a,b,p)=>a+(b-a)*p;
const escH=s=>String(s??'').replace(/[&<>"]/g,c=>({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
const mmss=s=>{ s=Math.max(0,Math.round(s)); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); };
const shuffle=a=>{ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
const isOn=id=>{ const el=document.getElementById(id); return el ? el.checked!==false : true; };
const tick0=()=>new Promise(r=>setTimeout(r,0));
const lum=(d,i)=>0.2126*d[i]+0.7152*d[i+1]+0.0722*d[i+2];
const isItemish=e=>e.type==='item' || e.type==='sketch';
let planCache={ key:'', plan:null }, fontP=null, cutState={ id:null, segs:null, words:null }, mediaRef=null, SEG=null, BUB=null;
let FACEBOX=null, BAR_H=0, VIS=null, FD=null, COLORFUL=true;

/* ---------- keeping text off your face ---------- */
function overlapArea(a,b){ const w=Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x), h=Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y); return w>0 && h>0 ? w*h : 0; }
function spot(cands){
  if(!FACEBOX) return cands[0];
  let best=cands[0], ba=Infinity;
  for(const c of cands){ const a=overlapArea(c,FACEBOX); if(a<=0) return c; if(a<ba){ ba=a; best=c; } }
  return best;
}

/* ---------- colourful key words in titles ---------- */
const STOPW=new Set('the a an and or of to in on for with your you my our is are be how why what this that it its from at by as into more most less'.split(' '));
const cleanW=w=>String(w).toLowerCase().replace(/[^\p{L}\p{N}']/gu,'');
function accentSet(el){
  const given=String(el.accent||'').split(/\s+/).map(cleanW).filter(Boolean);
  if(given.length) return new Set(given);
  const words=String(el.text).split(/\s+/).map(cleanW).filter(x=>x.length>=4 && !STOPW.has(x));
  if(!words.length) return new Set();
  return new Set([words.reduce((a,b)=>b.length>a.length ? b : a)]);
}
const acc=el=>el ? (el._acc||(el._acc=accentSet(el))) : null;
function richLine(ctx,line,x,y,align,base,accent,set){
  if(!COLORFUL || !set || !set.size){ ctx.fillStyle=base; ctx.textAlign=align; ctx.fillText(line,x,y); return; }
  const parts=String(line).split(' '), sp=ctx.measureText(' ').width, widths=parts.map(p=>ctx.measureText(p).width);
  const total=widths.reduce((a,b)=>a+b,0)+sp*(parts.length-1);
  let cx=align==='center' ? x-total/2 : align==='right' ? x-total : x;
  ctx.save(); ctx.textAlign='left';
  parts.forEach((p,i)=>{ ctx.fillStyle=set.has(cleanW(p)) ? accent : base; ctx.fillText(p,cx,y); cx+=widths[i]+sp; });
  ctx.restore();
}

/* ---------- fonts (Rubik for graphics, Caveat for handwriting on the whiteboard) ---------- */
function loadFont(){
  if(fontP) return fontP;
  fontP=(async()=>{
    const l=document.createElement('link'); l.rel='stylesheet';
    l.href='https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;700;800&family=Caveat:wght@600;700&display=swap';
    await new Promise(r=>{ l.onload=r; l.onerror=r; setTimeout(r,6000); document.head.appendChild(l); });
    try{ await Promise.all([...['400','500','700','800'].map(w=>document.fonts.load(w+' 40px Rubik')),document.fonts.load('700 40px Caveat')]); }catch{}
  })();
  return fontP;
}

/* ---------- browser storage (the same database autovideo.html uses) ---------- */
async function idbAll(store){
  const db=await new Promise((res,rej)=>{ const r=indexedDB.open('storyforge'); r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error); });
  try{
    if(!db.objectStoreNames.contains(store)) return [];
    return await new Promise((res,rej)=>{ const q=db.transaction(store).objectStore(store).getAll(); q.onsuccess=()=>res(q.result||[]); q.onerror=()=>rej(q.error); });
  }finally{ db.close(); }
}

/* ---------- 🔎 settings finder for the whole page ---------- */
const AV_FINDS=[
  [['shape','ratio','aspect','vertical','wide','square','9:16','16:9','portrait','landscape'],'format'],
  [['kind','type of video','presenter','quran face','recitation'],'peKind'],
  [['channel','profile','save settings'],'peChan'],
  [['logo','brand','watermark','channel mark'],'peLogoIn'],
  [['keep my video','keep picture','graphics','animated'],'keepPic'],
  [['whiteboard','board','drawing','drawings','hand','sketch','doodle','videoscribe'],'peBoard'],
  [['pauses','cut','um','mistakes','retakes'],'tightOn'],
  [['clean voice','noise','generator','fan'],'peClean'],
  [['colours','colors','theme','graphics colour'],'peTheme'],
  [['colourful','colorful','key words','accent'],'peColor'],
  [['behind me','studio','blur','room','green screen','background behind'],'peStudio'],
  [['soft light','glow'],'peGlow'],
  [['look better','skin','brighter','beauty'],'lookOn'],
  [['fuller face','face'],'fullFace'],
  [['zoom','smart zoom'],'peZoom'],
  [['sound effects','sfx','whoosh','pop'],'peSfx'],
  [['hook','headline'],'peHook'],
  [['progress','bar'],'peBar'],
  [['background','footage','stock','visuals','b-roll','broll','pixabay','pexels'],'vidSrc'],
  [['library','my photos','my videos','folder','upload background'],'bgAdd'],
  [['caption','captions','subtitle','subtitles'],'capStyle'],
  [['words at a time','words per'],'wpc'],
  [['emoji','emojis'],'emojiMode'],
  [['quality','1080','720','hd'],'quality'],
  [['music','background sound','nature sounds','rain','ocean'],'bgSound'],
  [['volume','loudness'],'musicVol'],
  [['voice studio','echo','voice effect','preset'],'fxPreset'],
  [['photo','avatar','bubble','my picture'],'photoInput'],
  [['language','arabic','english','quran'],'mlang'],
  [['surah','ayah','verse'],'qSurah'],
  [['make','export','render','create','one click','start'],'oneBtn']
];
function peToast(m){ const t=document.getElementById('toast'); if(t){ t.textContent=m; t.classList.add('show'); clearTimeout(t._pe); t._pe=setTimeout(()=>t.classList.remove('show'),3500); } else alert(m); }
const shown=el=>!!(el && el.getClientRects().length && !el.closest('.pe-hide,.hidden'));
function findSetting(q){
  q=String(q||'').trim().toLowerCase(); if(!q) return;
  let el=null;
  for(const [keys,id] of AV_FINDS){ if(keys.some(k=>k===q)){ el=document.getElementById(id); if(el) break; } }
  if(!el) for(const [keys,id] of AV_FINDS){ if(keys.some(k=>k.includes(q) || q.includes(k))){ const c=document.getElementById(id); if(c){ el=c; break; } } }
  if(!el || !shown(el)){
    const cand=[...document.querySelectorAll('aside .label, aside .sec, aside label, aside button, aside summary')].filter(x=>x.id!=='peFind' && x.textContent.toLowerCase().includes(q));
    el=cand.find(shown) || el || cand[0] || null;
  }
  if(!el){ peToast('No setting found for "'+q+'". Try: shape, captions, background, whiteboard, sound, logo'); return; }
  let d=el.closest('details'); while(d){ d.open=true; d=d.parentElement && d.parentElement.closest('details'); }
  if(!shown(el)){ peToast('That setting is hidden right now: it depends on the start mode or on "Keep my video picture".'); return; }
  const target=el.closest('label') || (el.parentElement && el.parentElement.closest('div')) || el;
  target.scrollIntoView({ behavior:'smooth', block:'center' });
  target.classList.add('pe-flash'); setTimeout(()=>target.classList.remove('pe-flash'),1800);
  if(el.focus && /INPUT|SELECT|BUTTON|TEXTAREA/.test(el.tagName)) setTimeout(()=>el.focus({ preventScroll:true }),350);
}
function addFinder(){
  const aside=document.querySelector('aside'); if(!aside || document.getElementById('peFind')) return;
  const inp=document.createElement('input'); inp.id='peFind'; inp.type='text'; inp.autocomplete='off'; inp.spellcheck=false;
  inp.placeholder='🔎 Jump to a setting: shape, captions, whiteboard, background, sound, logo…';
  inp.style.cssText='position:sticky;top:0;z-index:30;font-size:14px;margin-bottom:6px';
  aside.prepend(inp);
  inp.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); findSetting(inp.value); } });
  inp.addEventListener('change',()=>findSetting(inp.value));
}

/* ---------- channel profiles: CreAItive EDGE and Ummah Digital ---------- */
const PROF_KEY='forge:pe:profiles';
const PROF_IDS=['peKind','keepPic','tightOn','peClean','peTheme','peColor','peBg','peBoard','peStudio','peGlow','lookOn','fullFace','peSfx','peZoom','peBar','peHook','peMark','peCorner','capStyle','emojiMode','wpc','bgSound','musicVol','duck','fxPreset','format','mlang','channel','outroLine','quality'];
const DEF_PROFILES=[
  { id:'edge', name:'CreAItive EDGE', logo:'', settings:{ peKind:'presenter', peTheme:'white', peStudio:'auto', peSfx:true, peZoom:true, peBar:true, peHook:true, peMark:'logo', peCorner:'tr', peBoard:'some' } },
  { id:'ummah', name:'Ummah Digital', logo:'', settings:{ peKind:'presenter', peTheme:'sand', peStudio:'blur', peSfx:true, peZoom:true, peBar:false, peHook:true, peMark:'logo', peCorner:'tr', peBoard:'some' } }
];
function loadProfiles(){
  let P=null; try{ P=JSON.parse(localStorage.getItem(PROF_KEY)||'null'); }catch{}
  if(!P || !Array.isArray(P.list) || !P.list.length) P={ cur:'edge', list:DEF_PROFILES.map(p=>JSON.parse(JSON.stringify(p))) };
  if(!P.list.some(p=>p.id===P.cur)) P.cur=P.list[0].id;
  return P;
}
function saveProfiles(P){ try{ localStorage.setItem(PROF_KEY,JSON.stringify(P)); return true; }catch{ alert('Could not save: the browser storage is full. Try a smaller logo picture.'); return false; } }
const curProfile=()=>{ const P=loadProfiles(); return P.list.find(p=>p.id===P.cur)||P.list[0]; };
function flash(btn,text){ const old=btn.dataset.old||btn.textContent; btn.dataset.old=old; btn.textContent=text; clearTimeout(btn._t); btn._t=setTimeout(()=>{ btn.textContent=old; },2000); }
function applyProfile(p){
  const s=p.settings||{};
  if(s.peKind) setVal('peKind',s.peKind);
  for(const id of PROF_IDS){ if(id==='peKind' || !(id in s)) continue; setVal(id,s[id]); }
  syncUI();
}
function logoInfo(){
  const el=document.getElementById('peLogoInfo'); if(!el) return;
  const p=curProfile();
  el.innerHTML=p.logo ? '<img src="'+p.logo+'" alt="" style="height:30px;vertical-align:middle;margin-right:8px;border-radius:4px">Logo saved for <b>'+escH(p.name)+'</b>'
    : 'No logo yet for <b>'+escH(p.name)+'</b>, so the channel name is shown in the corner instead.';
}
function setupProfiles(){
  const sel=document.getElementById('peChan'); if(!sel) return;
  const P=loadProfiles(); saveProfiles(P);
  sel.innerHTML=P.list.map(p=>'<option value="'+escH(p.id)+'">'+escH(p.name)+'</option>').join('');
  sel.value=P.cur; logoInfo();
  sel.addEventListener('change',()=>{ const Q=loadProfiles(); Q.cur=sel.value; saveProfiles(Q); const p=Q.list.find(x=>x.id===Q.cur); if(p) applyProfile(p); logoInfo(); });
  document.getElementById('peChanSave').addEventListener('click',e=>{
    const btn=e.currentTarget, Q=loadProfiles(), p=Q.list.find(x=>x.id===Q.cur); if(!p) return;
    const s={}; for(const id of PROF_IDS){ const el=document.getElementById(id); if(el) s[id]=el.type==='checkbox' ? el.checked : el.value; }
    p.settings=s; if(saveProfiles(Q)) flash(btn,'✓ Saved for '+p.name);
  });
  document.getElementById('peLogoIn').addEventListener('change',async e=>{
    const f=e.target.files[0]; e.target.value=''; if(!f) return;
    try{
      const bmp=await createImageBitmap(f), s=Math.min(1,256/Math.max(bmp.width,bmp.height)), c=document.createElement('canvas');
      c.width=Math.max(1,Math.round(bmp.width*s)); c.height=Math.max(1,Math.round(bmp.height*s));
      c.getContext('2d').drawImage(bmp,0,0,c.width,c.height);
      const Q=loadProfiles(), p=Q.list.find(x=>x.id===Q.cur); p.logo=c.toDataURL('image/png');
      if(saveProfiles(Q)) logoInfo();
    }catch{ alert('Could not read that picture. Try a PNG or JPG.'); }
  });
  document.getElementById('peLogoDel').addEventListener('click',()=>{ const Q=loadProfiles(), p=Q.list.find(x=>x.id===Q.cur); p.logo=''; saveProfiles(Q); logoInfo(); });
}

/* ---------- the Presenter controls (this file adds them to the page) ---------- */
const KIND={
  presenter:{ keepPic:true, tightOn:true, cap:'none', quran:false },
  quranFace:{ keepPic:true, tightOn:false, cap:'box', quran:true },
  quranFootage:{ keepPic:false, tightOn:false, cap:'box', quran:true },
  footage:{ keepPic:false, tightOn:true, cap:'pop', quran:false }
};
const HIDE_WHEN_PIC=[['vidSrc','parent'],['stockBox','self'],['shotLen','row'],['photoInput','row'],['photoName','row'],['presMode','parent'],['nameTag','self'],['introOn','label'],['channel','self'],['outroLine','self'],['xfOn','label'],['cineOn','label']];
function setVal(id,v){
  const el=document.getElementById(id); if(!el) return;
  if(el.type==='checkbox'){ v=v===true || v==='1' || v==='true'; if(el.checked===v) return; el.checked=v; } else { v=String(v); if(el.value===v) return; el.value=v; }
  el.dispatchEvent(new Event('change',{ bubbles:true }));
}
function syncUI(){
  const kp=document.getElementById('keepPic'), more=document.getElementById('peMore'); if(!kp) return;
  if(more) more.classList.toggle('hidden',!kp.checked);
  for(const [id,how] of HIDE_WHEN_PIC){
    const el=document.getElementById(id); if(!el) continue;
    const box=how==='self' ? el : how==='parent' ? el.parentElement : how==='row' ? el.closest('.row') : el.closest('label');
    if(box) box.classList.toggle('pe-hide',kp.checked);
  }
}
function applyKind(k){
  const p=KIND[k]; if(!p) return;
  if(p.quran) setVal('mlang','quran');
  else{ const ml=document.getElementById('mlang'); if(ml && ml.value==='quran') setVal('mlang','english'); }
  setVal('keepPic',p.keepPic); setVal('tightOn',p.tightOn); setVal('capStyle',p.cap);
  syncUI();
}
function addFolderPicker(){
  const add=document.getElementById('bgAdd'); if(!add || document.getElementById('peFolder')) return;
  const lab=add.closest('label'); if(!lab) return;
  const l2=document.createElement('label'); l2.className='pick';
  l2.innerHTML='📁 Add a whole folder (pictures and videos)<input type="file" id="peFolder" webkitdirectory multiple hidden>';
  lab.insertAdjacentElement('afterend',l2);
  l2.querySelector('input').addEventListener('change',e=>{
    const all=[...e.target.files]; e.target.value='';
    const pics=all.filter(f=>/^image\//.test(f.type) || /\.(jpe?g|png|webp|gif|bmp)$/i.test(f.name)).slice(0,60);
    const vids=all.filter(f=>(/^video\//.test(f.type) || /\.(mp4|mov|webm|mkv|m4v)$/i.test(f.name)) && f.size<300*1048576).slice(0,10);
    const files=[...pics,...vids];
    if(!files.length){ alert('No pictures or videos were found in that folder.'); return; }
    const dt=new DataTransfer(); files.forEach(f=>dt.items.add(f));
    add.files=dt.files; add.dispatchEvent(new Event('change',{ bubbles:true }));
  });
}
function addNatureButton(){
  const sa=document.getElementById('soundAdd'); if(!sa || document.getElementById('peNature')) return;
  const lab=sa.closest('label') || sa;
  const b=document.createElement('button'); b.id='peNature'; b.type='button'; b.className='mini';
  b.textContent='🌿 Add halal nature sounds (rain, ocean, wind, birds, crickets, fire, studio air)';
  lab.insertAdjacentElement('afterend',b);
  b.addEventListener('click',()=>addNatureSounds(b));
}
export function mountUI(){
  if(document.getElementById('peUI') || document.getElementById('keepPic')) return;
  const anchor=document.getElementById('mediaInfo'); if(!anchor) return;
  if(!document.getElementById('peUIStyle')){ const st=document.createElement('style'); st.id='peUIStyle'; st.textContent='.pe-hide{display:none !important}.pe-flash{outline:3px solid var(--accent) !important;outline-offset:4px;border-radius:8px}'; document.head.appendChild(st); }
  const box=document.createElement('div'); box.id='peUI'; box.className='box';
  box.innerHTML='<div class="row"><div><div class="label">Channel</div><select id="peChan"></select></div>'
    +'<div style="flex:none;align-self:flex-end"><button class="mini" id="peChanSave" type="button" title="Save my current settings to this channel">💾 Save settings</button></div></div>'
    +'<details><summary class="ptext" style="cursor:pointer;margin:0">🏷️ Logo and channel mark</summary><div class="stack" style="gap:6px;margin-top:6px">'
    +'<div class="row"><label class="pick">🖼️ Choose logo<input type="file" id="peLogoIn" accept="image/*" hidden></label><button class="mini" id="peLogoDel" type="button" style="flex:none">✕ Remove</button></div>'
    +'<div class="ptext" id="peLogoInfo" style="margin:0"></div>'
    +'<div class="row"><div><div class="label">Show in the corner</div><select id="peMark"><option value="logo">My logo (or the name)</option><option value="name">Channel name</option><option value="none">Nothing</option></select></div>'
    +'<div><div class="label">Which corner</div><select id="peCorner"><option value="tr">Top right</option><option value="tl">Top left</option><option value="br">Bottom right</option><option value="bl">Bottom left</option></select></div></div>'
    +'</div></details>'
    +'<div><div class="label">What kind of video is this?</div><select id="peKind">'
    +'<option value="presenter">🎬 Presenter: my face + animated graphics (teaching, business, reminders)</option>'
    +'<option value="quranFace">📖 Quran recitation: my face + the ayat on screen</option>'
    +'<option value="quranFootage">📖 Quran recitation: new footage, only my voice</option>'
    +'<option value="footage">🎙️ Talk with new footage: only my voice, with captions</option>'
    +'<option value="custom">⚙️ Custom: I choose everything myself</option></select></div>'
    +'<label class="check"><input type="checkbox" id="tightOn" checked> ✂️ Cut pauses, "um"s and repeated tries, and lift a quiet voice</label>'
    +'<label class="check"><input type="checkbox" id="peClean" checked> 🎙️ Clean my voice (removes generator, fan and street noise)</label>'
    +'<label class="check"><input type="checkbox" id="keepPic"> 🎬 Keep my video picture and add animated graphics</label>'
    +'<div id="peMore" class="stack" style="gap:8px">'
    +'<div><div class="label">✏️ Whiteboard drawings (a hand draws while I talk)</div><select id="peBoard"><option value="off">Off</option><option value="some">Some parts of the video</option><option value="all">The whole video (me in a small circle)</option></select></div>'
    +'<div class="row"><div><div class="label">Graphics colours</div><select id="peTheme"><option value="auto">Auto (changes with each part)</option><option value="classic">Cream &amp; teal</option><option value="white">White &amp; blue</option><option value="sand">Sand &amp; green</option><option value="forest">Forest green</option><option value="rose">Soft rose</option><option value="ocean">Ocean blue</option><option value="night">Night &amp; gold</option></select></div>'
    +'<div><div class="label">Graphics background</div><select id="peBg"><option value="plain">Plain colour</option><option value="library">A picture from my library</option></select></div></div>'
    +'<label class="check"><input type="checkbox" id="peColor" checked> 🎨 Colourful key words in titles</label>'
    +'<div><div class="label">Behind me (my real background)</div><select id="peStudio"><option value="auto">Auto: changes with each part (uses my library too)</option><option value="room">Keep my room</option><option value="blur">Soft blur of my room</option><option value="libvideo">A moving video from my library</option><option value="library">A picture from my library</option><option value="bubbles">Floating circles</option><option value="rays">Turning light rays</option><option value="waves">Colour waves</option></select></div>'
    +'<label class="check"><input type="checkbox" id="peGlow" checked> 💡 Soft light behind me</label>'
    +'<label class="check"><input type="checkbox" id="lookOn" checked> ✨ Look better: brighter, warmer, smoother skin</label>'
    +'<label class="slider">Fuller face <input type="range" id="fullFace" min="0" max="8" step="1" value="4"></label>'
    +'<label class="check"><input type="checkbox" id="peZoom" checked> 🔍 Smart zoom (slow push-in, quick zoom on important words)</label>'
    +'<label class="check"><input type="checkbox" id="peSfx" checked> 🔊 Soft sound effects when graphics appear</label>'
    +'<label class="check"><input type="checkbox" id="peHook" checked> 🪝 Hook headline in the first 3 seconds (shown alone)</label>'
    +'<label class="check"><input type="checkbox" id="peBar" checked> ▬ Thin progress bar at the bottom</label>'
    +'</div>';
  anchor.insertAdjacentElement('afterend',box);
  const firstTime=localStorage.getItem('forge:set:pe:peKind')===null;
  if(localStorage.getItem('forge:set:pe:peBoard')===null) document.getElementById('peBoard').value='some';
  for(const id of ['peKind','keepPic','peTheme','peColor','peBg','peBoard','peStudio','peGlow','lookOn','fullFace','tightOn','peClean','peZoom','peSfx','peHook','peBar','peMark','peCorner']){
    const el=document.getElementById(id), k='forge:set:pe:'+id, v=localStorage.getItem(k);
    if(v!==null){ if(el.type==='checkbox') el.checked=v==='1'; else el.value=v; }
    if(el.tagName==='SELECT' && el.selectedIndex<0) el.selectedIndex=0;
    const save=()=>localStorage.setItem(k, el.type==='checkbox' ? (el.checked ? '1' : '0') : el.value);
    el.addEventListener('change',save); el.addEventListener('input',save);
  }
  const kp=document.getElementById('keepPic'), kind=document.getElementById('peKind');
  kp.addEventListener('change',e=>{
    if(e.isTrusted){
      const cs=document.getElementById('capStyle'), ml=document.getElementById('mlang'), quran=ml && ml.value==='quran';
      if(cs){
        if(kp.checked && !quran && cs.value!=='none'){ localStorage.setItem('forge:set:pe:capPrev',cs.value); setVal('capStyle','none'); }
        else if(!kp.checked && cs.value==='none'){ setVal('capStyle',localStorage.getItem('forge:set:pe:capPrev')||'pop'); }
      }
      setVal('peKind','custom');
    }
    syncUI();
  });
  kind.addEventListener('change',()=>applyKind(kind.value));
  addFolderPicker();
  addNatureButton();
  setupProfiles();
  addFinder();
  if(firstTime) applyKind(kind.value); else syncUI();
}

/* ---------- halal nature sounds, made by code (no instruments, no copyright, no internet) ---------- */
const NATURE=[['rain','Nature · Soft rain'],['ocean','Nature · Ocean waves'],['wind','Nature · Gentle wind'],['forest','Nature · Forest birds'],['night','Nature · Night crickets'],['fire','Nature · Crackling fire'],['room','Business · Quiet studio air']];
function natureSound(kind,R,secs){
  const X=Math.round(R*3), L=Math.round(R*secs), n=L+X, a=new Float32Array(n);
  const rnd=()=>Math.random()*2-1, lpA=fc=>1-Math.exp(-2*Math.PI*fc/R);
  let p0=0,p1=0,p2=0, br=0;
  const pink=()=>{ const w=rnd(); p0=0.99765*p0+w*0.0990460; p1=0.96300*p1+w*0.2965164; p2=0.57000*p2+w*1.0526913; return (p0+p1+p2+w*0.1848)*0.11; };
  const brown=()=>{ br=(br+0.02*rnd())/1.02; return br*3.5; };
  const walker=(lo,hi,speed)=>{ let v=(lo+hi)/2, tgt=v, c=0; const k=speed*4/R; return ()=>{ if(--c<=0){ tgt=lo+Math.random()*(hi-lo); c=Math.round(R*(0.5+Math.random()*1.5)/speed); } v+=(tgt-v)*k; return v; }; };
  if(kind==='rain'){
    let l1=0,l2=0,l3=0,e=0,dl=0; const a1=lpA(7000), a2=lpA(400), a3=lpA(2000), a4=lpA(250), dec=Math.exp(-1/(R*0.004)), amp=walker(0.8,1.1,0.3);
    for(let i=0;i<n;i++){
      const p=pink(); l1+=a1*(p-l1); l2+=a2*(l1-l2);
      if(Math.random()<45/R) e=0.05+Math.random()*Math.random()*0.5;
      const w=rnd()*e; e*=dec; dl+=a3*(w-dl);
      l3+=a4*(brown()-l3);
      a[i]=((l1-l2)*0.9+(w-dl)*0.6+l3*0.25)*amp();
    }
  }else if(kind==='ocean'){
    let l1=0,l2=0,h=0, ph=Math.random(), per=8; const a1=lpA(700), a2=lpA(2500), a3=lpA(300);
    for(let i=0;i<n;i++){
      ph+=1/(R*per); if(ph>=1){ ph-=1; per=6+Math.random()*5; }
      const sw=Math.pow(Math.sin(Math.PI*Math.pow(ph,1.5)),2);
      l1+=a1*(brown()-l1); l2+=a2*(pink()-l2); h+=a3*(l2-h);
      a[i]=l1*(0.35+0.65*sw)*0.9+(l2-h)*sw*sw*0.8;
    }
  }else if(kind==='wind'){
    let low=0,band=0,l1=0; const fcw=walker(220,800,0.25), amp=walker(0.3,1,0.2), a1=lpA(500);
    for(let i=0;i<n;i++){
      const fc=fcw(), f=2*Math.sin(Math.PI*fc/R), w=rnd();
      low+=f*band; const high=w-low-0.5*band; band+=f*high;
      l1+=a1*(pink()-l1);
      a[i]=band*0.25*amp()+l1*0.5;
    }
  }else if(kind==='forest'){
    let l1=0,l2=0,h=0, next=R*2, bird=null; const a1=lpA(1200), a2=lpA(6000), a3=lpA(2500), rust=walker(0.2,1,0.4);
    for(let i=0;i<n;i++){
      l1+=a1*(pink()-l1); const w=rnd(); l2+=a2*(w-l2); h+=a3*(l2-h);
      let v=l1*0.6+(l2-h)*0.05*rust();
      if(!bird && i>=next) bird={ f0:2800+Math.random()*1800, left:2+Math.floor(Math.random()*3), t:0, T:Math.round(R*(0.07+Math.random()*0.07)), gap:Math.round(R*(0.06+Math.random()*0.08)), amp:0.05+Math.random()*0.06, ph:0, wait:0 };
      if(bird){
        if(bird.wait>0) bird.wait--;
        else{
          const p=bird.t/bird.T, f=bird.f0*(1-0.3*p); bird.ph+=2*Math.PI*f/R;
          v+=(Math.sin(bird.ph)+0.25*Math.sin(2*bird.ph))*Math.pow(Math.sin(Math.PI*p),2)*bird.amp;
          if(++bird.t>=bird.T){ bird.t=0; bird.wait=bird.gap; if(--bird.left<=0){ bird=null; next=i+Math.round(R*(2+Math.random()*5)); } }
        }
      }
      a[i]=v;
    }
  }else if(kind==='night'){
    let l1=0; const a1=lpA(700), cr=[{ f:4300, per:0.7, off:0, amp:walker(0.4,1,0.3) },{ f:3900, per:0.95, off:0.3, amp:walker(0.2,0.9,0.25) }];
    for(let i=0;i<n;i++){
      l1+=a1*(pink()-l1); let v=l1*0.5; const t=i/R;
      for(const c of cr){
        const g=c.amp(), ct=(t+c.off)%c.per, k=Math.floor(ct/0.04);
        if(k<3){ const u=(ct-k*0.04)/0.025; if(u<1) v+=Math.sin(2*Math.PI*c.f*t)*Math.sin(Math.PI*u)*0.05*g; }
      }
      a[i]=v;
    }
  }else if(kind==='fire'){
    let l1=0,hp=0,e=0; const a1=lpA(350), a2=lpA(1500), dec=Math.exp(-1/(R*0.0012)), rate=walker(4,14,0.5);
    for(let i=0;i<n;i++){
      l1+=a1*(brown()-l1);
      if(Math.random()<rate()/R) e=Math.pow(Math.random(),2)*0.9;
      const w=rnd()*e; e*=dec; hp+=a2*(w-hp);
      a[i]=l1*0.7+(w-hp)*0.8;
    }
  }else{
    let l1=0,l2=0; const a1=lpA(220), a2=lpA(2500);
    for(let i=0;i<n;i++){ l1+=a1*(brown()-l1); l2+=a2*(pink()-l2); a[i]=l1*0.8+l2*0.12; }
  }
  const out=a.slice(0,L);
  for(let i=0;i<X;i++) out[i]=a[i]*Math.sqrt(i/X)+a[L+i]*Math.sqrt(1-i/X);
  let mean=0; for(let i=0;i<L;i++) mean+=out[i]; mean/=L;
  let s=0, pk=0; for(let i=0;i<L;i++){ out[i]-=mean; s+=out[i]*out[i]; }
  for(let i=0;i<L;i++) pk=Math.max(pk,Math.abs(out[i]));
  const g=Math.min(0.12/Math.sqrt(s/L+1e-12),0.95/(pk+1e-9));
  for(let i=0;i<L;i++) out[i]*=g;
  return out;
}
function wavBlob(x,R){
  const n=x.length, b=new ArrayBuffer(44+n*2), v=new DataView(b), W=(o,s)=>{ for(let i=0;i<s.length;i++) v.setUint8(o+i,s.charCodeAt(i)); };
  W(0,'RIFF'); v.setUint32(4,36+n*2,true); W(8,'WAVE'); W(12,'fmt '); v.setUint32(16,16,true); v.setUint16(20,1,true); v.setUint16(22,1,true);
  v.setUint32(24,R,true); v.setUint32(28,R*2,true); v.setUint16(32,2,true); v.setUint16(34,16,true); W(36,'data'); v.setUint32(40,n*2,true);
  for(let i=0;i<n;i++) v.setInt16(44+i*2,Math.round(clamp(x[i],-1,1)*32767),true);
  return new Blob([b],{ type:'audio/wav' });
}
async function addNatureSounds(btn){
  const add=document.getElementById('soundAdd'); if(!add){ alert('The sound library was not found on this page.'); return; }
  btn.disabled=true; const old=btn.textContent; btn.textContent='Making the sounds… (a few seconds)'; await tick0();
  let have=new Set(); try{ have=new Set((await idbAll('sounds')).map(r=>r.name)); }catch{}
  const R=22050, files=[];
  try{
    for(const [k,name] of NATURE){
      if(have.has(name)) continue;
      btn.textContent='Making: '+name+'…'; await tick0();
      files.push(new File([wavBlob(natureSound(k,R,240),R)],name+'.wav',{ type:'audio/wav' }));
    }
  }finally{ btn.disabled=false; btn.textContent=old; }
  if(!files.length){ alert('The nature sounds are already in your sound library. Choose one under "Background sound".'); return; }
  const dt=new DataTransfer(); files.forEach(f=>dt.items.add(f));
  add.files=dt.files; add.dispatchEvent(new Event('change',{ bubbles:true }));
}

/* ---------- finding the speaker's own words ---------- */
const NUM={ '1':'one','2':'two','3':'three','4':'four','5':'five','6':'six','7':'seven','8':'eight','9':'nine','10':'ten' };
const norm=w=>{ const x=String(w).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\u0600-\u06ff]/g,''); return NUM[x]||x; };
function near(a,b){
  if(!a || !b) return false; if(a===b) return true;
  if(a.length>=4 && b.length>=4 && (a.startsWith(b) || b.startsWith(a))) return true;
  if(a.length<4 || Math.abs(a.length-b.length)>1) return false;
  let i=0, j=0, d=0;
  while(i<a.length && j<b.length){ if(a[i]===b[j]){ i++; j++; continue; } if(++d>1) return false; if(a.length>b.length) i++; else if(b.length>a.length) j++; else { i++; j++; } }
  return d+(a.length-i)+(b.length-j)<=1;
}
function findSay(tok,say,from,to){
  const p=String(say||'').split(/\s+/).map(norm).filter(Boolean).slice(0,6); if(!p.length) return -1;
  let best=-1, bestSc=0; to=Math.min(tok.length,to);
  for(let i=Math.max(0,from);i<to;i++){
    let sc=0; for(let j=0;j<p.length && i+j<tok.length;j++) if(near(tok[i+j],p[j])) sc++;
    const r=sc/p.length;
    if(r>bestSc+1e-9 && (r>=0.6 || (p.length<=2 && r>=0.5))){ best=i; bestSc=r; if(r===1) break; }
  }
  return best;
}

/* ---------- better word timing: spread words over the voiced parts only ---------- */
function refineWords(words,buf){
  if(!buf || !words || !words.length) return words || [];
  const R=buf.sampleRate, F=Math.max(1,Math.round(R*0.02)), n=Math.floor(buf.length/F), d=buf.getChannelData(0);
  if(n<10) return words;
  const env=new Float32Array(n);
  for(let i=0;i<n;i++){ let s=0; for(let j=i*F,e=j+F;j<e;j++) s+=d[j]*d[j]; env[i]=Math.sqrt(s/F); }
  const sorted=Float32Array.from(env).sort(), noise=sorted[Math.floor(n*0.1)]||0, loud=sorted[Math.floor(n*0.95)]||0;
  if(!(loud>noise*1.5)) return words.map(w=>({ ...w }));
  const thr=noise+(loud-noise)*0.08, out=words.map(w=>({ ...w }));
  let a=0;
  for(let i=0;i<out.length;i++){
    if(i<out.length-1 && Math.abs(out[i+1].s-out[i].e)<=1e-4) continue;
    const seg=out.slice(a,i+1), S=seg[0].s, E=seg[seg.length-1].e; a=i+1;
    const f0=Math.max(0,Math.floor(S*R/F)), f1=Math.min(n,Math.ceil(E*R/F)), vl=[];
    for(let f=f0;f<f1;f++) if(env[f]>thr) vl.push(f);
    if(vl.length<3 || E-S<0.2) continue;
    const T=fr=>vl[Math.min(vl.length-1,Math.max(0,Math.floor(fr*vl.length)))]*F/R;
    for(const w of seg){ const fs=(w.s-S)/(E-S), fe=(w.e-S)/(E-S); w.s=T(fs); w.e=Math.max(w.s+0.05,T(Math.min(0.999,fe))); }
  }
  return out;
}

/* ---------- clean voice: remove steady noise (generator, fan, hum, hiss) ---------- */
function highPass(x,R,fc){
  const w0=2*Math.PI*fc/R, cs=Math.cos(w0), al=Math.sin(w0)/(2*0.7071), a0=1+al;
  const b0=(1+cs)/2/a0, b1=-(1+cs)/a0, b2=b0, a1=-2*cs/a0, a2=(1-al)/a0;
  let x1=0,x2=0,y1=0,y2=0;
  for(let i=0;i<x.length;i++){ const v=x[i], y=b0*v+b1*x1+b2*x2-a1*y1-a2*y2; x2=x1; x1=v; y2=y1; y1=y; x[i]=y; }
}
function fft(re,im){
  const n=re.length;
  for(let i=1,j=0;i<n;i++){ let bit=n>>1; for(;j&bit;bit>>=1) j^=bit; j^=bit; if(i<j){ let t=re[i]; re[i]=re[j]; re[j]=t; t=im[i]; im[i]=im[j]; im[j]=t; } }
  for(let len=2;len<=n;len<<=1){
    const ang=-2*Math.PI/len, wr=Math.cos(ang), wi=Math.sin(ang), half=len>>1;
    for(let i=0;i<n;i+=len){
      let cr=1, ci=0;
      for(let k=0;k<half;k++){
        const a=i+k, b=a+half, tr=re[b]*cr-im[b]*ci, ti=re[b]*ci+im[b]*cr;
        re[b]=re[a]-tr; im[b]=im[a]-ti; re[a]+=tr; im[a]+=ti;
        const nr=cr*wr-ci*wi; ci=cr*wi+ci*wr; cr=nr;
      }
    }
  }
}
function denoise(x){
  const N=1024, Hp=512, B=N/2+1, n=x.length; if(n<N*8) return x;
  const pad=new Float32Array(n+2*N); pad.set(x,N);
  const L=pad.length, frames=Math.floor((L-N)/Hp)+1;
  const win=new Float64Array(N); for(let i=0;i<N;i++) win[i]=Math.sqrt(0.5-0.5*Math.cos(2*Math.PI*i/N));
  const en=new Float64Array(frames);
  for(let f=0;f<frames;f++){ let s=0; const o=f*Hp; for(let i=0;i<N;i++){ const v=pad[o+i]; s+=v*v; } en[f]=s; }
  const idx=[]; for(let f=0;f<frames;f++) if(en[f]>1e-9) idx.push(f);
  if(idx.length<16) return x;
  idx.sort((p,q)=>en[p]-en[q]);
  const quiet=idx.slice(0,clamp(Math.round(idx.length*0.1),8,400));
  const re=new Float64Array(N), im=new Float64Array(N), np=new Float64Array(B);
  for(const f of quiet){ const o=f*Hp; for(let i=0;i<N;i++){ re[i]=pad[o+i]*win[i]; im[i]=0; } fft(re,im); for(let k=0;k<B;k++) np[k]+=re[k]*re[k]+im[k]*im[k]; }
  for(let k=0;k<B;k++) np[k]/=quiet.length;
  const out=new Float32Array(L), prev=new Float64Array(B).fill(1), beta=2.0, floor=0.2;
  for(let f=0;f<frames;f++){
    const o=f*Hp;
    for(let i=0;i<N;i++){ re[i]=pad[o+i]*win[i]; im[i]=0; }
    fft(re,im);
    for(let k=0;k<B;k++){
      const p=re[k]*re[k]+im[k]*im[k];
      let g=p>0 ? 1-beta*np[k]/p : 0; g=g>0 ? Math.sqrt(g) : 0; if(g<floor) g=floor;
      if(g<prev[k]) g=0.5*g+0.5*prev[k];
      prev[k]=g;
      re[k]*=g; im[k]*=g;
      if(k>0 && k<N/2){ re[N-k]*=g; im[N-k]*=g; }
    }
    for(let i=0;i<N;i++) im[i]=-im[i];
    fft(re,im);
    for(let i=0;i<N;i++) out[o+i]+=re[i]/N*win[i];
  }
  return out.slice(N,N+n);
}
function voiceSrc(media){
  const raw=media.raw, nc=raw.numberOfChannels;
  if(!isOn('peClean')) return Array.from({ length:nc },(_,c)=>raw.getChannelData(c));
  if(!media._peClean){
    const m=new Float32Array(raw.length);
    for(let c=0;c<nc;c++){ const d=raw.getChannelData(c); for(let i=0;i<d.length;i++) m[i]+=d[i]/nc; }
    try{ highPass(m,raw.sampleRate,80); media._peClean=denoise(m); }catch(e){ console.warn('Clean voice skipped',e); media._peClean=m; }
  }
  return Array.from({ length:nc },()=>media._peClean);
}

/* ---------- pauses, mistakes, wrongly heard words and a quiet voice ---------- */
const FILLERS=new Set(['um','uh','erm','er','ah','uhm','hmm','mm','umm','uhh']);
let EDIT=null, lastClick=-1, hearing=null;
function levelVoice(buf){
  const nc=buf.numberOfChannels, F=Math.max(1,Math.round(buf.sampleRate*0.05)), n=Math.floor(buf.length/F);
  if(n<4) return;
  const chans=[]; for(let c=0;c<nc;c++) chans.push(buf.getChannelData(c));
  const e=new Float32Array(n);
  for(let i=0;i<n;i++){ let s=0; for(const d of chans){ for(let j=i*F,k=j+F;j<k;j++) s+=d[j]*d[j]; } e[i]=s/(F*nc); }
  const sorted=Float32Array.from(e).sort(), top=sorted.subarray(Math.floor(n*0.4));
  let s=0; for(const v of top) s+=v; const rms=Math.sqrt(s/top.length);
  if(!(rms>1e-5)) return;
  const g=clamp(0.1/rms,0.5,8);
  for(const d of chans) for(let i=0;i<d.length;i++){ let x=d[i]*g; const ax=Math.abs(x); if(ax>0.85) x=Math.sign(x)*(0.85+0.15*Math.tanh((ax-0.85)/0.15)); d[i]=x; }
}
function findPauses(buf){
  const R=buf.sampleRate, F=Math.max(1,Math.round(R*0.02)), n=Math.floor(buf.length/F), nc=buf.numberOfChannels;
  if(n<10) return [];
  const ch=[]; for(let c=0;c<nc;c++) ch.push(buf.getChannelData(c));
  const env=new Float32Array(n);
  for(let i=0;i<n;i++){ let s=0; for(const d of ch){ for(let j=i*F,e=j+F;j<e;j++) s+=d[j]*d[j]; } env[i]=Math.sqrt(s/(F*nc)); }
  const sorted=Float32Array.from(env).sort(), noise=sorted[Math.floor(n*0.1)], loud=sorted[Math.floor(n*0.95)];
  if(!(loud>noise*1.5)) return [];
  const thr=noise+(loud-noise)*0.1, fr=F/R, out=[];
  let a=-1;
  for(let i=0;i<=n;i++){
    const quiet=i<n && env[i]<=thr;
    if(quiet && a<0) a=i;
    else if(!quiet && a>=0){ const len=(i-a)*fr; if(len>=0.35) out.push({ a:a*fr, b:Math.min(buf.duration,i*fr), lead:a===0, tail:i>=n }); a=-1; }
  }
  return out;
}
function findRetakes(tok,words){
  const out=[];
  for(let i=0;i<tok.length-3;i++){
    if(!tok[i] || !tok[i+1] || !tok[i+2] || !(tok[i].length>=4 || tok[i+1].length>=4 || tok[i+2].length>=4)) continue;
    for(let j=i+2;j<=Math.min(tok.length-3,i+20);j++){
      if(tok[j]===tok[i] && tok[j+1]===tok[i+1] && tok[j+2]===tok[i+2] && words[j].s-words[i].s<12){ out.push([i,j-1]); i=j-1; break; }
    }
  }
  return out;
}
function cutRanges(E,dur){
  const W=E.words, n=W.length, rem=[];
  for(const p of E.pauses){
    if(!p.remove) continue;
    if(p.lead){ rem.push([0,Math.max(0,p.b-0.1)]); continue; }
    if(p.tail){ rem.push([Math.min(dur,p.a+0.3),dur]); continue; }
    const a=p.a+0.06, b=p.b-0.06; if(b-a>0.05) rem.push([a,b]);
  }
  for(const k of E.cut){ if(k<0 || k>=n) continue; const s=Math.max(0,W[k].s-0.03), e=Math.min(dur,(k+1<n ? W[k+1].s : W[k].e+0.15)-0.03); if(e>s) rem.push([s,e]); }
  rem.sort((x,y)=>x[0]-y[0]);
  const merged=[]; for(const r of rem){ const l=merged[merged.length-1]; if(l && r[0]<=l[1]+0.05) l[1]=Math.max(l[1],r[1]); else merged.push(r.slice()); }
  const keep=[]; let st=0;
  for(const [a,b] of merged){ if(a-st>=0.05) keep.push([st,a]); st=Math.max(st,b); }
  if(dur-st>=0.05) keep.push([st,dur]);
  return keep.length ? keep : [[0,dur]];
}
function buildCut(E,raw,src){
  const R=raw.sampleRate, nc=raw.numberOfChannels, samples=cutRanges(E,raw.duration).map(([a,b])=>[Math.floor(a*R),Math.min(raw.length,Math.floor(b*R))]);
  let total=0; for(const [s,e] of samples) total+=Math.max(0,e-s);
  const out=new AudioBuffer({ length:Math.max(1,total), numberOfChannels:nc, sampleRate:R }), fade=Math.round(R*0.008), segs=[];
  let pos=0;
  for(const [s,e] of samples){
    const len=e-s; if(len<=0) continue; const f=Math.min(fade,Math.floor(len/2));
    for(let c=0;c<nc;c++){ const dst=out.getChannelData(c); dst.set(src[c].subarray(s,e),pos); for(let k=0;k<f;k++){ const g=k/f; dst[pos+k]*=g; dst[pos+len-1-k]*=g; } }
    segs.push({ o:pos/R, s:s/R, e:e/R }); pos+=len;
  }
  try{ levelVoice(out); }catch(e){ console.warn(e); }
  const map=t=>{ for(const g of segs){ if(t<g.s) return g.o; if(t<=g.e) return g.o+(t-g.s); } return out.duration; };
  const words=[]; E.words.forEach((w,i)=>{ if(E.cut.has(i)) return; const s=map(w.s); words.push({ t:w.t, s, e:Math.max(s+0.05,map(w.e)) }); });
  return { buf:out, segs, words };
}
function fullBuf(raw,src){
  const nc=raw.numberOfChannels, out=new AudioBuffer({ length:raw.length, numberOfChannels:nc, sampleRate:raw.sampleRate });
  for(let c=0;c<nc;c++) out.getChannelData(c).set(src[c]);
  try{ levelVoice(out); }catch(e){ console.warn(e); }
  return out;
}
export function useRaw(media){ if(!media || !media.buf) return; if(!media.raw) media.raw=media.buf; if(media.buf!==media.raw){ media.buf=media.raw; media.dur=media.raw.duration; } }
export function tighten(media){ useRaw(media); return false; }
export function cutWords(media,words,on){
  if(!media || !media.buf) return words;
  useRaw(media);
  mediaRef={ id:media.id, media };
  const raw=media.raw, refined=refineWords(words,raw);
  if(!EDIT || EDIT.id!==media.id || EDIT.n!==words.length){
    const tok=refined.map(w=>norm(w.t)), cut=new Set();
    tok.forEach((t,i)=>{ if(FILLERS.has(t)) cut.add(i); });
    let retakes=0; for(const [a,b] of findRetakes(tok,refined)){ retakes++; for(let k=a;k<=b;k++) cut.add(k); }
    EDIT={ id:media.id, n:words.length, words:refined, pauses:findPauses(raw).map(p=>({ ...p, remove:true })), cut, retakes, fix:new Map() };
  }else EDIT.words=refined;
  for(const [i,txt] of EDIT.fix) if(EDIT.words[i]) EDIT.words[i]={ ...EDIT.words[i], t:txt };
  EDIT.media=media; EDIT.on=!!on;
  showEditor();
  const src=voiceSrc(media);
  if(!on){
    const b=fullBuf(raw,src); media.buf=b; media.dur=b.duration;
    cutState={ id:media.id, segs:null, words:EDIT.words };
    return EDIT.words.map(w=>({ ...w }));
  }
  const r=buildCut(EDIT,raw,src);
  media.buf=r.buf; media.dur=r.buf.duration;
  cutState={ id:media.id, segs:r.segs, words:r.words };
  return r.words.map(w=>({ ...w }));
}

/* the "Pauses, mistakes and wrong words" box */
function showEditor(){
  if(!document.getElementById('peCutStyle')){
    const st=document.createElement('style'); st.id='peCutStyle';
    st.textContent='#peCutBox .pe-chips{display:flex;flex-wrap:wrap;gap:4px;max-height:260px;overflow:auto;padding:6px;border:1px solid var(--line);border-radius:8px;background:var(--panel);line-height:1.5}'
      +'#peCutBox .pe-w{cursor:pointer;padding:1px 4px;border-radius:5px;font-size:13px;user-select:none}#peCutBox .pe-w:hover{background:var(--panel-2)}'
      +'#peCutBox .pe-w.fix{color:var(--accent);text-decoration:underline dotted}'
      +'#peCutBox .pe-w.off{text-decoration:line-through;color:#ff6b6b;opacity:.8}'
      +'#peCutBox .pe-p{cursor:pointer;font-size:11px;padding:1px 7px;border-radius:99px;border:1px solid var(--ok);color:var(--ok);user-select:none}'
      +'#peCutBox .pe-p.off{border-color:#ff6b6b;color:#ff6b6b;text-decoration:line-through}';
    document.head.appendChild(st);
  }
  let box=document.getElementById('peCutBox');
  if(!box){
    const anchor=(document.getElementById('tightOn') && document.getElementById('tightOn').closest('label')) || document.getElementById('mediaInfo');
    if(!anchor) return;
    box=document.createElement('div'); box.id='peCutBox'; box.className='box';
    anchor.insertAdjacentElement('afterend',box);
    box.addEventListener('click',onEditorClick);
    box.addEventListener('dblclick',onEditorDbl);
  }
  box.classList.remove('hidden');
  drawEditor();
}
function drawEditor(){
  const box=document.getElementById('peCutBox'); if(!box || !EDIT) return;
  const E=EDIT, W=E.words, raw=E.media && E.media.raw, dur=raw ? raw.duration : 0;
  const keep=raw && E.on ? cutRanges(E,dur) : [[0,dur]], newLen=keep.reduce((s,[a,b])=>s+(b-a),0);
  const offP=E.pauses.filter(p=>p.remove), pSec=offP.reduce((s,p)=>s+(p.b-p.a),0);
  const before=new Map();
  E.pauses.forEach((p,k)=>{ let wi=W.findIndex(w=>w.s>=p.b-0.15); if(wi<0) wi=W.length; if(!before.has(wi)) before.set(wi,[]); before.get(wi).push(k); });
  let chips='';
  for(let i=0;i<=W.length;i++){
    for(const k of before.get(i)||[]){ const p=E.pauses[k]; chips+='<span class="pe-p'+(p.remove ? ' off' : '')+'" data-p="'+k+'" title="Click to '+(p.remove ? 'keep' : 'remove')+' this pause">⏸ '+(p.b-p.a).toFixed(1)+'s</span>'; }
    if(i<W.length) chips+='<span class="pe-w'+(E.fix.has(i) ? ' fix' : '')+(E.cut.has(i) ? ' off' : '')+'" data-w="'+i+'" title="Click: remove or keep · Double-click: correct this word">'+escH(W[i].t)+'</span>';
  }
  const summary=E.on
    ? 'Removing '+offP.length+' pause'+(offP.length===1 ? '' : 's')+' ('+pSec.toFixed(1)+' s) and '+E.cut.size+' word'+(E.cut.size===1 ? '' : 's')+(E.retakes ? ' (including '+E.retakes+' repeated tr'+(E.retakes===1 ? 'y' : 'ies')+')' : '')+'. New length about <b>'+mmss(newLen)+'</b> (was '+mmss(dur)+').'
    : 'Cutting is off, so nothing is removed. Tick "✂️ Cut pauses…" above to remove the red parts.';
  box.innerHTML='<div class="label" style="margin:0">✂️ Pauses, mistakes and wrong words</div>'
    +'<div class="ptext" style="margin:0">'+summary+'<br>Red = removed. <b>Click</b> a pause or word to keep or remove it. To remove a whole sentence, click its first word, then <b>Shift + click</b> its last word. <b>Double-click</b> a wrongly heard word to type the right one'+(E.fix.size ? ' ('+E.fix.size+' corrected so far)' : '')+'.</div>'
    +'<div class="row"><button class="mini" data-a="allp">Remove all pauses</button><button class="mini" data-a="nonep">Keep all pauses</button><button class="mini" data-a="words">Restore all words</button></div>'
    +'<div class="pe-chips">'+chips+'</div>'
    +'<div class="row"><button class="mini" data-a="hear">'+(hearing ? '■ Stop' : '▶ Hear the result')+'</button><button class="mini" data-a="make">✨ Apply and make my video</button></div>';
}
function hear(){
  if(hearing){ try{ hearing.src.stop(); }catch{} try{ hearing.ctx.close(); }catch{} hearing=null; drawEditor(); return; }
  const E=EDIT; if(!E || !E.media || !E.media.raw) return;
  const src=voiceSrc(E.media), buf=E.on ? buildCut(E,E.media.raw,src).buf : fullBuf(E.media.raw,src), ctx=new AudioContext(), s=ctx.createBufferSource();
  s.buffer=buf; s.connect(ctx.destination);
  s.onended=()=>{ if(hearing && hearing.src===s){ try{ ctx.close(); }catch{} hearing=null; drawEditor(); } };
  s.start(); hearing={ ctx, src:s }; drawEditor();
}
function onEditorClick(e){
  const E=EDIT; if(!E) return;
  if(e.detail>1) return;
  const p=e.target.closest('[data-p]'), w=e.target.closest('[data-w]'), a=e.target.closest('[data-a]');
  if(p){ const k=+p.dataset.p; E.pauses[k].remove=!E.pauses[k].remove; drawEditor(); return; }
  if(w){
    const i=+w.dataset.w;
    clearTimeout(onEditorClick.t);
    onEditorClick.t=setTimeout(()=>{
      if(e.shiftKey && lastClick>=0){ const x=Math.min(lastClick,i), y=Math.max(lastClick,i), off=!E.cut.has(i); for(let k=x;k<=y;k++){ if(off) E.cut.add(k); else E.cut.delete(k); } }
      else{ if(E.cut.has(i)) E.cut.delete(i); else E.cut.add(i); }
      lastClick=i; drawEditor();
    },260);
    return;
  }
  if(a){
    const act=a.dataset.a;
    if(act==='allp'){ E.pauses.forEach(q=>{ q.remove=true; }); drawEditor(); }
    else if(act==='nonep'){ E.pauses.forEach(q=>{ q.remove=false; }); drawEditor(); }
    else if(act==='words'){ E.cut.clear(); drawEditor(); }
    else if(act==='hear') hear();
    else if(act==='make'){ if(hearing) hear(); const b=document.getElementById('oneBtn'); if(b) b.click(); }
  }
}
function onEditorDbl(e){
  const E=EDIT; if(!E) return;
  const w=e.target.closest('[data-w]'); if(!w) return;
  e.preventDefault(); clearTimeout(onEditorClick.t);
  const i=+w.dataset.w, cur=E.words[i] ? E.words[i].t : '';
  const v=prompt('Type the correct word (you can type more than one word):',cur);
  if(v==null) return;
  const t=v.trim().replace(/\s+/g,' ');
  if(!t || !E.words[i]) return;
  E.fix.set(i,t); E.words[i]={ ...E.words[i], t };
  drawEditor();
}
function srcAt(segs,t){
  if(!segs || !segs.length) return { s:t, k:0 };
  let lo=0, hi=segs.length-1;
  while(lo<hi){ const mid=(lo+hi+1)>>1; if(segs[mid].o<=t) lo=mid; else hi=mid-1; }
  return { s:segs[lo].s+Math.max(0,t-segs[lo].o), k:lo };
}

/* ---------- soft sound effects (made by code, mixed into your voice track) ---------- */
const SFXG=0.3;
function synthSfx(k,R){
  const len=Math.round(R*({ whoosh:0.45, pop:0.09, tick:0.035, swish:0.3, scribble:1.2 }[k]||0.2)), out=new Float32Array(len);
  if(k==='pop'){
    let ph=0;
    for(let i=0;i<len;i++){ const t=i/R, f=900*Math.exp(-t*25)+300; ph+=2*Math.PI*f/R; out[i]=Math.sin(ph)*Math.min(1,i/(R*0.002))*Math.exp(-t*45)*0.5; }
  }else if(k==='tick'){
    let lp=0;
    for(let i=0;i<len;i++){ const t=i/R, w=Math.random()*2-1; lp+=0.5*(w-lp); out[i]=(w-lp)*Math.exp(-t*220)*0.6+Math.sin(2*Math.PI*2200*t)*Math.exp(-t*160)*0.25; }
  }else if(k==='scribble'){
    let lp=0, hp=0, rate=5.5;
    for(let i=0;i<len;i++){
      const t=i/R, p=i/len, w=Math.random()*2-1;
      lp+=0.45*(w-lp); hp+=0.06*(lp-hp);
      if(i%Math.round(R*0.25)===0) rate=4.5+Math.random()*3;
      const env=Math.pow(Math.max(0,Math.sin(2*Math.PI*rate*t)),2)*Math.min(1,p*8)*Math.min(1,(1-p)*6);
      out[i]=(lp-hp)*env*0.32;
    }
  }else{
    let low=0, band=0;
    for(let i=0;i<len;i++){
      const p=i/len, fc=k==='whoosh' ? 300+2200*Math.sin(Math.PI*p) : 1200+3000*p, f=2*Math.sin(Math.PI*Math.min(fc,R/6)/R), w=Math.random()*2-1;
      low+=f*band; const high=w-low-0.6*band; band+=f*high;
      out[i]=band*Math.pow(Math.sin(Math.PI*Math.pow(p,k==='whoosh' ? 0.7 : 0.5)),2)*(k==='whoosh' ? 0.55 : 0.35);
    }
  }
  return out;
}
function sfxEvents(res){
  const ev=[];
  res.forEach((s,i)=>{
    if(i>0 && !(s.layout==='presenter' && res[i-1].layout==='presenter') && !(s.layout==='board' && res[i-1].layout==='board')) ev.push({ t:s.t0, k:'whoosh' });
    for(const e of s.elements){
      if(e.tIn!=null){
        if(e.type==='item') ev.push({ t:e.tIn, k:s.layout==='board' ? 'scribble' : 'pop' });
        else if(e.type==='sketch') ev.push({ t:e.tIn, k:'scribble' });
        else if(e.tIn>s.t0+0.5) ev.push({ t:e.tIn, k:s.layout==='board' ? 'scribble' : 'swish' });
      }
      if(e.tStrike!=null) ev.push({ t:e.tStrike, k:'tick' });
      if(e.tHi!=null) ev.push({ t:e.tHi, k:'swish' });
    }
  });
  ev.sort((a,b)=>a.t-b.t);
  const out=[]; for(const e of ev){ const l=out[out.length-1]; if(!l || e.t-l.t>=0.15) out.push(e); }
  return out;
}
function applySfx(media,ev){
  const buf=media.buf; if(!buf) return;
  const R=buf.sampleRate, nc=buf.numberOfChannels, chans=[]; for(let c=0;c<nc;c++) chans.push(buf.getChannelData(c));
  const st=media._peSfx;
  if(st && st.buf===buf){ for(const a of st.adds) for(const d of chans){ for(let i=0;i<a.data.length && a.at+i<d.length;i++) d[a.at+i]-=a.data[i]*SFXG; } }
  const adds=[], cache={};
  for(const e of ev){
    const data=cache[e.k]||(cache[e.k]=synthSfx(e.k,R)), at=Math.max(0,Math.round(e.t*R));
    for(const d of chans){ for(let i=0;i<data.length && at+i<d.length;i++) d[at+i]+=data[i]*SFXG; }
    adds.push({ at, data });
  }
  media._peSfx={ buf, adds };
}

/* ---------- numbered points the speaker says ("step one", "first", "second"…) ---------- */
const ORD={ one:1, first:1, firstly:1, two:2, second:2, secondly:2, three:3, third:3, thirdly:3, four:4, fourth:4, fourthly:4, five:5, fifth:5, six:6, sixth:6, seven:7, seventh:7 };
const ORDW=new Set(['first','firstly','second','secondly','third','thirdly','fourth','fourthly','fifth','sixth','seventh']);
const KEYW=new Set(['step','number','point','tip','reason','rule','benefit','habit','way','lesson','thing','key','sign','mistake','pillar','stage','part']);
const FILL=new Set(['is','to','you','we','i','should','must','the','a','an','and','then','just','will','can','so','well','okay','ok','um','uh','its']);
const EMPH=new Set(['important','importantly','never','always','must','secret','biggest','best','worst','remember','warning','mistake','mistakes','danger','dangerous','everything','nothing','only','truth','powerful','exactly','stop','listen','free','guaranteed','imagine','problem','solution','results','missed','lose','losing']);
function detectMarkers(words,tok){
  const out=[];
  for(let i=0;i<tok.length;i++){
    const w=tok[i], prevEnd=i===0 || /[.!?,:;]["')\]]*$/.test(String(words[i-1].t));
    if(KEYW.has(w.replace(/s$/,'')) && ORD[tok[i+1]]){ out.push({ i, ord:ORD[tok[i+1]], from:i+2 }); i++; continue; }
    if(ORDW.has(w) && prevEnd){ out.push({ i, ord:ORD[w], from:i+1 }); continue; }
    if((w==='finally' || w==='lastly') && prevEnd) out.push({ i, ord:-1, from:i+1 });
  }
  return out;
}
function pointText(words,from){
  const out=[];
  for(let k=from;k<Math.min(words.length,from+8) && out.length<5;k++){
    const raw=String(words[k].t), clean=raw.replace(/[^\p{L}\p{N}'\-\s]/gu,'');
    if(!clean.trim()) continue;
    if(!out.length && FILL.has(clean.trim().toLowerCase())){ if(/[.!?;]["')\]]*$/.test(raw)) break; continue; }
    out.push(clean.trim());
    if(/[.!?;]["')\]]*$/.test(raw) || (out.length>=2 && /,$/.test(raw))) break;
  }
  if(!out.length) return '';
  const s=out.join(' '); return s[0].toUpperCase()+s.slice(1);
}
function enforceLists(sc,words,tok,ws){
  const mk=detectMarkers(words,tok); if(!mk.length) return;
  const groups=[]; let g=null;
  for(const m of mk){
    const t=ws(m.i); let ord=m.ord;
    if(ord===-1){ if(g && t-g.tl<45) ord=g.last+1; else continue; }
    if(g && ord===g.last+1 && t-g.tl<45){ g.list.push({ ...m, ord, t }); g.last=ord; g.tl=t; }
    else if(ord===1){ g={ list:[{ ...m, ord, t }], last:1, tl:t }; groups.push(g); }
    else g=null;
  }
  const sceneAtT=t=>{ for(let q=sc.length-1;q>=0;q--) if(t>=sc[q].t0) return q; return 0; };
  for(const gr of groups){
    if(gr.list.length<2) continue;
    const counts=new Map(); gr.list.forEach(p=>{ const k=sceneAtT(p.t); counts.set(k,(counts.get(k)||0)+1); });
    let best=-1, bs=-1; for(const [k,c] of counts){ const s=c*2+(ITEMISH.includes(sc[k].layout) ? 3 : 0); if(s>bs){ bs=s; best=k; } }
    const s=sc[best];
    if(!ITEMISH.includes(s.layout)){ if(['presenter','lower-third','top-third'].includes(s.layout)) s.layout='side-card'; else continue; }
    const first=gr.list[0].t, prev=sc[best-1];
    if(best>0 && first<s.t0+0.2 && first-0.15>prev.t0+1.5) s.t0=Math.min(s.t0,first-0.15);
    const lastT=gr.list[gr.list.length-1].t, nx=sc[best+1], nn=sc[best+2];
    if(nx && lastT>nx.t0-1.2){ const want=lastT+1.6; if(!nn || want<nn.t0-1.2) nx.t0=want; }
    const its=s.elements.filter(e=>e.type==='item'), used=new Set(), pts=gr.list.map(p=>({ ...p, item:null }));
    for(const p of pts){ let bi=null, bd=2.5; for(const e of its){ if(used.has(e) || !e.found) continue; const d=Math.abs(e.tIn-p.t); if(d<bd){ bd=d; bi=e; } } if(bi){ used.add(bi); p.item=bi; } }
    const spare=its.filter(e=>!used.has(e) && !e.found);
    for(const p of pts){ if(!p.item && spare.length){ p.item=spare.shift(); used.add(p.item); } }
    for(const p of pts){ if(!p.item) p.item={ type:'item', text:pointText(words,p.from) || ('Point '+p.ord), color:'', icon:'', draw:'', tIn:0, tStrike:null, tHi:null, found:true }; p.item.tIn=p.t; }
    const keep=its.filter(e=>!used.has(e) && e.found);
    s.elements=[...s.elements.filter(e=>e.type!=='item'),...[...pts.map(p=>p.item),...keep].sort((a,b)=>a.tIn-b.tIn)];
  }
}

/* ---------- the plan ---------- */
const chunk=(words,a,b)=>words.slice(Math.max(0,a),Math.max(0,b)).map(w=>String(w.t).replace(/[.,!?;:"]+$/,'')).join(' ');
function autoTheme(topic){ let h=0; for(const ch of String(topic||'storyforge')) h=(h*31+ch.charCodeAt(0))>>>0; return LIGHT[h%LIGHT.length]; }
function simplePlan(words,topic){
  const n=words.length, S=[], at=f=>clamp(Math.floor(n*f),0,n-1), title=(topic || chunk(words,0,5)).slice(0,40);
  S.push({ layout:'presenter', startWord:0, elements:[] });
  if(n>=8) S.push({ layout:'lower-third', startWord:at(0.06), elements:[{ type:'eyebrow', text:"Today's topic" },{ type:'title', text:title, trigger:at(0.08) }] });
  if(n>=30) S.push({ layout:'presenter', startWord:at(0.3), elements:[] });
  if(n>=15) S.push({ layout:'endcard', startWord:at(0.88), elements:[{ type:'eyebrow', text:'Up next' },{ type:'title', text:'Thanks for watching' },{ type:'source', text:'Follow for more' },{ type:'cta', text:'Watch next video →' }] });
  return { theme:autoTheme(topic), scenes:S };
}
function planPrompt(words,topic,board){
  const boardLine=board==='off' ? '' :
    '- "board": a whiteboard where a hand quickly draws simple line pictures while the speaker talks; the speaker is shown small in a circle. Elements: an optional "title" (2 to 5 words) and 1 to 4 "sketch" elements. For each sketch give "draw": ONE simple, concrete English noun that a line icon can show (for example clock, money, book, water, mosque, house, phone, calendar, heart, road, sun, tree, car, briefcase, bulb, target, gift, family, user, hands, shield, chart, plane, shop, tools, wrench, pipe, truck, school), "text": a 1 to 3 word label, and "say": the first 2 to 5 words where the speaker mentions it, copied EXACTLY from the transcript.\n';
  const boardRule=board==='off' ? '' : board==='all'
    ? '9. Use the "board" layout for EVERY scene. When something concrete is mentioned, give 1 to 4 sketches; otherwise give a title and items, which the hand writes on the board.\n'
    : '9. Use the "board" layout for 2 to 4 scenes where the speaker talks about concrete things, actions or steps that can be drawn.\n';
  return 'Below is the transcript of a person speaking to the camera.\nTopic: "'+(topic||'not given')+'"\n\nTranscript:\n"""'+words.map(w=>w.t).join(' ')+'"""\n\n'
  +'Make a motion-graphics plan as JSON: {"theme":"...","hook":"...","scenes":[...]}.\n'
  +'"theme": the colours that best fit the mood of THIS topic: "classic" (cream, teal, orange), "white" (clean white and blue), "sand" (warm beige and green), "forest" (fresh green and gold), "rose" (soft rose and coral), "ocean" (light blue and orange), "night" (dark navy and gold). Prefer the light themes.\n'
  +'"hook": a short line of 3 to 7 words shown in the first 3 seconds that makes viewers curious to keep watching (a question or a clear benefit). It must NOT repeat the title of any card, and it must be true to what is said: no false promises, no exaggeration.\n'
  +'Layouts:\n'
  +'- "presenter": speaker full screen, no graphics (greetings, stories, emotional moments).\n'
  +'- "lower-third": speaker full screen + topic card at the bottom (eyebrow + title).\n'
  +'- "top-third": speaker full screen + headline card (eyebrow + title).\n'
  +'- "side-card": speaker on the left, a card on the right with a title and 2-3 items.\n'
  +'- "split": speaker framed on the right; title card and 2-3 items on the left.\n'
  +'- "split-left": speaker framed on the left; title card and 2-3 items on the right.\n'
  +'- "stack": speaker framed at the top; a title and 2-3 short chips below.\n'
  +'- "corner-list": title + 2-4 numbered items, speaker small in the corner.\n'
  +'- "list": title + 2-4 numbered items, speaker hidden.\n'
  +'- "steps": title + 2-4 connected arrow steps (items), speaker hidden; optional "source" as a footnote.\n'
  +'- "quote": a short "quote" + its "source".\n'
  +'- "stat": one big number or short word as "stat" (like "3x" or "40%") + a "title" label.\n'
  +'- "endcard": speaker framed + eyebrow ("Up next"), title, "source" as a subtitle, and "cta".\n'
  +boardLine
  +'Each scene has "layout", "startSay" (the first 2 to 5 words of the scene, copied EXACTLY from the transcript) and "elements".\n'
  +'Element fields: "type" = eyebrow | title | item | quote | source | stat | cta'+(board==='off' ? '' : ' | sketch')+'. "text" = what is shown on screen, 2 to 6 words, never a full sentence. For every "title" also give "accent": the 1 or 2 most important words of that title (copied from its text), shown in colour. For EVERY item, sketch, quote and stat also give "say": the first 2 to 5 words the speaker says for that point, copied EXACTLY from the transcript. Optional: "icon" (one emoji that fits, for items), "color" ("a" or "b"), "strikeSay" (words copied exactly from where the speaker rejects that item; it gets crossed out), "highlightSay" (words copied exactly from where the speaker says it is the answer or the result; it gets highlighted).\n'
  +'Rules:\n'
  +'1. EVERY point, benefit, problem, option or step the speaker lists MUST be its own item (or sketch on a board), in the order spoken, inside the scene where it is spoken. If the speaker says step one, step two and step three, there must be three, and the scene must start at or before "step one". Never skip or merge points.\n'
  +'2. Copy "startSay", "say", "strikeSay" and "highlightSay" EXACTLY as written in the transcript, even where the transcript has a mistake.\n'
  +'3. The on-screen "text" and the "hook" SHOULD fix obvious listening mistakes of the transcript (for example "work off fajr" is surely "Wake up for Fajr").\n'
  +'4. A scene\'s items and sketches must be spoken after its startSay and before the next scene\'s startSay.\n'
  +'5. Choose layouts from what is being said, and vary them: never the same layout twice in a row (except presenter and board); use at least 4 different layouts in a video longer than 40 seconds.\n'
  +'6. Begin with "presenter" or "lower-third". End with "endcard" if the speaker closes or mentions a next video.\n'
  +'7. Each scene lasts at least 3 seconds.\n'
  +'8. Never write Quran verses or hadith word for word. Never draw faces, prophets, angels or anything sacred as a picture.\n'
  +boardRule
  +'Reply with JSON only.';
}
const PLAN_SCHEMA={ type:'OBJECT', properties:{ theme:{ type:'STRING' }, hook:{ type:'STRING' }, scenes:{ type:'ARRAY', items:{ type:'OBJECT', properties:{ layout:{ type:'STRING' }, startSay:{ type:'STRING' }, elements:{ type:'ARRAY', items:{ type:'OBJECT', properties:{ type:{ type:'STRING' }, text:{ type:'STRING' }, accent:{ type:'STRING' }, say:{ type:'STRING' }, draw:{ type:'STRING' }, icon:{ type:'STRING' }, color:{ type:'STRING' }, strikeSay:{ type:'STRING' }, highlightSay:{ type:'STRING' } }, required:['type','text'] } } }, required:['layout','startSay','elements'] } } }, required:['scenes'] };
const PLAN_SHAPE='{"theme":"classic","hook":"...","scenes":[{"layout":"...","startSay":"...","elements":[{"type":"title","text":"...","accent":"..."},{"type":"item","text":"...","say":"...","icon":"..."},{"type":"sketch","draw":"clock","text":"...","say":"..."}]}]}';

function resolvePlan(plan,words){
  const n=words.length;
  if(!n) return [{ layout:'presenter', t0:0, elements:[] }];
  const tok=words.map(w=>norm(w.t)), has=k=>k!=null && k!=='' && Number.isFinite(+k), ws=i=>Math.max(0,words[clamp(i,0,n-1)].s-0.12), endT=words[n-1].e;
  const raw=(plan && Array.isArray(plan.scenes) ? plan.scenes : []).filter(Boolean), sc=[];
  let cursor=0;
  for(const s of raw){
    let at=-1;
    if(s.startSay) at=findSay(tok,s.startSay,cursor,n);
    if(at<0 && has(s.startWord)) at=clamp(Math.round(+s.startWord),cursor,n-1);
    if(at<0){ const e0=(Array.isArray(s.elements) ? s.elements : []).find(e=>e && e.say); if(e0) at=findSay(tok,e0.say,cursor,n); }
    if(at<0) continue;
    if(sc.length && at===sc[sc.length-1].w) sc.pop();
    sc.push({ layout:LAYOUTS.includes(s.layout) ? s.layout : 'presenter', w:at, raw:Array.isArray(s.elements) ? s.elements : [] });
    cursor=at;
  }
  if(!sc.length || sc[0].w>0) sc.unshift({ layout:'presenter', w:0, raw:[] });
  sc.forEach((s,i)=>{ s.t0=i ? Math.max(ws(s.w),sc[i-1].t0+0.8) : 0; });
  sc.forEach((s,i)=>{
    const w1=i<sc.length-1 ? sc[i+1].w : n, lim=Math.min(n,w1+4);
    let cur=s.w; const els=[];
    for(const e of s.raw){
      if(!e || !e.type || !String(e.text||e.draw||'').trim()) continue;
      let type=String(e.type).toLowerCase(); if(type!=='sketch' && !TEXT_TYPES.includes(type)) type='item';
      const icon=e.icon ? Array.from(String(e.icon).trim()).slice(0,3).join('') : '';
      let wi=-1;
      if(e.say){ wi=findSay(tok,e.say,cur,lim); if(wi<0) wi=findSay(tok,e.say,s.w,lim); }
      if(wi<0 && has(e.trigger)) wi=clamp(Math.round(+e.trigger),0,n-1);
      if(wi>=0 && (type==='item' || type==='sketch')) cur=wi+1;
      const after=Math.max(s.w,wi), more=(say,num)=>{ let x=-1; if(say) x=findSay(tok,say,after,Math.min(n,w1+6)); if(x<0 && has(num)) x=clamp(Math.round(+num),0,n-1); return x; };
      const ks=more(e.strikeSay,e.strike), kh=more(e.highlightSay,e.highlight);
      els.push({ type, text:String(e.text||e.draw).trim(), draw:String(e.draw||'').trim().slice(0,40), accent:String(e.accent||'').trim(), color:/^(b|orange)$/i.test(e.color||'') ? 'b' : /^(a|teal)$/i.test(e.color||'') ? 'a' : '',
        icon:/[A-Za-z0-9]/.test(icon) ? '' : icon, found:wi>=0, tIn:wi>=0 ? ws(wi) : null, tStrike:ks>=0 ? ws(ks) : null, tHi:kh>=0 ? ws(kh) : null });
    }
    s.elements=els; delete s.raw;
  });
  enforceLists(sc,words,tok,ws);
  for(let i=1;i<sc.length;i++) sc[i].t0=Math.max(sc[i].t0,sc[i-1].t0+0.8);
  sc.forEach((s,i)=>{
    const t1=i<sc.length-1 ? sc[i+1].t0 : endT+1, lastOk=Math.max(s.t0+0.5,t1-0.6), minIn=i ? s.t0+0.35 : 0, els=s.elements;
    for(const e of els){
      if(e.tIn!=null) e.tIn=Math.max(minIn,e.tIn);
      if(!isItemish(e)){ if(e.tIn==null) e.tIn=minIn; e.tIn=Math.min(e.tIn,lastOk); }
    }
    const its=els.filter(isItemish), good=e=>e.tIn!=null && e.tIn<=lastOk;
    let k=0;
    while(k<its.length){
      if(good(its[k])){ k++; continue; }
      let j=k; while(j<its.length && !good(its[j])) j++;
      const a=k>0 ? its[k-1].tIn : minIn, b=j<its.length ? its[j].tIn : lastOk, cnt=j-k;
      for(let q=0;q<cnt;q++) its[k+q].tIn=a+(Math.max(a,b)-a)*(q+1)/(cnt+1);
      k=j;
    }
    for(let q=1;q<its.length;q++){ const gap=its[q].type==='sketch' ? 1.1 : 0.3; if(its[q].tIn<its[q-1].tIn+gap) its[q].tIn=its[q-1].tIn+gap; }
    for(const e of els){
      const top=Math.max(e.tIn+0.45,lastOk+0.3);
      if(e.tStrike!=null) e.tStrike=clamp(e.tStrike,e.tIn+0.45,top);
      if(e.tHi!=null) e.tHi=clamp(e.tHi,e.tIn+0.45,top);
    }
    const hasTitle=els.some(e=>e.type==='title'), plainItems=els.filter(e=>e.type==='item');
    if((s.layout==='list' || s.layout==='steps') && !plainItems.length) s.layout=hasTitle ? 'top-third' : 'presenter';
    if(s.layout==='quote' && !els.some(e=>e.type==='quote' || e.type==='title')) s.layout='presenter';
    if(s.layout==='stat' && !els.some(e=>e.type==='stat')) s.layout=hasTitle ? 'top-third' : 'presenter';
    if(s.layout==='board' && !els.length) s.layout='presenter';
  });
  return sc;
}
const sceneAt=(res,t)=>{ for(let k=res.length-1;k>=0;k--) if(t>=res[k].t0) return k; return 0; };

/* ---------- ✏️ whiteboard: open-source line pictures (Iconify: Tabler MIT + Lucide ISC), never faces ---------- */
const ICON_BAD=new Set(['mood','face','faces','emoji','smile','smiley','skull','ghost','alien','robot','baby','man','woman','girl','boy','mustache','beard','zombie','devil','angel','cross','church','christian','wine','beer','cocktail','martini','pig','pumpkin','halloween','santa','christmas','dice','casino','poker','music','guitar','piano','drum','trumpet','violin','saxophone','vinyl','playlist','yin','yang','kiss','lips','off','x','slash','minus','plus','question','exclamation','dashed','filled','bikini','pray']);
const SVGNS='http://www.w3.org/2000/svg';
let MEAS=null;
function measurePath(d){
  if(!MEAS){ MEAS=document.createElementNS(SVGNS,'svg'); MEAS.setAttribute('width','0'); MEAS.setAttribute('height','0'); MEAS.style.cssText='position:absolute;left:-9999px;top:-9999px;visibility:hidden'; document.body.appendChild(MEAS); }
  const p=document.createElementNS(SVGNS,'path'); p.setAttribute('d',d); MEAS.appendChild(p);
  let L=0; try{ L=p.getTotalLength(); }catch{}
  const pts=[]; const n=Math.max(2,Math.min(200,Math.ceil(L/0.6)));
  for(let i=0;i<=n;i++){ try{ const q=p.getPointAtLength(L*i/n); pts.push([q.x,q.y]); }catch{ break; } }
  p.remove();
  let p2=null; try{ p2=new Path2D(d); }catch{}
  return { L, pts, p2 };
}
function elToD(el){
  const tag=el.tagName.toLowerCase(), g=a=>parseFloat(el.getAttribute(a)||'0')||0;
  if(tag==='path') return el.getAttribute('d')||'';
  if(tag==='circle'){ const cx=g('cx'), cy=g('cy'), r=g('r'); if(!r) return ''; return 'M'+(cx-r)+' '+cy+'a'+r+' '+r+' 0 1 0 '+(2*r)+' 0a'+r+' '+r+' 0 1 0 '+(-2*r)+' 0'; }
  if(tag==='ellipse'){ const cx=g('cx'), cy=g('cy'), rx=g('rx'), ry=g('ry'); if(!rx || !ry) return ''; return 'M'+(cx-rx)+' '+cy+'a'+rx+' '+ry+' 0 1 0 '+(2*rx)+' 0a'+rx+' '+ry+' 0 1 0 '+(-2*rx)+' 0'; }
  if(tag==='line') return 'M'+g('x1')+' '+g('y1')+'L'+g('x2')+' '+g('y2');
  if(tag==='polyline' || tag==='polygon'){ const p=(el.getAttribute('points')||'').trim().split(/[\s,]+/).map(Number); let s=''; for(let i=0;i+1<p.length;i+=2) s+=(i ? 'L' : 'M')+p[i]+' '+p[i+1]; return s ? s+(tag==='polygon' ? 'Z' : '') : ''; }
  if(tag==='rect'){
    const x=g('x'), y=g('y'), w=g('width'), h=g('height'); if(!w || !h) return '';
    const r=Math.min(g('rx')||g('ry'),w/2,h/2);
    return r>0 ? 'M'+(x+r)+' '+y+'h'+(w-2*r)+'a'+r+' '+r+' 0 0 1 '+r+' '+r+'v'+(h-2*r)+'a'+r+' '+r+' 0 0 1 '+(-r)+' '+r+'h'+(-(w-2*r))+'a'+r+' '+r+' 0 0 1 '+(-r)+' '+(-r)+'v'+(-(h-2*r))+'a'+r+' '+r+' 0 0 1 '+r+' '+(-r)+'z'
      : 'M'+x+' '+y+'h'+w+'v'+h+'h'+(-w)+'z';
  }
  return '';
}
async function fetchIconRec(word){
  const q=String(word||'').toLowerCase().trim().replace(/[^a-z0-9 \-]/g,'').replace(/\s+/g,' ');
  if(!q) return null;
  const ck='forge:pe:ic2:'+q;
  try{ const c=JSON.parse(localStorage.getItem(ck)||'null'); if(c) return c.none ? null : c; }catch{}
  const tryQuery=async query=>{
    const r=await fetch('https://api.iconify.design/search?query='+encodeURIComponent(query)+'&limit=64&prefixes=tabler,lucide');
    if(!r.ok) return null;
    const j=await r.json(), dash=query.replace(/\s+/g,'-');
    const cands=(j.icons||[]).filter(id=>{ const name=id.split(':')[1]||''; return !name.split('-').some(seg=>ICON_BAD.has(seg)); });
    const score=id=>{ const [pre,name]=id.split(':'); let s=0; if(name===dash) s+=10; else if(name.startsWith(dash+'-')) s+=5; else if(name.includes(dash)) s+=2; if(pre==='tabler') s+=1; return s-name.split('-').length*0.3; };
    cands.sort((a,b)=>score(b)-score(a));
    for(const id of cands.slice(0,3)){
      const [pre,name]=id.split(':');
      try{
        const sv=await fetch('https://api.iconify.design/'+pre+'/'+name+'.svg'); if(!sv.ok) continue;
        const doc=new DOMParser().parseFromString(await sv.text(),'image/svg+xml'), svg=doc.documentElement;
        const vb=(svg.getAttribute('viewBox')||'0 0 24 24').split(/[\s,]+/).map(Number);
        const ds=[];
        svg.querySelectorAll('path,circle,ellipse,line,polyline,polygon,rect').forEach(el=>{ if(el.getAttribute('stroke')==='none' && el.getAttribute('fill')!=='currentColor') return; const d=elToD(el); if(d) ds.push(d); });
        if(ds.length) return { id, vb:vb.length===4 ? vb : [0,0,24,24], ds };
      }catch(e){ console.warn('Icon skipped',id,e); }
    }
    return null;
  };
  let rec=null;
  try{
    rec=await tryQuery(q);
    if(!rec && q.includes(' ')){ const parts=q.split(' '); rec=await tryQuery(parts[parts.length-1]) || await tryQuery(parts[0]); }
  }catch(e){ console.warn('Icon search failed',e); }
  try{ localStorage.setItem(ck,JSON.stringify(rec || { none:true })); }catch{}
  return rec;
}
function buildStrokes(rec){
  if(!rec) return null;
  const list=rec.ds.map(measurePath).filter(s=>s.p2 && s.pts.length>1);
  if(!list.length) return null;
  return { vb:rec.vb, list, total:list.reduce((a,s)=>a+Math.max(0.5,s.L),0) };
}
let DOODLE=null, CHECK=null;
function doodleStrokes(){ if(!DOODLE){ const s=measurePath('M12 3.2c5 .2 8.6 3.9 8.6 8.6 0 4.9-3.9 8.7-8.7 8.7S3.4 16.6 3.4 11.9C3.4 7.1 7 3.3 11.6 3.2'); DOODLE={ vb:[0,0,24,24], list:[s], total:Math.max(1,s.L) }; } return DOODLE; }
function checkStroke(){ if(!CHECK) CHECK=measurePath('M4 12.5l5 5 11-11'); return CHECK; }

/* drawing helpers for the board */
function handFont(ctx,fs){ ctx.font='700 '+Math.round(fs)+'px '+FONT_HAND; }
function fitHand(ctx,text,fs,maxW){ handFont(ctx,fs); while(ctx.measureText(text).width>maxW && fs>8){ fs*=0.93; handFont(ctx,fs); } return fs; }
function writeHand(ctx,text,x,y,fs,color,p,align){
  handFont(ctx,fs);
  const w=ctx.measureText(text).width, x0=align==='center' ? x-w/2 : x;
  ctx.save(); ctx.beginPath(); ctx.rect(x0-fs*0.3,y-fs*1.3,(w+fs*0.6)*clamp(p,0,1),fs*1.9); ctx.clip();
  ctx.fillStyle=color; ctx.textAlign='left'; ctx.textBaseline='alphabetic'; ctx.fillText(text,x0,y);
  ctx.restore();
  return p<1 ? [x0+w*clamp(p,0,1),y-fs*0.25] : null;
}
function strokeProgress(ctx,st,p,ox,oy,sc,color,lw){
  const target=p*st.total; let acc=0, pen=null;
  ctx.save(); ctx.translate(ox,oy); ctx.scale(sc,sc);
  ctx.lineCap='round'; ctx.lineJoin='round'; ctx.strokeStyle=color; ctx.lineWidth=lw; ctx.fillStyle='transparent';
  for(const s of st.list){
    if(acc>=target) break;
    const L=Math.max(0.5,s.L), d=Math.min(L,target-acc);
    if(d>=L-0.01){ ctx.setLineDash([]); ctx.stroke(s.p2); }
    else{
      ctx.setLineDash([d,L+50]); ctx.stroke(s.p2);
      const q=s.pts[Math.min(s.pts.length-1,Math.round(d/L*(s.pts.length-1)))];
      pen=[ox+q[0]*sc,oy+q[1]*sc];
    }
    acc+=L;
  }
  ctx.restore();
  return pen;
}
function drawSketch(ctx,e,cx,cy,size,t,lfs,m){
  const el=t-e.tIn; if(el<0) return null;
  const st=e.strokes || doodleStrokes(), vb=st.vb, sc=size/Math.max(vb[2],vb[3]);
  const ox=cx-vb[2]*sc/2-vb[0]*sc, oy=cy-vb[3]*sc/2-vb[1]*sc;
  const DD=clamp(0.6+st.total*0.008,1.0,1.8), p=clamp(el/DD,0,1);
  let pen=strokeProgress(ctx,st,easeIO(p),ox,oy,sc,INK,1.9);
  if(!e.strokes){ const fs=fitHand(ctx,e.text,size*0.2,size*0.8); const w=writeHand(ctx,e.text,cx,cy+fs*0.35,fs,C.a1,clamp((el-DD*0.6)/0.6,0,1),'center'); if(w) pen=w; return pen; }
  if(el>=DD*0.95){
    const txt=e.text, fs=fitHand(ctx,txt,lfs,size*1.25), dur=clamp(txt.length*0.045,0.35,0.9);
    const w=writeHand(ctx,txt,cx,cy+size/2+fs*1.15,fs,C.a2,clamp((el-DD*0.95)/dur,0,1),'center');
    if(w) pen=w;
  }
  return pen;
}
function drawHand(ctx,x,y,m){
  const u=m*0.0042;
  ctx.save(); ctx.translate(x,y); ctx.rotate(0.62);
  ctx.shadowColor='rgba(0,0,0,0.18)'; ctx.shadowBlur=u*4; ctx.shadowOffsetY=u*2;
  ctx.fillStyle=SLEEVE; rr(ctx,u*40,-u*6,u*40,u*30,u*8); ctx.fill();
  ctx.fillStyle=SKIN;
  ctx.beginPath(); ctx.ellipse(u*30,u*8,u*14,u*12,0.2,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(u*15,u*5,u*10,u*5.5,0.15,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(u*13,-u*4,u*7,u*3.6,-0.35,0,Math.PI*2); ctx.fill();
  ctx.shadowColor='transparent';
  ctx.fillStyle='#3A3F47'; rr(ctx,u*5,-u*3,u*30,u*6,u*2); ctx.fill();
  ctx.fillStyle=INK; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(u*6,-u*2.6); ctx.lineTo(u*6,u*2.6); ctx.closePath(); ctx.fill();
  ctx.fillStyle=SKIN;
  ctx.beginPath(); ctx.ellipse(u*17,u*1,u*8,u*4.2,0.1,0,Math.PI*2); ctx.fill();
  ctx.restore();
}
function gBoard(ctx,W,H,m,sc,t){
  const vert=W<H, pr=presRect('board',W,H);
  const ringA=sc.pb ? 1 : clamp((t-sc.t0-0.55)/0.3,0,1);
  if(ringA>0){ ctx.save(); ctx.globalAlpha*=ringA; const lw=Math.max(3,m*0.006); ctx.lineWidth=lw; ctx.strokeStyle=C.a1; ctx.beginPath(); ctx.arc(pr.x+pr.w/2,pr.y+pr.h/2,pr.w/2+lw/2,0,Math.PI*2); ctx.stroke(); ctx.restore(); }
  const ti=find(sc,'title'), sks=sc.elements.filter(e=>e.type==='sketch'), writes=sc.elements.filter(e=>e.type!=='sketch' && e.type!=='title' && e.type!=='eyebrow');
  const x0=vert ? W*0.07 : m*0.06, x1=vert ? W*0.93 : W-(pr.w+m*0.12);
  let y=vert ? H*0.13 : m*0.08, pen=null, penT=-1;
  const consider=(pt,tIn)=>{ if(pt && tIn>=penT){ pen=pt; penT=tIn; } };
  if(ti){
    const fs=fitHand(ctx,ti.text,m*(vert ? 0.082 : 0.075),x1-x0), base=y+fs;
    if(ti.tIn!=null && t>=ti.tIn){
      const dur=clamp(ti.text.length*0.045,0.5,1.3), p=clamp((t-ti.tIn)/dur,0,1), cx=(x0+x1)/2;
      consider(writeHand(ctx,ti.text,cx,base,fs,INK,p,'center'),ti.tIn);
      const up=clamp((t-ti.tIn-dur)/0.4,0,1);
      if(up>0){ handFont(ctx,fs); const w=ctx.measureText(ti.text).width; ctx.save(); ctx.strokeStyle=C.a2; ctx.lineWidth=Math.max(3,fs*0.08); ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(cx-w/2,base+fs*0.22); ctx.quadraticCurveTo(cx,base+fs*0.36,cx-w/2+w*up,base+fs*0.2); ctx.stroke(); ctx.restore(); }
    }
    y=base+fs*0.55+m*0.03;
  }
  const y1=vert ? H*0.53 : H-m*0.07;
  if(sks.length){
    const n=Math.min(4,sks.length), cols=vert ? (n===1 ? 1 : 2) : (n===4 ? 2 : n), rows=Math.ceil(n/cols), cw=(x1-x0)/cols, ch=(y1-y)/rows;
    const lfs=Math.min(m*0.05,ch*0.15), size=Math.max(m*0.06,Math.min(cw*0.66,(ch-lfs*1.8)*0.82));
    sks.slice(0,4).forEach((e,k)=>{
      if(e.tIn==null || t<e.tIn) return;
      const r=Math.floor(k/cols), inRow=Math.min(cols,n-r*cols), c=k%cols, off=(cols-inRow)*cw/2;
      const cx=x0+off+cw*(c+0.5), cy=y+ch*r+(ch-lfs*1.8)/2;
      consider(drawSketch(ctx,e,cx,cy,size,t,lfs,m),e.tIn);
    });
  }else if(writes.length){
    let fs=m*(vert ? 0.058 : 0.052);
    const lh=fs*1.55, slots=Math.max(1,Math.floor((y1-y)/lh));
    if(writes.length>slots) fs*=slots/writes.length;
    let yy=y+fs*1.1;
    for(const e of writes){
      const big=e.type==='stat', f2=big ? fs*1.9 : fs, step=big ? f2*1.2 : fs*1.55;
      if(e.tIn==null || t<e.tIn){ yy+=step; continue; }
      const el=t-e.tIn, txt=e.type==='quote' ? '\u201C'+e.text+'\u201D' : e.type==='source' ? '\u2014 '+e.text : e.text;
      let tx=x0;
      if(e.type==='item'){
        const ck=checkStroke(), s=f2/24*0.9, p=clamp(el/0.35,0,1);
        consider(strokeProgress(ctx,{ vb:[0,0,24,24], list:[ck], total:Math.max(1,ck.L) },p,x0,yy-f2*0.85,s,C.a2,2.4),e.tIn);
        tx=x0+f2*1.1;
      }
      const ff=fitHand(ctx,txt,f2,x1-tx), dur=clamp(txt.length*0.045,0.4,1.2), p=clamp((el-(e.type==='item' ? 0.3 : 0))/dur,0,1);
      consider(writeHand(ctx,txt,tx,yy,ff,e.type==='cta' || big ? C.a2 : INK,p,'left'),e.tIn+0.01);
      yy+=step;
    }
  }
  if(pen) drawHand(ctx,pen[0],pen[1],m);
}

/* ---------- reading videos frame by frame (your picture, and library videos that loop) ---------- */
async function dim(track,name){
  try{
    const g='get'+name[0].toUpperCase()+name.slice(1);
    if(typeof track[g]==='function') return +(await track[g]())||0;
    const v=track[name]; return +(typeof v==='function' ? await v.call(track) : await v)||0;
  }catch{ return 0; }
}
async function openReader(MB,blob,maxSide,loop){
  const input=new MB.Input({ source:new MB.BlobSource(blob), formats:MB.ALL_FORMATS });
  const track=await input.getPrimaryVideoTrack();
  if(!track || !(await track.canDecode())) throw new Error('cannot decode');
  const first=await track.getFirstTimestamp();
  const dur=loop ? Math.max(0.5,(await track.computeDuration())-first) : 0;
  let vw=await dim(track,'displayWidth'), vh=await dim(track,'displayHeight');
  if(!(vw>0 && vh>0)){ vw=maxSide; vh=Math.round(maxSide*9/16); }
  const s=Math.min(1,maxSide/Math.max(vw,vh)); vw=Math.max(2,Math.round(vw*s/2)*2); vh=Math.max(2,Math.round(vh*s/2)*2);
  const hold=new OffscreenCanvas(vw,vh);
  return { input, sink:new MB.CanvasSink(track,{ width:vw, height:vh, fit:'fill', poolSize:2 }), first, dur, loop, hold, hx:hold.getContext('2d'), iter:null, next:null, has:false, pos:-1 };
}
async function readFrame(c,t){
  const target=c.first+(c.loop ? (Math.max(0,t)%c.dur) : Math.max(0,t));
  if(!c.iter || target<c.pos-0.001){
    if(c.iter){ try{ await c.iter.return(); }catch{} }
    c.iter=c.sink.canvases(target); c.has=false;
    const r=await c.iter.next(); c.next=r.done ? null : r.value;
  }
  while(c.next && (!c.has || c.next.timestamp<=target+0.001)){ c.hx.drawImage(c.next.canvas,0,0); c.has=true; const r=await c.iter.next(); c.next=r.done ? null : r.value; }
  c.pos=target; return c.has ? c.hold : null;
}
async function closeReader(c){ try{ if(c && c.iter) await c.iter.return(); }catch{} try{ c && c.input.dispose?.(); }catch{} }

/* ---------- "My background library": pictures and videos (a different random choice for every video) ---------- */
async function libraryRecords(){
  try{
    const all=await idbAll('bgs');
    return { imgs:shuffle(all.filter(b=>b && b.type==='img')), vids:shuffle(all.filter(b=>b && b.type==='vid')) };
  }catch{ return { imgs:[], vids:[] }; }
}
async function decodeImages(recs,count){
  const out=[];
  for(const b of recs){
    if(out.length>=count) break;
    try{ let bmp=await createImageBitmap(b.blob); if(bmp.width>1600){ const b2=await createImageBitmap(bmp,{ resizeWidth:1600, resizeQuality:'medium' }); bmp.close(); bmp=b2; } out.push(bmp); }catch{}
  }
  return out;
}

/* ---------- Google MediaPipe tools (free, run in the browser): background cutter + face finder ---------- */
async function loadVision(){
  if(VIS) return VIS;
  for(const ver of ['@0.10.14','@0.10.3']){
    const base='https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision'+ver;
    let lib=null;
    for(const u of [base+'/vision_bundle.mjs',base,base+'/+esm']){
      try{ const V=await import(u); lib=V.FilesetResolver ? V : (V.default && V.default.FilesetResolver ? V.default : null); if(lib) break; }catch{}
    }
    if(!lib) continue;
    try{ const files=await lib.FilesetResolver.forVisionTasks(base+'/wasm'); VIS={ lib, files }; return VIS; }catch(e){ console.warn(e); }
  }
  throw new Error('the vision tools could not load');
}
async function loadSegmenter(){
  const { lib, files }=await loadVision();
  const models=['https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite',
    'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite'];
  for(const model of models) for(const delegate of ['GPU','CPU']){
    try{ return await lib.ImageSegmenter.createFromOptions(files,{ baseOptions:{ modelAssetPath:model, delegate }, runningMode:'IMAGE', outputCategoryMask:false, outputConfidenceMasks:true }); }
    catch(e){ console.warn('Segmenter '+delegate,e); }
  }
  throw new Error('the background cutter could not load');
}
async function loadFaceDetector(){
  if(FD) return FD;
  const { lib, files }=await loadVision();
  const model='https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite';
  for(const delegate of ['GPU','CPU']){
    try{ FD=await lib.FaceDetector.createFromOptions(files,{ baseOptions:{ modelAssetPath:model, delegate }, runningMode:'IMAGE', minDetectionConfidence:0.5 }); return FD; }
    catch(e){ console.warn('Face finder '+delegate,e); }
  }
  throw new Error('the face finder could not load');
}
async function findFace(clip,segs,dur){
  let fd; try{ fd=await loadFaceDetector(); }catch(e){ console.warn(e); return null; }
  const cv=document.createElement('canvas'), cx=cv.getContext('2d'), boxes=[];
  for(let k=0;k<7;k++){
    const t=Math.max(0,dur)*(0.1+0.8*k/6); let f=null;
    try{ f=await readFrame(clip,srcAt(segs,t).s); }catch{}
    if(!f) continue;
    const sc=Math.min(1,640/f.width); cv.width=Math.max(2,Math.round(f.width*sc)); cv.height=Math.max(2,Math.round(f.height*sc));
    cx.drawImage(f,0,0,cv.width,cv.height);
    try{
      const r=fd.detect(cv), d=((r && r.detections) || []).map(x=>x.boundingBox).filter(Boolean).sort((a,b)=>b.width*b.height-a.width*a.height)[0];
      if(d) boxes.push({ x:d.originX/cv.width, y:d.originY/cv.height, w:d.width/cv.width, h:d.height/cv.height });
    }catch(e){ console.warn(e); }
  }
  if(!boxes.length) return null;
  const med=k=>{ const a=boxes.map(b=>b[k]).sort((p,q)=>p-q); return a[a.length>>1]; };
  const x=med('x'), y=med('y'), w=med('w'), h=med('h');
  const fx=Math.max(0,x-w*0.12), fy=Math.max(0,y-h*0.45);
  return { x:fx, y:fy, w:Math.min(1-fx,w*1.24), h:Math.min(1-fy,h*1.6), cx:x+w/2, cy:y+h*0.45 };
}
/* edge refinement ("guided filter"): makes the cut-out follow the real edges of your hair, ears and shoulders */
function boxMean(src,w,h,r,out,S){
  const W1=w+1;
  for(let x=0;x<=w;x++) S[x]=0;
  for(let y=1;y<=h;y++){ let row=0; S[y*W1]=0; const o=(y-1)*w; for(let x=1;x<=w;x++){ row+=src[o+x-1]; S[y*W1+x]=S[(y-1)*W1+x]+row; } }
  for(let y=0;y<h;y++){
    const y0=Math.max(0,y-r), y1=Math.min(h,y+r+1);
    for(let x=0;x<w;x++){ const x0=Math.max(0,x-r), x1=Math.min(w,x+r+1); out[y*w+x]=(S[y1*W1+x1]-S[y0*W1+x1]-S[y1*W1+x0]+S[y0*W1+x0])/((y1-y0)*(x1-x0)); }
  }
}
function guided(I,p,w,h,r,eps,G){
  const n=w*h;
  for(let i=0;i<n;i++) G.tmp[i]=I[i]*I[i];
  boxMean(I,w,h,r,G.mI,G.S); boxMean(p,w,h,r,G.mp,G.S); boxMean(G.tmp,w,h,r,G.II,G.S);
  for(let i=0;i<n;i++) G.tmp[i]=I[i]*p[i];
  boxMean(G.tmp,w,h,r,G.Ip,G.S);
  for(let i=0;i<n;i++){ const mI=G.mI[i], v=G.II[i]-mI*mI, cv=G.Ip[i]-mI*G.mp[i], a=cv/(v+eps); G.a[i]=a; G.b[i]=G.mp[i]-a*mI; }
  boxMean(G.a,w,h,r,G.mI,G.S); boxMean(G.b,w,h,r,G.mp,G.S);
  for(let i=0;i<n;i++) G.q[i]=G.mI[i]*I[i]+G.mp[i];
  return G.q;
}
function computeMask(frame){
  const S=SEG, fw=frame.width, fh=frame.height;
  if(!S.inCanvas || S.fw!==fw || S.fh!==fh){
    S.fw=fw; S.fh=fh; S.mw=512; S.mh=Math.max(2,Math.round(512*fh/fw));
    const n=S.mw*S.mh, mk=(w,h)=>{ const c=document.createElement('canvas'); c.width=w; c.height=h; return c; };
    S.inCanvas=mk(S.mw,S.mh); S.ictx=S.inCanvas.getContext('2d',{ willReadFrequently:true });
    S.maskCanvas=mk(S.mw,S.mh); S.mctx=S.maskCanvas.getContext('2d');
    S.inv=mk(S.mw,S.mh); S.vctx=S.inv.getContext('2d');
    S.tint=mk(S.mw,S.mh); S.tctx=S.tint.getContext('2d');
    S.img=S.mctx.createImageData(S.mw,S.mh); S.invImg=S.vctx.createImageData(S.mw,S.mh);
    S.I=new Float32Array(n); S.p=new Float32Array(n); S.prevP=null; S.prevI=null; S.invert=null;
    const F=()=>new Float32Array(n);
    S.gf={ mI:F(), mp:F(), II:F(), Ip:F(), a:F(), b:F(), tmp:F(), q:F(), S:new Float64Array((S.mw+1)*(S.mh+1)) };
  }
  S.ictx.drawImage(frame,0,0,S.mw,S.mh);
  let data=null, multi=false;
  S.seg.segment(S.inCanvas,res=>{ const ms=res && res.confidenceMasks; if(ms && ms.length){ if(ms.length>=6){ multi=true; data=ms[0].getAsFloat32Array().slice(); } else data=ms[ms.length-1].getAsFloat32Array().slice(); } });
  const n=S.mw*S.mh;
  if(!data || data.length!==n) return false;
  if(multi) S.invert=true;
  else if(S.invert==null){
    const avg=(x0,x1,y0,y1)=>{ let s=0,c=0; for(let y=Math.floor(S.mh*y0);y<Math.floor(S.mh*y1);y++) for(let x=Math.floor(S.mw*x0);x<Math.floor(S.mw*x1);x++){ s+=data[y*S.mw+x]; c++; } return c ? s/c : 0; };
    S.invert=avg(0.4,0.6,0.4,0.8) < (avg(0,0.1,0,0.15)+avg(0.9,1,0,0.15))/2;
  }
  const p=S.p, I=S.I, px=S.ictx.getImageData(0,0,S.mw,S.mh).data;
  for(let i=0,o=0;i<n;i++,o+=4){ p[i]=S.invert ? 1-data[i] : data[i]; I[i]=(0.299*px[o]+0.587*px[o+1]+0.114*px[o+2])/255; }
  if(S.prevP){ for(let i=0;i<n;i++){ const d=Math.abs(I[i]-S.prevI[i]), a=d>0.1 ? 1 : 0.35+d*6.5; p[i]=p[i]*a+S.prevP[i]*(1-a); } }
  else{ S.prevP=new Float32Array(n); S.prevI=new Float32Array(n); }
  S.prevP.set(p); S.prevI.set(I);
  const q=guided(I,p,S.mw,S.mh,Math.max(2,Math.round(S.mw/100)),0.0025,S.gf);
  const mk=S.img.data, iv=S.invImg.data;
  for(let i=0,o=0;i<n;i++,o+=4){
    let v=clamp((q[i]-0.3)/0.4,0,1); v=v*v*(3-2*v);
    mk[o]=255; mk[o+1]=255; mk[o+2]=255; mk[o+3]=Math.round(v*255);
    const b=clamp(1-q[i]*4,0,1);
    iv[o]=255; iv[o+1]=255; iv[o+2]=255; iv[o+3]=Math.round(b*255);
  }
  S.mctx.putImageData(S.img,0,0); S.vctx.putImageData(S.invImg,0,0);
  return true;
}

/* ---------- drawing helpers ---------- */
function rr(ctx,x,y,w,h,r){
  r=Math.max(0,Math.min(r,w/2,h/2)); ctx.beginPath();
  if(ctx.roundRect) ctx.roundRect(x,y,w,h,r);
  else{ ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
}
const font=(ctx,w,fs)=>{ ctx.font=w+' '+Math.round(fs)+'px '+FONT; };
function wrapLines(ctx,text,maxW){ const ws=String(text).split(/\s+/).filter(Boolean), lines=[]; let line=''; for(const w of ws){ const t=line ? line+' '+w : w; if(ctx.measureText(t).width>maxW && line){ lines.push(line); line=w; } else line=t; } if(line) lines.push(line); return lines.length ? lines : ['']; }
function fit(ctx,text,w,size,maxW,maxLines){
  let fs=size;
  for(;;){
    font(ctx,w,fs); const lines=wrapLines(ctx,text,maxW), wide=lines.some(l=>ctx.measureText(l).width>maxW);
    if(lines.length===1 && !wide) return { fs, lines };
    if(fs>size*0.8){ fs*=0.95; continue; }
    if(lines.length<=maxLines && !wide) return { fs, lines };
    if(fs<size*0.45) return { fs, lines:lines.slice(0,maxLines) };
    fs*=0.93;
  }
}
const hexv=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16));
function mix(a,b,p){ const x=hexv(a), y=hexv(b); return '#'+x.map((v,i)=>Math.round(v+(y[i]-v)*clamp(p,0,1)).toString(16).padStart(2,'0')).join(''); }
function rgba(hex,a){ return 'rgba('+hexv(hex).join(',')+','+a+')'; }
function spacing(ctx,px){ try{ ctx.letterSpacing=px; }catch{} }
function eyebrow(ctx,text,x,y,fs){ font(ctx,'700',fs); spacing(ctx,Math.round(fs*0.08)+'px'); ctx.fillStyle=C.a2; ctx.textBaseline='alphabetic'; ctx.fillText(String(text).toUpperCase(),x,y); spacing(ctx,'0px'); }
const find=(sc,type)=>sc.elements.find(e=>e.type===type);
const items=sc=>sc.elements.filter(e=>e.type==='item');
const colorOf=(el,k)=>el.color==='b' ? C.a2 : el.color==='a' ? C.a1 : (k%2 ? C.a2 : C.a1);
function enter(e,t,m){ if(!e || e.tIn==null) return null; const d=t-e.tIn; if(d<0) return null; const p=easeOut(clamp(d/0.45,0,1)); return { a:p, dx:(1-p)*40*m/1080 }; }
function marker(ctx,x,y,r,el,k,override){
  if(el.icon){ ctx.save(); ctx.font=Math.round(r*2.3)+'px '+EMOJI; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle='#000'; ctx.fillText(el.icon,x,y+r*0.08); ctx.restore(); return; }
  ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fillStyle=override || colorOf(el,k); ctx.fill();
}
function coverDraw(ctx,im,r){ const s=Math.max(r.w/im.width,r.h/im.height), w=im.width*s, h=im.height*s; ctx.drawImage(im,r.x+(r.w-w)/2,r.y+(r.h-h)/2,w,h); }
function fitFrame(r,fw,fh,look,z,face){
  const wide=1+(look.fuller||0), s0=Math.max(r.w/(fw*wide),r.h/fh), dw0=fw*s0*wide, dh0=fh*s0, x0=r.x+(r.w-dw0)/2, y0=r.y+(r.h-dh0)*0.15;
  if(!(z>1)) return { x:x0, y:y0, dw:dw0, dh:dh0 };
  const fx=face ? face.cx : 0.5, fy=face ? face.cy : 0.35, px=x0+fx*dw0, py=y0+fy*dh0, dw=dw0*z, dh=dh0*z;
  return { x:clamp(px-fx*dw,r.x+r.w-dw,r.x), y:clamp(py-fy*dh,r.y+r.h-dh,r.y), dw, dh };
}

/* ---------- what goes behind you ---------- */
function drawStudio(ctx,st,r,frame,x,y,dw,dh,look,t,which){
  const m=Math.min(r.w,r.h);
  ctx.save();
  if(st==='blur' && look.maskOk && look.cpx && SEG && SEG.inv){
    const cp=look.cpc, c=look.cpx;
    c.setTransform(1,0,0,1,0,0); c.globalAlpha=1; c.filter='none'; c.globalCompositeOperation='source-over'; c.clearRect(0,0,cp.width,cp.height);
    c.drawImage(frame,x,y,dw,dh); c.globalCompositeOperation='destination-in'; c.drawImage(SEG.inv,x,y,dw,dh); c.globalCompositeOperation='source-over';
    look.avgN=(look.avgN||0)+1;
    if(!look.avg || look.avgN%15===0){ try{ const o=look.onex; o.clearRect(0,0,1,1); o.drawImage(cp,0,0,1,1); const d=o.getImageData(0,0,1,1).data; if(d[3]>0) look.avg='rgb('+d[0]+','+d[1]+','+d[2]+')'; }catch{} }
    ctx.fillStyle=look.avg||'#3a3a3a'; ctx.fillRect(r.x,r.y,r.w,r.h);
    ctx.filter='blur('+Math.max(6,Math.round(m*0.12))+'px) brightness(0.92)'; ctx.drawImage(cp,0,0);
    ctx.filter='blur('+Math.max(2,Math.round(m*0.025))+'px) brightness(0.92)'; ctx.drawImage(cp,0,0); ctx.drawImage(cp,0,0);
    ctx.restore(); return;
  }
  if(st==='room' || st==='blur'){
    ctx.filter=st==='blur' ? 'blur('+Math.max(2,Math.round(m*0.025))+'px) brightness(0.92)' : (look.filter || 'none');
    const g=st==='blur' ? 0.04 : 0;
    ctx.drawImage(frame,x-dw*g,y-dh*g,dw*(1+2*g),dh*(1+2*g));
    ctx.restore(); return;
  }
  if(st==='libvideo'){
    const vf=which==='prev' ? look.vfPrev : look.vf;
    if(vf){ ctx.filter='blur('+Math.max(1,Math.round(m*0.005))+'px)'; coverDraw(ctx,vf,r); ctx.restore(); return; }
  }
  if((st==='library' || st==='libvideo') && look.pics && look.pics.length){
    const im=look.pics[look.sceneIdx%look.pics.length];
    ctx.filter='blur('+Math.max(1,Math.round(m*0.006))+'px)'; coverDraw(ctx,im,r);
    ctx.restore(); return;
  }
  const deep=mix(C.a1,'#000000',0.55), mid=mix(C.a1,'#000000',0.15), acc2=C.a2, light=mix(C.a2,'#FFFFFF',0.55);
  const g=ctx.createLinearGradient(r.x,r.y,r.x+r.w*0.3,r.y+r.h); g.addColorStop(0,mid); g.addColorStop(1,deep);
  ctx.fillStyle=g; ctx.fillRect(r.x,r.y,r.w,r.h);
  if(!BUB){ let s=11; const rnd=()=>{ s=(s*16807)%2147483647; return s/2147483647; }; BUB=Array.from({ length:16 },()=>({ a:rnd()*6.283, d:0.15+rnd()*0.45, rr:0.04+rnd()*0.13, sp:(rnd()<0.5 ? -1 : 1)*(0.04+rnd()*0.08), w:rnd() })); }
  if(st==='rays'){
    const cx=r.x+r.w*0.5, cy=r.y+r.h*0.32, len=Math.hypot(r.w,r.h);
    ctx.translate(cx,cy); ctx.rotate(t*0.07); ctx.fillStyle=rgba(light,0.07);
    for(let k=0;k<12;k++){ const a0=k*Math.PI/6; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(a0-0.09)*len,Math.sin(a0-0.09)*len); ctx.lineTo(Math.cos(a0+0.09)*len,Math.sin(a0+0.09)*len); ctx.closePath(); ctx.fill(); }
    const rg=ctx.createRadialGradient(0,0,0,0,0,m*0.6); rg.addColorStop(0,rgba(light,0.3)); rg.addColorStop(1,rgba(light,0));
    ctx.fillStyle=rg; ctx.fillRect(-len,-len,len*2,len*2);
  }else if(st==='waves'){
    for(let k=0;k<3;k++){
      const cx=r.x+r.w*(0.5+0.35*Math.sin(t*0.18+k*2.1)), cy=r.y+r.h*(0.5+0.3*Math.cos(t*0.14+k*1.7)), rad=m*(0.55+0.1*k), col=k===1 ? acc2 : light;
      const rg=ctx.createRadialGradient(cx,cy,0,cx,cy,rad); rg.addColorStop(0,rgba(col,0.26)); rg.addColorStop(1,rgba(col,0));
      ctx.fillStyle=rg; ctx.fillRect(r.x,r.y,r.w,r.h);
    }
  }else{
    for(const b of BUB){
      const ang=b.a+t*b.sp, cx=r.x+r.w*(0.5+b.d*Math.cos(ang)), cy=r.y+r.h*(0.45+b.d*0.8*Math.sin(ang)), rad=m*b.rr, col=b.w<0.5 ? light : acc2;
      const rg=ctx.createRadialGradient(cx,cy,0,cx,cy,rad); rg.addColorStop(0,rgba(col,0.28)); rg.addColorStop(0.7,rgba(col,0.12)); rg.addColorStop(1,rgba(col,0));
      ctx.fillStyle=rg; ctx.beginPath(); ctx.arc(cx,cy,rad,0,Math.PI*2); ctx.fill();
    }
  }
  ctx.restore();
}
function drawVideo(ctx,frame,r,look,t){
  const m=Math.min(r.w,r.h), F=fitFrame(r,frame.width,frame.height,look,look.zoom||1,look.face), x=F.x, y=F.y, dw=F.dw, dh=F.dh;
  if(r.r>1){ ctx.save(); ctx.shadowColor='rgba(0,0,0,0.3)'; ctx.shadowBlur=m*0.05; ctx.shadowOffsetY=m*0.012; rr(ctx,r.x,r.y,r.w,r.h,r.r); ctx.fillStyle=C.card; ctx.fill(); ctx.restore(); }
  ctx.save(); rr(ctx,r.x,r.y,r.w,r.h,r.r); ctx.clip();
  const cut=look.maskOk && SEG && SEG.maskCanvas && (look.studio!=='room' || (look.p<1 && look.studioPrev!=='room'));
  if(!cut){
    ctx.filter=look.filter || 'none'; ctx.drawImage(frame,x,y,dw,dh);
    if(look.soft){ ctx.globalAlpha*=look.soft; ctx.filter=look.softFilter; ctx.drawImage(frame,x,y,dw,dh); }
    ctx.restore(); return;
  }
  const bc=look.bc, bx=look.bx;
  bx.setTransform(1,0,0,1,0,0); bx.globalAlpha=1; bx.globalCompositeOperation='source-over'; bx.filter='none'; bx.clearRect(0,0,bc.width,bc.height);
  if(look.p<1 && look.studioPrev!==look.studio){ drawStudio(bx,look.studioPrev,r,frame,x,y,dw,dh,look,t,'prev'); bx.globalAlpha=look.p; }
  drawStudio(bx,look.studio,r,frame,x,y,dw,dh,look,t,'cur'); bx.globalAlpha=1;
  const pc=look.pc, px=look.px;
  px.setTransform(1,0,0,1,0,0); px.globalCompositeOperation='source-over'; px.globalAlpha=1; px.filter='none'; px.clearRect(0,0,pc.width,pc.height);
  px.filter=look.filter || 'none'; px.drawImage(frame,x,y,dw,dh);
  if(look.soft){ px.globalAlpha=look.soft; px.filter=look.softFilter; px.drawImage(frame,x,y,dw,dh); px.globalAlpha=1; }
  px.filter='blur('+Math.max(1,Math.round(m*0.0015))+'px)'; px.globalCompositeOperation='destination-in'; px.drawImage(SEG.maskCanvas,x,y,dw,dh);
  px.globalCompositeOperation='source-atop'; px.globalAlpha=0.12; px.filter='blur('+Math.max(2,Math.round(m*0.03))+'px)'; px.drawImage(bc,0,0);
  px.globalAlpha=1; px.filter='none'; px.globalCompositeOperation='source-over';
  if(look.mx && (look.n++)%12===0){
    try{
      const mx=look.mx; mx.clearRect(0,0,32,18); mx.drawImage(bc,0,0,32,18); const bd=mx.getImageData(0,0,32,18).data;
      mx.clearRect(0,0,32,18); mx.drawImage(pc,0,0,32,18); const pd=mx.getImageData(0,0,32,18).data;
      let bs=0,bn=0,ps=0,pn=0;
      for(let i=0;i<bd.length;i+=4){ if(bd[i+3]>200){ bs+=lum(bd,i); bn++; } if(pd[i+3]>200){ ps+=lum(pd,i); pn++; } }
      if(bn>20 && pn>20 && bs>0){ const want=clamp((ps/pn)/(bs/bn)*1.08,0.6,1.2); look.bgGain=look.bgGain==null ? want : look.bgGain*0.7+want*0.3; }
    }catch{}
  }
  const designed=look.studio!=='room' && look.studio!=='blur', gain=designed && look.bgGain ? look.bgGain : 1;
  ctx.save(); ctx.filter='blur('+Math.max(1,Math.round(m*0.004))+'px) brightness('+gain.toFixed(3)+')'; ctx.drawImage(bc,0,0); ctx.restore();
  if(look.glow && designed){
    const tc=SEG.tctx; tc.globalCompositeOperation='source-over'; tc.clearRect(0,0,SEG.mw,SEG.mh);
    tc.fillStyle=mix(C.a1,'#FFFFFF',0.45); tc.fillRect(0,0,SEG.mw,SEG.mh);
    tc.globalCompositeOperation='destination-in'; tc.drawImage(SEG.maskCanvas,0,0); tc.globalCompositeOperation='source-over';
    ctx.save(); ctx.filter='blur('+Math.max(8,Math.round(m*0.07))+'px)'; ctx.globalAlpha*=0.25; ctx.drawImage(SEG.tint,x-dw*0.03,y-dh*0.035,dw*1.06,dh*1.06); ctx.restore();
  }
  ctx.drawImage(pc,0,0);
  if(look.lx){
    const lw=look.lw, lx=look.lx;
    lx.setTransform(1,0,0,1,0,0); lx.globalAlpha=1; lx.globalCompositeOperation='source-over'; lx.filter='none'; lx.clearRect(0,0,lw.width,lw.height);
    lx.filter='blur('+Math.max(2,Math.round(m*0.012))+'px)'; lx.drawImage(SEG.inv,x,y,dw,dh);
    lx.filter='none'; lx.globalCompositeOperation='destination-in'; lx.drawImage(SEG.maskCanvas,x,y,dw,dh);
    lx.globalCompositeOperation='source-in'; lx.filter='blur('+Math.max(2,Math.round(m*0.01))+'px) brightness('+gain.toFixed(3)+')'; lx.drawImage(bc,0,0);
    lx.filter='none'; lx.globalCompositeOperation='source-over';
    ctx.save(); ctx.globalAlpha*=designed ? 0.5 : 0.3; ctx.drawImage(lw,0,0); ctx.restore();
  }
  const cx=r.x+r.w/2, cy=r.y+r.h*0.45, vg=ctx.createRadialGradient(cx,cy,Math.min(r.w,r.h)*0.35,cx,cy,Math.hypot(r.w,r.h)*0.6);
  vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,0.2)'); ctx.fillStyle=vg; ctx.fillRect(r.x,r.y,r.w,r.h);
  ctx.restore();
}
function presRect(L,W,H){
  const m=Math.min(W,H), vert=W<H, r=m*0.044;
  switch(L){
    case 'presenter': case 'lower-third': case 'top-third': return { x:0, y:0, w:W, h:H, r:0 };
    case 'side-card': return vert ? { x:0, y:0, w:W, h:H*0.55, r:0 } : { x:0, y:0, w:W*0.6, h:H, r:0 };
    case 'split': return vert ? { x:W*0.06, y:m*0.06, w:W*0.88, h:H*0.40, r } : { x:W*0.50, y:H*0.14, w:W*0.45, h:H*0.72, r };
    case 'split-left': return vert ? { x:W*0.06, y:m*0.06, w:W*0.88, h:H*0.40, r } : { x:W*0.05, y:H*0.14, w:W*0.45, h:H*0.72, r };
    case 'stack': return vert ? { x:W*0.06, y:m*0.06, w:W*0.88, h:H*0.44, r } : { x:W*0.25, y:H*0.05, w:W*0.50, h:H*0.50, r };
    case 'corner-list': return vert ? { x:W*0.55, y:H*0.75, w:W*0.39, h:H*0.21, r } : { x:W*0.66, y:H*0.48, w:W*0.29, h:H*0.44, r };
    case 'endcard': return vert ? { x:W*0.08, y:m*0.06, w:W*0.84, h:H*0.40, r } : { x:m*0.07, y:H*0.16, w:W*0.44, h:H*0.68, r };
    case 'board': { if(vert){ const s=m*0.30; return { x:(W-s)/2, y:H*0.555, w:s, h:s, r:s/2 }; } const s=m*0.34; return { x:W-m*0.05-s, y:H-m*0.05-s-BAR_H, w:s, h:s, r:s/2 }; }
  }
  return null;
}
const bgOf=L=>L==='steps' ? C.band : L==='board' ? BOARD_BG : C.bg;
function paintBg(ctx,W,H,L,idx,pics,alpha,t){
  if(alpha<=0) return;
  const m=Math.min(W,H), col=bgOf(L);
  ctx.save(); ctx.globalAlpha=alpha;
  if(L==='board'){
    ctx.fillStyle=BOARD_BG; ctx.fillRect(0,0,W,H);
    const g=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.35,W/2,H/2,Math.hypot(W,H)*0.6); g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,'rgba(0,0,0,0.07)');
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
    ctx.globalAlpha=alpha*0.05; ctx.strokeStyle='#5B6573'; ctx.lineWidth=Math.max(2,m*0.004); ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(W*0.08,H*0.93); ctx.quadraticCurveTo(W*0.3,H*0.9,W*0.55,H*0.94); ctx.stroke();
    ctx.restore(); return;
  }
  if(pics && pics.length){
    const im=pics[idx%pics.length], s=Math.max(W/im.width,H/im.height), dw=im.width*s, dh=im.height*s;
    ctx.drawImage(im,(W-dw)/2,(H-dh)/2,dw,dh); ctx.globalAlpha=alpha*0.8; ctx.fillStyle=col; ctx.fillRect(0,0,W,H);
    ctx.restore(); return;
  }
  ctx.fillStyle=col; ctx.fillRect(0,0,W,H);
  const a1=L==='steps' ? C.onBand : C.a1, a2=L==='steps' ? C.onBand : C.a2, style=idx%4;
  if(style===1){
    for(let k=0;k<6;k++){ const ang=t*0.06+k*1.047, cx=W/2+Math.cos(ang)*W*0.32, cy=H/2+Math.sin(ang)*H*0.3, rad=m*(0.18+0.06*(k%3)); ctx.globalAlpha=alpha*0.07; ctx.fillStyle=k%2 ? a2 : a1; ctx.beginPath(); ctx.arc(cx,cy,rad,0,Math.PI*2); ctx.fill(); }
  }else if(style===2){
    const g=ctx.createLinearGradient(0,0,W,H); g.addColorStop(0,rgba(col,0)); g.addColorStop(1,rgba(a1,0.12)); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  }else if(style===3){
    const step=m*0.05, off=(t*m*0.01)%step; ctx.globalAlpha=alpha*0.08; ctx.fillStyle=L==='steps' ? C.onBand : C.ink;
    for(let yy=-step+off;yy<H+step;yy+=step) for(let xx=-step+off;xx<W+step;xx+=step){ ctx.beginPath(); ctx.arc(xx,yy,m*0.003,0,Math.PI*2); ctx.fill(); }
  }
  ctx.restore();
}
function topicCard(ctx,m,x,y,maxW,ey,ti,a,dx,o={}){
  const pad=m*0.035, efs=m*0.026, T=fit(ctx,ti ? ti.text : '','800',m*0.058,maxW-pad*2,2);
  font(ctx,'800',T.fs); let tw=0; if(ti) for(const l of T.lines) tw=Math.max(tw,ctx.measureText(l).width);
  let ew=0; if(ey){ font(ctx,'700',efs); spacing(ctx,Math.round(efs*0.08)+'px'); ew=ctx.measureText(String(ey.text).toUpperCase()).width; spacing(ctx,'0px'); }
  const w=Math.min(maxW,Math.max(tw,ew)+pad*2), h=pad*1.6+(ey ? efs*1.5 : 0)+(ti ? T.lines.length*T.fs*1.12 : 0);
  topicCard.w=w;
  if(a>0){
    if(o.bottom) y-=h;
    if(o.center) x=(o.center-w)/2;
    ctx.save(); ctx.globalAlpha*=a; ctx.translate(dx,0);
    rr(ctx,x,y,w,h,m*0.022); ctx.fillStyle=C.dark; ctx.fill();
    let yy=y+pad*0.8;
    if(ey){ yy+=efs; eyebrow(ctx,ey.text,x+pad,yy,efs); yy+=efs*0.5; }
    if(ti){ font(ctx,'800',T.fs); ctx.textBaseline='alphabetic'; for(const l of T.lines){ yy+=T.fs; richLine(ctx,l,x+pad,yy,'left',C.darkText,C.a2,acc(ti)); yy+=T.fs*0.12; } }
    ctx.restore();
  }
  return h;
}
function bulletList(ctx,m,x,y,maxW,list,t,fs0,gap,ink){
  list.forEach((b,k)=>{
    const e=enter(b,t,m); if(!e) return;
    const by=y+k*gap;
    ctx.save(); ctx.globalAlpha*=e.a; ctx.translate(e.dx,0);
    marker(ctx,x+m*0.022,by,m*0.022,b,k);
    const F=fit(ctx,b.text,'500',fs0,maxW-m*0.1,1); font(ctx,'500',F.fs);
    ctx.fillStyle=ink; ctx.textBaseline='middle'; ctx.fillText(F.lines[0],x+m*0.1,by);
    ctx.restore();
  });
}
function chip(ctx,m,x,y,w,h,it,k,e){
  ctx.save(); ctx.globalAlpha*=e.a; ctx.translate(e.dx,0);
  rr(ctx,x,y,w,h,h/2); ctx.fillStyle=C.card; ctx.fill();
  marker(ctx,x+h*0.5,y+h/2,m*0.018,it,k);
  const F=fit(ctx,it.text,'500',m*0.04,w-h*0.95-m*0.03,2); font(ctx,'500',F.fs); ctx.fillStyle=C.ink; ctx.textBaseline='middle';
  const lh=F.fs*1.1, top=y+h/2-(F.lines.length-1)*lh/2; F.lines.forEach((l,i)=>ctx.fillText(l,x+h*0.95,top+i*lh));
  ctx.restore();
}

/* ---------- the layouts ---------- */
function cardSpots(W,H,m,w,h,topFirst){
  const vert=W<H, bot=(vert ? H*0.80 : H-m*0.07)-BAR_H, top=vert ? m*0.08 : m*0.06;
  const T={ x:(W-w)/2, y:top, w, h }, BL={ x:m*0.06, y:bot-h, w, h }, BR={ x:W-m*0.06-w, y:bot-h, w, h }, BC={ x:(W-w)/2, y:bot-h, w, h };
  return topFirst ? [T,BC,BL,BR] : [BL,BR,T];
}
function gLowerThird(ctx,W,H,m,sc,t){
  const ey=find(sc,'eyebrow'), ti=find(sc,'title'), e=enter(ti||ey,t,m); if(!e) return;
  const vert=W<H, maxW=vert ? W-m*0.12 : W*0.6, h=topicCard(ctx,m,0,0,maxW,ey,ti,0,0), c=spot(cardSpots(W,H,m,topicCard.w,h,false));
  topicCard(ctx,m,c.x,c.y,maxW,ey,ti,e.a,e.dx);
}
function gTopThird(ctx,W,H,m,sc,t){
  const ey=find(sc,'eyebrow'), ti=find(sc,'title'), e=enter(ti||ey,t,m); if(!e) return;
  const vert=W<H, maxW=vert ? W-m*0.12 : W*0.7, h=topicCard(ctx,m,0,0,maxW,ey,ti,0,0), c=spot(cardSpots(W,H,m,topicCard.w,h,true));
  topicCard(ctx,m,c.x,c.y,maxW,ey,ti,e.a,e.dx);
}
function gSideCard(ctx,W,H,m,sc,t){
  const vert=W<H, ey=find(sc,'eyebrow'), ti=find(sc,'title'), list=items(sc), e0=enter(ti||list[0]||ey,t,m); if(!e0) return;
  const x=vert ? W*0.06 : W*0.63, y=vert ? H*0.59 : H*0.12, w=vert ? W*0.88 : W*0.33, h=vert ? H*0.36 : H*0.76, pad=m*0.045;
  ctx.save(); ctx.globalAlpha*=e0.a; ctx.translate(e0.dx,0); rr(ctx,x,y,w,h,m*0.03); ctx.fillStyle=C.card; ctx.fill(); ctx.restore();
  let yy=y+pad;
  if(ey){ const fs=m*0.026; ctx.save(); ctx.globalAlpha*=e0.a; ctx.translate(e0.dx,0); eyebrow(ctx,ey.text,x+pad,yy+fs,fs); ctx.restore(); yy+=fs*2; }
  if(ti){
    const F=fit(ctx,ti.text,'800',m*0.055,w-pad*2,3), e=enter(ti,t,m);
    if(e){ ctx.save(); ctx.globalAlpha*=e.a; ctx.translate(e.dx,0); font(ctx,'800',F.fs); ctx.textBaseline='alphabetic'; F.lines.forEach((l,i)=>richLine(ctx,l,x+pad,yy+F.fs*(0.9+i*1.1),'left',C.ink,C.a2,acc(ti))); ctx.restore(); }
    yy+=F.lines.length*F.fs*1.1+m*0.06;
  }
  const gap=Math.min(m*0.1,(y+h-pad-yy)/Math.max(1,list.length));
  bulletList(ctx,m,x+pad,yy+gap*0.4,w-pad*2,list,t,m*0.045,gap,C.ink);
}
function gSplitAny(ctx,W,H,m,sc,t,textLeft){
  const vert=W<H, ey=find(sc,'eyebrow'), ti=find(sc,'title');
  const x=vert ? W*0.06 : (textLeft ? m*0.08 : W*0.54), maxW=vert ? W*0.88 : W*0.40;
  let y=vert ? H*0.50 : H*0.17;
  if(ti){ const e=enter(ti,t,m); y+=topicCard(ctx,m,x,y,maxW,ey,ti,e ? e.a : 0,e ? e.dx : 0)+m*0.09; }
  else y=vert ? H*0.55 : H*0.32;
  bulletList(ctx,m,x,y,maxW,items(sc),t,m*0.056,m*0.11,C.ink);
}
function gStack(ctx,W,H,m,sc,t){
  const vert=W<H, r=presRect('stack',W,H), ti=find(sc,'title'), list=items(sc);
  let y=r.y+r.h+m*0.07;
  if(ti){
    const F=fit(ctx,ti.text,'800',m*0.06,W*0.88,vert ? 2 : 1), e=enter(ti,t,m);
    if(e){ ctx.save(); ctx.globalAlpha*=e.a; ctx.translate(e.dx,0); font(ctx,'800',F.fs); ctx.textBaseline='alphabetic'; F.lines.forEach((l,i)=>richLine(ctx,l,W/2,y+F.fs*(0.9+i*1.1),'center',C.ink,C.a2,acc(ti))); ctx.restore(); }
    y+=F.lines.length*F.fs*1.1+m*0.05;
  }
  const n=list.length; if(!n) return;
  if(vert){ const ch=m*0.12, gap=m*0.03; list.forEach((it,k)=>{ const e=enter(it,t,m); if(e) chip(ctx,m,W*0.06,y+k*(ch+gap),W*0.88,ch,it,k,e); }); }
  else{ const gap=m*0.03, w=(W*0.88-gap*(n-1))/n, ch=m*0.12; list.forEach((it,k)=>{ const e=enter(it,t,m); if(e) chip(ctx,m,W*0.06+k*(w+gap),y,w,ch,it,k,e); }); }
}
function gList(ctx,W,H,m,sc,t,narrow){
  const vert=W<H, ti=find(sc,'title'), rows=items(sc), x=m*0.1, w=narrow && !vert ? W*0.52 : W-m*0.2, bottom=narrow && vert ? H*0.71 : H-m*0.06;
  let y=m*0.1;
  if(ti){
    const F=fit(ctx,ti.text,'800',m*0.08,w,2), e=enter(ti,t,m);
    if(e){ ctx.save(); ctx.globalAlpha*=e.a; ctx.translate(e.dx,0); font(ctx,'800',F.fs); ctx.textBaseline='alphabetic'; F.lines.forEach((l,k)=>richLine(ctx,l,x,y+F.fs*(0.9+k*1.1),'left',C.ink,C.a2,acc(ti))); ctx.restore(); }
    y+=F.lines.length*F.fs*1.1+m*0.08;
  }
  if(!rows.length) return;
  const gap=m*0.035, rh=Math.min(m*0.13,(bottom-y-gap*(rows.length-1))/rows.length);
  rows.forEach((r,k)=>{
    const e=enter(r,t,m); if(!e) return;
    const ry=y+k*(rh+gap), cy=ry+rh/2, rad=m*0.022;
    const hp=r.tHi!=null ? easeOut(clamp((t-r.tHi)/0.35,0,1)) : 0;
    const struck=r.tStrike!=null && t>=r.tStrike, sp=struck ? easeOut(clamp((t-r.tStrike)/0.5,0,1)) : 0, white=hp>0.5;
    ctx.save(); ctx.globalAlpha*=e.a; ctx.translate(e.dx,0);
    rr(ctx,x,ry,w,rh,rad); ctx.fillStyle=C.card; ctx.fill();
    if(hp>0){ ctx.save(); rr(ctx,x,ry,w,rh,rad); ctx.clip(); ctx.fillStyle=C.a1; ctx.fillRect(x,ry,w*hp,rh); ctx.restore(); }
    marker(ctx,x+m*0.05,cy,m*0.018,r,k,white ? '#FFFFFF' : (r.color ? null : (r.tStrike!=null ? C.a2 : C.a1)));
    font(ctx,'500',m*0.035); ctx.textBaseline='middle'; ctx.fillStyle=white ? 'rgba(255,255,255,0.85)' : C.muted;
    ctx.fillText(String(k+1).padStart(2,'0'),x+m*0.1,cy);
    const tx=x+m*0.18, F=fit(ctx,r.text,'500',m*0.05,w-m*0.22,2), lh=F.fs*1.15, top=cy-(F.lines.length-1)*lh/2;
    font(ctx,'500',F.fs); ctx.fillStyle=white ? '#FFFFFF' : struck ? C.muted : C.ink;
    F.lines.forEach((l,i)=>ctx.fillText(l,tx,top+i*lh));
    if(struck && !white){ const th=Math.max(2,m*0.0035); ctx.fillStyle=C.a2; F.lines.forEach((l,i)=>ctx.fillRect(tx,top+i*lh-th/2+F.fs*0.04,ctx.measureText(l).width*sp,th)); }
    ctx.restore();
  });
}
function gSteps(ctx,W,H,m,sc,t){
  const vert=W<H, ti=find(sc,'title'), ch=items(sc), fn=find(sc,'source'), x0=m*0.1, totW=W-m*0.2;
  let y=vert ? m*0.16 : m*0.12;
  if(ti){
    const F=fit(ctx,ti.text,'800',m*0.085,totW,2), e=enter(ti,t,m);
    if(e){ ctx.save(); ctx.globalAlpha*=e.a; ctx.translate(e.dx,0); font(ctx,'800',F.fs); ctx.textBaseline='alphabetic'; F.lines.forEach((l,k)=>richLine(ctx,l,x0,y+F.fs*(0.9+k*1.1),'left',C.onBand,C.a2,acc(ti))); ctx.restore(); }
    y+=F.lines.length*F.fs*1.1+m*0.1;
  }
  const n=ch.length;
  if(n){
    const amt=ch.map((c,k)=>{ if(t<c.tIn) return 0; const on=clamp((t-c.tIn)/0.3,0,1), nx=ch[k+1], off=nx && t>=nx.tIn ? clamp((t-nx.tIn)/0.3,0,1) : 0; return on*(1-off); });
    const gap=m*0.014;
    ch.forEach((c,k)=>{
      const e=enter(c,t,m); if(!e) return;
      ctx.save(); ctx.globalAlpha*=e.a; ctx.translate(vert ? 0 : e.dx,vert ? e.dx : 0);
      let tx,ty,maxW,fs0,lines;
      ctx.beginPath();
      if(!vert){
        const h=m*0.27, d=h*0.2, seg=totW/n, top=Math.max(y,H*0.4), L=x0+k*seg+(k ? gap/2 : 0), R=x0+(k+1)*seg-(k<n-1 ? gap/2 : 0), B=top+h, mid=top+h/2;
        ctx.moveTo(L,top); ctx.lineTo(R,top); if(k<n-1) ctx.lineTo(R+d,mid); ctx.lineTo(R,B); ctx.lineTo(L,B); if(k) ctx.lineTo(L+d,mid); ctx.closePath();
        tx=L+(k ? d : 0)+m*0.045; ty=top+h*0.3; maxW=R-tx-m*0.02; fs0=m*0.046; lines=3;
      }else{
        const d=m*0.06, h=Math.min(m*0.22,(H-m*0.14-y)/n-gap), T=y+k*(h+gap), B=T+h, xL=x0, xR=x0+totW, mx=(xL+xR)/2;
        ctx.moveTo(xL,T); if(k) ctx.lineTo(mx,T+d); ctx.lineTo(xR,T); ctx.lineTo(xR,B); if(k<n-1) ctx.lineTo(mx,B+d); ctx.lineTo(xL,B); ctx.closePath();
        tx=xL+m*0.05; ty=T+(k ? d : 0)+m*0.05; maxW=totW-m*0.1; fs0=m*0.044; lines=2;
      }
      ctx.fillStyle=mix(C.chev,C.a2,amt[k]); ctx.fill();
      const on=amt[k]>0.5;
      if(c.icon){ ctx.save(); ctx.font=Math.round(m*0.034)+'px '+EMOJI; ctx.textBaseline='alphabetic'; ctx.fillText(c.icon,tx+m*0.06,ty); ctx.restore(); }
      font(ctx,'500',m*0.032); ctx.textBaseline='alphabetic'; ctx.fillStyle=on ? C.a2Text : C.chevNum; ctx.fillText(String(k+1).padStart(2,'0'),tx,ty);
      const F=fit(ctx,c.text,'700',fs0,maxW,lines); font(ctx,'700',F.fs); ctx.fillStyle=on ? C.a2Text : C.chevText;
      F.lines.forEach((l,i)=>ctx.fillText(l,tx,ty+F.fs*1.3+i*F.fs*1.12));
      ctx.restore();
    });
  }
  if(fn){ const e=enter(fn,t,m); if(e){ ctx.save(); ctx.globalAlpha*=e.a*0.75; font(ctx,'400',m*0.032); ctx.fillStyle=C.onBand; ctx.textBaseline='alphabetic'; ctx.fillText(fn.text,x0,H-m*0.07,totW); ctx.restore(); } }
}
function gQuote(ctx,W,H,m,sc,t){
  const q=find(sc,'quote') || find(sc,'title'), src=find(sc,'source'), x=m*0.12, w=W-m*0.24;
  let bottom=H*0.7;
  if(q){
    const F=fit(ctx,q.text,'700',m*0.068,w,4), lh=F.fs*1.25, top=H*0.42; bottom=top+F.lines.length*lh;
    const e=enter(q,t,m);
    if(e){
      ctx.save(); ctx.globalAlpha*=e.a; ctx.translate(e.dx,0);
      ctx.font='700 '+Math.round(m*0.3)+'px Georgia, serif'; ctx.fillStyle=C.a2; ctx.textBaseline='alphabetic'; ctx.fillText('\u201C',x-m*0.02,H*0.38);
      font(ctx,'700',F.fs); ctx.fillStyle=C.ink; F.lines.forEach((l,i)=>ctx.fillText(l,x,top+F.fs+i*lh));
      ctx.restore();
    }
  }
  if(src){ const e=enter(src,t,m); if(e){ ctx.save(); ctx.globalAlpha*=e.a; ctx.translate(e.dx,0); font(ctx,'500',m*0.038); ctx.fillStyle=C.muted; ctx.textBaseline='alphabetic'; ctx.fillText('\u2014 '+src.text,x,bottom+m*0.08,w); ctx.restore(); } }
}
function gStat(ctx,W,H,m,sc,t){
  const st=find(sc,'stat'), lb=find(sc,'title') || find(sc,'source');
  if(st){ const e=enter(st,t,m); if(e){ ctx.save(); ctx.globalAlpha*=e.a; ctx.textAlign='center'; const F=fit(ctx,st.text,'800',m*0.2,W*0.9,1); font(ctx,'800',F.fs); ctx.fillStyle=C.a1; ctx.textBaseline='middle'; ctx.fillText(F.lines[0],W/2+e.dx,H*0.44); ctx.restore(); } }
  if(lb){ const e=enter(lb,t,m); if(e){ ctx.save(); ctx.globalAlpha*=e.a; ctx.textAlign='center'; const F=fit(ctx,lb.text,'500',m*0.05,W*0.85,2); font(ctx,'500',F.fs); ctx.fillStyle=C.muted; ctx.textBaseline='middle'; F.lines.forEach((l,i)=>ctx.fillText(l,W/2+e.dx,H*0.62+i*F.fs*1.2)); ctx.restore(); } }
}
function gEnd(ctx,W,H,m,sc,t){
  const vert=W<H, x=vert ? W*0.08 : W*0.56, w=vert ? W*0.84 : W*0.38;
  let y=vert ? H*0.52 : H*0.27;
  const ey=find(sc,'eyebrow'), ti=find(sc,'title'), sub=find(sc,'source') || find(sc,'subtitle'), cta=find(sc,'cta');
  const show=(el,fn)=>{ const e=enter(el,t,m); if(!e) return; ctx.save(); ctx.globalAlpha*=e.a; ctx.translate(e.dx,0); fn(); ctx.restore(); };
  if(ey){ const fs=m*0.032, yy=y; show(ey,()=>eyebrow(ctx,ey.text,x,yy+fs,fs)); y+=fs*2.1; }
  if(ti){ const F=fit(ctx,ti.text,'800',m*0.085,w,3), yy=y; show(ti,()=>{ font(ctx,'800',F.fs); ctx.textBaseline='alphabetic'; F.lines.forEach((l,i)=>richLine(ctx,l,x,yy+F.fs*(0.9+i*1.08),'left',C.ink,C.a2,acc(ti))); }); y+=F.lines.length*F.fs*1.08+m*0.04; }
  if(sub){ const F=fit(ctx,sub.text,'400',m*0.042,w,2), yy=y; show(sub,()=>{ font(ctx,'400',F.fs); ctx.fillStyle=C.muted; ctx.textBaseline='alphabetic'; F.lines.forEach((l,i)=>ctx.fillText(l,x,yy+F.fs*(0.9+i*1.3))); }); y+=F.lines.length*F.fs*1.3+m*0.07; }
  if(cta){ const yy=y; show(cta,()=>{ const fs=m*0.044; font(ctx,'700',fs); const tw=Math.min(ctx.measureText(cta.text).width,w-m*0.1), ph=fs*2.4, pw=tw+m*0.1; rr(ctx,x,yy,pw,ph,ph/2); ctx.fillStyle=C.a2; ctx.fill(); ctx.fillStyle=C.a2Text; ctx.textBaseline='middle'; ctx.fillText(cta.text,x+m*0.05,yy+ph/2,w-m*0.1); }); }
}
const G={ 'lower-third':gLowerThird, 'top-third':gTopThird, 'side-card':gSideCard,
  split:(c,W,H,m,s,t)=>gSplitAny(c,W,H,m,s,t,true), 'split-left':(c,W,H,m,s,t)=>gSplitAny(c,W,H,m,s,t,false),
  stack:gStack, 'corner-list':(c,W,H,m,s,t)=>gList(c,W,H,m,s,t,true), list:(c,W,H,m,s,t)=>gList(c,W,H,m,s,t,false),
  steps:gSteps, quote:gQuote, stat:gStat, endcard:gEnd, board:gBoard };

/* ---------- one finished frame ---------- */
const TH=s=>THEMES[s && s.theme] || THEMES.classic;
function drawFrame(ctx,W,H,res,t,frame,look,pics){
  const m=Math.min(W,H), i=sceneAt(res,t);
  const sc=res[i], pv=i>0 ? res[i-1] : null, since=t-sc.t0, p=pv ? easeIO(clamp(since/0.7,0,1)) : 1;
  ctx.save(); ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over'; ctx.filter='none'; ctx.shadowColor='transparent'; ctx.textAlign='left';
  if(pv){ C=TH(pv); paintBg(ctx,W,H,pv.layout,i-1,pics,1,t); }
  C=TH(sc); paintBg(ctx,W,H,sc.layout,i,pics,pv ? p : 1,t);
  if(frame){
    const a=pv ? presRect(pv.layout,W,H) : null, b=presRect(sc.layout,W,H);
    let r=null, al=1;
    if(a && b) r={ x:lerp(a.x,b.x,p), y:lerp(a.y,b.y,p), w:lerp(a.w,b.w,p), h:lerp(a.h,b.h,p), r:lerp(a.r,b.r,p) };
    else if(b){ r=b; al=pv ? p : 1; }
    else if(a){ r=a; al=1-clamp(since/0.35,0,1); }
    look.studio=sc.studio || 'room'; look.studioPrev=pv ? (pv.studio || 'room') : look.studio; look.p=p; look.sceneIdx=i;
    if(r && al>0){ ctx.globalAlpha=al; drawVideo(ctx,frame,r,look,t); ctx.globalAlpha=1; }
  }
  if(pv && since<0.3 && G[pv.layout]){ C=TH(pv); ctx.save(); ctx.globalAlpha=1-since/0.3; G[pv.layout](ctx,W,H,m,pv,t); ctx.restore(); C=TH(sc); }
  if(G[sc.layout]) G[sc.layout](ctx,W,H,m,sc,t);
  ctx.restore();
}

/* hook headline (shown alone, placed where it does not cover your face), channel mark and progress bar */
function drawExtras(ctx,W,H,t,X){
  const m=Math.min(W,H), barH=BAR_H;
  ctx.save(); ctx.globalAlpha=1; ctx.filter='none'; ctx.shadowColor='transparent';
  if(X.hook && t<3.6){
    const a=clamp(Math.min((t-0.3)/0.35,(3.6-t)/0.4),0,1);
    if(a>0){
      const vert=W<H, F=fit(ctx,X.hook,'800',m*0.062,W*(vert ? 0.82 : 0.66),2);
      font(ctx,'800',F.fs); let tw=0; for(const l of F.lines) tw=Math.max(tw,ctx.measureText(l).width);
      const pad=m*0.032, bw=tw+pad*2, bh=F.lines.length*F.fs*1.15+pad*1.3, bx=(W-bw)/2;
      const c=spot([{ x:bx, y:vert ? H*0.12 : m*0.07, w:bw, h:bh },{ x:bx, y:H-bh-m*0.09-barH, w:bw, h:bh },{ x:bx, y:H*0.5-bh/2, w:bw, h:bh }]);
      ctx.save(); ctx.globalAlpha=a; ctx.translate(0,(1-easeOut(a))*m*0.03*(c.y>H/2 ? 1 : -1));
      ctx.shadowColor='rgba(0,0,0,0.25)'; ctx.shadowBlur=m*0.03; rr(ctx,c.x,c.y,bw,bh,m*0.025); ctx.fillStyle=C.a2; ctx.fill(); ctx.shadowColor='transparent';
      font(ctx,'800',F.fs); ctx.fillStyle=C.a2Text; ctx.textAlign='center'; ctx.textBaseline='alphabetic';
      F.lines.forEach((l,i)=>ctx.fillText(l,W/2,c.y+pad*0.65+F.fs*(0.9+i*1.15)));
      ctx.restore();
    }
  }
  if(X.mark!=='none'){
    const mg=m*0.035, right=X.corner[1]==='r', bottom=X.corner[0]==='b';
    if(X.logo && X.mark==='logo'){
      const h=m*0.075, w=X.logo.width/X.logo.height*h, x=right ? W-mg-w : mg, y=bottom ? H-mg-h-barH : mg;
      ctx.save(); ctx.globalAlpha=0.85; ctx.drawImage(X.logo,x,y,w,h); ctx.restore();
    }else if(X.name){
      const fs=m*0.026; font(ctx,'700',fs);
      const tw=ctx.measureText(X.name).width, h=fs*1.9, w=tw+fs*1.4, x=right ? W-mg-w : mg, y=bottom ? H-mg-h-barH : mg;
      ctx.save(); ctx.globalAlpha=0.85; rr(ctx,x,y,w,h,h/2); ctx.fillStyle='rgba(0,0,0,0.38)'; ctx.fill();
      ctx.fillStyle='#FFFFFF'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText(X.name,x+fs*0.7,y+h/2); ctx.restore();
    }
  }
  if(barH){
    const p=clamp(t/X.dur,0,1);
    ctx.fillStyle='rgba(0,0,0,0.18)'; ctx.fillRect(0,H-barH,W,barH);
    ctx.fillStyle=C.a2; ctx.fillRect(0,H-barH,W*p,barH);
  }
  ctx.restore();
}

/* ---------- called by autovideo.html ---------- */
export async function setup(o){
  await loadFont();
  o.setP(0.585,'Opening your video picture…');
  let clip;
  try{ clip=await openReader(o.MB,o.file,Math.max(o.W,o.H),false); }
  catch(e){ console.warn(e); throw new Error('your video picture could not be opened. Try an MP4 file'); }
  const mine=cutState.id===o.fileKey, segs=mine ? cutState.segs : null;
  const md=mediaRef && mediaRef.id===o.fileKey ? mediaRef.media : null;
  const val=id=>{ const el=document.getElementById(id); return el ? (el.type==='checkbox' ? el.checked : el.value) : null; };
  COLORFUL=val('peColor')!==false;
  const boardMode=['off','some','all'].includes(val('peBoard')) ? val('peBoard') : 'some';
  const lookOn=val('lookOn')!==false, fuller=clamp((+val('fullFace')||0)/100,0,0.08);
  let b=1;
  if(lookOn){
    try{
      const f=await readFrame(clip,srcAt(segs,1).s);
      if(f){ const c=new OffscreenCanvas(48,27), x=c.getContext('2d'); x.drawImage(f,0,0,48,27); const d=x.getImageData(0,0,48,27).data; let s=0; for(let i=0;i<d.length;i+=4) s+=0.2126*d[i]+0.7152*d[i+1]+0.0722*d[i+2]; b=clamp(0.5/Math.max(s/(d.length/4)/255,0.05),1,1.35); }
    }catch{}
  }
  const look={ fuller, zoom:1, filter:lookOn ? 'brightness('+b.toFixed(3)+') contrast(1.05) saturate(1.08) sepia(0.06)' : 'none', soft:lookOn ? 0.28 : 0,
    softFilter:'blur('+Math.max(1,Math.round(Math.min(o.W,o.H)*0.003))+'px) brightness('+(b*1.05).toFixed(3)+')', glow:val('peGlow')!==false, maskOk:false, p:1, vf:null, vfPrev:null, face:null, bgGain:null, n:0, avg:null, avgN:0 };
  const hasWords=o.words && o.words.length;
  const words=!hasWords ? [] : (mine && cutState.words ? cutState.words : refineWords(o.words,md ? md.buf : null));
  const dur=md && md.dur ? md.dur : (words.length ? words[words.length-1].e+1 : 0);

  o.setP(0.585,'Finding your face…');
  try{ look.face=await findFace(clip,segs,dur || 10); }catch(e){ console.warn(e); look.face=null; }
  BAR_H=val('peBar')!==false && dur>1 ? Math.max(3,Math.min(o.W,o.H)*0.007) : 0;
  FACEBOX=null;
  if(look.face){ const F=fitFrame({ x:0, y:0, w:o.W, h:o.H },clip.hold.width,clip.hold.height,look,1,null); FACEBOX={ x:F.x+look.face.x*F.dw, y:F.y+look.face.y*F.dh, w:look.face.w*F.dw, h:look.face.h*F.dh }; }

  const key='v15|'+boardMode+'|'+o.fileKey+'|'+words.length+'|'+words.map(w=>w.t).join(' ')+'|'+(o.topic||'');
  let plan;
  if(!words.length) plan={ theme:autoTheme(o.topic), scenes:[{ layout:'presenter', startWord:0, elements:[] }] };
  else if(planCache.key===key) plan=planCache.plan;
  else{
    o.setP(0.585,'Planning the graphics…');
    try{ plan=await o.askAI(planPrompt(words,o.topic,boardMode),PLAN_SCHEMA,PLAN_SHAPE,'is planning the graphics',d=>{ if(!d || !Array.isArray(d.scenes) || !d.scenes.length) throw new Error('the graphics plan was empty'); },0.585); }
    catch(e){ console.warn('Using the simple graphics plan',e); plan=simplePlan(words,o.topic); }
    planCache={ key, plan };
  }
  const res=resolvePlan(plan,words);
  const pick=val('peTheme') || 'auto', base=pick!=='auto' && THEMES[pick] ? pick : (THEMES[plan.theme] ? plan.theme : autoTheme(o.topic));
  res.forEach((s,i)=>{ s.theme=pick!=='auto' ? base : ROT[(ROT.indexOf(base)+i)%ROT.length]; });

  /* ✏️ whiteboard mode: off (board becomes a normal card), some parts, or the whole video */
  if(boardMode==='off'){
    for(const s of res){
      for(const e of s.elements) if(e.type==='sketch') e.type='item';
      if(s.layout==='board') s.layout=s.elements.some(e=>e.type==='item') ? 'side-card' : (s.elements.some(e=>e.type==='title') ? 'top-third' : 'presenter');
    }
  }else if(boardMode==='all'){
    for(const s of res){ s.layout='board'; s.theme=THEMES[s.theme] && s.theme!=='night' ? s.theme : 'classic'; }
  }else{
    for(const s of res) if(s.layout!=='board') for(const e of s.elements) if(e.type==='sketch') e.type='item';
    for(const s of res) if(s.layout==='board' && s.theme==='night') s.theme='classic';
  }
  res.forEach((s,i)=>{ s.pb=i>0 && res[i-1].layout==='board' && s.layout==='board'; });
  const sketches=[]; for(const s of res) if(s.layout==='board') for(const e of s.elements) if(e.type==='sketch') sketches.push(e);
  if(sketches.length){
    o.setP(0.585,'Finding the drawings for the whiteboard…');
    await Promise.all(sketches.map(async e=>{ try{ e.strokes=buildStrokes(await fetchIconRec(e.draw || e.text)); }catch(err){ console.warn('Drawing skipped',err); e.strokes=null; } }));
  }

  /* the hook always shows alone — no card, title, item or drawing of ANY scene may appear before it has gone */
  const hookTxt=val('peHook')!==false && plan && typeof plan.hook==='string' ? plan.hook.trim().slice(0,70) : '';
  if(hookTxt) for(const s of res) for(const e of s.elements){
    if(e.tIn!=null && e.tIn<HOOK_END) e.tIn=HOOK_END;
    if(e.tStrike!=null && e.tStrike<HOOK_END+0.45) e.tStrike=HOOK_END+0.45;
    if(e.tHi!=null && e.tHi<HOOK_END+0.45) e.tHi=HOOK_END+0.45;
  }

  const studioPick=val('peStudio') || 'room', gfxPics=val('peBg')==='library';
  const wantLib=gfxPics || ['auto','library','libvideo'].includes(studioPick);
  const recs=wantLib ? await libraryRecords() : { imgs:[], vids:[] };
  const vids=[];
  if((studioPick==='auto' || studioPick==='libvideo') && recs.vids.length){
    o.setP(0.585,'Opening your background videos…');
    for(const rc of recs.vids.slice(0,3)){ try{ vids.push(await openReader(o.MB,rc.blob,1280,true)); }catch(e){ console.warn('A library video could not be opened',e); } }
  }
  const needPics=gfxPics || studioPick==='library' || ((studioPick==='auto' || studioPick==='libvideo') && recs.imgs.length);
  const lib=needPics ? await decodeImages(recs.imgs,Math.min(20,Math.max(4,res.length))) : [];
  const libStyles=[...(vids.length ? ['libvideo'] : []),...(lib.length ? ['library'] : [])], designed=['bubbles','rays','waves','blur'];
  res.forEach((s,i)=>{
    if(studioPick==='auto') s.studio=libStyles.length ? (i%2===0 ? libStyles[(i>>1)%libStyles.length] : designed[(i>>1)%designed.length]) : STUDIO_ROT[i%STUDIO_ROT.length];
    else if(studioPick==='libvideo') s.studio=vids.length ? 'libvideo' : (lib.length ? 'library' : 'blur');
    else if(studioPick==='library') s.studio=lib.length ? 'library' : 'blur';
    else s.studio=studioPick;
  });
  if(res.some(s=>s.studio!=='room')){
    if(!SEG){
      o.setP(0.585,'Loading the background cutter (first time only)…');
      try{ SEG={ seg:await loadSegmenter() }; }
      catch(e){ console.warn(e); SEG=null; res.forEach(s=>{ s.studio='room'; }); }
    }
    if(SEG){ SEG.inCanvas=null; }
  }
  look.pics=lib;
  look.pc=new OffscreenCanvas(o.W,o.H); look.px=look.pc.getContext('2d');
  look.bc=new OffscreenCanvas(o.W,o.H); look.bx=look.bc.getContext('2d');
  look.lw=new OffscreenCanvas(o.W,o.H); look.lx=look.lw.getContext('2d');
  look.cpc=new OffscreenCanvas(o.W,o.H); look.cpx=look.cpc.getContext('2d');
  try{ look.mc=new OffscreenCanvas(32,18); look.mx=look.mc.getContext('2d',{ willReadFrequently:true }); }catch{ look.mx=null; }
  try{ look.one=new OffscreenCanvas(1,1); look.onex=look.one.getContext('2d',{ willReadFrequently:true }); }catch{ look.onex=null; }
  const pics=gfxPics ? lib : [];

  if(md && md.buf && md.buf!==md.raw){ try{ applySfx(md,val('peSfx')!==false ? sfxEvents(res) : []); }catch(e){ console.warn('Sound effects skipped',e); } }
  const zoomOn=val('peZoom')!==false, emph=[];
  if(zoomOn){ let lastE=-9; for(const w of words){ const k=norm(w.t); if((EMPH.has(k) || /!["')\]]*$/.test(String(w.t))) && w.s-lastE>4){ emph.push(Math.max(0,w.s-0.05)); lastE=w.s; } } }
  const prof=curProfile(); let logo=null;
  if(prof.logo){ try{ const im=new Image(); im.src=prof.logo; await im.decode(); logo=im; }catch{} }
  const X={ hook:hookTxt, mark:val('peMark') || 'logo', corner:val('peCorner') || 'tr', logo, name:prof.name || '', dur };
  const FULL=['presenter','lower-third','top-third'];
  const zoomAt=(t,k)=>{
    let z=1+(k%2)*0.04;
    if(!zoomOn) return z;
    const i=sceneAt(res,t), sc=res[i];
    if(FULL.includes(sc.layout)){ const nx=res[i+1], end=nx ? nx.t0 : dur, span=Math.max(1,end-sc.t0); z+=0.06*easeIO(clamp((t-sc.t0)/span,0,1)); }
    for(const e of emph){ if(e>t+0.1) break; const d=t-e; if(d>=-0.1 && d<1.6){ z+=0.07*(d<0.15 ? easeOut(clamp((d+0.1)/0.25,0,1)) : 1-easeIO(clamp((d-0.15)/1.45,0,1))); break; } }
    return z;
  };
  return {
    async draw(ctx,t){
      const s=srcAt(segs,t); let f=null; try{ f=await readFrame(clip,s.s); }catch{}
      const i=sceneAt(res,t), cur=res[i], pv=res[i-1], mid=pv && t-cur.t0<0.7;
      look.zoom=zoomAt(t,s.k);
      if(cur.layout==='board'){ const into=pv && pv.layout!=='board' ? easeIO(clamp((t-cur.t0)/0.7,0,1)) : 1; look.zoom=Math.max(look.zoom,1+0.35*into); }
      look.maskOk=false; look.vf=null; look.vfPrev=null;
      if(vids.length){
        if(cur.studio==='libvideo'){ try{ look.vf=await readFrame(vids[i%vids.length],t-cur.t0); }catch{} }
        if(mid && pv.studio==='libvideo'){
          if((i-1)%vids.length===i%vids.length && cur.studio==='libvideo') look.vfPrev=look.vf;
          else{ try{ look.vfPrev=await readFrame(vids[(i-1)%vids.length],t-pv.t0); }catch{} }
        }
      }
      if(f && SEG){
        const shown=presRect(cur.layout,o.W,o.H) || (mid && presRect(pv.layout,o.W,o.H));
        const need=shown && (cur.studio!=='room' || (mid && pv.studio!=='room'));
        if(need){ try{ look.maskOk=computeMask(f); }catch(e){ console.warn(e); } }
      }
      drawFrame(ctx,o.W,o.H,res,t,f,look,pics);
      drawExtras(ctx,o.W,o.H,t,X);
    },
    async close(){ await closeReader(clip); for(const v of vids) await closeReader(v); }
  };
}
