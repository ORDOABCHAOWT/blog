const rail=document.querySelector('.poster-rail');
rail.querySelectorAll('.poster-frame').forEach(button => {
  button.addEventListener('click', () => {
    const title = button.closest('.poster-piece').querySelector('h3').textContent.trim();
    openWork(button.dataset.poster, title);
  });
});
const motion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth';
const prev=document.querySelector('#poster-prev'),next=document.querySelector('#poster-next');
function railState(){prev.disabled=rail.scrollLeft<4;next.disabled=rail.scrollLeft+rail.clientWidth>=rail.scrollWidth-4}
prev.onclick=()=>rail.scrollBy({left:-rail.clientWidth*.7,behavior:motion()});
next.onclick=()=>rail.scrollBy({left:rail.clientWidth*.7,behavior:motion()});
rail.addEventListener('scroll',railState,{passive:true});window.addEventListener('resize',railState);railState();
rail.addEventListener('keydown',e=>{if(e.target!==rail)return;if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();rail.scrollBy({left:(e.key==='ArrowRight'?1:-1)*rail.clientWidth*.7,behavior:motion()})}});

const dialog=document.querySelector('#lightbox'),fullImage=document.querySelector('#lightbox-img');let trigger;
function openWork(asset,title){trigger=document.activeElement;fullImage.src=`/graphic-design/assets/${asset}.webp`;fullImage.alt=title;fullImage.className=asset.startsWith('poster')||asset.startsWith('story')?'portrait':'';document.querySelector('#lightbox-title').textContent=title;dialog.showModal();document.querySelector('.lightbox-body').scrollTop=0;document.querySelector('#close-lightbox').focus()}
document.querySelector('#close-lightbox').onclick=()=>dialog.close();dialog.addEventListener('close',()=>trigger?.focus());document.querySelectorAll('.zoom-work').forEach(b=>b.onclick=()=>openWork(b.dataset.asset,b.querySelector('span')?.textContent.replace(/\s*↗$/, '').trim() || b.dataset.title));
const sections=[...document.querySelectorAll('section.chapter')],navLinks=[...document.querySelectorAll('.chapter-nav a')];function updateNav(){const threshold=innerHeight*.35;let current=sections[0];sections.forEach(s=>{if(s.getBoundingClientRect().top<threshold)current=s});navLinks.forEach(a=>{const active=a.hash===`#${current.id}`;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')})}let ticking=false;window.addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(()=>{updateNav();ticking=false})}},{passive:true});updateNav();
