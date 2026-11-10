const rail=document.querySelector('.poster-rail');
rail.querySelectorAll('.poster-frame').forEach(button => {
  button.addEventListener('click', () => {
    const title = button.closest('.poster-piece').querySelector('h3').textContent.trim();
    openWork(button.dataset.poster, title);
  });
});
const motion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth';
function setupRail(track, prev, next, step) {
  function updateControls() {
    prev.disabled = track.scrollLeft < 4;
    next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
  }
  function scroll(direction) {
    track.scrollBy({ left: direction * track.clientWidth * step, behavior: motion() });
  }
  prev.onclick = () => scroll(-1);
  next.onclick = () => scroll(1);
  track.addEventListener('scroll', updateControls, { passive: true });
  window.addEventListener('resize', updateControls);
  track.addEventListener('keydown', event => {
    if (event.target !== track || !['ArrowRight', 'ArrowLeft'].includes(event.key)) return;
    event.preventDefault();
    scroll(event.key === 'ArrowRight' ? 1 : -1);
  });
  updateControls();
}
setupRail(rail, document.querySelector('#poster-prev'), document.querySelector('#poster-next'), .7);
setupRail(
  document.querySelector('#annual-meeting-rail'),
  document.querySelector('#annual-meeting-prev'),
  document.querySelector('#annual-meeting-next'),
  .9
);

const dialog=document.querySelector('#lightbox'),fullImage=document.querySelector('#lightbox-img');let trigger;
function openWork(asset,title){trigger=document.activeElement;fullImage.src=`/graphic-design/assets/${asset}.webp`;fullImage.alt=title;fullImage.className=asset.startsWith('poster')||asset.startsWith('story')?'portrait':'';document.querySelector('#lightbox-title').textContent=title;dialog.showModal();document.querySelector('.lightbox-body').scrollTop=0;document.querySelector('#close-lightbox').focus()}
document.querySelector('#close-lightbox').onclick=()=>dialog.close();dialog.addEventListener('close',()=>trigger?.focus());document.querySelectorAll('.zoom-work').forEach(b=>b.onclick=()=>openWork(b.dataset.asset,b.querySelector('span')?.textContent.replace(/\s*↗$/, '').trim() || b.dataset.title));
const sections=[...document.querySelectorAll('section.chapter')],navLinks=[...document.querySelectorAll('.chapter-nav a')];function updateNav(){const threshold=innerHeight*.35;let current=sections[0];sections.forEach(s=>{if(s.getBoundingClientRect().top<threshold)current=s});navLinks.forEach(a=>{const active=a.hash===`#${current.id}`;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')})}let ticking=false;window.addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(()=>{updateNav();ticking=false})}},{passive:true});updateNav();
