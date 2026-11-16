import { ORBIT_MOTIF } from '../data/artwork.js';
import { bindReducedMotionPreference, getMotionState } from './motion-controller.js';

export function initLivingUniverse() {
  const root = document.documentElement;
  const events = new AbortController();
  let pointerFrame = 0;
  const atmosphere = document.createElement('div');
  atmosphere.className = 'universe-atmosphere motion-scope';
  atmosphere.setAttribute('aria-hidden', 'true');
  atmosphere.innerHTML = `<svg viewBox="0 0 1440 1000" preserveAspectRatio="xMidYMid slice"><g class="ambient star-drift">${Array.from({length:32}, (_,i) => `<circle cx="${(i*397)%1440}" cy="${(i*173)%1000}" r="${i%4 === 0 ? 1.8 : .9}"/>`).join('')}</g><g class="ambient star-drift far">${Array.from({length:18}, (_,i) => `<circle cx="${(i*233+87)%1440}" cy="${(i*317+67)%1000}" r="1"/>`).join('')}</g><ellipse cx="1180" cy="680" rx="640" ry="250" transform="rotate(-30 1180 680)"/></svg>`;
  document.body.prepend(atmosphere);

  const unbindPreference = bindReducedMotionPreference(document.getElementById('reduce-motion-setting'));

  for (const selector of ['.faq-intro', '.site-footer > .container']) {
    const parent = document.querySelector(selector);
    if (!parent) continue;
    const visual = document.createElement('div');
    visual.className = 'ambient-emblem';
    visual.setAttribute('aria-hidden', 'true');
    visual.innerHTML = ORBIT_MOTIF;
    parent.prepend(visual);
  }
  const scopes = [...document.querySelectorAll('main > section, .site-footer')];
  const visibility = new Map(scopes.map(scope => [scope, false]));
  scopes.forEach(scope => scope.classList.add('motion-scope'));
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) visibility.set(entry.target, entry.isIntersecting);
    sync();
  }, { threshold: 0 });
  scopes.forEach(scope => observer.observe(scope));
  function sync() {
    const enabled = getMotionState().canAnimate;
    atmosphere.classList.toggle('motion-running', enabled && !document.hidden);
    for (const scope of scopes) scope.classList.toggle('motion-running', enabled && !document.hidden && visibility.get(scope));
  }
  document.addEventListener('visibilitychange', sync, { signal: events.signal });
  document.addEventListener('edulab:motion-change', sync, { signal: events.signal });

  window.addEventListener('pointermove', event => {
    if (root.dataset.motion !== 'on' || event.pointerType !== 'mouse' || pointerFrame) return;
    pointerFrame = requestAnimationFrame(() => {
      pointerFrame = 0;
      atmosphere.style.setProperty('--parallax-x', `${(event.clientX / innerWidth - .5) * 12}px`);
      atmosphere.style.setProperty('--parallax-y', `${(event.clientY / innerHeight - .5) * 8}px`);
    });
  }, { passive: true, signal: events.signal });
  sync();
  return () => {
    events.abort();
    unbindPreference();
    observer.disconnect();
    cancelAnimationFrame(pointerFrame);
    atmosphere.remove();
  };
}
