'use strict';
(() => {
 const root=document.getElementById('module-dialog');
 if(!root)return;
 const $=id=>document.getElementById(id), sentence=$('conversation-sentence'), ghost=$('conversation-ghost'), mine=$('conversation-mine');
 const buttons=[...root.querySelectorAll('[data-reaction]')];
 const events=window.conversationEvents, byId=Object.fromEntries(events.map(e=>[e.id,e]));
 const order=['opening','topic','emotion','question','silence','interrupt','closing'];
 let state='calm', active=false, started=false, ended=false, locked=true, current=null, round=0, clock=0, visualClock=0,lastFrame=0, queue=[], generation=0, waitingResult=false, hadMisunderstanding=false, history=[], typed=null, finishingState='calm';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function later(ms,fn){queue.push({at:clock+ms,fn,generation});}
 function setExpression(value){
  root.dataset.expression=value;
  const names={neutral:'무표정',surprised:'놀란 표정',angry:'화난 표정',happy:'기쁜 표정'};
  $('conversation-portrait').setAttribute('aria-label','상대의 '+names[value]);
 }
 function setState(value){state=value;root.dataset.state=value;setExpression({calm:'happy',tense:'angry',emotional:'angry',silence:'neutral',misunderstood:'surprised'}[value]||'neutral');}
 function lock(value){locked=value;buttons.forEach(b=>b.disabled=value);}
 function renderText(text,instant=false){
  sentence.replaceChildren();const chars=[...text];
  chars.forEach(ch=>{const span=document.createElement('span');span.textContent=ch;span.style.visibility=instant||reduced?'visible':'hidden';sentence.appendChild(span);});
  sentence.setAttribute('aria-label',text);sentence.querySelectorAll('span').forEach(el=>el.setAttribute('aria-hidden','true'));
  typed=instant||reduced?null:{start:clock,chars:[...sentence.children],duration:Math.min(1350,chars.length*42)};
 }
 function transition(text,kind='normal'){
  ghost.textContent=sentence.getAttribute('aria-label')||'';
  root.classList.remove('conversation-shift','conversation-collision');void root.offsetWidth;
  if(kind==='shift')root.classList.add('conversation-shift');
  renderText(text,kind!=='normal');
  $('conversation-speaker').textContent='상대의 말';
 }
 function collision(userText,theirText,nextState){
  setState(nextState);root.classList.remove('conversation-shift','conversation-collision');void root.offsetWidth;
  ghost.textContent=userText;renderText(theirText,true);root.classList.add('conversation-collision');
  later(1600,()=>root.classList.remove('conversation-collision'));
 }
 function begin(id){
  generation++;queue=[];current=byId[id];lock(true);mine.textContent='';$('conversation-hint').textContent='말이 이어지는 중';
  let emotion=current.emotion,text=current.text;
  if(id==='closing'&&['tense','emotional','misunderstood'].includes(state)){emotion='tense';text=current.tenseText;}
  if(id==='question')text=current.variants[Math.floor(Math.random()*current.variants.length)];
  setState(emotion);setExpression(({opening:'neutral',topic:'surprised',emotion:'angry',question:'surprised',silence:'neutral',interrupt:'angry',misunderstanding:'surprised',closing:emotion==='calm'?'happy':'neutral'})[id]||'neutral');transition(text,['topic_change','sudden_question','emotion_change'].includes(current.type)?'shift':'normal');
  if(emotion==='silence')renderText('...',true);
  later(id==='silence'?3200:2300,()=>{lock(false);$('conversation-hint').textContent=id==='silence'?'말 사이에 잠깐의 침묵이 흐릅니다.':'지금, 어떻게 반응할까요?';});
  // Silence is also a response. Inaction advances the scene without a penalty.
  later(8500+Math.random()*800,()=>{if(!locked)choose('wait',true);});
 }
 function next(){
  if(current.id==='misunderstanding'){round++;begin(order[round]);return;}
  if(state==='misunderstood'&&!hadMisunderstanding){hadMisunderstanding=true;begin('misunderstanding');return;}
  round++;if(round>=order.length){finish();return;}begin(order[round]);
 }
 function choose(action,automatic=false){
  if(locked||ended||!active)return;
  generation++;queue=[];lock(true);typed=null;
  // Complete an unfinished sentence before the user's response arrives.
  sentence.querySelectorAll('span').forEach(el=>el.style.visibility='visible');
  const previous=state, reaction=current.reactions[action];
  history.push({event:current.id,action,automatic,state:reaction.nextState});
  mine.textContent=action==='wait'?'':'나 · '+reaction.text;
  $('conversation-hint').textContent=action==='wait'?'잠시, 말을 보태지 않습니다.':'당신의 말이 상대에게 닿습니다.';
  setState(reaction.nextState);
  const wait=action==='wait';if(wait){waitingResult=true;transition('...');renderText('...',true);}
  const overlap=!wait&&(current.type==='interruption'||reaction.nextState==='misunderstood');
  later(overlap?480:wait?4200:1900,()=>{
   let reply=reaction.reply,after=reaction.afterState;
   if(current.id==='closing'&&action==='explain'&&previous!=='calm'){after='tense';reply='무슨 뜻인지는 알겠어. 그래도 지금은 조금 시간이 필요해.';}
   if(overlap)collision(reaction.text,reply,after);else{setState(after);transition(reply);}
   if(current.id==='closing')finishingState=after;
   $('conversation-hint').textContent='';
   later(5000+Math.random()*400,next);
  });
 }
 function finish(){
  ended=true;generation++;queue=[];lock(true);root.classList.remove('conversation-collision','conversation-shift');
  const last=history.at(-1), endings=window.conversationCopy.endings;
  const result=finishingState!=='calm'?endings.misunderstood:last?.action==='wait'&&waitingResult?endings.silence:last?.action==='empathy'?endings.open:endings.calm;
  $('conversation-result').textContent=result;$('conversation-end').hidden=false;$('conversation-actions').hidden=true;
  $('conversation-hint').textContent='한 번의 대화가 지나갔습니다.';mine.textContent='';
 }
 function reset(){generation++;queue=[];round=0;clock=0;visualClock=0;ended=false;hadMisunderstanding=false;waitingResult=false;history=[];finishingState='calm';started=true;$('conversation-end').hidden=true;$('conversation-actions').hidden=false;begin(order[0]);}
 buttons.forEach(b=>b.addEventListener('click',()=>choose(b.dataset.reaction)));
 $('conversation-replay').addEventListener('click',reset);$('conversation-restart').addEventListener('click',reset);
 window.conversationExperience={setActive(value){active=value;root.classList.toggle('is-away',!value);if(value&&!started)reset();},getState(){return {state,event:current?.id,round,ended,locked,history:[...history]};}};
 // A typographic ear and inward-moving sound waves. Geometry stays local/offline.
 const canvas=$('conversation-canvas'),ctx=canvas.getContext('2d');let w=1,h=1;
 const portraitCache=new Map();let paintedExpression='',previousPortrait=null,currentPortrait=null,expressionChangedAt=0;
 function drawWordFace(){
  if(w<2||h<2)return;
  const name=root.dataset.expression||'neutral';
  const dpr=Math.min(devicePixelRatio||1,2),key=name+':'+w+':'+h+':'+dpr;
  const portrait=window.createWordPortrait(name,w,h,dpr,visualClock/1000);
  if(paintedExpression!==key){previousPortrait=currentPortrait;currentPortrait=portrait;paintedExpression=key;expressionChangedAt=clock;}
  const blend=reduced||state==='silence'?1:Math.min(1,(clock-expressionChangedAt)/400);
  if(previousPortrait&&blend<1){ctx.globalAlpha=1-blend;ctx.drawImage(previousPortrait,0,0,w,h);}
  ctx.globalAlpha=previousPortrait?blend:1;ctx.drawImage(portrait,0,0,w,h);ctx.globalAlpha=1;
 }

 function resize(){portraitCache.clear();paintedExpression='';previousPortrait=null;currentPortrait=null;w=canvas.clientWidth;h=canvas.clientHeight;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);}
 new ResizeObserver(resize).observe(canvas);
 const fragments=$('conversation-fragments');
 [...'대화마음듣기이해표현기다림공감말사이우리'].forEach((c,i)=>{const el=document.createElement('span');el.textContent=c;el.style.left=(6+(i%12)*7.6)+'%';el.style.top=(i<12?17:81)+'%';el.style.setProperty('--dx',((i*67)%180-90)+'px');el.style.setProperty('--dy',((i*43)%180-90)+'px');el.style.setProperty('--rot',((i*19)%70-35)+'deg');fragments.appendChild(el);});
 function draw(){
  ctx.clearRect(0,0,w,h);drawWordFace();const t=visualClock/1000,level=state==='calm'?1:state==='tense'?1.7:state==='silence'?.35:2.8;
  const cx=w*.5,cy=h*.34,scale=Math.min(h*.38,w*.28);
  ctx.textAlign='center';ctx.fillStyle='#77847c';
  ctx.font=(11+level*2)+'px monospace';
  for(let i=0;i<5;i++){
   const progress=reduced?.5:((t*(typed?.38:.18)+i/5)%1);
   const x=cx+scale*.72+(1-progress)*Math.min(w*.28,350);
   const y=cy+Math.sin(progress*Math.PI*4+i)*level*9;
   ctx.globalAlpha=(1-progress)*.48;ctx.fillText('(((',x,y);ctx.fillText(')))',w-x,y);
  }ctx.globalAlpha=1;
  // Ordered baseline returns as tension settles.
  ctx.font='11px monospace';ctx.fillStyle='#2f3a34';
  for(let i=0;i<Math.floor(w/20);i++)ctx.fillText(state==='calm'?'·':':',i*20,h*.89+Math.sin(i*.7+t*2)*level*2);
 }
 function frame(now){requestAnimationFrame(frame);const dt=Math.min(now-lastFrame,70);lastFrame=now;if(!active||document.hidden)return;
  clock+=dt;if(state!=='silence')visualClock+=dt;
  const due=queue.filter(job=>job.at<=clock);queue=queue.filter(job=>job.at>clock);due.forEach(job=>{if(job.generation===generation)job.fn();});
  if(typed&&state!=='silence'){const ratio=Math.min(1,(clock-typed.start)/typed.duration);typed.chars.forEach((el,i)=>el.style.visibility=i<Math.ceil(ratio*typed.chars.length)?'visible':'hidden');if(ratio===1)typed=null;}
  draw();
 }
 document.addEventListener('visibilitychange',()=>root.classList.toggle('is-away',document.hidden||!active));
 requestAnimationFrame(frame);
})();
