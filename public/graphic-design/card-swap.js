// Adapted from Bencho CardSwap (MIT): bencho.dev/blocks/card-swap.
// Uses the same fixed depth slots and front-to-back ordering in a static page.
const stage = document.querySelector('.media-posters');
if (stage) {
  const cards = [...stage.querySelectorAll('.media-poster')];
  // Keep the taller poster within the stack while retaining every image's ratio.
  cards.forEach(card => {
    const image = card.querySelector('img');
    function fit() {
      if (image.naturalWidth && image.naturalHeight) {
        card.style.width = Math.min(stage.clientWidth * .67, stage.clientHeight * .78 * image.naturalWidth / image.naturalHeight) + 'px';
      }
    }
    image.addEventListener('load', fit);
    new ResizeObserver(fit).observe(stage);
    fit();
  });
  let order = [...cards];
  let startX = 0;
  let dragged = false;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  function layout() {
    order.forEach((card, index) => {
      card.style.setProperty('--slot', index);
      card.style.zIndex = String(cards.length - index);
      card.tabIndex = index === 0 ? 0 : -1;
      card.inert = index !== 0;
    });
  }
  function swap() {
    order.push(order.shift());
    layout();
  }
  cards.forEach(card => {
    card.onclick = () => { if (!dragged) swap(); dragged = false; };
    card.addEventListener('pointerdown', event => { startX = event.clientX; dragged = false; });
    card.addEventListener('pointerup', event => {
      if (Math.abs(event.clientX - startX) > 30) { dragged = true; swap(); event.preventDefault(); }
    });
  });
  const timer = setInterval(() => {
    if (!reduced.matches && !document.hidden && !stage.matches(':hover, :focus-within')) swap();
  }, 5000);
  window.addEventListener('pagehide', () => clearInterval(timer), { once: true });
  layout();
}
