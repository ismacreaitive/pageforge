// presenter-explainer.js — v20 — StoryForge presenter loader.
// The presenter engine is large, so it lives in presenter-base.js (the v15 engine) in the SAME folder.
// This small file reads that engine, applies the v16–v20 whiteboard fixes when it runs, and starts it.
// Both files must sit together in the same folder (pageforge, and on your Netlify site).
// v20 kills SKIPPING on fast videos: EVERY point on a board gets its own guaranteed slot (spread evenly across that
//     board's time) so it must appear before the scene changes, the pictures draw about twice as fast so they finish
//     even on quick scenes, and the planner is told to keep every point even when the speaker talks fast.
// v19: parts are never thrown away when words can't be matched; matching is more forgiving; the closing is not
//      dropped; a board can hold up to 6 points.
// v18: pictures breathe/pop + live concept motion (light glows, clock ticks, fire, water, money "+", arrow, star).
// v17: every board point is its own BIG live hand-drawn picture with label + green tick / red cross.
// v16: GOOD = green tick, BAD = red cross; problem and solution on SEPARATE boards; face in the circle from the start.

const EDITS=[
  [`// presenter-explainer.js — v15 — StoryForge: keep the video picture and add animated graphics`,
   `// presenter-base.js — v15 engine (patched to v20 by presenter-explainer.js)`],

  [`const INK='#1F2A37', BOARD_BG='#FBFBF8', SKIN='#B97A4F', SLEEVE='#24364F';`,
   `const INK='#1F2A37', BOARD_BG='#FBFBF8', SKIN='#B97A4F', SLEEVE='#24364F'; const GOOD='#1E9E5A', BAD='#D14B41';`],

  [`let DOODLE=null, CHECK=null;`,
   `let DOODLE=null, CHECK=null, CROSS=null;`],

  [`function checkStroke(){ if(!CHECK) CHECK=measurePath('M4 12.5l5 5 11-11'); return CHECK; }`,
   `function checkStroke(){ if(!CHECK) CHECK=measurePath('M4 12.5l5 5 11-11'); return CHECK; } function crossStroke(){ if(!CROSS){ const a=measurePath('M6 6l12 12'), b=measurePath('M18 6L6 18'); CROSS={ vb:[0,0,24,24], list:[a,b].filter(s=>s.p2 && s.pts.length>1), total:Math.max(1,a.L+b.L) }; } return CROSS; } function liveFx(ctx,e,cx,cy,size,lp){ const key=((e.draw||'')+' '+(e.text||'')).toLowerCase(), has=(...a)=>a.some(w=>key.indexOf(w)>=0); ctx.save(); ctx.lineCap='round'; ctx.lineJoin='round'; if(has('light','bulb','lamp','idea','bright','glow','sun','energy')){ const on=Math.min(1,lp/0.5), pz=0.85+0.15*Math.sin(lp*3), g=ctx.createRadialGradient(cx,cy,0,cx,cy,size*0.85); g.addColorStop(0,'rgba(245,158,11,'+(0.33*on*pz).toFixed(3)+')'); g.addColorStop(1,'rgba(245,158,11,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(cx,cy,size*0.85,0,6.283); ctx.fill(); ctx.strokeStyle='rgba(245,158,11,'+(0.75*on).toFixed(3)+')'; ctx.lineWidth=Math.max(2,size*0.02); for(let k=0;k<8;k++){ const a=k*0.785+lp*0.25, r0=size*0.5, r1=size*(0.62+0.05*Math.sin(lp*4+k)); ctx.beginPath(); ctx.moveTo(cx+Math.cos(a)*r0,cy+Math.sin(a)*r0); ctx.lineTo(cx+Math.cos(a)*r1,cy+Math.sin(a)*r1); ctx.stroke(); } } else if(has('clock','time','watch','hour','minute','late','early','schedule','deadline','wait','rush')){ ctx.strokeStyle=BAD; ctx.lineWidth=Math.max(2,size*0.024); let a=-1.5708+lp*2.2; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+Math.cos(a)*size*0.3,cy+Math.sin(a)*size*0.3); ctx.stroke(); ctx.strokeStyle=INK; ctx.lineWidth=Math.max(2,size*0.032); a=-1.5708+lp*0.37; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+Math.cos(a)*size*0.2,cy+Math.sin(a)*size*0.2); ctx.stroke(); } else if(has('fire','hot','burn','flame','danger','urgent','stress')){ const fl=0.3+0.18*Math.sin(lp*9)+0.1*Math.sin(lp*17), g=ctx.createRadialGradient(cx,cy+size*0.1,0,cx,cy,size*0.65); g.addColorStop(0,'rgba(209,75,65,'+(0.4*fl).toFixed(3)+')'); g.addColorStop(1,'rgba(209,75,65,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(cx,cy,size*0.65,0,6.283); ctx.fill(); } else if(has('water','rain','ocean','sea','wet','drink','wudu','flow')){ ctx.strokeStyle='rgba(14,116,144,0.55)'; ctx.lineWidth=Math.max(1.5,size*0.014); for(let k=0;k<3;k++){ const rr=((lp*0.6+k*0.4)%1.2)*size*0.5, al=Math.max(0,1-rr/(size*0.5))*0.55; ctx.globalAlpha=al; ctx.beginPath(); ctx.arc(cx,cy+size*0.08,rr+size*0.1,0,6.283); ctx.stroke(); } ctx.globalAlpha=1; } else if(has('money','cash','coin','profit','rich','save','price','cost','pay','gold','salary','income')){ ctx.font='700 '+Math.round(size*0.17)+'px '+FONT; ctx.textAlign='center'; ctx.textBaseline='middle'; for(let k=0;k<3;k++){ const ph=(lp*1.1+k*0.5)%1.3, al=Math.max(0,1-ph/1.3)*0.85, sx=cx+(k-1)*size*0.24, sy=cy-size*0.08-ph*size*0.22; ctx.fillStyle='rgba(30,158,90,'+al.toFixed(3)+')'; ctx.fillText('+',sx,sy); } } else if(has('arrow','road','move','fast','grow','rise','forward','progress','run','start','step')){ ctx.strokeStyle=C.a1; ctx.lineWidth=Math.max(2,size*0.02); for(let k=0;k<3;k++){ const ph=(lp*1.3+k*0.33)%1, al=Math.sin(3.14159*ph)*0.8, xx=cx-size*0.14+k*size*0.14, yy=cy+size*0.52; ctx.globalAlpha=al; ctx.beginPath(); ctx.moveTo(xx,yy); ctx.lineTo(xx+size*0.08,yy-size*0.08); ctx.lineTo(xx+size*0.16,yy); ctx.stroke(); } ctx.globalAlpha=1; } else if(has('star','win','success','best','award','goal','achieve','trophy','top','great')){ ctx.lineWidth=Math.max(1.5,size*0.012); for(let k=0;k<4;k++){ const ph=(lp*1.4+k*0.6)%1.4, al=Math.max(0,1-ph/1.4)*0.9, rr=size*(0.08+ph*0.16), ang=k*1.7, sx=cx+Math.cos(ang)*size*0.4, sy=cy+Math.sin(ang)*size*0.4; ctx.strokeStyle='rgba(245,158,11,'+al.toFixed(3)+')'; ctx.beginPath(); ctx.moveTo(sx-rr,sy); ctx.lineTo(sx+rr,sy); ctx.moveTo(sx,sy-rr); ctx.lineTo(sx,sy+rr); ctx.stroke(); } } ctx.restore(); }`],

  [`let pen=strokeProgress(ctx,st,easeIO(p),ox,oy,sc,INK,1.9);`,
   `const _lp=el>DD ? el-DD : 0, _pz=_lp>0 ? 1+0.06*Math.exp(-_lp*4)+0.02*Math.sin(_lp*2) : 1; let pen; if(_pz!==1){ ctx.save(); ctx.translate(cx,cy); ctx.scale(_pz,_pz); ctx.translate(-cx,-cy); pen=strokeProgress(ctx,st,1,ox,oy,sc,INK,1.9); ctx.restore(); liveFx(ctx,e,cx,cy,size,_lp); } else pen=strokeProgress(ctx,st,easeIO(p),ox,oy,sc,INK,1.9);`],

  [`const DD=clamp(0.6+st.total*0.008,1.0,1.8), p=clamp(el/DD,0,1);`,
   `const DD=clamp(0.4+st.total*0.006,0.5,1.1), p=clamp(el/DD,0,1);`],

  [`if(r>bestSc+1e-9 && (r>=0.6 || (p.length<=2 && r>=0.5))){ best=i; bestSc=r; if(r===1) break; }`,
   `if(r>bestSc+1e-9 && (r>=0.5 || (p.length<=2 && r>=0.45))){ best=i; bestSc=r; if(r===1) break; }`],

  [`if(at<0) continue;`,
   `if(at<0 && s.startSay) at=findSay(tok,s.startSay,0,n); if(at<0){ const e1=(Array.isArray(s.elements) ? s.elements : []).find(e=>e && e.say); if(e1) at=findSay(tok,e1.say,0,n); } if(at<0) at=clamp(cursor+2,0,n-1);`],

  [`const res=resolvePlan(plan,words);`,
   `const res=resolvePlan(plan,words); try{ for(let _i=0;_i<res.length;_i++){ const _s=res[_i]; if(_s.layout!=='board') continue; const _t1=(_i<res.length-1 ? res[_i+1].t0 : (words.length ? words[words.length-1].e+0.8 : _s.t0+4)); const _its=_s.elements.filter(e=>e.type==='item' || e.type==='sketch'); if(_its.length){ const _span=Math.max(0.5,_t1-_s.t0-0.5); _its.forEach((e,_k)=>{ e.tIn=_s.t0+0.3+_span*_k/_its.length; if(e.tStrike!=null) e.tStrike=Math.max(e.tStrike,e.tIn+0.4); if(e.tHi!=null) e.tHi=Math.max(e.tHi,e.tIn+0.4); }); } } }catch(_e){ console.warn(_e); }`],

  [`const n=Math.min(4,sks.length), cols=vert ? (n===1 ? 1 : 2) : (n===4 ? 2 : n), rows=Math.ceil(n/cols), cw=(x1-x0)/cols, ch=(y1-y)/rows;`,
   `const n=Math.min(6,sks.length), cols=vert ? (n<=2 ? 1 : 2) : (n<=3 ? n : 3), rows=Math.ceil(n/cols), cw=(x1-x0)/cols, ch=(y1-y)/rows;`],

  [`sks.slice(0,4).forEach((e,k)=>{`,
   `sks.slice(0,6).forEach((e,k)=>{`],

  [`const ringA=sc.pb ? 1 : clamp((t-sc.t0-0.55)/0.3,0,1);`,
   `const ringA=sc.pb ? 1 : clamp((t-sc.t0)/0.3,0,1);`],

  [`since=t-sc.t0, p=pv ? easeIO(clamp(since/0.7,0,1)) : 1;`,
   `since=t-sc.t0, p=pv ? easeIO(clamp(since/(sc.layout==='board' ? 0.3 : 0.7),0,1)) : 1;`],

  [`const ti=find(sc,'title'), sks=sc.elements.filter(e=>e.type==='sketch'), writes=sc.elements.filter(e=>e.type!=='sketch' && e.type!=='title' && e.type!=='eyebrow');`,
   `const ti=find(sc,'title'), sks=sc.elements.filter(e=>e.type==='sketch' || e.type==='item'), writes=sc.elements.filter(e=>e.type!=='sketch' && e.type!=='item' && e.type!=='title' && e.type!=='eyebrow');`],

  [`consider(drawSketch(ctx,e,cx,cy,size,t,lfs,m),e.tIn);`,
   `consider(drawSketch(ctx,e,cx,cy,size,t,lfs,m),e.tIn); if(e.type==='item'){ const mk=e.bad ? crossStroke() : { vb:[0,0,24,24], list:[checkStroke()], total:Math.max(1,checkStroke().L) }, msc=size*0.46/24, mp=clamp((t-e.tIn-0.4)/0.35,0,1); if(mp>0) consider(strokeProgress(ctx,mk,easeIO(mp),cx+size*0.26,cy-size*0.64,msc,e.bad ? BAD : GOOD,3.2),e.tIn+0.2); }`],

  [`const sketches=[]; for(const s of res) if(s.layout==='board') for(const e of s.elements) if(e.type==='sketch') sketches.push(e);`,
   `const sketches=[]; for(const s of res) if(s.layout==='board') for(const e of s.elements) if(e.type==='sketch' || (e.type==='item' && (e.draw || e.text))) sketches.push(e);`],

  [`Never skip or merge points.`,
   `Never skip or merge points. On a board, give EVERY point a "draw" noun so it becomes a hand-drawn picture, and keep 2 to 4 points on a board so each picture is BIG and the board is full, never empty.`],

  [`in the order spoken,`,
   `in the order spoken (even when the speaker talks fast — never merge points just because they are said quickly),`],

  [`Each scene lasts at least 3 seconds.`,
   `Each scene lasts at least 3 seconds. Do not drop the closing: if the speaker ends by naming several things (like time, money, energy, a goal), make each one its own drawn point on a board, do not just talk over it.`],

  [`Optional: "icon" (one emoji that fits, for items),`,
   `Optional: "draw" for every item too (ONE simple concrete English noun a line picture can show: clock, book, house, door, light, bulb, money, water, road, phone, calendar, heart, tree, car, shield, chart, bed, sun, moon, star, key, gift, hand, person, family, team, bell, cup, bag, box, flag, map), so each point is drawn as a little picture, not only written. "icon" (one emoji that fits, for items),`],

  [`it gets highlighted).`,
   `it gets highlighted). On a board, a point the speaker says is GOOD gets a green tick, and a point they say is WRONG, a mistake, or that does NOT work gets a red cross: mark the bad ones with "bad": true.`],

  [`anything sacred as a picture.`,
   `anything sacred as a picture. Also keep the PROBLEM and the SOLUTION on separate boards: put the things the speaker says are WRONG or that do NOT work together in ONE scene, each with "bad": true, under a short title like "The challenge", and put what the speaker says DOES work or the solution in a SEPARATE next scene (each a good point) under a title like "What works"; NEVER put the wrong things and the good things on the same board.`],

  [`color:{ type:'STRING' }, strikeSay:{ type:'STRING' }`,
   `color:{ type:'STRING' }, bad:{ type:'BOOLEAN' }, strikeSay:{ type:'STRING' }`],

  [`icon:/[A-Za-z0-9]/.test(icon) ? '' : icon, found:wi>=0,`,
   `icon:/[A-Za-z0-9]/.test(icon) ? '' : icon, bad:e.bad===true, found:wi>=0,`],

  [`const key='v15|'+boardMode`,
   `const key='v20|'+boardMode`]
];

async function loadEngine(){
  const res=await fetch(new URL('./presenter-base.js',import.meta.url));
  if(!res.ok) throw new Error('presenter-base.js could not be loaded ('+res.status+'). Make sure presenter-base.js is in the same folder as presenter-explainer.js.');
  let code=await res.text();
  let applied=0;
  for(const [a,b] of EDITS){
    if(code.indexOf(a)>=0){ code=code.split(a).join(b); applied++; }
    else console.warn('[presenter v20] a fix did not match and was skipped:',a.slice(0,45));
  }
  console.log('[presenter v20] whiteboard fixes applied:',applied,'of',EDITS.length);
  const url=URL.createObjectURL(new Blob([code],{ type:'text/javascript' }));
  return import(url);
}

const engine=await loadEngine();
export const mountUI=engine.mountUI;
export const cutWords=engine.cutWords;
export const useRaw=engine.useRaw;
export const tighten=engine.tighten;
export const setup=engine.setup;
