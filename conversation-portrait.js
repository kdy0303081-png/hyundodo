'use strict';
// Sample the supplied expression images into whole Korean words, just like the intro.
const decodedFaces=new Map(),portraitSurfaces=new Map();
window.createWordPortrait = function(name,width,height,pixelRatio=1,time=0){
 const model=window.conversationFaceData[name];
 if(!model)throw new Error('Missing expression data: '+name);
 if(!decodedFaces.has(name)){
  const raw=atob(model.data),values=Uint8Array.from(raw,c=>c.charCodeAt(0));
  if(values.length!==model.width*model.height*2)throw new Error('Incomplete expression data');
  decodedFaces.set(name,values);
 }
 const pixels=decodedFaces.get(name),ih=height*(width<640?.76:.84),iw=ih*model.aspect,left=(width-iw)/2;
 const surfaceKey=name+':'+width+':'+height+':'+pixelRatio;
 if(!portraitSurfaces.has(surfaceKey)){
  if(portraitSurfaces.size>12)portraitSurfaces.clear();
  const canvas=document.createElement('canvas');canvas.width=Math.ceil(width*pixelRatio);canvas.height=Math.ceil(height*pixelRatio);portraitSurfaces.set(surfaceKey,canvas);
 }
 const result=portraitSurfaces.get(surfaceKey),paint=result.getContext('2d');
 paint.setTransform(pixelRatio,0,0,pixelRatio,0,0);paint.clearRect(0,0,width,height);
 const yaw=Math.sin(time*.38)*.065,turn=Math.cos(yaw),wordPhase=Math.floor(time*.8);
 const stepX=width<640?9.6:10.8,stepY=width<640?5.7:6.2,font=width<640?4.7:5.2;
 paint.font=`500 ${font}px "Noto Sans KR", "Malgun Gothic", sans-serif`;paint.textAlign='center';paint.textBaseline='middle';
 const words=['공감','마음','이해','표현','대화','경청','진심','생각','언어','존중','위로','용기','감정','연결','믿음','배려','소통','말씀'];
 let count=0;
 for(let row=0,y=stepY/2;y<ih;y+=stepY,row++)for(let col=0,x=stepX/2;x<width;x+=stepX,col++){
  const u=(x-left)/iw;
  // A shallow turn is resampled onto the fixed text grid, as on the main portrait.
  const surfaceDepth=Math.sqrt(Math.max(0,1-Math.pow((u-.5)*3,2)));
  const sx=Math.floor(((u-.5)/turn+.5-yaw*surfaceDepth*.16)*model.width),sy=Math.floor(y/ih*model.height);
  if(sx<0||sx>=model.width||sy<0||sy>=model.height)continue;
  const i=(sy*model.width+sx)*2,alpha=pixels[i+1]/255,luminance=pixels[i]/255;
  if(alpha<.55||luminance<.08)continue;
  const lighting=1+Math.sin(time*.38+(u-.5)*3)*.10;
  const bucket=Math.min(15,Math.max(0,Math.floor(Math.pow(luminance,1.15)*lighting*16)));
  const shade=Math.round(50+bucket*13.4);
  const fade=Math.min(1,Math.max(0,(ih-y)/(ih*.12)));
  paint.fillStyle=`rgba(${shade},${shade},${Math.min(255,shade+3)},${alpha*fade})`;
  const seed=row*7+col*11;
  paint.fillText(words[(seed+(seed%7===0?wordPhase:0)+sx)%words.length],x,y);count++;
 }
 result.portraitWordCount=count;return result;
};
