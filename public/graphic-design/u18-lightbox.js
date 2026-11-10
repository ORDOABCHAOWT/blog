const dialog = document.querySelector('.u18-lightbox');
const enlarged = dialog.querySelector('img');
let trigger;

document.querySelectorAll('.u18-zoom').forEach(button => {
  button.addEventListener('click', () => {
    const source = button.querySelector('img');
    enlarged.src = source.currentSrc || source.src;
    enlarged.alt = source.alt;
    trigger = button;
    dialog.showModal();
  });
});

dialog.querySelector('.u18-lightbox-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target === dialog) dialog.close();
});
dialog.addEventListener('close', () => trigger?.focus({ preventScroll: true }));
