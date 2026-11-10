// Rule 30 by ASCII Magic (MIT). See vendor/ascii-magic/LICENSE.
import create,{meta} from './vendor/ascii-magic/pieces/rule-30.js';
import {paint} from './vendor/ascii-magic/lib/canvas.js';

const canvas=document.querySelector('#ascii-canvas');
if(canvas){
 const ctx=canvas.getContext('2d'),box=canvas.parentElement,render=create();
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const openingTime=4;
 canvas.style.background='#000';
 let visible=true,frame=0,previous=0,elapsed=openingTime,last=0;
 function draw(time){
  const rect=box.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2),w=Math.round(rect.width*dpr),h=Math.round(rect.height*dpr);
  if(!w||!h)return;if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
  ctx.clearRect(0,0,w,h);
  ctx.setTransform(dpr,0,0,dpr,0,0);
  paint(ctx,render(time),meta.palette,{
   mode:'circle',
   all:true,
   cw:w/dpr/meta.cols,
   ch:h/dpr/meta.rows,
   dpr
  });
  ctx.resetTransform();
 }
 function loop(now){frame=0;if(!visible||document.hidden||reduced.matches)return;if(previous)elapsed+=Math.min(now-previous,100)*.001;previous=now;if(now-last>=1000/meta.fps){draw(elapsed);last=now}frame=requestAnimationFrame(loop)}
 function resume(){if(!frame&&visible&&!document.hidden&&!reduced.matches){previous=0;frame=requestAnimationFrame(loop)}}
 new ResizeObserver(()=>draw(reduced.matches?openingTime:elapsed)).observe(box);
 new IntersectionObserver(([e])=>{visible=e.isIntersecting;resume()}).observe(box);
 document.addEventListener('visibilitychange',resume);
 reduced.addEventListener('change',()=>{if(reduced.matches){cancelAnimationFrame(frame);frame=0;draw(openingTime)}else resume()});
 draw(openingTime);resume();
}
