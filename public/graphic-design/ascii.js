// Geometry: ASCII Magic, Sphere to Cube Morph (MIT); see vendor/ascii-magic/LICENSE.
// Local presentation: transparent page background and restrained two-tone characters.
import create,{meta} from './vendor/ascii-magic/pieces/sphere-cube-morph.js';
import {KEYS} from './vendor/ascii-magic/lib/kit.js';
const canvas=document.querySelector('#ascii-canvas');
if(canvas){
 const ctx=canvas.getContext('2d'),box=canvas.parentElement,render=create();
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let visible=true,frame=0,previous=0,elapsed=2,last=0;
 const shade={'░':'.','▒':':','▓':'+','█':'*'};
 function draw(time){
  const rect=box.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2),w=Math.round(rect.width*dpr),h=Math.round(rect.height*dpr);
  if(!w||!h)return;if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
  ctx.clearRect(0,0,w,h);
  const style=getComputedStyle(document.documentElement),ink=style.getPropertyValue('--ink').trim(),accent=style.getPropertyValue('--accent').trim();
  const data=render(time),lines=data.text.split('\n'),colors=data.color.split('\n');
  const cw=w/meta.cols,ch=cw*2,top=(h-ch*meta.rows)/2;
  ctx.font=`${cw*1.12}px ui-monospace, SFMono-Regular, Menlo, monospace`;ctx.textAlign='center';ctx.textBaseline='middle';
  for(let r=0;r<meta.rows;r++)for(let c=0;c<meta.cols;c++){
   const glyph=lines[r][c];if(glyph===' '||glyph==='·')continue;
   const key=KEYS.indexOf(colors[r][c]);ctx.fillStyle=key>=24&&key<40?accent:ink;
   ctx.fillText(shade[glyph]||glyph,(c+.5)*cw,top+(r+.5)*ch);
  }
 }
 function loop(now){frame=0;if(!visible||document.hidden||reduced.matches)return;if(previous)elapsed+=Math.min(now-previous,100)*.00055;previous=now;if(now-last>60){draw(elapsed);last=now}frame=requestAnimationFrame(loop)}
 function resume(){if(!frame&&visible&&!document.hidden&&!reduced.matches){previous=0;frame=requestAnimationFrame(loop)}}
 new ResizeObserver(()=>draw(reduced.matches?2:elapsed)).observe(box);
 new IntersectionObserver(([e])=>{visible=e.isIntersecting;resume()}).observe(box);
 document.addEventListener('visibilitychange',resume);
 reduced.addEventListener('change',()=>{if(reduced.matches){cancelAnimationFrame(frame);frame=0;draw(2)}else resume()});
 draw(2);resume();
}
