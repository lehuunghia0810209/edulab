import { ORBIT_MOTIF } from '../data/artwork.js';
import { bindMotionToggle, getMotionState } from './motion-controller.js';

export function initLivingUniverse() {
  const root = document.documentElement;
  const events = new AbortController();
  let pointerFrame = 0;
  const atmosphere = document.createElement('div');
  atmosphere.className = 'universe-atmosphere motion-scope';
  atmosphere.setAttribute('aria-hidden', 'true');
  atmosphere.innerHTML = `<svg viewBox="0 0 1440 1000" preserveAspectRatio="xMidYMid slice"><g class="ambient star-drift">${Array.from({length:32}, (_,i) => `<circle cx="${(i*397)%1440}" cy="${(i*173)%1000}" r="${i%4 === 0 ? 1.8 : .9}"/>`).join('')}</g><g class="ambient star-drift far">${Array.from({length:18}, (_,i) => `<circle cx="${(i*233+87)%1440}" cy="${(i*317+67)%1000}" r="1"/>`).join('')}</g><ellipse cx="1180" cy="680" rx="640" ry="250" transform="rotate(-30 1180 680)"/></svg>`;
  document.body.prepend(atmosphere);

  const toggle = document.createElement('button');
  toggle.id = 'motion-toggle';
  toggle.className = 'motion-toggle';
  toggle.type = 'button';
  document.getElementById('theme-toggle')?.before(toggle);
  const unbindToggle = bindMotionToggle(toggle);

  document.querySelectorAll('.philosophy-geo').forEach((element, index) => {
    element.innerHTML = index === 0 ? ORBIT_MOTIF : index === 1
      ? `<svg class="orbit-motif" viewBox="0 0 360 260" fill="none" aria-hidden="true"><g class="ambient motif-orbit"><rect x="68" y="60" width="138" height="138" rx="36"/><circle cx="68" cy="130" r="5"/></g><g class="ambient motif-orbit reverse"><rect x="154" y="60" width="138" height="138" rx="36"/><circle cx="292" cy="130" r="5"/></g><path d="M168 130H192M180 118V142"/></svg>`
      : `<svg class="orbit-motif" viewBox="0 0 360 260" fill="none" aria-hidden="true"><path d="M180 45L70 195H290Z"/><g class="ambient motif-orbit"><path d="M180 45L70 195H290Z" class="ambient network-flow"/></g><circle class="motif-center" cx="180" cy="45" r="24"/><circle class="motif-center" cx="70" cy="195" r="24"/><circle class="motif-center" cx="290" cy="195" r="24"/><path d="M180 45V145M70 195L180 145L290 195"/><circle cx="180" cy="145" r="7"/></svg>`;
    element.dataset.principle = index;
  });
  for (const selector of ['.faq-layout > div:first-child', '.final-cta-box', '.site-footer > .container']) {
    const parent = document.querySelector(selector);
    if (!parent) continue;
    const visual = document.createElement('div');
    visual.className = 'ambient-emblem';
    visual.setAttribute('aria-hidden', 'true');
    visual.innerHTML = ORBIT_MOTIF;
    parent.prepend(visual);
  }
  document.querySelectorAll('.step-node').forEach((step, index) => {
    const marker = document.createElement('div');
    marker.className = 'journey-marker';
    marker.setAttribute('aria-hidden', 'true');
    marker.innerHTML = `<span class="ambient journey-orbit" style="--journey-delay:${-index*1.7}s"></span><span>${String(index+1).padStart(2,'0')}</span>`;
    step.prepend(marker);
  });

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

  const activeObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.target.classList.toggle('is-observed', entry.isIntersecting));
  }, { rootMargin: '-25% 0px -25% 0px', threshold: .15 });
  document.querySelectorAll('.philosophy-row, .step-node').forEach(element => activeObserver.observe(element));

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
    unbindToggle();
    observer.disconnect();
    activeObserver.disconnect();
    cancelAnimationFrame(pointerFrame);
    atmosphere.remove();
    toggle.remove();
  };
}
