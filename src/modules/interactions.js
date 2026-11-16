// Pointer light and a gentle 3D tilt on the Lab cards: one delegated listener writes CSS
// variables once per frame. Mouse only and only while motion is allowed; touch and
// keyboard users get the static lift and border light from CSS instead.
const MAX_TILT = 4;

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
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      card.style.setProperty('--spot-x', x + 'px');
      card.style.setProperty('--spot-y', y + 'px');
      if (document.documentElement.dataset.motion !== 'on') return;
      // Small tilts about X and Y combine into one axis-angle, so CSS can use the
      // independent `rotate` property and leave `transform` to the scroll reveal.
      const aboutX = (0.5 - y / rect.height) * 2 * MAX_TILT;
      const aboutY = (x / rect.width - 0.5) * 2 * MAX_TILT;
      const angle = Math.hypot(aboutX, aboutY);
      card.style.setProperty('--tilt', angle < 0.05 ? '0deg' : `${aboutX.toFixed(3)} ${aboutY.toFixed(3)} 0 ${angle.toFixed(2)}deg`);
    });
  }, { passive: true });
  grid.addEventListener('pointerout', function(event) {
    const card = event.target.closest('.lab-card');
    if (!card || card.contains(event.relatedTarget)) return;
    cancelAnimationFrame(frame);
    frame = 0;
    card.style.removeProperty('--tilt');
  }, { passive: true });
}
