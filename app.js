'use strict';
const canvas = document.getElementById('portrait');
const ctx = canvas.getContext('2d', { alpha: false });
const $ = id => document.getElementById(id);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let points, pointRegions, w, h, cols, rows, cellW, cellH, depth, shades, glyphs, regions;
const speed = 1.2; // Twice the previous default multiplier of 0.6.
let angle = -.25, playing = true;
let dragging = false, moved = false, downX = 0, downY = 0, lastX = 0;
let lastTime = 0, elapsed = 0, reformStart = reduceMotion ? -100 : 0, ready = false, hovered = 0;
const words = ['공감','마음','이해','표현','대화','경청','진심','생각','언어','존중','위로','용기','감정','연결','믿음','배려','소통','말씀'];
let wordIndices;
// Regions are on the 3D surface. Visibility comes from the same depth buffer as the ASCII portrait.
const spots = [
  { id: 1, name: '왼쪽 눈', module: 'message', label: '눈 · 문자', center: [-.43,.58,.94], radius: [.24,.14,.23] },
  { id: 2, name: '오른쪽 눈', module: 'message', label: '눈 · 문자', center: [.33,.58,.91], radius: [.24,.14,.23] },
  { id: 3, name: '왼쪽 귀', module: 'dialog', label: '귀 · 대화', center: [-.92,.31,-.14], radius: [.23,.38,.35] },
  { id: 4, name: '오른쪽 귀', module: 'dialog', label: '귀 · 대화', center: [.86,.31,-.17], radius: [.23,.38,.35] },
  { id: 5, name: '입', module: 'speech', label: '입 · 스피치', center: [-.05,-.16,1.06], radius: [.30,.15,.21] }
];
function classifyPoint(x, y, z) {
  for (const spot of spots) {
    const [a,b,c] = spot.center, [rx,ry,rz] = spot.radius;
    if (((x-a)/rx)**2 + ((y-b)/ry)**2 + ((z-c)/rz)**2 < 1) return spot.id;
  }
  return 0;
}
for (const spot of spots) {
  const link = document.createElement('a');
  link.className = 'hotspot'; link.href = './trainer.html#' + spot.module;
  link.setAttribute('aria-label', spot.name + ' — ' + spot.label.split(' · ')[1] + ' 훈련 시작');
  link.innerHTML = '<span class="hotspot-tip">' + spot.label + '</span>';
  link.hidden = true;
  link.addEventListener('pointerenter', () => setHovered(spot.id));
  link.addEventListener('pointerleave', () => { if (document.activeElement !== link) setHovered(0); });
  link.addEventListener('focus', () => setHovered(spot.id));
  link.addEventListener('blur', () => setHovered(0));
  $('hotspots').appendChild(link); spot.element = link; spot.visible = false;
}
function resize() {
  w = canvas.clientWidth; h = canvas.clientHeight;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(w*dpr); canvas.height = Math.round(h*dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
  cellW = w < 760 ? 2.35 : 2.95; cellH = w < 760 ? 5.45 : 6.9;
  cols = Math.ceil(w/cellW); rows = Math.ceil(h/cellH);
  depth = new Float32Array(cols*rows); shades = new Float32Array(cols*rows);
  glyphs = new Int32Array(cols*rows); regions = new Uint8Array(cols*rows);
}
new ResizeObserver(resize).observe(canvas);
function setHovered(id) {
  if (hovered === id) return;
  hovered = id;
  for (const s of spots) s.element.classList.toggle('is-active', s.id === id);
  canvas.style.cursor = id ? 'pointer' : 'grab';
}
function hitTest(x,y) {
  let found = null, best = Infinity;
  for (const s of spots) {
    if (!s.visible) continue;
    const score = ((x-s.x)/s.hitX)**2 + ((y-s.y)/s.hitY)**2;
    if (score <= 1 && score < best) { found = s; best = score; }
  }
  return found;
}
function localPointer(event) {
  const r = canvas.getBoundingClientRect();
  return [event.clientX-r.left, event.clientY-r.top];
}
canvas.addEventListener('pointerdown', event => {
  dragging = true; moved = false; downX = lastX = event.clientX; downY = event.clientY;
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointermove', event => {
  if (dragging) {
    if (Math.hypot(event.clientX-downX,event.clientY-downY)>6) moved = true;
    if (moved) { angle += (event.clientX-lastX)*.008; setHovered(0); }
    lastX = event.clientX;
  } else { const s = hitTest(...localPointer(event)); setHovered(s ? s.id : 0); }
});
canvas.addEventListener('pointerup', event => {
  const select = dragging && !moved;
  dragging = false;
  if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  if (select) { const s = hitTest(...localPointer(event)); if (s) location.assign('./trainer.html#'+s.module); }
});
for (const name of ['pointercancel','lostpointercapture']) canvas.addEventListener(name, () => { dragging=false; moved=true; });
canvas.addEventListener('pointerleave', () => { if (!dragging) setHovered(0); });
canvas.addEventListener('keydown', event => {
  if (event.key==='ArrowLeft'||event.key==='ArrowRight') { event.preventDefault(); setHovered(0); angle += event.key==='ArrowLeft'?-.12:.12; }
});
function updateHotspots(disperse) {
  const counts = new Int32Array(6), sumX = new Float32Array(6), sumY = new Float32Array(6);
  const minX = new Float32Array(6).fill(Infinity), maxX = new Float32Array(6).fill(-Infinity);
  const minY = new Float32Array(6).fill(Infinity), maxY = new Float32Array(6).fill(-Infinity);
  for (let j=0;j<regions.length;j++) {
    const id = regions[j]; if (!id) continue;
    const x = (j%cols+.5)*cellW, y = ((j/cols|0)+.5)*cellH;
    counts[id]++; sumX[id]+=x; sumY[id]+=y;
    minX[id]=Math.min(minX[id],x); maxX[id]=Math.max(maxX[id],x);
    minY[id]=Math.min(minY[id],y); maxY[id]=Math.max(maxY[id],y);
  }
  for (const s of spots) {
    s.visible = counts[s.id]>=4 && disperse<.015 && (s.module==='dialog' || Math.cos(angle)>-.1);
    s.element.hidden = !s.visible;
    if (!s.visible) { if (hovered===s.id) setHovered(0); continue; }
    s.x=sumX[s.id]/counts[s.id]; s.y=sumY[s.id]/counts[s.id];
    s.hitX=Math.max(22,(maxX[s.id]-minX[s.id])/2+7);
    s.hitY=Math.max(22,(maxY[s.id]-minY[s.id])/2+7);
    s.element.style.left=s.x+'px'; s.element.style.top=s.y+'px';
  }
}
function render(t) {
  requestAnimationFrame(render);
  if (!ready||document.hidden||t-lastTime<33) return;
  const dt=Math.min((t-lastTime)/1000,.06); lastTime=t; elapsed+=dt;
  if (playing&&!dragging) angle+=dt*.14*speed;
  const ca=Math.cos(angle),sa=Math.sin(angle),mobile=w<760;
  const scale=mobile?Math.min(w/3.75,(h-90)/4.15):Math.min(h/4.5,w/6.4);
  const centerX=mobile?w*.56:w*.65,centerY=mobile?h*.61:h*.50;
  const age=elapsed-reformStart; let disperse=0;
  if (age>=0&&age<3.5) {
    disperse=age<.65?Math.sin(age/.65*Math.PI/2):Math.pow(1-(age-.65)/2.85,3);
    if (reformStart===0) disperse=Math.pow(Math.max(0,1-age/3.5),3);
  }
  depth.fill(-Infinity); shades.fill(0); glyphs.fill(0); regions.fill(0);
  for (let i=0;i<points.length;i+=7) {
    const x=points[i],y=points[i+1],z=points[i+2];
    let px=x*ca+z*sa,pz=z*ca-x*sa,py=y;
    const nx=points[i+3]*ca+points[i+5]*sa,nz=points[i+5]*ca-points[i+3]*sa,ny=points[i+4];
    if (nz<-.12) continue;
    if (disperse>.0001) { const seed=i*.031; px+=Math.sin(seed*12.13)*disperse*2.9; py+=Math.cos(seed*3.79)*disperse*2.5; pz+=Math.sin(seed*1.71)*disperse*.5; }
    const sx=(centerX+px*scale)/cellW|0,sy=(centerY-py*scale)/cellH|0;
    if (sx<0||sx>=cols||sy<0||sy>=rows) continue;
    const idx=sy*cols+sx;
    if (pz<=depth[idx]) continue;
    depth[idx]=pz;
    const light=Math.max(0,nx*-.43+ny*.42+nz*.79),rim=Math.pow(1-Math.max(0,nz),3)*.13;
    const value=((.15+light*.84)*points[i+6]+rim)*Math.min(1,Math.max(0,(py+2.28)/.80));
    shades[idx]=Math.min(1,Math.max(0,value)); glyphs[idx]=i/7|0; regions[idx]=pointRegions[i/7|0];
  }
  updateHotspots(disperse);
  ctx.fillStyle='#090a0c'; ctx.fillRect(0,0,w,h); ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.font=`500 ${w < 760 ? 4.4 : 5.4}px "Apple SD Gothic Neo","Malgun Gothic",sans-serif`;
  // Smaller two-letter words on a denser grid retain fine facial contours.
  // One drawing pass keeps the higher word count responsive.
  let previousTone=-1;
  for(let row=0;row<rows;row++) {
    for(let col=2;col<cols;col+=4) {
      const j=row*cols+col,v=shades[j];
      if(v<.08)continue;
      const highlight=hovered>0&&regions[j]===hovered;
      const bucket=highlight?16:Math.min(15,Math.floor(v*16));
      if(bucket!==previousTone) {
        const tone=Math.round(50+bucket*13.4);
        ctx.fillStyle=highlight?'#ffc49e':`rgb(${tone},${tone+1},${Math.min(255,tone+5)})`;
        previousTone=bucket;
      }
      ctx.fillText(words[wordIndices[glyphs[j]]],(col+.5)*cellW,(row+.5)*cellH);
    }
  }
  const degrees=((angle*180/Math.PI)%360+360)%360;
  $('angle').textContent=String(Math.round(degrees)%360).padStart(3,'0')+'°';
  $('viewLabel').textContent=degrees<35||degrees>325?'FRONT':degrees>145&&degrees<215?'BACK':'PROFILE';
}
function decodePortraitModel(model) {
  if (!model || model.format !== 'xyz16-n8-v1' || !Number.isInteger(model.count) || model.count <= 0) throw Error('Missing portrait data');
  const raw=atob(model.data);
  if(raw.length!==model.count*10)throw Error('Incomplete portrait data');
  const bytes=new Uint8Array(raw.length);
  for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
  const view=new DataView(bytes.buffer), result=new Float32Array(model.count*7);
  for(let n=0;n<model.count;n++){
    const i=n*10,j=n*7;
    for(let k=0;k<3;k++)result[j+k]=view.getInt16(i+k*2,true)/10000;
    for(let k=0;k<3;k++)result[j+3+k]=view.getInt8(i+6+k)/127;
    result[j+6]=view.getUint8(i+9)/255;
  }
  return result;
}
function initializePortrait(){
  try {
    points=decodePortraitModel(window.PORTRAIT_HEAD);
    pointRegions=new Uint8Array(points.length/7);wordIndices=new Uint8Array(points.length/7);
    for(let i=0;i<points.length;i+=7){
      pointRegions[i/7]=classifyPoint(points[i],points[i+1],points[i+2]);
      const a=Math.floor(points[i]*6),b=Math.floor(points[i+1]*7),c=Math.floor(points[i+2]*6);
      wordIndices[i/7]=((a*73+b*37+c*19)%words.length+words.length)%words.length;
    }
    resize();ready=true;$('loading').hidden=true;requestAnimationFrame(render);
  }catch(error){
    console.error('Portrait initialization failed:',error);
    $('loading').textContent='머리 데이터 파일을 확인해 주세요. 왼쪽 메뉴로 훈련을 시작할 수 있어요.';
  }
}
initializePortrait();
