// Snow Train by bas3line (MIT). See vendor/ascii-magic/SNOW-TRAIN-LICENSE.
import create,{meta} from './vendor/ascii-magic/pieces/snow-train.js';
const canvas=document.querySelector('#ascii-canvas');
if(canvas){
 const ctx=canvas.getContext('2d'),box=canvas.parentElement,render=create();
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let visible=true,frame=0,previous=0,elapsed=2,last=0;
 const color=new Uint8Array(meta.cols*meta.rows);
 function draw(time){
  const rect=box.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2),w=Math.round(rect.width*dpr),h=Math.round(rect.height*dpr);
  if(!w||!h)return;if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
  ctx.fillStyle=meta.ground;
  ctx.fillRect(0,0,w,h);
  const lines=render(time,{color}).split('\n');
  const cw=w/meta.cols,ch=h/meta.rows;
  ctx.font=cw*1.46+'px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.textAlign='center';
  ctx.textBaseline='middle';
  for(let row=0;row<meta.rows;row++)for(let col=0;col<meta.cols;col++){
   const glyph=lines[row][col];
   if(glyph===' ')continue;
   ctx.fillStyle=meta.palette[color[row*meta.cols+col]];
   ctx.fillText(glyph,(col+.5)*cw,(row+.5)*ch);
  }
 }
 function loop(now){frame=0;if(!visible||document.hidden||reduced.matches)return;if(previous)elapsed+=Math.min(now-previous,100)*.001;previous=now;if(now-last>=1000/meta.fps){draw(elapsed);last=now}frame=requestAnimationFrame(loop)}
 function resume(){if(!frame&&visible&&!document.hidden&&!reduced.matches){previous=0;frame=requestAnimationFrame(loop)}}
 new ResizeObserver(()=>draw(reduced.matches?2:elapsed)).observe(box);
 new IntersectionObserver(([e])=>{visible=e.isIntersecting;resume()}).observe(box);
 document.addEventListener('visibilitychange',resume);
 reduced.addEventListener('change',()=>{if(reduced.matches){cancelAnimationFrame(frame);frame=0;draw(2)}else resume()});
 draw(2);resume();
}
