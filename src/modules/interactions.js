// Pointer light on the Lab cards: one delegated listener writes two CSS variables per frame.
// Purely decorative; touch and keyboard users get the centred default from CSS.
export function initCardSpotlight() {
  const grid = document.getElementById('labs-discovery-grid');
  if (!grid) return;
  let frame = 0;
  grid.addEventListener('pointermove', function(event) {
    if (event.pointerType !== 'mouse' || frame) return;
    const card = event.target.closest('.lab-card');
    if (!card) return;
    frame = requestAnimationFrame(function() {
      frame = 0;
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--spot-x', (event.clientX - rect.left) + 'px');
      card.style.setProperty('--spot-y', (event.clientY - rect.top) + 'px');
    });
  }, { passive: true });
}
