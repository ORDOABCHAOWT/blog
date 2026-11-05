(()=>{
 const book=document.querySelector('#brochure-book');if(!book)return;
 const pages=[
  ['brochure-cover-latest','海南民生众和集团画册封面与封底'],
  ['brochure-business-latest','城市管道燃气业务与发展历程'],
  ['brochure-service-latest','燃气服务与智慧燃气'],
  ['brochure-construction-latest','建设业务与工程监理设计']
 ];
 const current=book.querySelector('.book-current'),under=book.querySelector('.book-under'),turn=book.querySelector('.book-turn'),front=turn.querySelector('.book-front img'),back=turn.querySelector('.book-back img'),prev=document.querySelector('#book-prev'),next=document.querySelector('#book-next'),left=book.querySelector('.book-hit-left'),right=book.querySelector('.book-hit-right'),dots=[...document.querySelectorAll('[data-book-page]')],announcement=document.querySelector('#book-announcement');
 let index=0,busy=false,start=null,suppressClickUntil=0;
 const src=i=>`/graphic-design/assets/${pages[i][0]}.webp`;
 const images=pages.map((_,i)=>{const im=new Image();im.src=src(i);return im});
 function sync(){prev.disabled=left.disabled=index===0;next.disabled=right.disabled=index===pages.length-1;dots.forEach((dot,i)=>{dot.classList.toggle('selected',i===index);if(i===index)dot.setAttribute('aria-current','true');else dot.removeAttribute('aria-current')});book.dataset.page=String(index);announcement.textContent=`第 ${index+1} 跨页，共 ${pages.length} 跨页`}
 async function go(target){
  if(busy||target===index||target<0||target>=pages.length)return;
  busy=true;book.setAttribute('aria-busy','true');const forward=target>index;
  try{
   await images[target].decode();
   if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
    under.src=src(target);front.src=src(index);back.src=src(target);
    await Promise.all([under.decode(),front.decode(),back.decode()]);
    book.classList.toggle('turn-backward',!forward);book.classList.add('is-turning');
    const animation=turn.animate([{transform:'rotateY(0deg)'},{transform:`rotateY(${forward?-180:180}deg)`}],{duration:720,easing:'cubic-bezier(.35,.05,.25,1)',fill:'forwards'});
    await animation.finished;
    // Decode the committed page before removing the turning sheet, avoiding a blank frame.
    current.src=src(target);await current.decode();animation.cancel();
   }else{current.src=src(target);await current.decode()}
   index=target;current.alt=pages[index][1];sync();
  }catch(error){console.error('画册翻页失败',error)}finally{book.classList.remove('is-turning','turn-backward');book.removeAttribute('aria-busy');busy=false}
 }
 prev.onclick=()=>go(index-1);next.onclick=()=>go(index+1);
 left.onclick=()=>{if(Date.now()>suppressClickUntil)go(index-1)};right.onclick=()=>{if(Date.now()>suppressClickUntil)go(index+1)};
 dots.forEach(dot=>dot.onclick=()=>go(Number(dot.dataset.bookPage)));
 book.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();go(index+(event.key==='ArrowRight'?1:-1))}});
 book.addEventListener('pointerdown',event=>{if(event.pointerType!=='mouse')start={x:event.clientX,y:event.clientY}});
 book.addEventListener('pointerup',event=>{if(!start)return;const dx=event.clientX-start.x,dy=event.clientY-start.y;start=null;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.4){suppressClickUntil=Date.now()+500;go(index+(dx<0?1:-1))}});
 book.addEventListener('pointercancel',()=>{start=null});sync();
})();
